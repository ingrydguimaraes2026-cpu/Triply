// Mapa de onde já fui (N5) e estatísticas do viajante (N6), spec 102. Puro, pra dar pra testar.

export type ViagemDoViajante = { id: string; nome: string; data_inicio: string | null; data_fim: string | null }
export type DestinoDoViajante = {
  viagem_id: string
  nome: string
  codigo: string | null // país (ISO), já convertido pela tela
  latitude: number | null
  longitude: number | null
  ordem: number
}

export type Estatisticas = {
  viagens: number
  paises: string[]
  cidades: number
  dias: number
  km: number
  pontos: { nome: string; latitude: number; longitude: number }[]
}

function km(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

const dias = (inicio: string, fim: string) => Math.round((Date.parse(`${fim}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 86_400_000) + 1
const simples = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Só conta viagem que já começou (até hoje). Casa (BR) não conta como país visitado.
export function estatisticasDoViajante(viagens: ViagemDoViajante[], destinos: DestinoDoViajante[], hoje: string, casa = 'BR'): Estatisticas {
  const feitas = viagens.filter((v) => v.data_inicio && v.data_inicio <= hoje)
  const ids = new Set(feitas.map((v) => v.id))
  const meus = destinos.filter((d) => ids.has(d.viagem_id))

  const paises = [...new Set(meus.map((d) => d.codigo?.toUpperCase()).filter((c): c is string => !!c && c !== casa))].sort()
  const cidades = new Map<string, DestinoDoViajante>()
  for (const d of meus) if (d.codigo?.toUpperCase() !== casa) cidades.set(`${simples(d.nome)}|${d.codigo ?? ''}`, d)

  let total = 0
  for (const v of feitas) {
    const rota = meus
      .filter((d) => d.viagem_id === v.id && d.latitude != null && d.longitude != null)
      .sort((a, b) => a.ordem - b.ordem) as (DestinoDoViajante & { latitude: number; longitude: number })[]
    for (let i = 0; i + 1 < rota.length; i++) total += km(rota[i], rota[i + 1])
  }

  return {
    viagens: feitas.length,
    paises,
    cidades: cidades.size,
    // Viagem em andamento conta até hoje
    dias: feitas.reduce((s, v) => {
      const fim = v.data_fim ?? v.data_inicio!
      return s + dias(v.data_inicio!, fim < hoje ? fim : hoje)
    }, 0),
    km: Math.round(total),
    pontos: [...cidades.values()]
      .filter((d) => d.latitude != null && d.longitude != null)
      .map((d) => ({ nome: d.nome, latitude: d.latitude!, longitude: d.longitude! })),
  }
}
