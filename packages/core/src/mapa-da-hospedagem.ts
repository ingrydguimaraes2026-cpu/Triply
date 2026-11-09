// Spec 124: mapa das opções de hospedagem de uma cidade.
// Junta as opções (com lat/lon), o ponto de chegada (estação ou aeroporto) e o ponto principal da cidade,
// e calcula os minutos a pé de cada opção. Também enquadra tudo num retrato fixo do mapa (azulejos do OpenStreetMap).
// Funções puras. Teste: apps/web/tests/mapa-da-hospedagem.test.mjs
import { formatarDinheiro } from './dinheiro.ts'
import type { Opcao } from './hospedagem.ts'
import { fatosDaOpcao, metrosEntre, minutosAPe, type CidadeDaNoite } from './noites.ts'

export type Coordenada = { lat: number; lon: number }

// O mínimo de um lugar da cidade que o mapa usa
export type LugarParaMapa = { id: string; nome: string; tipo: string | null; latitude: number | null; longitude: number | null; votos: number }

export type PinoDaOpcao = Coordenada & {
  opcao: Opcao
  numero: number // 1, 2, 3... na ordem da lista
  rotulo: string // "R$ 722 · 4,8"
  daChegada: number | null // minutos a pé
  atePonto: number | null
}

export type MapaDaHospedagem = {
  pinos: PinoDaOpcao[]
  semLugar: Opcao[]
  chegada: (Coordenada & { nome: string }) | null
  ponto: (Coordenada & { id: string; nome: string }) | null
  lugares: (Coordenada & { id: string; nome: string })[] // candidatos a ponto principal (inclui o escolhido)
}

const temLugar = (l: LugarParaMapa): l is LugarParaMapa & { latitude: number; longitude: number } =>
  l.latitude != null && l.longitude != null && l.tipo !== 'guarda_volumes'

// O ponto principal: o lugar mais votado; empatando, o mais perto do meio das opções
export function pontoPrincipal(lugares: LugarParaMapa[], opcoes: Coordenada[]): string | null {
  const candidatos = lugares.filter(temLugar)
  if (!candidatos.length) return null
  const meio = opcoes.length
    ? { lat: opcoes.reduce((s, o) => s + o.lat, 0) / opcoes.length, lon: opcoes.reduce((s, o) => s + o.lon, 0) / opcoes.length }
    : null
  const distancia = (l: { latitude: number; longitude: number }) => (meio ? metrosEntre(meio, { lat: l.latitude, lon: l.longitude }) : 0)
  return [...candidatos].sort((a, b) => b.votos - a.votos || distancia(a) - distancia(b))[0].id
}

// "R$ 722 · 4,8": preço por pessoa sem centavos e a nota, se tiver
function rotuloDoPino(opcao: Opcao, porPessoa: number | null) {
  const preco = porPessoa !== null ? formatarDinheiro(Math.round(porPessoa / 100) * 100, opcao.moeda).replace(/,00$/, '') : null
  const nota = opcao.nota != null ? String(opcao.nota).replace('.', ',') : null
  return [preco, nota].filter(Boolean).join(' · ') || 'sem preço'
}

export function mapaDaHospedagem(
  cidade: Pick<CidadeDaNoite, 'destino' | 'chegada' | 'opcoes'>,
  lugares: LugarParaMapa[],
  pessoas: number,
  pontoId?: string | null,
): MapaDaHospedagem {
  const comLugar = cidade.opcoes.filter((o) => o.lat != null && o.lon != null)
  const candidatos = lugares.filter(temLugar).map((l) => ({ id: l.id, nome: l.nome, lat: l.latitude, lon: l.longitude }))
  const idDoPonto = pontoId && candidatos.some((c) => c.id === pontoId) ? pontoId : pontoPrincipal(lugares, comLugar.map((o) => ({ lat: o.lat!, lon: o.lon! })))
  const ponto = candidatos.find((c) => c.id === idDoPonto) ?? null
  const c = cidade.chegada
  const chegada = c?.lat != null && c?.lon != null ? { nome: c.lugar, lat: c.lat, lon: c.lon } : null

  const pinos: PinoDaOpcao[] = []
  const semLugar: Opcao[] = []
  cidade.opcoes.forEach((opcao) => {
    if (opcao.lat == null || opcao.lon == null) {
      semLugar.push(opcao)
      return
    }
    const aqui = { lat: opcao.lat, lon: opcao.lon }
    const { porPessoa, minutos } = fatosDaOpcao(opcao, cidade, pessoas)
    pinos.push({
      ...aqui,
      opcao,
      numero: pinos.length + 1,
      rotulo: rotuloDoPino(opcao, porPessoa),
      daChegada: minutos,
      atePonto: ponto ? minutosAPe(aqui, ponto) : null,
    })
  })
  return { pinos, semLugar, chegada, ponto, lugares: candidatos }
}

// ---------------- Enquadrar no mapa (Web Mercator, azulejos de 256 px) ----------------

export const URL_DO_AZULEJO = (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
export const ATRIBUICAO_DO_MAPA = '© OpenStreetMap'
const AZULEJO = 256

// Coordenada → pixel no "mundo" do zoom z
function noMundo({ lat, lon }: Coordenada, z: number): [number, number] {
  const tamanho = AZULEJO * 2 ** z
  const seno = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180)
  return [((lon + 180) / 360) * tamanho, (0.5 - Math.log((1 + seno) / (1 - seno)) / (4 * Math.PI)) * tamanho]
}

export type Azulejo = { chave: string; url: string; esquerda: number; topo: number; tamanho: number }

export type Enquadramento = {
  zoom: number
  azulejos: Azulejo[]
  // Coordenada → [x, y] dentro do quadro
  xy: (ponto: Coordenada) => [number, number]
}

// Maior zoom em que todos os pontos cabem no quadro, com folga (em cima sobra mais por causa dos rótulos)
export function enquadrarNoMapa(
  pontos: Coordenada[],
  largura: number,
  altura: number,
  folga: { lados: number; cima: number; baixo: number } = { lados: 36, cima: 48, baixo: 24 },
  zoomMaximo = 17,
): Enquadramento | null {
  if (!pontos.length || largura <= 0 || altura <= 0) return null
  const uteis = { l: Math.max(10, largura - 2 * folga.lados), a: Math.max(10, altura - folga.cima - folga.baixo) }
  let zoom = zoomMaximo
  for (; zoom > 2; zoom--) {
    const px = pontos.map((p) => noMundo(p, zoom))
    const xs = px.map((p) => p[0])
    const ys = px.map((p) => p[1])
    if (Math.max(...xs) - Math.min(...xs) <= uteis.l && Math.max(...ys) - Math.min(...ys) <= uteis.a) break
  }
  // Zoom "quebrado": aumenta os azulejos até os pontos ocuparem o espaço (no máximo 1,9×, pra não borrar)
  const px0 = pontos.map((p) => noMundo(p, zoom))
  const larguraDosPontos = Math.max(...px0.map((p) => p[0])) - Math.min(...px0.map((p) => p[0]))
  const alturaDosPontos = Math.max(...px0.map((p) => p[1])) - Math.min(...px0.map((p) => p[1]))
  const escala = zoom >= zoomMaximo ? 1 : Math.max(1, Math.min(1.9, uteis.l / Math.max(1, larguraDosPontos), uteis.a / Math.max(1, alturaDosPontos)))
  const px = px0.map(([x, y]) => [x * escala, y * escala])
  const xs = px.map((p) => p[0])
  const ys = px.map((p) => p[1])
  const meioX = (Math.min(...xs) + Math.max(...xs)) / 2
  // Centro do espaço útil (a folga de cima é maior)
  const meioY = (Math.min(...ys) + Math.max(...ys)) / 2 - (folga.cima - folga.baixo) / 2
  const origem = [meioX - largura / 2, meioY - altura / 2]

  const limite = 2 ** zoom
  const lado = AZULEJO * escala
  const azulejos: Azulejo[] = []
  for (let tx = Math.floor(origem[0] / lado); tx * lado < origem[0] + largura; tx++) {
    for (let ty = Math.floor(origem[1] / lado); ty * lado < origem[1] + altura; ty++) {
      if (ty < 0 || ty >= limite) continue
      const x = ((tx % limite) + limite) % limite
      // +0,5 px tapa a fresta entre azulejos quando a escala não é inteira
      azulejos.push({ chave: `${zoom}/${tx}/${ty}`, url: URL_DO_AZULEJO(zoom, x, ty), esquerda: tx * lado - origem[0], topo: ty * lado - origem[1], tamanho: lado + (escala === 1 ? 0 : 0.5) })
    }
  }
  return {
    zoom,
    azulejos,
    xy: (p) => {
      const [x, y] = noMundo(p, zoom)
      return [x * escala - origem[0], y * escala - origem[1]]
    },
  }
}

// Quais rótulos de preço cabem sem cobrir outro. O da opção destacada entra primeiro; os outros, na ordem.
// Rótulo: caixa acima do pino (largura ~ 6,2 px por letra). Também evita a bolinha dos outros pinos.
export function rotulosQueCabem(pinos: { xy: [number, number]; rotulo: string; destaque: boolean }[]): boolean[] {
  const caixa = ({ xy: [x, y], rotulo }: { xy: [number, number]; rotulo: string }) => {
    const l = rotulo.length * 6.2 + 12
    return { x1: x - l / 2, x2: x + l / 2, y1: y - 38, y2: y - 18 }
  }
  const bateu = (a: ReturnType<typeof caixa>, b: { x1: number; x2: number; y1: number; y2: number }) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2
  const bolinhas = pinos.map(({ xy: [x, y] }) => ({ x1: x - 14, x2: x + 14, y1: y - 14, y2: y + 14 }))
  const ordem = pinos.map((_, i) => i).sort((a, b) => Number(pinos[b].destaque) - Number(pinos[a].destaque))
  const postas: ReturnType<typeof caixa>[] = []
  const cabe = pinos.map(() => false)
  for (const i of ordem) {
    const c = caixa(pinos[i])
    const livre = postas.every((p) => !bateu(c, p)) && bolinhas.every((b, j) => j === i || !bateu(c, b))
    if (livre || pinos[i].destaque) {
      cabe[i] = true
      postas.push(c)
    }
  }
  return cabe
}

// "6 min da Roma Termini · 12 min do Coliseu"
export function textoDosMinutos(pino: Pick<PinoDaOpcao, 'daChegada' | 'atePonto'>, mapa: Pick<MapaDaHospedagem, 'chegada' | 'ponto'>) {
  const partes: string[] = []
  if (pino.daChegada !== null && mapa.chegada) partes.push(`${pino.daChegada} min de ${mapa.chegada.nome}`)
  if (pino.atePonto !== null && mapa.ponto) partes.push(`${pino.atePonto} min até ${mapa.ponto.nome}`)
  return partes.join(' · ')
}
