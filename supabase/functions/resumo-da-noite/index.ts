// Função "resumo-da-noite" (spec 042): push por volta das 21h (hora do destino) com o que acontece amanhã.
// Chamada de hora em hora pelo agendamento (pg_cron), sem corpo. Pra cada viagem acontecendo, vê se
// agora são 20h ou 21h no destino de hoje (fuso pela longitude) e manda UMA vez por noite
// (`marcar_resumo`). Quem desligou "Resumo da noite" (spec 033) não recebe.
// Segredos: VAPID_PRIVATE_KEY (o mesmo das outras funções de aviso).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLICA = 'BMT3M0-HThNnW4fGo8UHb2WQkWYQIx6kYd1rSlUQzJt9yyGBDprocMC0zQc5kbUXcKWvqvXoW_6Fnsvr1D_olUI'
const CONTATO = 'https://github.com/ingrydguimaraes2026-cpu/Triply'

type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string }
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } })

// ---- Cópia de packages/core/src/resumo.ts (o Deno não importa do pacote). Mudou lá, muda aqui. ----
type DestinoR = { id: string; nome: string; chegada: string | null; saida: string | null; longitude: number | null }
type TrajetoR = { origem_id: string | null; destino_id: string | null; meio: string; partida: string | null }
type EventoR = { dia: string; hora: string | null; titulo: string }
type PontoR = { local: string; quando: string | null }

// Fuso aproximado pela longitude (15° = 1 h). Sem horário de verão: erra no máximo 1 h.
function fusoAproximado(longitude: number | null): number {
  if (longitude === null) return 0
  return Math.max(-12, Math.min(14, Math.round(longitude / 15)))
}

// Dia e hora "de lá" a partir de um instante, dado o fuso em horas
function horaLocal(instante: string | Date, fuso: number): { dia: string; hora: string; h: number } {
  const d = new Date(new Date(instante).getTime() + fuso * 3600000)
  const p = (n: number) => String(n).padStart(2, '0')
  return { dia: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`, hora: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`, h: d.getUTCHours() }
}

const MEIOS: Record<string, string> = { aviao: 'Voo', trem: 'Trem', onibus: 'Ônibus', carro: 'Carro', barco: 'Barco', a_pe: 'A pé' }

// Onde o comboio está num dia (o último destino cujo período inclui o dia)
function ondeNoDia(dia: string, destinos: DestinoR[]): DestinoR | undefined {
  const lista = destinos.filter((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia)
  return lista[lista.length - 1]
}

// Monta o resumo de amanhã. null = nada marcado (não manda push vazio).
function resumoDeAmanha(
  amanha: string,
  fuso: number,
  { destinos, trajetos, eventos, pontos }: { destinos: DestinoR[]; trajetos: TrajetoR[]; eventos: EventoR[]; pontos: PontoR[] },
): { titulo: string; corpo: string } | null {
  const nome = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const itens: { hora: string; texto: string }[] = []
  for (const t of trajetos) {
    if (!t.partida) continue
    const l = horaLocal(t.partida, fuso)
    if (l.dia === amanha) itens.push({ hora: l.hora, texto: `${MEIOS[t.meio] ?? 'Saída'} ${nome(t.origem_id)} → ${nome(t.destino_id)}` })
  }
  for (const p of pontos) {
    if (!p.quando) continue
    const l = horaLocal(p.quando, fuso)
    if (l.dia === amanha) itens.push({ hora: l.hora, texto: `Encontro: ${p.local}` })
  }
  for (const e of eventos) if (e.dia === amanha) itens.push({ hora: e.hora?.slice(0, 5) ?? '', texto: e.titulo })
  const chegando = destinos.filter((d) => d.chegada === amanha && ondeNoDia(amanha, destinos)?.id === d.id && d.chegada !== d.saida)

  if (itens.length === 0 && chegando.length === 0) return null
  itens.sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'))
  const onde = ondeNoDia(amanha, destinos)
  const linhas = itens.slice(0, 4).map((i) => (i.hora ? `${i.hora} ${i.texto}` : i.texto))
  if (itens.length > 4) linhas.push(`+ ${itens.length - 4}`)
  if (chegando.length) linhas.push(`Chegada em ${chegando.map((d) => d.nome).join(', ')}`)
  const primeiro = itens.find((i) => i.hora)
  return {
    titulo: `🌙 Amanhã${onde ? ` em ${onde.nome}` : ''}${primeiro ? ` · começa ${primeiro.hora}` : ''}`,
    corpo: linhas.join(' · '),
  }
}
// ---- fim da cópia ----

function somarDia(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async () => {
  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!privada) return json({ erro: 'Falta o segredo VAPID_PRIVATE_KEY na função.' }, 500)
  webpush.setVapidDetails(CONTATO, VAPID_PUBLICA, privada)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Viagens com algum destino entre ontem e amanhã (em UTC; o fuso fino vem depois)
  const hojeUtc = new Date().toISOString().slice(0, 10)
  const { data: destinosAtivos, error } = await admin
    .from('destinos')
    .select('viagem_id')
    .lte('chegada', somarDia(hojeUtc, 2))
    .gte('saida', somarDia(hojeUtc, -1))
  if (error) return json({ erro: error.message }, 500)
  const viagens = [...new Set((destinosAtivos ?? []).map((d) => d.viagem_id))]

  let enviados = 0
  for (const viagemId of viagens) {
    const { data: destinos } = await admin.from('destinos').select('id, nome, chegada, saida, longitude').eq('viagem_id', viagemId).order('ordem')
    if (!destinos?.length) continue
    // Fuso do destino de hoje (ou do primeiro)
    const ondeHoje = ondeNoDia(hojeUtc, destinos) ?? destinos[0]
    const fuso = fusoAproximado(ondeHoje.longitude)
    const agora = horaLocal(new Date(), fuso)
    if (agora.h !== 20 && agora.h !== 21) continue
    const amanha = somarDia(agora.dia, 1)

    const [trajetos, eventos, pontos] = await Promise.all([
      admin.from('trajetos').select('origem_id, destino_id, meio, partida').eq('viagem_id', viagemId),
      admin.from('eventos_agenda').select('dia, hora, titulo').eq('viagem_id', viagemId).eq('dia', amanha),
      admin.from('pontos_de_encontro').select('local, quando').eq('viagem_id', viagemId),
    ])
    const resumo = resumoDeAmanha(amanha, fuso, { destinos, trajetos: trajetos.data ?? [], eventos: eventos.data ?? [], pontos: pontos.data ?? [] })
    if (!resumo) continue
    const { data: primeiraVez } = await admin.rpc('marcar_resumo', { p_viagem: viagemId, p_dia: amanha })
    if (!primeiraVez) continue

    const { data: membros } = await admin.from('comboio_membros').select('usuario_id').eq('viagem_id', viagemId)
    const pessoas = (membros ?? []).map((m) => m.usuario_id)
    const { data: desligados } = await admin.from('preferencias_aviso').select('usuario_id').eq('tipo', 'resumo').eq('ligado', false).in('usuario_id', pessoas)
    const fora = new Set((desligados ?? []).map((d) => d.usuario_id))
    const { data: aparelhos } = await admin.from('push_inscricoes').select('id, endpoint, p256dh, auth').in('usuario_id', pessoas.filter((p) => !fora.has(p)))
    const dados = JSON.stringify({ ...resumo, url: `/viagem/${viagemId}/agenda`, tag: `resumo-${viagemId}-${amanha}` })
    for (const a of (aparelhos ?? []) as Inscricao[]) {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, dados, { TTL: 60 * 60 * 6 })
        enviados++
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', a.id)
        else console.error('Falha ao enviar push:', status, (erro as Error).message)
      }
    }
  }
  return json({ viagens: viagens.length, enviados })
})
