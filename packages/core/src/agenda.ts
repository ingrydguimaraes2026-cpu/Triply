// Agenda do dia (spec 029). Funções puras: montam a linha do tempo de um dia da viagem
// juntando trajetos, chegadas/saídas dos destinos e os eventos livres do comboio.
// Testado em apps/web/tests/agenda.test.mjs.
import type { Tables } from './database'

type Destino = Pick<Tables<'destinos'>, 'id' | 'nome' | 'chegada' | 'saida'>
type Trajeto = Pick<Tables<'trajetos'>, 'id' | 'origem_id' | 'destino_id' | 'meio' | 'partida' | 'chegada' | 'observacao'>
export type EventoDaAgenda = Tables<'eventos_agenda'>

export type ItemDaAgenda =
  | { tipo: 'saida' | 'chegada'; chave: string; hora: ''; titulo: string; detalhe: string }
  | { tipo: 'trajeto'; chave: string; hora: string; titulo: string; detalhe: string; meio: string; trajetoId: string; fim?: string }
  | { tipo: 'evento'; chave: string; hora: string; titulo: string; detalhe: string; evento: EventoDaAgenda }

// "2026-11-20T18:30:00Z" → o dia no fuso do aparelho ("2026-11-20")
export function diaNoFuso(horario: string): string {
  const d = new Date(horario)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "2026-11-20T18:30:00Z" → "15:30" (no fuso do aparelho)
export function horaNoFuso(horario: string): string {
  const d = new Date(horario)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Todos os dias entre o início e o fim (AAAA-MM-DD), no máximo 60
export function diasDoPeriodo(inicio: string | null, fim: string | null): string[] {
  if (!inicio) return []
  const dias: string[] = []
  const d = new Date(`${inicio}T12:00:00`)
  const ultimo = fim && fim >= inicio ? fim : inicio
  while (dias.length < 60) {
    const iso = diaNoFuso(d.toISOString())
    dias.push(iso)
    if (iso >= ultimo) break
    d.setDate(d.getDate() + 1)
  }
  return dias
}

// Onde o comboio está nesse dia: o destino cujo período inclui o dia (o último, se for dia de troca)
export function destinoDoDia<D extends Destino>(dia: string, destinos: D[]): D | undefined {
  const lista = destinos.filter((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia)
  return lista[lista.length - 1]
}

// Linha do tempo do dia. Ordem: saídas, depois tudo que tem hora (por hora), depois eventos sem hora, por fim chegadas.
export function montarAgendaDoDia(
  dia: string,
  { destinos, trajetos, eventos }: { destinos: Destino[]; trajetos: Trajeto[]; eventos: EventoDaAgenda[] },
): ItemDaAgenda[] {
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const saidas: ItemDaAgenda[] = []
  const chegadas: ItemDaAgenda[] = []
  const comHora: ItemDaAgenda[] = []
  const semHora: ItemDaAgenda[] = []

  for (const d of destinos) {
    if (d.saida === dia && d.saida !== d.chegada) saidas.push({ tipo: 'saida', chave: `s${d.id}`, hora: '', titulo: `Saída de ${d.nome}`, detalhe: '' })
    if (d.chegada === dia) chegadas.push({ tipo: 'chegada', chave: `c${d.id}`, hora: '', titulo: `Chegada em ${d.nome}`, detalhe: '' })
  }

  for (const t of trajetos) {
    if (!t.partida || diaNoFuso(t.partida) !== dia) continue
    comHora.push({
      tipo: 'trajeto',
      chave: `t${t.id}`,
      hora: horaNoFuso(t.partida),
      titulo: `${nomeDe(t.origem_id)} → ${nomeDe(t.destino_id)}`,
      detalhe: [t.chegada ? `chega ${horaNoFuso(t.chegada)}` : null, t.observacao].filter(Boolean).join(' · '),
      meio: t.meio,
      trajetoId: t.id,
      // Spec 077: até que horas o trajeto ocupa o dia (pra avisar compromisso por cima)
      ...(t.chegada && diaNoFuso(t.chegada) === dia ? { fim: horaNoFuso(t.chegada) } : {}),
    })
  }

  for (const e of eventos) {
    if (e.dia !== dia) continue
    const item: ItemDaAgenda = {
      tipo: 'evento',
      chave: `e${e.id}`,
      hora: e.hora ? e.hora.slice(0, 5) : '',
      titulo: e.titulo,
      detalhe: [e.local, e.observacao].filter(Boolean).join(' · '),
      evento: e,
    }
    ;(e.hora ? comHora : semHora).push(item)
  }

  comHora.sort((a, b) => a.hora.localeCompare(b.hora))
  return [...saidas, ...comHora, ...semHora, ...chegadas]
}

// Spec 088: roteiro pra imprimir. Todos os dias da viagem que têm alguma coisa,
// com onde o comboio está naquele dia. Dias vazios ficam de fora.
export function roteiroDiaADia<D extends Destino>(
  inicio: string | null,
  fim: string | null,
  dados: { destinos: D[]; trajetos: Trajeto[]; eventos: EventoDaAgenda[] },
): { dia: string; onde: D | undefined; itens: ItemDaAgenda[] }[] {
  return diasDoPeriodo(inicio, fim)
    .map((dia) => ({ dia, onde: destinoDoDia(dia, dados.destinos), itens: montarAgendaDoDia(dia, dados) }))
    .filter((d) => d.itens.length > 0)
}
