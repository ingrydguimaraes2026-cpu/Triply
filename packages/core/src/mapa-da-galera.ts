// Mapa da galera (spec 118b): junta os carimbos de todas as viagens da pessoa (o banco só
// devolve viagens das quais ela participa) e conta lugares, viagens, dias juntos, km e
// "quem carimbou mais este ano". Puro, pra dar pra testar. Teste: apps/web/tests/mapa-da-galera.test.mjs
import type { ClienteTogether } from './supabase'

export type CarimboDoMapa = {
  viagem_id: string
  nome: string
  latitude: number | null
  longitude: number | null
  data: string
  liberado_por: string
}
export type ViagemDoMapa = { id: string; data_inicio: string | null; data_fim: string | null }
export type FiltroDoMapa = 'todos' | 'meus'

export type MapaDaGalera = {
  pontos: { nome: string; latitude: number; longitude: number }[]
  lugares: number
  viagens: number
  diasJuntos: number
  km: number
  // Os 3 que mais carimbaram no ano (sem último lugar, sem quem tem zero)
  podio: { pessoaId: string; carimbos: number }[]
}

function km(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

const diasEntre = (inicio: string, fim: string) => Math.round((Date.parse(`${fim}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 86_400_000) + 1
const chaveDoLugar = (nome: string) => nome.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function mapaDaGalera(carimbos: CarimboDoMapa[], viagens: ViagemDoMapa[], meuId: string, filtro: FiltroDoMapa, hoje: string): MapaDaGalera {
  const lista = filtro === 'meus' ? carimbos.filter((c) => c.liberado_por === meuId) : carimbos

  // Um ponto por lugar (o mesmo lugar em duas viagens acende uma vez só)
  const porLugar = new Map<string, MapaDaGalera['pontos'][number]>()
  for (const c of lista) {
    if (c.latitude == null || c.longitude == null) continue
    const k = chaveDoLugar(c.nome)
    if (!porLugar.has(k)) porLugar.set(k, { nome: c.nome, latitude: c.latitude, longitude: c.longitude })
  }
  const lugares = new Set(lista.map((c) => chaveDoLugar(c.nome))).size

  const idsDasViagens = new Set(lista.map((c) => c.viagem_id))
  const diasJuntos = viagens
    .filter((v) => idsDasViagens.has(v.id) && v.data_inicio)
    .reduce((soma, v) => soma + Math.max(1, diasEntre(v.data_inicio as string, v.data_fim ?? (v.data_inicio as string))), 0)

  // km: dentro de cada viagem, de carimbo em carimbo, na ordem das datas
  let total = 0
  for (const id of idsDasViagens) {
    const daViagem = lista
      .filter((c) => c.viagem_id === id && c.latitude != null && c.longitude != null)
      .sort((a, b) => a.data.localeCompare(b.data))
    for (let i = 1; i < daViagem.length; i++)
      total += km(daViagem[i - 1] as { latitude: number; longitude: number }, daViagem[i] as { latitude: number; longitude: number })
  }

  // Disputa leve: sempre sobre a galera toda (não muda com o filtro), só o ano de hoje
  const ano = hoje.slice(0, 4)
  const conta = new Map<string, number>()
  for (const c of carimbos) if (c.data.slice(0, 4) === ano) conta.set(c.liberado_por, (conta.get(c.liberado_por) ?? 0) + 1)
  const podio = [...conta.entries()]
    .map(([pessoaId, n]) => ({ pessoaId, carimbos: n }))
    .sort((a, b) => b.carimbos - a.carimbos || a.pessoaId.localeCompare(b.pessoaId))
    .slice(0, 3)

  return { pontos: [...porLugar.values()], lugares, viagens: idsDasViagens.size, diasJuntos, km: Math.round(total), podio }
}

// ---- Banco -------------------------------------------------------------------

export type DadosDoMapa = { carimbos: CarimboDoMapa[]; viagens: ViagemDoMapa[]; nomes: Map<string, string> }

// Tudo que o mapa precisa. O RLS já limita às viagens da pessoa.
export async function buscarMapaDaGalera(cli: ClienteTogether): Promise<DadosDoMapa> {
  const [c, v] = await Promise.all([
    cli.from('carimbos').select('viagem_id, nome, latitude, longitude, data, liberado_por'),
    cli.from('viagens').select('id, data_inicio, data_fim'),
  ])
  if (c.error) throw c.error
  if (v.error) throw v.error
  const carimbos = c.data ?? []
  const ids = [...new Set(carimbos.map((x) => x.liberado_por))]
  const { data: perfis } = ids.length ? await cli.from('perfis').select('id, nome').in('id', ids) : { data: [] }
  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome ?? 'Alguém']))
  return { carimbos, viagens: v.data ?? [], nomes }
}
