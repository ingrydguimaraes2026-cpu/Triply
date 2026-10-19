// Função "avisos-cambio" (spec 013): checa o câmbio e manda notificação pra quem bateu a meta.
// - Chamada sem corpo (pelo agendamento, a cada 30 min): checa todas as metas.
// - Chamada com { "teste": true } por alguém logado: manda uma notificação de teste só pros aparelhos dessa pessoa.
// Segredos (no painel do Supabase → Edge Functions → Secrets): VAPID_PRIVATE_KEY.
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY o Supabase já coloca sozinho.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'
import { decidir, mensagem } from './regras.ts'

// Chave pública do Web Push (a mesma de src/features/cambio/avisos.ts). Pública por natureza.
const VAPID_PUBLICA = 'BMT3M0-HThNnW4fGo8UHb2WQkWYQIx6kYd1rSlUQzJt9yyGBDprocMC0zQc5kbUXcKWvqvXoW_6Fnsvr1D_olUI'
const CONTATO = 'https://github.com/ingrydguimaraes2026-cpu/Triply'

type Inscricao = { id: string; usuario_id: string; endpoint: string; p256dh: string; auth: string }

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!privada) return json({ erro: 'Falta o segredo VAPID_PRIVATE_KEY na função.' }, 500)
  webpush.setVapidDetails(CONTATO, VAPID_PUBLICA, privada)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const corpo = await req.json().catch(() => ({}))

  // Manda pra todos os aparelhos da pessoa; aparelho que não existe mais (404/410) sai da lista
  async function enviar(inscricoes: Inscricao[], dados: Record<string, string>) {
    let enviados = 0
    for (const i of inscricoes) {
      try {
        await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, JSON.stringify(dados), { TTL: 60 * 60 * 6 })
        enviados++
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', i.id)
        else console.error('Falha ao enviar push:', status, (erro as Error).message)
      }
    }
    return enviados
  }

  // ---------- Teste: só pra quem chamou ----------
  if (corpo?.teste) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: quem } = await admin.auth.getUser(token)
    if (!quem?.user) return json({ erro: 'Faça login pra testar.' }, 401)
    const { data: minhas } = await admin.from('push_inscricoes').select('*').eq('usuario_id', quem.user.id)
    const enviados = await enviar((minhas ?? []) as Inscricao[], {
      titulo: '✅ Avisos ligados',
      corpo: 'É assim que o Together vai te avisar quando o câmbio bater a sua meta.',
      url: '/',
      tag: 'teste',
    })
    return json({ enviados })
  }

  // ---------- Checagem agendada: todas as metas ----------
  const { data: metas, error } = await admin
    .from('metas_cambio')
    .select('usuario_id, viagem_id, moeda, meta, abaixo, viagens (nome)')
    .eq('avisar', true)
  if (error) return json({ erro: error.message }, 500)
  if (!metas?.length) return json({ metas: 0 })

  // Cotação comercial de agora de cada moeda (AwesomeAPI), numa chamada só
  const moedas = [...new Set(metas.map((m) => m.moeda))]
  const resposta = await fetch(`https://economia.awesomeapi.com.br/json/last/${moedas.map((m) => `${m}-BRL`).join(',')}`)
  if (!resposta.ok) return json({ erro: `AwesomeAPI respondeu ${resposta.status}` }, 502)
  const cotacoes: Record<string, { bid?: string }> = await resposta.json()

  let avisados = 0
  let rearmados = 0
  for (const m of metas) {
    const comercial = Number(cotacoes[`${m.moeda}BRL`]?.bid)
    if (!comercial) continue
    const { acao, comIOF } = decidir({ meta: Number(m.meta), abaixo: m.abaixo }, comercial)
    const chave = { usuario_id: m.usuario_id, viagem_id: m.viagem_id, moeda: m.moeda }

    if (acao === 'avisar') {
      const { data: aparelhos } = await admin.from('push_inscricoes').select('*').eq('usuario_id', m.usuario_id)
      const viagem = (m.viagens as unknown as { nome: string } | null)?.nome ?? 'a viagem'
      const texto = mensagem(m.moeda, comIOF, Number(m.meta), viagem)
      await enviar((aparelhos ?? []) as Inscricao[], { ...texto, url: `/viagem/${m.viagem_id}/financeiro`, tag: `cambio-${m.moeda}` })
      await admin.from('metas_cambio').update({ abaixo: true, avisado_em: new Date().toISOString() }).match(chave)
      avisados++
    } else if (acao === 'rearmar') {
      await admin.from('metas_cambio').update({ abaixo: false }).match(chave)
      rearmados++
    }
  }
  return json({ metas: metas.length, avisados, rearmados })
})
