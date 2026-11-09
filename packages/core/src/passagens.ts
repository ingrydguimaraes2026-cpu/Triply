// Spec 122d: Passagens da viagem (substitui a tela Transportes). O que falta decidir, o que falta comprar,
// o que já foi comprado, os avisos da viagem toda e quanto custa o transporte.
// Função pura. Teste: apps/web/tests/passagens.test.mjs
import type { Tables } from './database'
import { diaNoFuso, horaNoFuso, montarAgendaDoDia, opcoesNoDia, type SituacaoDoDeslocamento } from './agenda.ts'
import { avisosDoDia, type AvisoDoDia, type CasaDoDia } from './avisos-do-dia.ts'

type Trajeto = Pick<Tables<'trajetos'>, 'id' | 'origem_id' | 'destino_id' | 'meio' | 'partida' | 'chegada' | 'observacao'> &
  Partial<Pick<Tables<'trajetos'>, 'de_texto' | 'para_texto' | 'situacao' | 'trocas' | 'preco' | 'moeda' | 'ultimo_do_dia' | 'grupo_opcoes' | 'escolhida'>>
type Destino = Pick<Tables<'destinos'>, 'id' | 'nome' | 'chegada' | 'saida'>

export type ItemDaPassagem = {
  id: string
  grupo: string | null
  opcoes: number
  titulo: string // "Como → Veneza"
  dia: string | null
  hora: string | null
  meio: string
  situacao: SituacaoDoDeslocamento
  preco: number | null
  moeda: string | null
  naHora: boolean // compra no cais / na estação ("na hora" na observação)
}

export type Passagens = {
  decidir: ItemDaPassagem[]
  comprar: ItemDaPassagem[]
  compradas: ItemDaPassagem[]
  avisos: (AvisoDoDia & { dia: string; trajetoId: string | null })[]
  // Somas por moeda (não converte câmbio): total previsto e o que já foi comprado
  total: Record<string, number>
  pago: Record<string, number>
}

const NA_HORA = /(no cais|na hora|na esta[cç][aã]o|no ônibus|no onibus|a bordo)/i

export function passagensDaViagem(trajetos: Trajeto[], destinos: Destino[], casas: CasaDoDia[]): Passagens {
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const decidir: ItemDaPassagem[] = []
  const comprar: ItemDaPassagem[] = []
  const compradas: ItemDaPassagem[] = []
  const total: Record<string, number> = {}
  const pago: Record<string, number> = {}

  const valem = opcoesNoDia(trajetos).sort((a, b) => (a.partida ?? '9').localeCompare(b.partida ?? '9'))
  for (const t of valem) {
    const situacao: SituacaoDoDeslocamento = t.opcoes > 1 && !t.temEscolhida ? 'comparando' : ((t.situacao ?? 'sugestao') as SituacaoDoDeslocamento)
    const item: ItemDaPassagem = {
      id: t.id,
      grupo: t.grupo_opcoes ?? null,
      opcoes: t.opcoes,
      titulo: `${t.de_texto ?? nomeDe(t.origem_id)} → ${t.para_texto ?? nomeDe(t.destino_id)}`,
      dia: t.partida ? diaNoFuso(t.partida) : null,
      hora: t.partida ? horaNoFuso(t.partida) : null,
      meio: t.meio,
      situacao,
      preco: t.preco != null ? Number(t.preco) : null,
      moeda: t.moeda ?? null,
      naHora: !!t.observacao && NA_HORA.test(t.observacao),
    }
    if (situacao === 'comprado') compradas.push(item)
    else if (situacao === 'decidido' || situacao === 'reservado') comprar.push(item)
    else decidir.push(item)
    if (item.preco != null && item.moeda) {
      total[item.moeda] = (total[item.moeda] ?? 0) + item.preco
      if (situacao === 'comprado') pago[item.moeda] = (pago[item.moeda] ?? 0) + item.preco
    }
  }

  // Avisos sérios (vermelhos) de cada dia que tem deslocamento
  const dias = [...new Set(valem.map((t) => (t.partida ? diaNoFuso(t.partida) : null)).filter((d): d is string => !!d))].sort()
  const avisos: Passagens['avisos'] = []
  for (const dia of dias) {
    const itens = montarAgendaDoDia(dia, { destinos, trajetos, eventos: [] })
    for (const a of avisosDoDia(dia, itens, casas)) {
      if (a.nivel !== 'ruim') continue
      const item = itens.find((i) => i.chave === a.depoisDe)
      avisos.push({ ...a, dia, trajetoId: item && item.tipo === 'trajeto' ? item.trajetoId : null })
    }
  }

  return { decidir, comprar, compradas, avisos, total, pago }
}
