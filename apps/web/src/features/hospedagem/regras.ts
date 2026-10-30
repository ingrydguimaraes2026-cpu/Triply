// Regras da hospedagem (spec 011). Funções puras, sem banco. Testadas em tests/hospedagem.test.mjs.
// Dinheiro sempre em centavos (inteiro), igual ao Financeiro.
import { contarNoites } from '../destinos/datas.ts'
import { codigoDoPais } from '../documentos/paises.ts'
import { formatarData } from '../../lib/datas.ts'

type DestinoBase = { id: string; nome: string; pais: string | null; chegada: string | null; saida: string | null }

export type Opcao = {
  id: string
  destinoId: string | null
  nome: string
  link: string | null
  precoTotal: number | null // centavos
  moeda: string
  checkin: string | null
  checkout: string | null
  horaCheckin?: string | null // "15:00" (a partir de)
  horaCheckout?: string | null // "10:00" (até)
  observacao: string | null
  cancelamentoGratisAte?: string | null // spec 041
  guardaMalas?: string | null // spec 060
  guardaMalasObs?: string | null
  etiquetas?: string[] // spec 063
  fotoUrl?: string | null // spec 072
  nota?: number | null
  escolhida: boolean
  criadoPor: string
  votos: string[] // ids de quem votou
  guia?: GuiaDaCasa // spec 026: só faz sentido na escolhida
}

// Guia da casa (spec 026): o que o comboio precisa saber ao chegar
export type GuiaDaCasa = {
  endereco: string | null
  wifiRede: string | null
  wifiSenha: string | null
  codigoPorta: string | null
  regras: string | null
  comoChegar?: string | null // spec 062: transfer do aeroporto/estação
}

export function guiaVazio(guia: GuiaDaCasa | undefined): boolean {
  return !guia || Object.values(guia).every((v) => !v)
}

// ---------------- Links de busca ----------------

export type Busca = { site: 'airbnb' | 'booking' | 'hostelworld' | 'maps'; nome: string; url: string }

// "Nice, França" (só o nome se o país vier vazio ou repetido)
export function localDaBusca(destino: Pick<DestinoBase, 'nome' | 'pais'>) {
  return destino.pais && destino.pais !== destino.nome ? `${destino.nome}, ${destino.pais}` : destino.nome
}

/**
 * Links de busca já preenchidos com cidade, datas e número de pessoas.
 * Sem as duas datas (ou com 0 noites), os sites abrem só com a cidade.
 */
export function linksDeBusca(destino: DestinoBase, pessoas: number): Busca[] {
  const local = localDaBusca(destino)
  const noites = contarNoites(destino.chegada, destino.saida)
  const comDatas = noites !== null && noites > 0
  const adultos = String(Math.max(1, pessoas))

  const airbnb = new URLSearchParams()
  if (comDatas) {
    airbnb.set('checkin', destino.chegada!)
    airbnb.set('checkout', destino.saida!)
  }
  airbnb.set('adults', adultos)

  const booking = new URLSearchParams({ ss: local })
  if (comDatas) {
    booking.set('checkin', destino.chegada!)
    booking.set('checkout', destino.saida!)
  }
  booking.set('group_adults', adultos)
  booking.set('no_rooms', '1')
  booking.set('group_children', '0')

  const maps = new URLSearchParams({ api: '1', query: `hospedagem em ${local}` })

  return [
    {
      site: 'airbnb',
      nome: 'Airbnb',
      url: `https://www.airbnb.com.br/s/${encodeURIComponent(local)}/homes?${airbnb}`,
    },
    { site: 'booking', nome: 'Booking', url: `https://www.booking.com/searchresults.pt-br.html?${booking}` },
    { site: 'maps', nome: 'Google Maps', url: `https://www.google.com/maps/search/?${maps}` },
    // Spec 063 (ideia do Hostelworld): hostels com avaliação e "vibe". Busca, porque o site não tem link de pesquisa estável.
    { site: 'hostelworld', nome: 'Hostels', url: `https://www.google.com/search?${new URLSearchParams({ q: `hostelworld ${local}` })}` },
  ]
}

// ---------------- Vibe da opção (spec 063) ----------------

export const ETIQUETAS_DA_HOSPEDAGEM: { chave: string; nome: string }[] = [
  { chave: 'social', nome: 'Social / animado' },
  { chave: 'tranquilo', nome: 'Tranquilo' },
  { chave: 'seguro', nome: 'Seguro' },
  { chave: 'bem_localizado', nome: 'Bem localizado' },
  { chave: 'cozinha', nome: 'Tem cozinha' },
  { chave: 'familia', nome: 'Bom pra família' },
  { chave: 'barato', nome: 'Barato' },
]

export function nomeDaEtiqueta(chave: string): string {
  return ETIQUETAS_DA_HOSPEDAGEM.find((e) => e.chave === chave)?.nome ?? chave
}

// ---------------- Site do link ----------------

const SITES: { chave: string; nome: string; dominio: RegExp }[] = [
  { chave: 'airbnb', nome: 'Airbnb', dominio: /(^|\.)airbnb\./ },
  { chave: 'booking', nome: 'Booking', dominio: /(^|\.)booking\.com$/ },
  { chave: 'hostelworld', nome: 'Hostelworld', dominio: /(^|\.)hostelworld\./ },
  { chave: 'expedia', nome: 'Expedia', dominio: /(^|\.)expedia\./ },
  { chave: 'vrbo', nome: 'Vrbo', dominio: /(^|\.)vrbo\.com$/ },
  { chave: 'hotels', nome: 'Hotels.com', dominio: /(^|\.)hotels\.com$/ },
  { chave: 'agoda', nome: 'Agoda', dominio: /(^|\.)agoda\./ },
  { chave: 'decolar', nome: 'Decolar', dominio: /(^|\.)decolar\.com$/ },
  { chave: 'google', nome: 'Google', dominio: /(^|\.)(google\.[a-z.]+|goo\.gl)$/ },
]

export type Site = { chave: string; nome: string }

// "https://www.airbnb.com.br/rooms/123" → { chave: 'airbnb', nome: 'Airbnb' }. Site desconhecido → o domínio.
export function detectarSite(link: string | null | undefined): Site | null {
  if (!link) return null
  let host: string
  try {
    host = new URL(link).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  const conhecido = SITES.find((s) => s.dominio.test(host))
  return conhecido ? { chave: conhecido.chave, nome: conhecido.nome } : { chave: 'outro', nome: host }
}

// Link precisa ser https (o banco também confere)
export function linkValido(link: string) {
  try {
    return new URL(link).protocol === 'https:'
  } catch {
    return false
  }
}

// Sugere o nome a partir do link, quando dá: booking.com/hotel/fr/le-negresco.pt-br.html → "Le Negresco"
export function sugerirNome(link: string): string | null {
  const site = detectarSite(link)
  if (!site) return null
  if (site.chave === 'booking') {
    const m = new URL(link).pathname.match(/\/hotel\/[a-z]{2}\/([^./]+)/i)
    if (m) return m[1].split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  if (site.chave === 'hostelworld') {
    const partes = new URL(link).pathname.split('/').filter(Boolean)
    const i = partes.findIndex((p) => p === 'hostels' || p === 'pwa')
    const nome = i >= 0 ? partes[i + 2] : null
    if (nome && !/^\d+$/.test(nome)) return nome.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return null
}

// ---------------- Contas ----------------

// Quantas noites a opção cobre: datas dela, ou as do destino
export function noitesDaOpcao(opcao: Pick<Opcao, 'checkin' | 'checkout'>, destino?: Pick<DestinoBase, 'chegada' | 'saida'>) {
  return contarNoites(opcao.checkin ?? destino?.chegada, opcao.checkout ?? destino?.saida)
}

// "22:00:00" ou "22:00" → "22h"; "09:30" → "9h30"; "00:00" → "meia-noite". Vazio → null.
export function textoDaHora(hora: string | null | undefined): string | null {
  const [h, m] = (hora ?? '').split(':').map(Number)
  if (!hora || Number.isNaN(h)) return null
  if (h === 0 && !m) return 'meia-noite'
  return `${h}h${m ? String(m).padStart(2, '0') : ''}`
}

// "das 22h", mas "da 1h", "da 1h30" e "da meia-noite" (singular)
const singular = (hora: string) => hora === 'meia-noite' || /^1h/.test(hora)
const aPartirDa = (hora: string) => (singular(hora) ? `a partir da ${hora}` : `a partir das ${hora}`)
const ateA = (hora: string) => (singular(hora) ? `até a ${hora}` : `até as ${hora}`)

/**
 * "Check-in 7 jun, a partir das 22h · Check-out 9 jun, até as 9h".
 * Data: a da opção, ou a do destino. Só aparece o que tiver horário; sem nenhum horário → null.
 */
export function textoDosHorarios(
  opcao: Pick<Opcao, 'checkin' | 'checkout' | 'horaCheckin' | 'horaCheckout'>,
  destino?: Pick<DestinoBase, 'chegada' | 'saida'> | null,
): string | null {
  const entrada = textoDaHora(opcao.horaCheckin)
  const saida = textoDaHora(opcao.horaCheckout)
  const diaEntrada = opcao.checkin ?? destino?.chegada
  const diaSaida = opcao.checkout ?? destino?.saida
  const partes = [
    entrada && `Check-in ${diaEntrada ? `${formatarData(diaEntrada)}, ` : ''}${aPartirDa(entrada)}`,
    saida && `Check-out ${diaSaida ? `${formatarData(diaSaida)}, ` : ''}${ateA(saida)}`,
  ].filter(Boolean)
  return partes.length ? partes.join(' · ') : null
}

// Total ÷ pessoas e ÷ noites, arredondado pro centavo
export function contasDaOpcao(precoTotal: number | null, pessoas: number, noites: number | null) {
  if (precoTotal === null) return { porPessoa: null, porNoite: null }
  return {
    porPessoa: pessoas > 0 ? Math.round(precoTotal / pessoas) : null,
    porNoite: noites && noites > 0 ? Math.round(precoTotal / noites) : null,
  }
}

// Mais votada primeiro; empate: a mais barata (sem preço vai pro fim); depois por nome
export function ordenarOpcoes<T extends Pick<Opcao, 'votos' | 'precoTotal' | 'nome' | 'escolhida'>>(opcoes: T[]): T[] {
  return [...opcoes].sort(
    (a, b) =>
      Number(b.escolhida) - Number(a.escolhida) ||
      b.votos.length - a.votos.length ||
      (a.precoTotal ?? Infinity) - (b.precoTotal ?? Infinity) ||
      a.nome.localeCompare(b.nome),
  )
}

// ---------------- Situação de cada destino ----------------

export type Situacao =
  | 'casa' // ponto de partida/volta no Brasil: não precisa de hospedagem
  | 'bate-e-volta' // chegada = saída
  | 'sem-datas' // ainda sem datas no roteiro
  | 'precisa' // tem noites e nenhuma escolhida
  | 'resolvido' // tem escolhida

export type DestinoDaHospedagem<D extends DestinoBase = DestinoBase> = {
  destino: D
  indice: number
  noites: number | null
  situacao: Situacao
  escolhida: Opcao | null
  opcoes: Opcao[] // já ordenadas
  avisos: string[]
}

const DATA_CURTA = (data: string) => {
  const [, m, d] = data.split('-').map(Number)
  return `${d}/${String(m).padStart(2, '0')}`
}

// Avisos da escolhida: datas que não batem com o destino
export function avisosDaEscolhida(escolhida: Opcao, destino: DestinoBase): string[] {
  const avisos: string[] = []
  if (escolhida.checkin && destino.chegada && escolhida.checkin !== destino.chegada) {
    avisos.push(
      escolhida.checkin > destino.chegada
        ? `A hospedagem começa dia ${DATA_CURTA(escolhida.checkin)}, mas vocês chegam em ${destino.nome} dia ${DATA_CURTA(destino.chegada)}.`
        : `A hospedagem começa dia ${DATA_CURTA(escolhida.checkin)}, antes de vocês chegarem em ${destino.nome} (${DATA_CURTA(destino.chegada)}).`,
    )
  }
  if (escolhida.checkout && destino.saida && escolhida.checkout !== destino.saida) {
    avisos.push(
      escolhida.checkout < destino.saida
        ? `A hospedagem termina dia ${DATA_CURTA(escolhida.checkout)}, mas vocês saem de ${destino.nome} dia ${DATA_CURTA(destino.saida)}.`
        : `A hospedagem vai até dia ${DATA_CURTA(escolhida.checkout)}, depois de vocês saírem de ${destino.nome} (${DATA_CURTA(destino.saida)}).`,
    )
  }
  return avisos
}

/**
 * Junta destinos (na ordem do roteiro) com as opções de cada um e diz a situação.
 * Primeiro ou último destino no Brasil, sem noites marcadas, é o ponto de partida/volta ("casa").
 */
export function montarHospedagem<D extends DestinoBase>(destinos: D[], opcoes: Opcao[]): DestinoDaHospedagem<D>[] {
  return destinos.map((destino, indice) => {
    const noites = contarNoites(destino.chegada, destino.saida)
    const minhas = ordenarOpcoes(opcoes.filter((o) => o.destinoId === destino.id))
    const escolhida = minhas.find((o) => o.escolhida) ?? null
    const pontaDoRoteiro = destinos.length > 1 && (indice === 0 || indice === destinos.length - 1)
    const emCasa = pontaDoRoteiro && codigoDoPais(destino.pais) === 'BR' && !noites

    let situacao: Situacao
    if (escolhida) situacao = 'resolvido'
    else if (emCasa) situacao = 'casa'
    else if (noites === 0) situacao = 'bate-e-volta'
    else if (noites === null) situacao = 'sem-datas'
    else situacao = 'precisa'

    return {
      destino,
      indice,
      noites,
      situacao,
      escolhida,
      opcoes: minhas,
      avisos: escolhida ? avisosDaEscolhida(escolhida, destino) : [],
    }
  })
}

// Resumo do topo e da Overview: X de Y destinos, total por moeda e por pessoa
export function resumoDaHospedagem(itens: DestinoDaHospedagem[], pessoas: number) {
  const contam = itens.filter((i) => i.situacao === 'precisa' || i.situacao === 'sem-datas' || i.situacao === 'resolvido')
  const resolvidos = contam.filter((i) => i.situacao === 'resolvido')
  const totais: Record<string, number> = {}
  for (const i of resolvidos) {
    const e = i.escolhida!
    if (e.precoTotal !== null) totais[e.moeda] = (totais[e.moeda] ?? 0) + e.precoTotal
  }
  const porPessoa: Record<string, number> = {}
  for (const [moeda, total] of Object.entries(totais)) porPessoa[moeda] = pessoas > 0 ? Math.round(total / pessoas) : total
  const opcoes = itens.reduce((n, i) => n + i.opcoes.length, 0)
  return { total: contam.length, resolvidos: resolvidos.length, totais, porPessoa, opcoes }
}

// ---------------- Mapa (Google Maps embutido, sem chave de API) ----------------

export const TIPOS_NO_MAPA = [
  { chave: 'hotel', nome: 'Hotéis', busca: 'hotéis' },
  { chave: 'hostel', nome: 'Hostels', busca: 'hostels' },
  { chave: 'apartamento', nome: 'Apartamentos', busca: 'apartamentos para alugar' },
  { chave: 'pousada', nome: 'Pousadas', busca: 'pousadas e B&B' },
] as const

export type TipoNoMapa = (typeof TIPOS_NO_MAPA)[number]['chave']

// Mapa do Google com a busca "hotéis em Nice, França": `embed` vai no iframe, `abrir` abre o Google Maps completo
export function linkDoMapa(destino: Pick<DestinoBase, 'nome' | 'pais'>, tipo: TipoNoMapa = 'hotel') {
  const busca = TIPOS_NO_MAPA.find((t) => t.chave === tipo)!.busca
  const q = `${busca} em ${localDaBusca(destino)}`
  return {
    embed: `https://maps.google.com/maps?${new URLSearchParams({ q, z: '13', hl: 'pt-BR', output: 'embed' })}`,
    abrir: `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: q })}`,
  }
}
