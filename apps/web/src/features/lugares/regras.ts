// Regras dos lugares de cada destino (spec 016). Funções puras, sem banco. Testadas em tests/lugares-regras.test.mjs.
// Dinheiro sempre em centavos (inteiro), igual ao Financeiro e à Hospedagem.
import { contarNoites } from '../destinos/datas.ts'

export type TipoDeLugar = 'passeio' | 'comida' | 'guarda_volumes' | 'outro'

// Mesmos tipos da tabela `lugares` no banco, na ordem em que aparecem na tela
export const TIPOS_DE_LUGAR: { chave: TipoDeLugar; nome: string; plural: string; exemplo: string }[] = [
  { chave: 'passeio', nome: 'Passeio', plural: 'Passeios', exemplo: 'Ex.: Galeria Vittorio Emanuele: girar no touro' },
  { chave: 'comida', nome: 'Comida', plural: 'Comida', exemplo: 'Ex.: Steak n Shake, na frente da marina' },
  { chave: 'guarda_volumes', nome: 'Guarda-volumes', plural: 'Guarda-volumes', exemplo: 'Ex.: Guarda-volumes da Milano Centrale' },
  { chave: 'outro', nome: 'Outro', plural: 'Outros', exemplo: 'Ex.: Farmácia perto do hotel' },
]

export function tipoDeLugar(chave: string) {
  return TIPOS_DE_LUGAR.find((t) => t.chave === chave) ?? TIPOS_DE_LUGAR[3]
}

export type Lugar = {
  id: string
  destinoId: string | null
  tipo: TipoDeLugar
  nome: string
  link: string | null
  horario: string | null
  preco: number | null // centavos
  moeda: string
  observacao: string | null
  criadoPor: string
}

type DestinoBase = { id: string; nome: string; pais: string | null; chegada: string | null; saida: string | null }

export type DestinoComLugares<D extends DestinoBase> = {
  destino: D
  indice: number
  lugares: Lugar[]
  passagem: boolean // chega e sai no mesmo dia (bate-e-volta): bom lugar pra um guarda-volumes
  temGuardaVolumes: boolean
}

// Lugares de um destino na ordem dos tipos (passeio, comida, guarda-volumes, outro) e, dentro do tipo, pela ordem em que foram anotados
export function ordenarLugares(lugares: Lugar[]): Lugar[] {
  const posicao = (l: Lugar) => TIPOS_DE_LUGAR.findIndex((t) => t.chave === l.tipo)
  return lugares.map((l, i) => ({ l, i })).sort((a, b) => posicao(a.l) - posicao(b.l) || a.i - b.i).map(({ l }) => l)
}

/**
 * Junta os destinos (na ordem do roteiro) com os lugares de cada um.
 * Destino repetido (Mônaco no sábado e no domingo) tem id próprio: cada um tem os seus lugares.
 */
export function montarLugares<D extends DestinoBase>(destinos: D[], lugares: Lugar[]): DestinoComLugares<D>[] {
  return destinos.map((destino, indice) => {
    const meus = ordenarLugares(lugares.filter((l) => l.destinoId === destino.id))
    return {
      destino,
      indice,
      lugares: meus,
      passagem: contarNoites(destino.chegada, destino.saida) === 0,
      temGuardaVolumes: meus.some((l) => l.tipo === 'guarda_volumes'),
    }
  })
}

// Lugares cujo destino saiu do roteiro (o banco guarda, sem destino)
export function lugaresSoltos(destinos: Pick<DestinoBase, 'id'>[], lugares: Lugar[]): Lugar[] {
  return lugares.filter((l) => !l.destinoId || !destinos.some((d) => d.id === l.destinoId))
}

// Quantos de cada tipo (pros filtros: "Passeios 3")
export function contarPorTipo(lugares: Lugar[]): Record<TipoDeLugar, number> {
  const conta: Record<TipoDeLugar, number> = { passeio: 0, comida: 0, guarda_volumes: 0, outro: 0 }
  for (const l of lugares) conta[l.tipo] = (conta[l.tipo] ?? 0) + 1
  return conta
}

// Google Maps com a busca "Nome do lugar, Cidade, País" (sem chave de API)
export function linkNoMapa(lugar: Pick<Lugar, 'nome'>, destino?: Pick<DestinoBase, 'nome' | 'pais'> | null) {
  const cidade = destino ? (destino.pais && destino.pais !== destino.nome ? `${destino.nome}, ${destino.pais}` : destino.nome) : ''
  const busca = cidade ? `${lugar.nome}, ${cidade}` : lugar.nome
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: busca })}`
}
