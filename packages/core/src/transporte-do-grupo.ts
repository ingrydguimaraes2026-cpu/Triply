// Transporte v2 (spec 121): chegadas e saídas por pessoa, trechos do grupo, "como chegar" e o
// caminho do trem/ônibus com as paradas. Funções puras + a busca do caminho no Transitous.
// Teste: apps/web/tests/transporte-do-grupo.test.mjs

import type { Alvo, LinkDeApp } from './navegacao.ts'
import { textoDoAlvo } from './navegacao.ts'

export type TipoDoTrajeto = 'chegada' | 'saida' | 'trecho'

export const MEIOS_DE_TRANSPORTE: { chave: string; nome: string }[] = [
  { chave: 'aviao', nome: 'Avião' },
  { chave: 'trem', nome: 'Trem' },
  { chave: 'onibus', nome: 'Ônibus' },
  { chave: 'carro', nome: 'Carro' },
  { chave: 'carona', nome: 'Carona' },
  { chave: 'barco', nome: 'Barco' },
  { chave: 'a_pe', nome: 'A pé' },
  { chave: 'outro', nome: 'Outro' },
]

export const nomeDoMeio = (meio: string) => MEIOS_DE_TRANSPORTE.find((m) => m.chave === meio)?.nome ?? 'Outro'
export const meioComMotorista = (meio: string) => meio === 'carro' || meio === 'carona'
export const meioComCaminho = (meio: string) => meio === 'trem' || meio === 'onibus'

type TrajetoG = {
  id: string
  tipo?: string | null
  meio: string
  partida: string | null
  origem_id: string | null
  destino_id: string | null
  criado_por?: string | null
  passageiros?: string[]
}
// Chegada, saída ou trecho? Vem de fora pra um destino = chega; sai de um destino pra fora = vai embora.
export function tipoProvavel(ids: { origemId: string | null; destinoId: string | null }): TipoDoTrajeto {
  if (ids.origemId && ids.destinoId) return 'trecho'
  if (ids.origemId) return 'saida'
  return 'chegada'
}

// De quem é o trajeto: os passageiros marcados; sem ninguém marcado, quem lançou.
// Trecho sem passageiro = o comboio inteiro (spec 067).
export function donosDoTrajeto(t: TrajetoG): string[] {
  if (t.passageiros?.length) return t.passageiros
  return t.criado_por ? [t.criado_por] : []
}

export type LinhaDaPessoa<T> = { id: string; nome: string; chegada: T | null; saida: T | null }

// Uma linha por pessoa do comboio: como ela chega e como vai embora (o mais cedo / o mais tarde)
export function chegadasPorPessoa<T extends TrajetoG>(trajetos: T[], membros: { id: string; nome: string }[]): LinhaDaPessoa<T>[] {
  const quando = (t: T) => t.partida ?? '9999'
  return membros.map((m) => {
    const meus = trajetos.filter((t) => donosDoTrajeto(t).includes(m.id))
    const chegadas = meus.filter((t) => t.tipo === 'chegada').sort((a, b) => quando(a).localeCompare(quando(b)))
    const saidas = meus.filter((t) => t.tipo === 'saida').sort((a, b) => quando(b).localeCompare(quando(a)))
    return { id: m.id, nome: m.nome, chegada: chegadas[0] ?? null, saida: saidas[0] ?? null }
  })
}

// Trechos do grupo na ordem do roteiro: um por par de destinos seguidos, com os trajetos de cada um
export function trechosDoGrupo<T extends TrajetoG>(trajetos: T[], destinos: { id: string; nome: string }[]) {
  const doGrupo = trajetos.filter((t) => (t.tipo ?? 'trecho') === 'trecho')
  const pares = destinos.slice(1).map((d, i) => ({ chave: `${destinos[i].id}>${d.id}`, de: destinos[i], para: d }))
  const usados = new Set<string>()
  const trechos = pares.map((p) => {
    const ts = doGrupo.filter((t) => t.origem_id === p.de.id && t.destino_id === p.para.id)
    ts.forEach((t) => usados.add(t.id))
    return { ...p, trajetos: ts }
  })
  // Trajeto de grupo fora dos pares (bate-e-volta, destino apagado): vai pra "outros"
  const outros = doGrupo.filter((t) => !usados.has(t.id))
  return { trechos, outros }
}

// ---------- Como chegar (121b) ----------
// Transporte público e a pé no Google Maps; o resto (carro, Uber) já está em navegacao.ts.
export function linksComoChegar(a: Alvo): LinkDeApp[] {
  const temPonto = typeof a.latitude === 'number' && typeof a.longitude === 'number'
  const destino = encodeURIComponent(temPonto ? `${a.latitude},${a.longitude}` : textoDoAlvo(a))
  return [
    { chave: 'transporte', nome: 'Transporte público', url: `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=transit`, preenche: true },
    { chave: 'a_pe', nome: 'A pé', url: `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=walking`, preenche: true },
    { chave: 'carro', nome: 'De carro', url: `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`, preenche: true },
  ]
}

// "Ver o caminho" sem dado próprio: Google Maps de A pra B em transporte público
export function linkDoCaminho(de: string, para: string): string {
  const q = encodeURIComponent
  return `https://www.google.com/maps/dir/?api=1&origin=${q(de)}&destination=${q(para)}&travelmode=transit`
}

// ---------- Caminho do trem/ônibus com as paradas (121c) ----------
export type ParadaDoCaminho = { nome: string; latitude: number; longitude: number; chega: string | null; sai: string | null }
export type Caminho = {
  fonte: 'transitous'
  buscadoEm: string
  linhas: string[] // "FR 9520 · Trenitalia"
  paradas: ParadaDoCaminho[] // inclui a 1ª e a última
  linha: [number, number][] // [latitude, longitude] pra desenhar
}

// Linha codificada (formato Google polyline, precisão 5 ou 6)
export function decodificarLinha(texto: string, precisao = 6): [number, number][] {
  const fator = 10 ** precisao
  const pontos: [number, number][] = []
  let i = 0
  let lat = 0
  let lon = 0
  while (i < texto.length) {
    for (const eixo of [0, 1]) {
      let resultado = 0
      let deslocamento = 0
      let b: number
      do {
        b = texto.charCodeAt(i++) - 63
        resultado |= (b & 0x1f) << deslocamento
        deslocamento += 5
      } while (b >= 0x20 && i < texto.length)
      const delta = resultado & 1 ? ~(resultado >> 1) : resultado >> 1
      if (eixo === 0) lat += delta
      else lon += delta
    }
    pontos.push([lat / fator, lon / fator])
  }
  return pontos
}

type PernaT = {
  mode: string
  from: { name: string; lat: number; lon: number; departure?: string }
  to: { name: string; lat: number; lon: number; arrival?: string }
  intermediateStops?: { name: string; lat: number; lon: number; arrival?: string; departure?: string }[]
  legGeometry?: { points: string; precision?: number }
  displayName?: string
  routeShortName?: string
  tripShortName?: string
  agencyName?: string
}

// Transforma a resposta do Transitous (/api/v5/plan) no nosso caminho. Só as pernas de veículo.
export function caminhoDaResposta(resposta: unknown, agora: string): Caminho | null {
  const it = (resposta as { itineraries?: { legs?: PernaT[] }[] })?.itineraries?.[0]
  const pernas = (it?.legs ?? []).filter((l) => l.mode !== 'WALK' && l.mode !== 'BIKE' && l.mode !== 'CAR')
  if (!pernas.length) return null
  const paradas: ParadaDoCaminho[] = []
  const linha: [number, number][] = []
  const linhas: string[] = []
  for (const p of pernas) {
    const nome = [p.displayName || p.routeShortName || p.tripShortName, p.agencyName].filter(Boolean).join(' · ')
    if (nome && !linhas.includes(nome)) linhas.push(nome)
    const ultima = paradas[paradas.length - 1]
    if (ultima && ultima.nome === p.from.name) ultima.sai = p.from.departure ?? ultima.sai
    else paradas.push({ nome: p.from.name, latitude: p.from.lat, longitude: p.from.lon, chega: null, sai: p.from.departure ?? null })
    for (const s of p.intermediateStops ?? []) paradas.push({ nome: s.name, latitude: s.lat, longitude: s.lon, chega: s.arrival ?? null, sai: s.departure ?? null })
    paradas.push({ nome: p.to.name, latitude: p.to.lat, longitude: p.to.lon, chega: p.to.arrival ?? null, sai: null })
    if (p.legGeometry?.points) linha.push(...decodificarLinha(p.legGeometry.points, p.legGeometry.precision ?? 6))
  }
  return { fonte: 'transitous', buscadoEm: agora, linhas, paradas, linha: simplificar(linha, 200) }
}

// Fica com no máximo `max` pontos (guardar no banco sem pesar)
function simplificar(pontos: [number, number][], max: number): [number, number][] {
  if (pontos.length <= max) return pontos
  const passo = (pontos.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => pontos[Math.round(i * passo)])
}

// Lê o que está guardado em `trajetos.caminho`
export function lerCaminho(valor: unknown): Caminho | null {
  const c = valor as Caminho | null
  if (!c || c.fonte !== 'transitous' || !Array.isArray(c.paradas) || !Array.isArray(c.linha)) return null
  return c
}

const TRANSITOUS = 'https://api.transitous.org/api'
type Ponto = { latitude: number; longitude: number }

// Acha a estação pelo nome (perto da cidade, quando dá)
async function acharEstacao(nome: string, perto: Ponto | null): Promise<Ponto | null> {
  const lugar = perto ? `&place=${perto.latitude},${perto.longitude}` : ''
  const r = await fetch(`${TRANSITOUS}/v1/geocode?text=${encodeURIComponent(nome)}&type=STOP${lugar}`)
  if (!r.ok) return null
  const achados = (await r.json()) as { lat: number; lon: number }[]
  return achados[0] ? { latitude: achados[0].lat, longitude: achados[0].lon } : null
}

// Busca o caminho do trem/ônibus. De/para: a estação (se tiver) ou a cidade do destino.
// Devolve null quando não há dado (ex.: ônibus rodoviário no Brasil): aí a tela usa o link do Maps.
export async function buscarCaminho(
  de: { estacao: string | null; cidade: Ponto | null },
  para: { estacao: string | null; cidade: Ponto | null },
  partida: string | null,
  agora: string,
): Promise<Caminho | null> {
  try {
    const [a, b] = await Promise.all([
      de.estacao ? acharEstacao(de.estacao, de.cidade).then((p) => p ?? de.cidade) : Promise.resolve(de.cidade),
      para.estacao ? acharEstacao(para.estacao, para.cidade).then((p) => p ?? para.cidade) : Promise.resolve(para.cidade),
    ])
    if (!a || !b) return null
    const quando = partida ? `&time=${encodeURIComponent(new Date(new Date(partida).getTime() - 30 * 60000).toISOString())}` : ''
    const r = await fetch(`${TRANSITOUS}/v5/plan?fromPlace=${a.latitude},${a.longitude}&toPlace=${b.latitude},${b.longitude}${quando}&numItineraries=1`)
    if (!r.ok) return null
    return caminhoDaResposta(await r.json(), agora)
  } catch {
    return null
  }
}
