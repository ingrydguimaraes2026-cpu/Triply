// Função "ler-carteiras" (spec 015): lê os e-mails do Wise/Nomad e grava os movimentos.
// Chamada pelo agendamento (pg_cron) a cada ~15 min. Pra cada pessoa com Gmail conectado:
//   1. renova o acesso (refresh token);
//   2. busca e-mails novos do Wise/Nomad dos últimos 2 dias;
//   3. interpreta cada um (parser.ts) e grava na carteira da viagem atual, sem duplicar.
//
// Segredos: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET. SUPABASE_URL/SERVICE_ROLE_KEY são automáticos.
// verify_jwt = false: quem dispara é o cron (não tem usuário logado). A resposta é só contagem.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import { interpretarEmail } from './parser.ts'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

type Conta = { usuario_id: string; refresh_token: string | null; ultimo_sync: string | null }

// base64url (como o Gmail manda) → texto UTF-8
function decodar(dados: string): string {
  try {
    const bin = atob(dados.replace(/-/g, '+').replace(/_/g, '/'))
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
  } catch {
    return ''
  }
}

function tirarHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&euro;/g, '€')
    .replace(/\s+/g, ' ')
}

// Junta o texto de todas as partes do e-mail (texto puro + html sem tags)
// deno-lint-ignore no-explicit-any
function extrairCorpo(payload: any): string {
  if (!payload) return ''
  let texto = ''
  if (payload.body?.data && payload.mimeType?.startsWith('text/')) {
    const bruto = decodar(payload.body.data)
    texto += payload.mimeType === 'text/html' ? tirarHtml(bruto) : bruto
  }
  for (const parte of payload.parts ?? []) texto += '\n' + extrairCorpo(parte)
  return texto
}

// deno-lint-ignore no-explicit-any
function cabecalho(payload: any, nome: string): string {
  const h = (payload?.headers ?? []).find((x: { name: string }) => x.name.toLowerCase() === nome.toLowerCase())
  return h?.value ?? ''
}

async function novoAcesso(clientId: string, clientSecret: string, refresh: string): Promise<{ access?: string; erro?: string }> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refresh, grant_type: 'refresh_token' }),
  })
  const t = await r.json().catch(() => ({}))
  return r.ok ? { access: t.access_token } : { erro: t?.error ?? 'falha' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) return json({ erro: 'Faltam os segredos do Google na função.' }, 500)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: contas } = await admin.from('gmail_contas').select('usuario_id, refresh_token, ultimo_sync').eq('status', 'ativo')
  if (!contas || contas.length === 0) return json({ contas: 0, movimentos: 0 })

  const hoje = new Date().toISOString().slice(0, 10)
  let totalMov = 0

  for (const conta of contas as Conta[]) {
    if (!conta.refresh_token) continue

    // 1. Renova o acesso. Se o Google derrubou (modo Testing, 7 dias), marca pra reconectar.
    const { access, erro } = await novoAcesso(clientId, clientSecret, conta.refresh_token)
    if (!access) {
      const expirado = erro === 'invalid_grant'
      await admin.from('gmail_contas').update({ status: expirado ? 'expirado' : 'erro', erro }).eq('usuario_id', conta.usuario_id)
      continue
    }

    // Carteira alvo: a viagem que está acontecendo agora; senão, a carteira mais recente.
    const { data: carteiras } = await admin
      .from('carteiras')
      .select('id, criado_em, viagens(data_inicio, data_fim)')
      .eq('usuario_id', conta.usuario_id)
    if (!carteiras || carteiras.length === 0) {
      await admin.from('gmail_contas').update({ ultimo_sync: new Date().toISOString(), erro: null }).eq('usuario_id', conta.usuario_id)
      continue
    }
    // deno-lint-ignore no-explicit-any
    const atual = carteiras.find((c: any) => c.viagens?.data_inicio && c.viagens?.data_fim && c.viagens.data_inicio <= hoje && hoje <= c.viagens.data_fim)
    const carteiraId = atual?.id ?? [...carteiras].sort((a, b) => (b.criado_em ?? '').localeCompare(a.criado_em ?? ''))[0].id

    // 2. Busca e-mails do Wise/Nomad. Na 1ª vez (nunca sincronizou) puxa TODO o histórico;
    //    depois só os últimos 7 dias, pra ficar leve. Vai de página em página (até 300).
    const base = 'from:(wise.com OR transferwise.com OR nomadglobal.com)'
    const q = conta.ultimo_sync ? `${base} newer_than:7d` : base

    let pageToken = ''
    let vistas = 0
    let falhou = false
    do {
      const u = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
      u.searchParams.set('q', q)
      u.searchParams.set('maxResults', '50')
      if (pageToken) u.searchParams.set('pageToken', pageToken)
      const lista = await fetch(u, { headers: { Authorization: `Bearer ${access}` } })
      if (!lista.ok) {
        await admin.from('gmail_contas').update({ status: 'erro', erro: `gmail list ${lista.status}` }).eq('usuario_id', conta.usuario_id)
        falhou = true
        break
      }
      const pagina = await lista.json()

      // 3. Lê cada e-mail e grava o movimento (sem duplicar)
      for (const m of (pagina.messages ?? []) as { id: string }[]) {
        vistas++
        const det = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, {
          headers: { Authorization: `Bearer ${access}` },
        })
        if (!det.ok) continue
        const email = await det.json()
        const de = cabecalho(email.payload, 'From')
        const assunto = cabecalho(email.payload, 'Subject')
        const corpo = extrairCorpo(email.payload)

        const t = interpretarEmail(de, assunto, corpo)
        if (!t) continue

        const quando = Number(email.internalDate) ? new Date(Number(email.internalDate)).toISOString() : new Date().toISOString()
        const { error } = await admin.from('movimentos_carteira').upsert(
          {
            carteira_id: carteiraId,
            tipo: t.tipo,
            valor: t.valor,
            moeda: t.moeda,
            descricao: t.descricao,
            data: quando,
            provedor: t.provedor,
            gmail_message_id: m.id,
          },
          { onConflict: 'carteira_id,gmail_message_id', ignoreDuplicates: true },
        )
        if (!error) totalMov++
      }
      pageToken = pagina.nextPageToken ?? ''
    } while (pageToken && vistas < 300)
    if (falhou) continue

    await admin.from('gmail_contas').update({ ultimo_sync: new Date().toISOString(), status: 'ativo', erro: null }).eq('usuario_id', conta.usuario_id)
  }

  return json({ contas: contas.length, movimentos: totalMov })
})
