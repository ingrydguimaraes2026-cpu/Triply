// Carimbo de lugar (spec 118a): cada destino vira um carimbo apagado e cai sozinho quando
// alguém do grupo prova que esteve lá (localização, foto ou "Cheguei"), ou de memória.
// A localização da pessoa nunca sai do aparelho: aqui só se compara com o destino.
// Teste: apps/web/tests/carimbos.test.mjs
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type Carimbo = Tables<'carimbos'>
export type ComoLiberou = 'localizacao' | 'foto' | 'hoje' | 'memoria'
export type TipoDeLugar = 'cidade' | 'praia' | 'serra' | 'show' | 'festa'

// Perto o bastante pra contar como "estive aqui" (spec 118a: 15 km pra cidade)
export const RAIO_DO_CARIMBO_KM = 15

export type PontoNoMapa = { latitude: number; longitude: number }
export type DestinoDoCarimbo = {
  id: string
  nome: string
  latitude: number | null
  longitude: number | null
  chegada: string | null
  saida: string | null
}
export type DatasDaViagem = { data_inicio: string | null; data_fim: string | null }

// Distância em linha reta (fórmula de haversine), em km
export function distanciaEntreKm(a: PontoNoMapa, b: PontoNoMapa): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// O dia (AAAA-MM-DD) está dentro das datas da viagem? Sem datas, não dá pra provar pela localização.
export function dentroDaViagem(dia: string, viagem: DatasDaViagem): boolean {
  if (!viagem.data_inicio) return false
  return dia >= viagem.data_inicio && dia <= (viagem.data_fim ?? viagem.data_inicio)
}

// Os destinos ainda sem carimbo que ficam a até `raioKm` do ponto (o mais perto primeiro)
export function destinosPerto<D extends DestinoDoCarimbo>(destinos: D[], carimbos: Pick<Carimbo, 'destino_id'>[], ponto: PontoNoMapa, raioKm = RAIO_DO_CARIMBO_KM): D[] {
  const ja = new Set(carimbos.map((c) => c.destino_id))
  return destinos
    .filter((d) => !ja.has(d.id) && d.latitude != null && d.longitude != null)
    .map((d) => ({ d, km: distanciaEntreKm(ponto, { latitude: d.latitude as number, longitude: d.longitude as number }) }))
    .filter((x) => x.km <= raioKm)
    .sort((a, b) => a.km - b.km)
    .map((x) => x.d)
}

// Pela localização (app aberto): só vale nas datas da viagem
export function carimbosPelaLocalizacao<D extends DestinoDoCarimbo>(destinos: D[], carimbos: Pick<Carimbo, 'destino_id'>[], ponto: PontoNoMapa, hoje: string, viagem: DatasDaViagem): D[] {
  return dentroDaViagem(hoje, viagem) ? destinosPerto(destinos, carimbos, ponto) : []
}

// Data que vai no carimbo: o dia da prova; de memória, o dia em que o grupo chegou lá
export function dataDoCarimbo(como: ComoLiberou, destino: Pick<DestinoDoCarimbo, 'chegada'>, viagem: DatasDaViagem, hoje: string): string {
  if (como === 'memoria') return destino.chegada ?? viagem.data_inicio ?? hoje
  return hoje
}

// Palpite do tipo pelo nome (o ícone da arte). Sem pista, é cidade.
export function tipoDoLugar(nome: string): TipoDeLugar {
  const n = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/\b(praia|ilha|beach|playa|plage|spiaggia|island|isla)\b/.test(n)) return 'praia'
  if (/\b(serra|monte|chapada|montanha|campos do jordao|gramado|canela|mountain|alpes)\b/.test(n)) return 'serra'
  return 'cidade'
}

// Ícone da arte do carimbo (catálogo de ícones do Tripwave)
export function iconeDoTipo(tipo: string): 'lugar' | 'sol' | 'natureza' | 'ingresso' | 'festa' {
  if (tipo === 'praia') return 'sol'
  if (tipo === 'serra') return 'natureza'
  if (tipo === 'show') return 'ingresso'
  if (tipo === 'festa') return 'festa'
  return 'lugar'
}

export type CarimboDoDestino<D extends DestinoDoCarimbo = DestinoDoCarimbo> = { destino: D; carimbo: Carimbo | null }

// Um item por destino, na ordem do roteiro: aceso (com carimbo) ou apagado
export function carimbosDaViagem<D extends DestinoDoCarimbo>(destinos: D[], carimbos: Carimbo[]): CarimboDoDestino<D>[] {
  const porDestino = new Map(carimbos.filter((c) => c.destino_id).map((c) => [c.destino_id as string, c]))
  return destinos.map((destino) => ({ destino, carimbo: porDestino.get(destino.id) ?? null }))
}

export function textoDoComo(como: string): string {
  if (como === 'localizacao') return 'pela localização'
  if (como === 'foto') return 'por uma foto'
  if (como === 'hoje') return 'no "Cheguei"'
  return 'de memória'
}

// "dez 2026" (a data curta da arte)
export function dataDaArte(dia: string): string {
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const [a, m, d] = dia.split('-')
  return `${Number(d)} ${meses[Number(m) - 1]} ${a}`
}

// ---- Banco -------------------------------------------------------------------

export async function buscarCarimbos(cli: ClienteTogether, viagemId: string): Promise<Carimbo[]> {
  const { data, error } = await cli.from('carimbos').select('*').eq('viagem_id', viagemId).order('liberado_em')
  if (error) throw error
  return data ?? []
}

// Libera o carimbo do destino. Se outra pessoa liberou antes (um por destino), devolve null sem erro.
export async function liberarCarimbo(
  cli: ClienteTogether,
  viagemId: string,
  destino: DestinoDoCarimbo,
  como: ComoLiberou,
  viagem: DatasDaViagem,
  hoje: string,
): Promise<Carimbo | null> {
  const { data, error } = await cli
    .from('carimbos')
    .insert({
      viagem_id: viagemId,
      destino_id: destino.id,
      nome: destino.nome,
      latitude: destino.latitude,
      longitude: destino.longitude,
      tipo: tipoDoLugar(destino.nome),
      data: dataDoCarimbo(como, destino, viagem, hoje),
      como,
    })
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') return null // já carimbado
    throw error
  }
  return data
}

// Prova pela foto: o GPS de cada foto (lido no aparelho, nunca guardado aqui) perto de um destino.
// Vale fora das datas também (a foto pode ser postada depois da viagem). Devolve os carimbos novos.
export async function liberarPelasFotos(
  cli: ClienteTogether,
  viagemId: string,
  destinos: DestinoDoCarimbo[],
  pontos: (PontoNoMapa | null)[],
  viagem: DatasDaViagem,
  hoje: string,
): Promise<Carimbo[]> {
  const comGps = pontos.filter((p): p is PontoNoMapa => !!p)
  if (!comGps.length || !destinos.length) return []
  const ja = await buscarCarimbos(cli, viagemId)
  const alvos = new Map<string, DestinoDoCarimbo>()
  for (const p of comGps) for (const d of destinosPerto(destinos, ja, p)) alvos.set(d.id, d)
  const novos: Carimbo[] = []
  for (const d of alvos.values()) {
    const c = await liberarCarimbo(cli, viagemId, d, 'foto', viagem, hoje)
    if (c) novos.push(c)
  }
  return novos
}

export async function apagarCarimbo(cli: ClienteTogether, id: string) {
  const { error } = await cli.from('carimbos').delete().eq('id', id)
  if (error) throw error
}
