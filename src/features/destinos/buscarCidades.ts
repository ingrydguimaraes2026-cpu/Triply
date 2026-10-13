// Busca destinos pelo nome usando duas fontes gratuitas e sem chave, ao mesmo tempo:
// - Open-Meteo (GeoNames): cidades e países, com nome em português e população. Rápido (~1 s).
//   https://open-meteo.com/en/docs/geocoding-api (uso não comercial, licença CC-BY 4.0)
// - Photon (OpenStreetMap): conhece nomes locais ("Milano") e lugares da natureza
//   (lagos, praias, ilhas, parques...). Mais lento (~4 s).
//   https://photon.komoot.io
// Os resultados das duas são juntados e ordenados por relevância.

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

// Cidade + uma nota de 0 a 110 pra ordenar a lista (não vai pro banco)
type Resultado = Cidade & { relevancia: number }

const MAXIMO_RESULTADOS = 6
const nomeDoPais = new Intl.DisplayNames(['pt-BR'], { type: 'region' })

// ---------- Open-Meteo: cidades e países ----------

type RespostaOpenMeteo = {
  results?: {
    id: number
    name: string
    latitude: number
    longitude: number
    feature_code?: string // PPLC = capital, PCLI = país...
    country_code?: string
    country?: string
    admin1?: string
    population?: number
  }[]
}

function relevanciaOpenMeteo(codigo = '', populacao = 0) {
  if (codigo.startsWith('PCL')) return 100 // país
  if (codigo === 'PPLC') return 90 // capital
  if (populacao >= 1_000_000) return 85
  if (populacao >= 100_000) return 70
  if (populacao >= 10_000) return 50
  return 30
}

async function buscarNoOpenMeteo(texto: string, sinal?: AbortSignal): Promise<Resultado[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(texto)}&count=10&language=pt&format=json`
  const resposta = await fetch(url, { signal: sinal })
  if (!resposta.ok) throw new Error('Falha ao buscar no Open-Meteo')
  const dados: RespostaOpenMeteo = await resposta.json()

  return (dados.results ?? []).map((r) => {
    const codigoPais = (r.country_code ?? '').toUpperCase()
    const ehPais = (r.feature_code ?? '').startsWith('PCL')
    return {
      id: `om${r.id}`,
      nome: r.name,
      tipo: ehPais ? 'País' : undefined,
      pais: r.country ?? (codigoPais ? (nomeDoPais.of(codigoPais) ?? '') : ''),
      codigoPais,
      regiao: ehPais ? undefined : r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      relevancia: relevanciaOpenMeteo(r.feature_code, r.population),
    }
  })
}

// ---------- Photon: nomes locais e natureza ----------

type RespostaPhoton = {
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
  suburb: 'Bairro',
  neighbourhood: 'Bairro',
  quarter: 'Bairro',
}

// Cidade grande vale mais que vilarejo; bairro vale pouco
const RELEVANCIA_PHOTON: Record<string, number> = {
  country: 95,
  city: 65,
  state: 55,
  region: 55,
  town: 45,
  village: 25,
  hamlet: 15,
  suburb: 15,
  neighbourhood: 15,
  quarter: 15,
}

async function buscarNoPhoton(texto: string, sinal?: AbortSignal): Promise<Resultado[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(texto)}&limit=12`
  const resposta = await fetch(url, { signal: sinal })
  if (!resposta.ok) throw new Error('Falha ao buscar no Photon')
  const dados: RespostaPhoton = await resposta.json()

  const vistos = new Set<string>()
  const lugares: Resultado[] = []
  for (const { geometry, properties: p } of dados.features) {
    if (!p.name || !CHAVES_ACEITAS.includes(p.osm_key)) continue
    // A mesma cidade às vezes vem 2x (cidade + limite da cidade)
    const chave = `${p.name}|${p.state}|${p.countrycode}`
    if (vistos.has(chave)) continue
    vistos.add(chave)

    const codigoPais = (p.countrycode ?? '').toUpperCase()
    const ehLocalidade = p.osm_key === 'place' || p.osm_key === 'boundary'
    lugares.push({
      id: `${p.osm_type}${p.osm_id}`,
      nome: p.name,
      tipo: TIPOS[p.osm_value],
      pais: codigoPais ? (nomeDoPais.of(codigoPais) ?? p.country ?? '') : (p.country ?? ''),
      codigoPais,
      regiao: p.state,
      longitude: geometry.coordinates[0],
      latitude: geometry.coordinates[1],
      // Natureza (lago, praia...) fica no meio da tabela
      relevancia: ehLocalidade ? (RELEVANCIA_PHOTON[p.osm_value] ?? 20) : 40,
    })
  }
  return lugares
}

// ---------- Juntar as duas ----------

// "Milão" -> "milao" (sem acento e minúsculo, pra comparar)
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

// Distância aproximada em km (boa o bastante pra saber se é o mesmo lugar)
function distanciaKm(a: Cidade, b: Cidade) {
  const x = (b.longitude - a.longitude) * Math.cos(((a.latitude + b.latitude) / 2) * (Math.PI / 180))
  const y = b.latitude - a.latitude
  return Math.sqrt(x * x + y * y) * 111
}

// Cidade ou país (e não lago, praia...)
function ehLocalidade(c: Cidade) {
  return !c.tipo || c.tipo === 'País' || c.tipo === 'Região' || c.tipo === 'Bairro'
}

// O mesmo lugar vindo das duas fontes (ex.: "Milão" do Open-Meteo e "Milano" do Photon)
function mesmoLugar(a: Cidade, b: Cidade) {
  if (a.codigoPais !== b.codigoPais || !ehLocalidade(a) || !ehLocalidade(b)) return false
  if (a.tipo === 'País' || b.tipo === 'País') return a.tipo === b.tipo
  return distanciaKm(a, b) < 25
}

function combinar(texto: string, doOpenMeteo: Resultado[], doPhoton: Resultado[]): Cidade[] {
  // O Open-Meteo vem primeiro na lista porque tem o nome em português
  const todos = [...doOpenMeteo]
  for (const lugar of doPhoton) {
    if (!todos.some((outro) => mesmoLugar(outro, lugar))) todos.push(lugar)
  }

  // Bônus pra quem tem o nome igual ou começando com o que foi digitado.
  // Quem só "parece" (ex.: "Milas" pra "milão") perde pontos e vai pro fim.
  const busca = normalizar(texto)
  const nota = (c: Resultado) => {
    const nome = normalizar(c.nome)
    if (nome === busca) return c.relevancia + 10
    if (nome.startsWith(busca)) return c.relevancia + 5
    return c.relevancia - 20
  }

  return todos
    .map((c) => ({ c, nota: nota(c) }))
    .sort((a, b) => b.nota - a.nota)
    .slice(0, MAXIMO_RESULTADOS)
    .map(({ c: { relevancia: _relevancia, ...cidade } }) => cidade)
}

// Guarda buscas já feitas pra mostrar na hora se a pessoa digitar de novo
const memoria = new Map<string, Resultado[]>()

async function comMemoria(fonte: string, texto: string, buscar: () => Promise<Resultado[]>) {
  const chave = `${fonte}|${normalizar(texto)}`
  const guardado = memoria.get(chave)
  if (guardado) return guardado
  const lugares = await buscar()
  memoria.set(chave, lugares)
  return lugares
}

/**
 * Busca nas duas fontes ao mesmo tempo. Chama `aoAtualizar` assim que a primeira
 * responde e de novo quando a segunda chega, com a lista já juntada e ordenada.
 * Termina quando as duas acabaram (com sucesso ou não).
 */
export async function buscarCidades(
  texto: string,
  aoAtualizar: (lugares: Cidade[]) => void,
  sinal?: AbortSignal,
): Promise<void> {
  const limpo = texto.trim()
  if (limpo.length < 2) return aoAtualizar([])

  let doOpenMeteo: Resultado[] = []
  let doPhoton: Resultado[] = []
  let openMeteoRespondeu = false
  let pendentes = 2

  // Mostra a lista só depois do Open-Meteo (rápido e com nomes em português);
  // o Photon, mais lento, completa depois. Se o Open-Meteo falhar, vale o Photon.
  const atualizar = () => {
    if (sinal?.aborted) return
    pendentes--
    const juntos = combinar(limpo, doOpenMeteo, doPhoton)
    // Lista vazia só substitui a anterior quando as duas fontes já responderam
    if ((openMeteoRespondeu && juntos.length > 0) || pendentes === 0) aoAtualizar(juntos)
  }

  await Promise.all([
    comMemoria('om', limpo, () => buscarNoOpenMeteo(limpo, sinal))
      .then((lugares) => (doOpenMeteo = lugares))
      .catch(() => {})
      .finally(() => {
        openMeteoRespondeu = true
        atualizar()
      }),
    comMemoria('photon', limpo, () => buscarNoPhoton(limpo, sinal))
      .then((lugares) => (doPhoton = lugares))
      .catch(() => {})
      .finally(atualizar),
  ])
}

// Moeda mais provável pelo país do primeiro destino
const ZONA_EURO = ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'MC', 'SM', 'VA', 'AD', 'ME', 'XK']
const OUTRAS: Record<string, string> = { US: 'USD', GB: 'GBP', CH: 'CHF', BR: 'BRL', AR: 'ARS', CL: 'CLP', JP: 'JPY', CA: 'CAD', AU: 'AUD', MX: 'MXN', UY: 'UYU', CZ: 'CZK', HU: 'HUF', PL: 'PLN', DK: 'DKK', SE: 'SEK', NO: 'NOK', TR: 'TRY', TH: 'THB', CN: 'CNY', ZA: 'ZAR' }

export function moedaDoPais(codigoPais: string): string {
  if (ZONA_EURO.includes(codigoPais)) return 'EUR'
  return OUTRAS[codigoPais] ?? 'EUR'
}
