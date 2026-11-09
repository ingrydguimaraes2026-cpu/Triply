// Transportes que ajudam (spec 121, etapa 1). Funções puras, sem banco.
// Testado em apps/web/tests/como-ir.test.mjs.
// (O ".ts" no import é pra os testes no Node abrirem este arquivo sozinho.)
import { acharAeroporto, aeroportoDaCidade, minutosDeCarro, type Aeroporto } from './aeroportos.ts'

type DestinoC = { id: string; nome: string; pais: string | null; saida?: string | null }
type TrajetoC = {
  id: string
  meio: string
  origem_id: string | null
  destino_id: string | null
  partida: string | null
  chegada: string | null
  estacao_partida?: string | null
  estacao_chegada?: string | null
  passageiros?: string[] // ids (spec 067); vazio = o comboio inteiro
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// ---------- Qual aeroporto ----------

// Aeroporto de embarque e de chegada de um voo: o que está escrito na estação; senão, o principal da cidade.
export function aeroportosDoVoo(t: TrajetoC, destinos: DestinoC[]): { partida: Aeroporto | null; chegada: Aeroporto | null } {
  if (t.meio !== 'aviao') return { partida: null, chegada: null }
  const nome = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? null
  return {
    partida: acharAeroporto(t.estacao_partida) ?? acharAeroporto(nome(t.origem_id)) ?? aeroportoDaCidade(nome(t.origem_id)),
    chegada: acharAeroporto(t.estacao_chegada) ?? acharAeroporto(nome(t.destino_id)) ?? aeroportoDaCidade(nome(t.destino_id)),
  }
}

// ---------- "Saia às X" (T2) ----------

// Quanto antes chegar no embarque, por meio. Voo sem país conhecido conta como internacional (o mais seguro).
export function antecedenciaDoEmbarque(meio: string, internacional: boolean): number | null {
  if (meio === 'aviao') return internacional ? 180 : 120
  if (meio === 'trem' || meio === 'onibus') return 30
  if (meio === 'barco') return 45
  return null // carro, a pé: a partida já é a hora de sair
}

export function ehInternacional(t: TrajetoC, destinos: DestinoC[]): boolean {
  const pais = (id: string | null) => destinos.find((d) => d.id === id)?.pais ?? null
  const de = pais(t.origem_id)
  const para = pais(t.destino_id)
  if (!de || !para) return true
  return semAcento(de) !== semAcento(para)
}

export type HoraDeSair = {
  instante: string // ISO: a tela formata no mesmo fuso da partida
  antecedencia: number // minutos antes da partida, no embarque
  ateOEmbarque: number // minutos da casa até o embarque
  deOndeVeio: 'tabela' | 'escolhido'
}

// "Saia da casa às 05:35" = partida − antecedência − tempo até o embarque.
// O tempo até o embarque vem da tabela de aeroportos (voo) ou do que a pessoa escolheu.
// Sem nenhum dos dois → null (a tela pergunta). Sem partida ou meio sem antecedência → null.
export function horaDeSair(t: TrajetoC, destinos: DestinoC[], minutosEscolhidos: number | null): HoraDeSair | null {
  if (!t.partida) return null
  const antecedencia = antecedenciaDoEmbarque(t.meio, ehInternacional(t, destinos))
  if (antecedencia === null) return null
  const aeroporto = aeroportosDoVoo(t, destinos).partida
  const ateOEmbarque = minutosEscolhidos ?? (aeroporto ? minutosDeCarro(aeroporto) : null)
  if (ateOEmbarque === null) return null
  const instante = new Date(new Date(t.partida).getTime() - (antecedencia + ateOEmbarque) * 60_000).toISOString()
  return { instante, antecedencia, ateOEmbarque, deOndeVeio: minutosEscolhidos !== null ? 'escolhido' : 'tabela' }
}

// Opções pra pessoa escolher quando a tabela não sabe
export const TEMPOS_ATE_O_EMBARQUE = [15, 30, 45, 60, 90]

// ---------- Dividir o transfer (T3) ----------

export type ChegadaPerto = {
  trajetoId: string // o outro trajeto
  pessoas: string[] // ids de quem vem no outro trajeto
  minutos: number // diferença (positivo = o outro chega depois)
}

// Onde o trajeto chega, pra comparar: o aeroporto (se achar) ou a cidade
function pontoDeChegada(t: TrajetoC, destinos: DestinoC[]): string | null {
  if (!t.destino_id) return null
  const a = aeroportosDoVoo(t, destinos).chegada
  return a ? `aero:${a.codigo}` : `${t.meio}:${t.destino_id}:${semAcento(t.estacao_chegada ?? '')}`
}

// Outros trajetos que chegam no mesmo lugar com até `janela` minutos de diferença e trazem outras pessoas.
// Trajeto do comboio inteiro (sem passageiros) não entra: aí já vão todos juntos.
export function chegadasPerto(alvo: TrajetoC, trajetos: TrajetoC[], destinos: DestinoC[], janela = 90): ChegadaPerto[] {
  const meus = alvo.passageiros ?? []
  if (!alvo.chegada || meus.length === 0) return []
  const ponto = pontoDeChegada(alvo, destinos)
  if (!ponto) return []
  const minha = new Date(alvo.chegada).getTime()
  const saida: ChegadaPerto[] = []
  for (const t of trajetos) {
    if (t.id === alvo.id || !t.chegada) continue
    const deles = (t.passageiros ?? []).filter((p) => !meus.includes(p))
    if ((t.passageiros ?? []).length === 0 || deles.length === 0) continue
    if (pontoDeChegada(t, destinos) !== ponto) continue
    const minutos = Math.round((new Date(t.chegada).getTime() - minha) / 60_000)
    if (Math.abs(minutos) <= janela) saida.push({ trajetoId: t.id, pessoas: deles, minutos })
  }
  return saida.sort((a, b) => Math.abs(a.minutos) - Math.abs(b.minutos))
}

// Preço do táxi/corrida dividido (centavos, arredondado pra cima). Sem carro na tabela → null.
export function transferDividido(a: Aeroporto | null, pessoas: number): { preco: number; moeda: string } | null {
  const carro = a?.jeitos.find((x) => x.meio === 'taxi' || x.meio === 'corrida')
  if (!carro || pessoas < 1) return null
  return { preco: Math.ceil(carro.preco / pessoas), moeda: carro.moeda }
}

// ---------- Ver no mapa e links do trecho (T1, T4) ----------

// Google Maps com o caminho de A até B. Em transporte público por padrão.
export function linkDoCaminhoNoMapa(de: string, para: string, modo: 'transit' | 'driving' = 'transit'): string {
  const q = new URLSearchParams({ api: '1', origin: de, destination: para, travelmode: modo })
  return `https://www.google.com/maps/dir/?${q}`
}

export type LinkDoTrecho = { chave: 'mapa' | 'rome2rio' | 'voo' | 'carro'; nome: string; url: string }

// Botões pra descobrir como ir de um destino pro outro (trecho ainda sem trajeto).
// `afiliado` fica vazio por enquanto (spec 119 congelada); quando ligar, entra aqui.
export function linksDoTrecho(de: string, para: string, data: string | null, _afiliado?: string): LinkDoTrecho[] {
  const quando = data ? ` em ${data}` : ''
  return [
    { chave: 'mapa', nome: 'Transporte público', url: linkDoCaminhoNoMapa(de, para, 'transit') },
    { chave: 'rome2rio', nome: 'Comparar trem, ônibus e voo', url: `https://www.rome2rio.com/map/${encodeURIComponent(de)}/${encodeURIComponent(para)}` },
    { chave: 'voo', nome: 'Voos', url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`voos de ${de} para ${para}${quando}`)}` },
    { chave: 'carro', nome: 'De carro', url: linkDoCaminhoNoMapa(de, para, 'driving') },
  ]
}

// Trechos do roteiro (destinos seguidos) que ainda não têm nenhum trajeto
export function trechosSemTrajeto<D extends DestinoC>(destinos: D[], trajetos: Pick<TrajetoC, 'origem_id' | 'destino_id'>[]): { de: D; para: D }[] {
  const saida: { de: D; para: D }[] = []
  for (let i = 0; i + 1 < destinos.length; i++) {
    const de = destinos[i]
    const para = destinos[i + 1]
    if (!trajetos.some((t) => t.origem_id === de.id && t.destino_id === para.id)) saida.push({ de, para })
  }
  return saida
}
