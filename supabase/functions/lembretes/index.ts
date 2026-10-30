// Função "lembretes" (spec 032): push no celular 1 hora antes de cada trajeto e ponto de encontro,
// e 2 dias antes do fim do cancelamento grátis da hospedagem escolhida (spec 041).
// Chamada a cada 5 min pelo agendamento (pg_cron), sem corpo. Pode rodar de novo sem medo:
// o banco (`lembretes_a_enviar`) só devolve cada lembrete uma vez.
// Quem recebe: todo mundo do comboio da viagem que ligou os avisos no aparelho.
// Segredos: VAPID_PRIVATE_KEY (o mesmo das funções avisos-cambio e avisos-feed).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLICA = 'BMT3M0-HThNnW4fGo8UHb2WQkWYQIx6kYd1rSlUQzJt9yyGBDprocMC0zQc5kbUXcKWvqvXoW_6Fnsvr1D_olUI'
const CONTATO = 'https://github.com/ingrydguimaraes2026-cpu/Triply'

type Inscricao = { id: string; usuario_id: string; endpoint: string; p256dh: string; auth: string }
type Lembrete = { tipo: 'trajeto' | 'ponto' | 'cancelamento'; alvo_id: string; viagem_id: string; titulo: string | null; horario: string; meio: string | null }

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } })

// ---- Cópia de packages/core/src/lembretes.ts (o Deno não importa do pacote). Mudou lá, muda aqui. ----
const EMOJI_DO_MEIO: Record<string, string> = { aviao: '✈️', trem: '🚆', onibus: '🚌', carro: '🚗', barco: '⛴️', a_pe: '🚶' }

function faltaQuanto(horario: string, agora = new Date()) {
  const minutos = Math.round((new Date(horario).getTime() - agora.getTime()) / 60000)
  if (minutos <= 1) return 'agora'
  if (minutos < 60) return `em ${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `em ${horas} h ${resto} min` : `em ${horas} h`
}

function textoDoLembrete(l: Lembrete) {
  const falta = faltaQuanto(l.horario)
  const titulo = l.titulo?.trim() || (l.tipo === 'ponto' ? 'o ponto de encontro' : l.tipo === 'cancelamento' ? 'a hospedagem' : 'o trajeto')
  if (l.tipo === 'cancelamento') {
    const [, m, d] = l.horario.slice(0, 10).split('-')
    return { titulo: '⏳ Cancelamento grátis acabando', corpo: `${titulo}: dá pra cancelar sem pagar só até ${d}/${m}. Ainda vão ficar?`, url: `/viagem/${l.viagem_id}/hospedagem`, tag: `lembrete-cancelamento-${l.alvo_id}` }
  }
  if (l.tipo === 'ponto') {
    return { titulo: `📍 Encontro ${falta}`, corpo: `${titulo}. Não se atrase!`, url: `/viagem/${l.viagem_id}?foco=${l.alvo_id}`, tag: `lembrete-ponto-${l.alvo_id}` }
  }
  const emoji = (l.meio && EMOJI_DO_MEIO[l.meio]) || '🧳'
  return { titulo: `${emoji} Saída ${falta}`, corpo: `${titulo}. Bilhete e documentos na mão.`, url: `/viagem/${l.viagem_id}/transportes`, tag: `lembrete-trajeto-${l.alvo_id}` }
}
// ---- fim da cópia ----

Deno.serve(async () => {
  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!privada) return json({ erro: 'Falta o segredo VAPID_PRIVATE_KEY na função.' }, 500)
  webpush.setVapidDetails(CONTATO, VAPID_PUBLICA, privada)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: lembretes, error } = await admin.rpc('lembretes_a_enviar')
  if (error) return json({ erro: error.message }, 500)
  if (!lembretes?.length) return json({ lembretes: 0, enviados: 0 })

  let enviados = 0
  for (const l of lembretes as Lembrete[]) {
    const { data: membros } = await admin.from('comboio_membros').select('usuario_id').eq('viagem_id', l.viagem_id)
    let pessoas = (membros ?? []).map((m) => m.usuario_id)
    // Spec 067: trajeto com lista de passageiros avisa só quem vai
    if (l.tipo === 'trajeto') {
      const { data: passageiros } = await admin.from('trajeto_passageiros').select('usuario_id').eq('trajeto_id', l.alvo_id)
      const lista = new Set((passageiros ?? []).map((p) => p.usuario_id))
      if (lista.size > 0) pessoas = pessoas.filter((p) => lista.has(p))
    }
    if (pessoas.length === 0) continue

    // Quem desligou esse tipo de aviso (spec G4) não recebe
    const { data: desligados } = await admin
      .from('preferencias_aviso')
      .select('usuario_id')
      .eq('tipo', 'lembretes')
      .eq('ligado', false)
      .in('usuario_id', pessoas)
    const fora = new Set((desligados ?? []).map((d) => d.usuario_id))

    const { data: aparelhos } = await admin
      .from('push_inscricoes')
      .select('id, usuario_id, endpoint, p256dh, auth')
      .in('usuario_id', pessoas.filter((p) => !fora.has(p)))
    const dados = JSON.stringify(textoDoLembrete(l))
    for (const a of (aparelhos ?? []) as Inscricao[]) {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, dados, { TTL: 60 * 60 })
        enviados++
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', a.id)
        else console.error('Falha ao enviar push:', status, (erro as Error).message)
      }
    }
  }
  return json({ lembretes: lembretes.length, enviados })
})
