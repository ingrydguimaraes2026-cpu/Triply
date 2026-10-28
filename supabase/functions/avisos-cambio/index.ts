// Função "avisos-cambio" (spec 013): boletim do câmbio no celular, 2x por dia (12h e 20h de Brasília).
// - Chamada sem corpo (pelo agendamento): manda o boletim pra todo mundo que pediu.
// - Chamada com { "teste": true } por alguém logado: manda o boletim de agora só pros aparelhos dessa pessoa
//   (sem mexer no "último valor", pra não bagunçar o "subiu/caiu" do próximo boletim de verdade).
// Segredos (no painel do Supabase → Edge Functions → Secrets): VAPID_PRIVATE_KEY.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase já coloca sozinho.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'
import { boletim, decidir, IOF_GASTOS, nivelDoCambio } from './regras.ts'

// Chave pública do Web Push (a mesma de src/features/cambio/avisos.ts). Pública por natureza.
const VAPID_PUBLICA = 'BMT3M0-HThNnW4fGo8UHb2WQkWYQIx6kYd1rSlUQzJt9yyGBDprocMC0zQc5kbUXcKWvqvXoW_6Fnsvr1D_olUI'
const CONTATO = 'https://github.com/ingrydguimaraes2026-cpu/Triply'

type Inscricao = { id: string; usuario_id: string; endpoint: string; p256dh: string; auth: string }
type Linha = {
  usuario_id: string
  viagem_id: string
  moeda: string
  meta: number | null
  abaixo: boolean
  ultimo_valor: number | null
  boletim_em: string | null
}

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

// Cotação comercial de agora: AwesomeAPI (atualiza durante o dia). Se ela falhar (às vezes bloqueia servidores),
// usa o Banco Central Europeu (Frankfurter, valor do último dia útil).
async function cotacoesDeAgora(moedas: string[]) {
  const saida: Record<string, number> = {}
  try {
    const resposta = await fetch(`https://economia.awesomeapi.com.br/json/last/${moedas.map((m) => `${m}-BRL`).join(',')}`)
    if (resposta.ok) {
      const dados: Record<string, { bid?: string }> = await resposta.json()
      for (const m of moedas) {
        const valor = Number(dados[`${m}BRL`]?.bid)
        if (valor) saida[m] = valor
      }
    } else console.error('AwesomeAPI respondeu', resposta.status)
  } catch (e) {
    console.error('AwesomeAPI falhou:', (e as Error).message)
  }
  for (const m of moedas.filter((m) => !saida[m])) {
    try {
      const resposta = await fetch(`https://api.frankfurter.dev/v1/latest?base=${m}&symbols=BRL`)
      const dados: { rates?: { BRL?: number } } = resposta.ok ? await resposta.json() : {}
      if (dados.rates?.BRL) saida[m] = dados.rates.BRL
    } catch (e) {
      console.error('Frankfurter falhou:', (e as Error).message)
    }
  }
  if (Object.keys(saida).length === 0) throw new Error('Nenhuma fonte de cotação respondeu.')
  return saida
}

// Últimos 90 dias (Frankfurter, 1 valor por dia útil). Falhou → lista vazia (o boletim sai sem o "barato/caro").
async function historico90(moeda: string) {
  try {
    const inicio = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10)
    const resposta = await fetch(`https://api.frankfurter.dev/v1/${inicio}..?base=${moeda}&symbols=BRL`)
    if (!resposta.ok) return []
    const dados: { rates?: Record<string, { BRL?: number }> } = await resposta.json()
    return Object.values(dados.rates ?? {})
      .map((r) => r.BRL)
      .filter((v): v is number => typeof v === 'number')
  } catch {
    return []
  }
}

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

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const corpo = await req.json().catch(() => ({}))

  // Manda pra todos os aparelhos da pessoa; aparelho que não existe mais (404/410) sai da lista
  async function enviar(usuarioId: string, dados: Record<string, string>) {
    const { data } = await admin.from('push_inscricoes').select('*').eq('usuario_id', usuarioId)
    let enviados = 0
    for (const i of (data ?? []) as Inscricao[]) {
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

  // Quem é a pessoa logada (só no teste)
  let soEsta: string | null = null
  if (corpo?.teste) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: quem } = await admin.auth.getUser(token)
    if (!quem?.user) return json({ erro: 'Faça login pra testar.' }, 401)
    soEsta = quem.user.id
  }

  let consulta = admin.from('metas_cambio').select('usuario_id, viagem_id, moeda, meta, abaixo, ultimo_valor, boletim_em').eq('avisar', true)
  if (soEsta) consulta = consulta.eq('usuario_id', soEsta)
  const { data, error } = await consulta
  if (error) return json({ erro: error.message }, 500)
  const linhas = (data ?? []) as Linha[]

  // Teste de quem ainda não pediu boletim nenhum: notificação simples
  if (soEsta && linhas.length === 0) {
    const enviados = await enviar(soEsta, {
      titulo: '✅ Notificações ligadas',
      corpo: 'É assim que o Together vai te mandar o boletim do câmbio, às 12h e às 20h.',
      url: '/',
      tag: 'teste',
    })
    return json({ enviados })
  }
  if (linhas.length === 0) return json({ boletins: 0 })

  const moedas = [...new Set(linhas.map((l) => l.moeda))]
  let agora: Record<string, number>
  try {
    agora = await cotacoesDeAgora(moedas)
  } catch (e) {
    return json({ erro: (e as Error).message }, 502)
  }
  const historicos = Object.fromEntries(await Promise.all(moedas.map(async (m) => [m, await historico90(m)] as const)))

  // Um boletim por pessoa e moeda (quem tem 2 viagens em euro recebe 1 só)
  const grupos = new Map<string, Linha[]>()
  for (const l of linhas) {
    const chave = `${l.usuario_id}:${l.moeda}`
    grupos.set(chave, [...(grupos.get(chave) ?? []), l])
  }

  let enviados = 0
  for (const grupo of grupos.values()) {
    const { usuario_id, moeda } = grupo[0]
    const comercial = agora[moeda]
    if (!comercial) continue
    const comIOF = comercial * (1 + IOF_GASTOS)

    // "Último aviso" = o boletim mais recente entre as viagens dessa moeda
    const ultimo = grupo.filter((l) => l.ultimo_valor !== null).sort((a, b) => (b.boletim_em ?? '').localeCompare(a.boletim_em ?? ''))[0]

    // Meta (opcional): avisa uma vez quando cruza pra baixo
    let metaBatida: number | null = null
    const decisoes = grupo.map((l) => (l.meta === null ? null : decidir({ meta: Number(l.meta), abaixo: l.abaixo }, comercial)))
    grupo.forEach((l, i) => {
      if (decisoes[i]?.acao === 'avisar') metaBatida = Math.max(metaBatida ?? 0, Number(l.meta))
    })

    const texto = boletim({
      moeda,
      comIOF,
      anterior: ultimo ? Number(ultimo.ultimo_valor) : null,
      nivel: nivelDoCambio(historicos[moeda] ?? [], comercial),
      metaBatida,
    })
    enviados += await enviar(usuario_id, {
      ...texto,
      url: grupo.length === 1 ? `/viagem/${grupo[0].viagem_id}/financeiro` : '/',
      tag: `cambio-${moeda}`,
    })

    // O teste não grava nada: o próximo boletim de verdade compara com o anterior de verdade
    if (soEsta) continue
    const quando = new Date().toISOString()
    for (const [i, l] of grupo.entries()) {
      const acao = decisoes[i]?.acao
      await admin
        .from('metas_cambio')
        .update({
          ultimo_valor: Number(comIOF.toFixed(4)),
          boletim_em: quando,
          ...(acao === 'avisar' ? { abaixo: true, avisado_em: quando } : acao === 'rearmar' ? { abaixo: false } : {}),
        })
        .match({ usuario_id: l.usuario_id, viagem_id: l.viagem_id, moeda: l.moeda })
    }
  }
  return json({ boletins: grupos.size, enviados })
})
