// Busca lugares pelo nome usando o Photon (OpenStreetMap), gratuito e sem chave.
// Acha cidades e também lagos, praias, ilhas, parques, montanhas...
// https://photon.komoot.io

export type Cidade = {
  id: string
  nome: string
  tipo?: string // ex.: "Lago", "Praia" (vazio pra cidade)
  pais: string
  codigoPais: string // ex.: "IT"
  regiao?: string
  latitude: number
  longitude: number
}

type Resposta = {
  features: {
    geometry: { coordinates: [number, number] }
    properties: {
      osm_id: number
      osm_type: string
      osm_key: string
      osm_value: string
      name?: string
      state?: string
      country?: string
      countrycode?: string
    }
  }[]
}

// Só tipos de lugar que fazem sentido como destino (tira ruas, prédios, lojas...)
const CHAVES_ACEITAS = ['place', 'natural', 'water', 'waterway', 'tourism', 'boundary', 'leisure', 'historic', 'mountain_pass']

// Nome em português de alguns tipos de lugar (cidade fica sem rótulo)
const TIPOS: Record<string, string> = {
  lake: 'Lago',
  reservoir: 'Lago',
  water: 'Lago',
  beach: 'Praia',
  bay: 'Baía',
  island: 'Ilha',
  islet: 'Ilha',
  peak: 'Montanha',
  volcano: 'Vulcão',
  glacier: 'Geleira',
  valley: 'Vale',
  national_park: 'Parque nacional',
  park: 'Parque',
  nature_reserve: 'Reserva natural',
  attraction: 'Atração',
  viewpoint: 'Mirante',
  castle: 'Castelo',
  river: 'Rio',
  waterfall: 'Cachoeira',
  region: 'Região',
  state: 'Região',
  country: 'País',
}

const nomeDoPais = new Intl.DisplayNames(['pt-BR'], { type: 'region' })

export async function buscarCidades(texto: string, sinal?: AbortSignal): Promise<Cidade[]> {
  if (texto.trim().length < 2) return []
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(texto.trim())}&limit=12`
  const resposta = await fetch(url, { signal: sinal })
  if (!resposta.ok) throw new Error('Falha ao buscar lugares')
  const dados: Resposta = await resposta.json()

  const vistos = new Set<string>()
  const lugares: Cidade[] = []
  for (const { geometry, properties: p } of dados.features) {
    if (!p.name || !CHAVES_ACEITAS.includes(p.osm_key)) continue
    // A mesma cidade às vezes vem 2x (cidade + limite da cidade)
    const chave = `${p.name}|${p.state}|${p.countrycode}`
    if (vistos.has(chave)) continue
    vistos.add(chave)

    const codigoPais = (p.countrycode ?? '').toUpperCase()
    lugares.push({
      id: `${p.osm_type}${p.osm_id}`,
      nome: p.name,
      tipo: TIPOS[p.osm_value],
      pais: codigoPais ? (nomeDoPais.of(codigoPais) ?? p.country ?? '') : (p.country ?? ''),
      codigoPais,
      regiao: p.state,
      longitude: geometry.coordinates[0],
      latitude: geometry.coordinates[1],
    })
  }
  return lugares.slice(0, 6)
}

// Moeda mais provável pelo país do primeiro destino
const ZONA_EURO = ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'MC', 'SM', 'VA', 'AD', 'ME', 'XK']
const OUTRAS: Record<string, string> = { US: 'USD', GB: 'GBP', CH: 'CHF', BR: 'BRL', AR: 'ARS', CL: 'CLP', JP: 'JPY', CA: 'CAD', AU: 'AUD', MX: 'MXN', UY: 'UYU', CZ: 'CZK', HU: 'HUF', PL: 'PLN', DK: 'DKK', SE: 'SEK', NO: 'NOK', TR: 'TRY', TH: 'THB', CN: 'CNY', ZA: 'ZAR' }

export function moedaDoPais(codigoPais: string): string {
  if (ZONA_EURO.includes(codigoPais)) return 'EUR'
  return OUTRAS[codigoPais] ?? 'EUR'
}
