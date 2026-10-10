// Busca cidades pelo nome usando a API gratuita do Open-Meteo (sem chave).
// https://open-meteo.com/en/docs/geocoding-api

export type Cidade = {
  id: number
  nome: string
  pais: string
  codigoPais: string // ex.: "FR"
  regiao?: string
  latitude: number
  longitude: number
}

type Resposta = {
  results?: {
    id: number
    name: string
    country?: string
    country_code?: string
    admin1?: string
    latitude: number
    longitude: number
  }[]
}

export async function buscarCidades(texto: string, sinal?: AbortSignal): Promise<Cidade[]> {
  if (texto.trim().length < 2) return []
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(texto.trim())}&count=6&language=pt&format=json`
  const resposta = await fetch(url, { signal: sinal })
  if (!resposta.ok) throw new Error('Falha ao buscar cidades')
  const dados: Resposta = await resposta.json()
  return (dados.results ?? []).map((r) => ({
    id: r.id,
    nome: r.name,
    pais: r.country ?? '',
    codigoPais: r.country_code ?? '',
    regiao: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }))
}

// Moeda mais provável pelo país do primeiro destino
const ZONA_EURO = ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'MC', 'SM', 'VA', 'AD', 'ME', 'XK']
const OUTRAS: Record<string, string> = { US: 'USD', GB: 'GBP', CH: 'CHF', BR: 'BRL', AR: 'ARS', CL: 'CLP', JP: 'JPY', CA: 'CAD', AU: 'AUD', MX: 'MXN', UY: 'UYU', CZ: 'CZK', HU: 'HUF', PL: 'PLN', DK: 'DKK', SE: 'SEK', NO: 'NOK', TR: 'TRY', TH: 'THB', CN: 'CNY', ZA: 'ZAR' }

export function moedaDoPais(codigoPais: string): string {
  if (ZONA_EURO.includes(codigoPais)) return 'EUR'
  return OUTRAS[codigoPais] ?? 'EUR'
}
