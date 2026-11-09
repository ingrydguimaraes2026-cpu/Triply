// Função "diagnostico-emails" (spec 015, investigação): lista os e-mails do Wise/Nomad da
// própria pessoa, com assunto + se achou valor em euro + se tem palavra de transação + um
// trechinho curto. Serve pra DESCOBRIR quais formatos a Nomad manda (ela não manda e-mail
// de transação como o Wise — só avisa "extrato disponível"). Nada é guardado; só devolve.
//
// Só o dono vê os próprios e-mails (verify_jwt = true). Usa o token já guardado na conexão.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

const TEM_EURO = /(\d[\d .,]*\d|\d)\s*(?:EUR|€|euros?)|(?:EUR|€|euros?)\s*\d/i
const PALAVRAS = /(gastou|gasto|comprou|compra|pagou|pagamento|recebeu|adicionou|dep[óo]sito|convers[ãa]o|c[âa]mbio|transfer|saque|d[ée]bito|cr[ée]dito|aprovad)/i

// deno-lint-ignore no-explicit-any
function cabecalho(payload: any, nome: string): string {
  const h = (payload?.headers ?? []).find((x: { name: string }) => x.name.toLowerCase() === nome.toLowerCase())
  return h?.value ?? ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) return json({ erro: 'Faltam os segredos do Google.' }, 500)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user) return json({ erro: 'Faça login.' }, 401)

  const { data: conta } = await admin.from('gmail_contas').select('refresh_token').eq('usuario_id', quem.user.id).maybeSingle()
  if (!conta?.refresh_token) return json({ erro: 'Conecte o Gmail primeiro.' }, 400)

  // Renova o acesso
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: conta.refresh_token, grant_type: 'refresh_token' }),
  })
  const tok = await r.json().catch(() => ({}))
  if (!r.ok) return json({ erro: 'O acesso ao Gmail expirou. Reconecte.' }, 400)
  const access = tok.access_token

  // Lista todos os e-mails do Nomad e do Wise (até 150), de página em página
  const q = encodeURIComponent('from:(nomadglobal.com OR wise.com OR transferwise.com)')
  const itens: unknown[] = []
  let pageToken = ''
  do {
    const u = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
    u.searchParams.set('q', decodeURIComponent(q))
    u.searchParams.set('maxResults', '50')
    if (pageToken) u.searchParams.set('pageToken', pageToken)
    const lista = await fetch(u, { headers: { Authorization: `Bearer ${access}` } })
    if (!lista.ok) return json({ erro: `gmail list ${lista.status}` }, 502)
    const pagina = await lista.json()

    for (const m of (pagina.messages ?? []) as { id: string }[]) {
      // format=metadata + snippet: pega assunto/remetente e um trecho, sem baixar o corpo inteiro
      const det = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${access}` } },
      )
      if (!det.ok) continue
      const email = await det.json()
      const assunto = cabecalho(email.payload, 'Subject')
      const de = cabecalho(email.payload, 'From')
      const snippet: string = (email.snippet ?? '').slice(0, 140)
      const texto = `${assunto}\n${snippet}`
      const provedor = /nomad/i.test(de) ? 'nomad' : 'wise'
      const palavra = texto.match(PALAVRAS)?.[0] ?? null
      itens.push({
        provedor,
        data: Number(email.internalDate) ? new Date(Number(email.internalDate)).toISOString().slice(0, 10) : null,
        assunto,
        euro: TEM_EURO.test(texto),
        palavra,
        trecho: snippet,
      })
      if (itens.length >= 150) break
    }
    pageToken = itens.length >= 150 ? '' : (pagina.nextPageToken ?? '')
  } while (pageToken)

  return json({ total: itens.length, itens })
})
