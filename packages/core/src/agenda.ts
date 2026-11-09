// Agenda do dia (spec 029). Funções puras: montam a linha do tempo de um dia da viagem
// juntando trajetos, chegadas/saídas dos destinos e os eventos livres do comboio.
// Testado em apps/web/tests/agenda.test.mjs.
import type { Tables } from './database'

type Destino = Pick<Tables<'destinos'>, 'id' | 'nome' | 'chegada' | 'saida'>
type Trajeto = Pick<Tables<'trajetos'>, 'id' | 'origem_id' | 'destino_id' | 'meio' | 'partida' | 'chegada' | 'observacao'> &
  Partial<Pick<Tables<'trajetos'>, 'de_texto' | 'para_texto' | 'situacao' | 'trocas' | 'preco' | 'moeda' | 'ultimo_do_dia' | 'grupo_opcoes' | 'escolhida'>>
export type EventoDaAgenda = Tables<'eventos_agenda'>
export type SituacaoDoDeslocamento = 'comparando' | 'sugestao' | 'decidido' | 'reservado' | 'comprado'

export type ItemDaAgenda =
  | { tipo: 'saida' | 'chegada'; chave: string; hora: ''; titulo: string; detalhe: string }
  | {
      tipo: 'trajeto'
      chave: string
      hora: string
      titulo: string
      detalhe: string
      meio: string
      trajetoId: string
      fim?: string
      // Spec 122a: o deslocamento no dia
      situacao: SituacaoDoDeslocamento
      opcoes: number // quantas opções o deslocamento tem (1 = só ele)
      partida: string // horário completo da saída
      chegada: string | null // horário completo da chegada (pode ser no dia seguinte)
      para: string // pra onde (texto)
      ultimo: boolean // é o último do dia
    }
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

  for (const t of opcoesNoDia(trajetos)) {
    if (!t.partida || diaNoFuso(t.partida) !== dia) continue
    const de = t.de_texto ?? nomeDe(t.origem_id)
    const para = t.para_texto ?? nomeDe(t.destino_id)
    comHora.push({
      tipo: 'trajeto',
      chave: `t${t.id}`,
      hora: horaNoFuso(t.partida),
      titulo: `${de} → ${para}`,
      detalhe: detalheDoDeslocamento(t, dia),
      meio: t.meio,
      trajetoId: t.id,
      // Spec 077: até que horas o trajeto ocupa o dia (pra avisar compromisso por cima)
      ...(t.chegada && diaNoFuso(t.chegada) === dia ? { fim: horaNoFuso(t.chegada) } : {}),
      situacao: t.opcoes > 1 && !t.temEscolhida ? 'comparando' : ((t.situacao ?? 'sugestao') as SituacaoDoDeslocamento),
      opcoes: t.opcoes,
      partida: t.partida,
      chegada: t.chegada,
      para,
      ultimo: !!t.ultimo_do_dia,
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

// ---------- Spec 122a: deslocamentos no dia ----------

const NOME_DA_SITUACAO: Record<SituacaoDoDeslocamento, string> = {
  comparando: 'Comparando',
  sugestao: 'Pra decidir',
  decidido: 'Decidido',
  reservado: 'Reservado',
  comprado: 'Comprado',
}
export const nomeDaSituacaoDoDeslocamento = (s: SituacaoDoDeslocamento) => NOME_DA_SITUACAO[s] ?? 'Pra decidir'

// Opções do mesmo deslocamento (mesmo `grupo_opcoes`) viram um passo só no dia:
// a escolhida; se nenhuma (ou todas) estão marcadas, a primeira por horário, como "comparando".
export function opcoesNoDia<T extends Trajeto>(trajetos: T[]): (T & { opcoes: number; temEscolhida: boolean })[] {
  const grupos = new Map<string, T[]>()
  const soltos: (T & { opcoes: number; temEscolhida: boolean })[] = []
  for (const t of trajetos) {
    if (!t.grupo_opcoes) soltos.push({ ...t, opcoes: 1, temEscolhida: true })
    else grupos.set(t.grupo_opcoes, [...(grupos.get(t.grupo_opcoes) ?? []), t])
  }
  for (const lista of grupos.values()) {
    const ordem = [...lista].sort((a, b) => (a.partida ?? '9').localeCompare(b.partida ?? '9'))
    const escolhidas = ordem.filter((t) => t.escolhida !== false)
    const temEscolhida = escolhidas.length > 0 && escolhidas.length < ordem.length
    const vale = temEscolhida ? escolhidas[0] : ordem[0]
    soltos.push({ ...vale, opcoes: ordem.length, temEscolhida: ordem.length === 1 || temEscolhida })
  }
  return soltos
}

const NOME_DO_MEIO: Record<string, string> = {
  aviao: 'Avião', trem: 'Trem', onibus: 'Ônibus', metro: 'Metrô', carro: 'Carro', carona: 'Carona', barco: 'Barco', a_pe: 'A pé', outro: 'Outro',
}

// "Trem · 3h20 · chega 09:30 · 1 troca · €42 · último do dia" (chegada no dia seguinte vira "chega 03:10 do dia seguinte")
export function detalheDoDeslocamento(t: Trajeto, dia: string): string {
  const partes: string[] = [NOME_DO_MEIO[t.meio] ?? 'Outro']
  if (t.partida && t.chegada) {
    const min = Math.round((new Date(t.chegada).getTime() - new Date(t.partida).getTime()) / 60000)
    if (min > 0) partes.push(duracaoCurta(min))
    partes.push(`chega ${horaNoFuso(t.chegada)}${diaNoFuso(t.chegada) !== dia ? ' do dia seguinte' : ''}`)
  }
  if (t.trocas != null) partes.push(t.trocas === 0 ? 'direto' : t.trocas === 1 ? '1 troca' : `${t.trocas} trocas`)
  if (t.preco != null) partes.push(`${t.moeda === 'EUR' ? '€' : t.moeda === 'BRL' ? 'R$' : (t.moeda ?? '') + ' '}${Number(t.preco).toLocaleString('pt-BR')}`)
  if (t.ultimo_do_dia) partes.push('último do dia')
  if (t.observacao) partes.push(t.observacao)
  return partes.join(' · ')
}

// 200 → "3h20", 45 → "45 min", 120 → "2h"
export function duracaoCurta(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

// Topo do dia: "3 comprados · 1 pra decidir"
export function resumoDoDia(itens: ItemDaAgenda[]): { comprados: number; prontos: number; pendentes: number } {
  const desl = itens.filter((i): i is Extract<ItemDaAgenda, { tipo: 'trajeto' }> => i.tipo === 'trajeto')
  return {
    comprados: desl.filter((i) => i.situacao === 'comprado').length,
    prontos: desl.filter((i) => i.situacao === 'decidido' || i.situacao === 'reservado').length,
    pendentes: desl.filter((i) => i.situacao === 'sugestao' || i.situacao === 'comparando').length,
  }
}
