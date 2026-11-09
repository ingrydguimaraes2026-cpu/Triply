// Spec 122c: "achar o jeito de ir". Cartões por meio (trem, ônibus, barco, metrô, carro, táxi, a pé),
// no estilo do Rome2rio, e as saídas exatas de cada meio. Tudo dentro do Norti:
// - trem/ônibus/barco/metrô: Transitous (aberto e grátis);
// - carro: OSRM (rotas abertas) + preço ESTIMADO pela distância;
// - táxi: preço ESTIMADO pela distância;
// - a pé: quando é perto.
// Funções puras + as buscas. Teste: apps/web/tests/jeitos-de-ir.test.mjs

import { kmEstimados } from './transportes.ts'

export type PontoGeo = { latitude: number; longitude: number }
export type MeioDoJeito = 'trem' | 'onibus' | 'barco' | 'metro' | 'carro' | 'taxi' | 'a_pe'

export type Saida = {
  sai: string // horário completo
  chega: string
  minutos: number
  trocas: number
  trocaEm: string[] // onde troca ("Milano Centrale")
  linhas: string[] // "FR 9520 · Trenitalia"
  meio: MeioDoJeito
}

export type JeitoDeIr = {
  meio: MeioDoJeito
  minutos: number // da opção mais rápida (ou da rota, pra carro/táxi/a pé)
  trocas?: number // menor número de trocas
  frequenciaMin?: number | null // passa de quanto em quanto tempo (estimado pelas saídas)
  km?: number
  preco?: { valor: number; moeda: string; estimativa: true } // só carro e táxi
  saidas: Saida[] // só trem, ônibus, barco, metrô
  selos: ('mais-rapido' | 'mais-barato')[]
}

type PernaT = {
  mode: string
  startTime?: string
  endTime?: string
  from: { name: string }
  to: { name: string }
  displayName?: string
  routeShortName?: string
  tripShortName?: string
  agencyName?: string
}
type ItinerarioT = { startTime: string; endTime: string; duration: number; transfers?: number; legs: PernaT[] }

const TRILHO = ['RAIL', 'REGIONAL_RAIL', 'HIGHSPEED_RAIL', 'LONG_DISTANCE', 'REGIONAL_FAST_RAIL', 'NIGHT_RAIL', 'SUBURBAN']
const METRO = ['SUBWAY', 'METRO', 'TRAM']

export function meioDaPerna(modo: string): MeioDoJeito | null {
  if (TRILHO.includes(modo)) return 'trem'
  if (modo === 'BUS' || modo === 'COACH') return 'onibus'
  if (modo === 'FERRY') return 'barco'
  if (METRO.includes(modo)) return 'metro'
  return null // a pé, bicicleta, carro…
}

const duracaoDaPerna = (p: PernaT) => (p.startTime && p.endTime ? new Date(p.endTime).getTime() - new Date(p.startTime).getTime() : 0)

// Um itinerário do Transitous vira uma saída. O meio é o da perna mais longa (trem com metrô no meio = trem).
export function saidaDoItinerario(it: ItinerarioT): Saida | null {
  const pernas = it.legs.filter((l) => meioDaPerna(l.mode))
  if (!pernas.length) return null
  const principal = [...pernas].sort((a, b) => duracaoDaPerna(b) - duracaoDaPerna(a))[0]
  const linhas: string[] = []
  for (const p of pernas) {
    const nome = [p.displayName || p.routeShortName || p.tripShortName, p.agencyName].filter(Boolean).join(' · ')
    if (nome && !linhas.includes(nome)) linhas.push(nome)
  }
  return {
    sai: pernas[0].startTime ?? it.startTime,
    chega: pernas[pernas.length - 1].endTime ?? it.endTime,
    minutos: Math.round(it.duration / 60),
    trocas: pernas.length - 1,
    trocaEm: pernas.slice(1).map((p) => p.from.name),
    linhas,
    meio: meioDaPerna(principal.mode)!,
  }
}

// Passa de quanto em quanto tempo: a mediana dos intervalos entre saídas seguidas (precisa de 3 ou mais)
export function frequenciaEstimada(saidas: Pick<Saida, 'sai'>[]): number | null {
  const horas = [...new Set(saidas.map((s) => new Date(s.sai).getTime()))].sort((a, b) => a - b)
  if (horas.length < 3) return null
  const intervalos = horas.slice(1).map((h, i) => Math.round((h - horas[i]) / 60000)).sort((a, b) => a - b)
  return intervalos[Math.floor(intervalos.length / 2)]
}

// Preço ESTIMADO pela distância (combustível + pedágio aproximado; táxi = bandeirada + km).
// Não é preço de verdade: a tela sempre escreve "estimativa".
const TABELA: Record<string, { carroKm: number; taxiBase: number; taxiKm: number }> = {
  EUR: { carroKm: 0.22, taxiBase: 4, taxiKm: 2 },
  BRL: { carroKm: 0.9, taxiBase: 6, taxiKm: 3.5 },
  USD: { carroKm: 0.2, taxiBase: 4, taxiKm: 2.5 },
}
export function precoEstimado(meio: 'carro' | 'taxi', km: number, moeda: string): { valor: number; moeda: string; estimativa: true } {
  const m = TABELA[moeda] ? moeda : 'EUR'
  const t = TABELA[m]
  const bruto = meio === 'carro' ? km * t.carroKm : t.taxiBase + km * t.taxiKm
  const valor = bruto < 50 ? Math.round(bruto) : Math.round(bruto / 10) * 10
  return { valor: Math.max(valor, 1), moeda: m, estimativa: true }
}

// Junta as saídas por meio, monta os cartões e marca "mais rápido" e "mais barato"
export function montarJeitos(
  saidas: Saida[],
  rota: { km: number; minutos: number } | null,
  distanciaReta: number | null,
  moeda: string,
): JeitoDeIr[] {
  const jeitos: JeitoDeIr[] = []
  const porMeio = new Map<MeioDoJeito, Saida[]>()
  const vistas = new Set<string>()
  for (const s of [...saidas].sort((a, b) => a.sai.localeCompare(b.sai))) {
    const chave = `${s.sai}|${s.chega}|${s.meio}`
    if (vistas.has(chave)) continue
    vistas.add(chave)
    porMeio.set(s.meio, [...(porMeio.get(s.meio) ?? []), s])
  }
  for (const meio of ['trem', 'onibus', 'barco', 'metro'] as MeioDoJeito[]) {
    const lista = porMeio.get(meio)
    if (!lista?.length) continue
    jeitos.push({
      meio,
      minutos: Math.min(...lista.map((s) => s.minutos)),
      trocas: Math.min(...lista.map((s) => s.trocas)),
      frequenciaMin: frequenciaEstimada(lista),
      saidas: lista,
      selos: [],
    })
  }
  if (rota && rota.km >= 1) {
    jeitos.push({ meio: 'carro', minutos: rota.minutos, km: rota.km, preco: precoEstimado('carro', rota.km, moeda), saidas: [], selos: [] })
    jeitos.push({ meio: 'taxi', minutos: rota.minutos, km: rota.km, preco: precoEstimado('taxi', rota.km, moeda), saidas: [], selos: [] })
  }
  const km = rota?.km ?? distanciaReta
  if (km != null && km <= 3) jeitos.push({ meio: 'a_pe', minutos: Math.max(1, Math.round((km / 4.5) * 60)), km, saidas: [], selos: [] })

  const maisRapido = [...jeitos].sort((a, b) => a.minutos - b.minutos)[0]
  if (maisRapido && jeitos.length > 1) maisRapido.selos.push('mais-rapido')
  const comPreco = jeitos.filter((j) => j.preco || j.meio === 'a_pe')
  const maisBarato = [...comPreco].sort((a, b) => (a.preco?.valor ?? 0) - (b.preco?.valor ?? 0))[0]
  if (maisBarato && comPreco.length > 1) maisBarato.selos.push('mais-barato')
  return jeitos
}

// "Não dá tempo": sai antes de o grupo ficar livre
export const naoDaTempo = (s: Pick<Saida, 'sai'>, livreDesde: string | null) => !!livreDesde && s.sai < livreDesde

// ---------- Buscas ----------
const TRANSITOUS = 'https://api.transitous.org/api'
// O Transitous recusa "User-Agent" genérico (o do celular e o do Node). No navegador o cabeçalho é ignorado
// e vale o do próprio navegador. Regra de uso: https://transitous.org/api/
export const CABECALHO_TRANSITOUS = { headers: { 'User-Agent': 'Norti/1.0 (+https://together-viagem.vercel.app)' } }

async function planos(de: PontoGeo, para: PontoGeo, quando: string, extra = ''): Promise<ItinerarioT[]> {
  const url = `${TRANSITOUS}/v5/plan?fromPlace=${de.latitude},${de.longitude}&toPlace=${para.latitude},${para.longitude}&time=${encodeURIComponent(quando)}&numItineraries=6${extra}`
  const r = await fetch(url, CABECALHO_TRANSITOUS)
  if (!r.ok) return []
  const j = (await r.json()) as { itineraries?: ItinerarioT[] }
  return j.itineraries ?? []
}

// Saídas de transporte público a partir de `quando` (todos os meios + só trilho, pra achar mais trens)
export async function buscarSaidas(de: PontoGeo, para: PontoGeo, quando: string): Promise<Saida[]> {
  const listas = await Promise.all([planos(de, para, quando).catch(() => []), planos(de, para, quando, '&transitModes=RAIL').catch(() => [])])
  return listas.flat().map(saidaDoItinerario).filter((s): s is Saida => !!s)
}

// Rota de carro (OSRM público). Sem rota, devolve null.
export async function buscarRotaDeCarro(de: PontoGeo, para: PontoGeo): Promise<{ km: number; minutos: number } | null> {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${de.longitude},${de.latitude};${para.longitude},${para.latitude}?overview=false`)
    if (!r.ok) return null
    const j = (await r.json()) as { routes?: { distance: number; duration: number }[] }
    const rota = j.routes?.[0]
    return rota ? { km: Math.round(rota.distance / 100) / 10, minutos: Math.round(rota.duration / 60) } : null
  } catch {
    return null
  }
}

// Acha as coordenadas de um lugar digitado (perto de um ponto de referência, quando tem)
export async function acharLugar(texto: string, perto: PontoGeo | null): Promise<(PontoGeo & { nome: string }) | null> {
  try {
    const lugar = perto ? `&place=${perto.latitude},${perto.longitude}` : ''
    const r = await fetch(`${TRANSITOUS}/v1/geocode?text=${encodeURIComponent(texto)}${lugar}`, CABECALHO_TRANSITOUS)
    if (!r.ok) return null
    const achados = (await r.json()) as { name: string; type: string; lat: number; lon: number }[]
    const melhor = achados.find((a) => a.type === 'PLACE') ?? achados[0]
    return melhor ? { nome: melhor.name, latitude: melhor.lat, longitude: melhor.lon } : null
  } catch {
    return null
  }
}

// Tudo junto: os cartões de jeitos de ir entre dois pontos, a partir de um horário
export async function buscarJeitosDeIr(de: PontoGeo, para: PontoGeo, quando: string, moeda: string): Promise<JeitoDeIr[]> {
  const [saidas, rota] = await Promise.all([buscarSaidas(de, para, quando), buscarRotaDeCarro(de, para)])
  return montarJeitos(saidas, rota, kmEstimados(de, para), moeda)
}
