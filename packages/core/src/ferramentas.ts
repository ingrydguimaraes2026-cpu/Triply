// Ferramentas do dia (spec 059), na tela Hoje: conversor, gorjeta, banheiro grátis, restaurante e
// guarda-volumes. Puro, testado em apps/web/tests/ferramentas.test.mjs.
// Sem import de propósito (o teste carrega o arquivo direto). Mesmo valor de IOF_GASTOS em termometro.ts.
const IOF_GASTOS = 0.035

// ---------- Conversor (J2) ----------
// `reaisPorUnidade` = quantos reais vale 1 da moeda (comercial). Devolve centavos de real.
export function emReais(centavosMoeda: number, reaisPorUnidade: number, comIof = true): number {
  return Math.round(centavosMoeda * reaisPorUnidade * (comIof ? 1 + IOF_GASTOS : 1))
}

// ---------- Gorjeta (J6) ----------
const GORJETA_PADRAO: Record<string, number> = {
  US: 18, CA: 15, MX: 10, AR: 10, CL: 10, UY: 10, CO: 10, PE: 10, BR: 10,
  GB: 10, IE: 10, PL: 10, HU: 10, CZ: 10, GR: 5, DE: 7, AT: 7,
  FR: 5, IT: 5, ES: 5, PT: 5, NL: 5, BE: 5, CH: 5, HR: 5, MC: 5,
  JP: 0, CN: 0, KR: 0, AU: 0, NZ: 0, FI: 0, IS: 0, DK: 0, NO: 0, SE: 0,
  TH: 5, ZA: 12, AE: 10,
}

export function gorjetaSugerida(codigoPais: string | null): number {
  return codigoPais ? (GORJETA_PADRAO[codigoPais.toUpperCase()] ?? 10) : 10
}

// Conta com gorjeta dividida: a sobra dos centavos fica com a primeira pessoa (como no Financeiro)
export function contaComGorjeta(centavos: number, porcento: number, pessoas: number): { gorjeta: number; total: number; porPessoa: number; sobra: number } {
  const gorjeta = Math.round((centavos * porcento) / 100)
  const total = centavos + gorjeta
  const n = Math.max(1, Math.floor(pessoas))
  const porPessoa = Math.floor(total / n)
  return { gorjeta, total, porPessoa, sobra: total - porPessoa * n }
}

// ---------- Banheiro grátis perto (C11, ideia do Flush) ----------
// Dados abertos do OpenStreetMap (Overpass). `fee=no` = grátis; sem a etiqueta = não se sabe.

export type Banheiro = { id: number; latitude: number; longitude: number; metros: number; gratis: boolean | null; nome: string | null; acessivel: boolean }

export function distanciaEmMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371000
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * r * Math.asin(Math.sqrt(a)))
}

export function consultaDeBanheiros(latitude: number, longitude: number, raioMetros = 800): string {
  const q = `[out:json][timeout:15];(node["amenity"="toilets"](around:${raioMetros},${latitude},${longitude});way["amenity"="toilets"](around:${raioMetros},${latitude},${longitude}););out center 40;`
  return `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`
}

type ElementoOsm = { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }

// Grátis primeiro, depois os "não se sabe", por distância. Pagos no fim. No máximo 8.
export function banheirosDaResposta(resposta: { elements?: ElementoOsm[] }, latitude: number, longitude: number): Banheiro[] {
  const lista: Banheiro[] = []
  for (const e of resposta.elements ?? []) {
    const lat = e.lat ?? e.center?.lat
    const lon = e.lon ?? e.center?.lon
    if (lat === undefined || lon === undefined) continue
    const fee = e.tags?.fee
    lista.push({
      id: e.id,
      latitude: lat,
      longitude: lon,
      metros: distanciaEmMetros(latitude, longitude, lat, lon),
      gratis: fee === 'no' ? true : fee === 'yes' ? false : null,
      nome: e.tags?.name ?? null,
      acessivel: e.tags?.wheelchair === 'yes',
    })
  }
  const peso = (b: Banheiro) => (b.gratis === true ? 0 : b.gratis === null ? 1 : 2)
  return lista.sort((a, b) => peso(a) - peso(b) || a.metros - b.metros).slice(0, 8)
}

// ---------- Restaurante (C12, ideia do TheFork) e guarda-volumes (E12, ideia do Nannybag) ----------
// Só links de busca com a cidade pronta: nada de API paga nem afiliado.

const busca = (texto: string) => `https://www.google.com/search?q=${encodeURIComponent(texto)}`

export function linksDeRestaurante(cidade: string, latitude: number | null, longitude: number | null): { nome: string; url: string }[] {
  const perto =
    latitude !== null && longitude !== null
      ? `https://www.google.com/maps/search/restaurantes/@${latitude},${longitude},15z`
      : `https://www.google.com/maps/search/${encodeURIComponent(`restaurantes ${cidade}`)}`
  return [
    { nome: 'Perto, no Google Maps', url: perto },
    { nome: 'TheFork (desconto reservando antes)', url: busca(`TheFork ${cidade}`) },
  ]
}

export function linksDeGuardaVolumes(cidade: string): { nome: string; url: string }[] {
  return [
    { nome: 'Nannybag', url: busca(`Nannybag ${cidade}`) },
    { nome: 'Bounce', url: busca(`Bounce guarda volumes ${cidade}`) },
    { nome: 'Radical Storage', url: busca(`Radical Storage ${cidade}`) },
  ]
}

// ---------- Perto de mim (C8, spec 061) ----------
// Os lugares salvos não têm coordenada: o app procura cada um no Photon (OpenStreetMap), perto do destino.

export function consultaDoLugar(nome: string, cidade: string, latitude: number | null, longitude: number | null): string {
  const perto = latitude !== null && longitude !== null ? `&lat=${latitude}&lon=${longitude}` : ''
  return `https://photon.komoot.io/api/?q=${encodeURIComponent(`${nome} ${cidade}`.trim())}&limit=1${perto}`
}

type RespostaPhoton = { features?: { geometry?: { coordinates?: [number, number] } }[] }

export function pontoDaResposta(resposta: RespostaPhoton): { latitude: number; longitude: number } | null {
  const c = resposta.features?.[0]?.geometry?.coordinates
  return c ? { latitude: c[1], longitude: c[0] } : null
}

// Os mais perto primeiro; descarta o que ficou a mais de 50 km (o Photon achou outro lugar com o mesmo nome)
export function maisPerto<L extends { latitude: number; longitude: number }>(lugares: L[], latitude: number, longitude: number): (L & { metros: number })[] {
  return lugares
    .map((l) => ({ ...l, metros: distanciaEmMetros(latitude, longitude, l.latitude, l.longitude) }))
    .filter((l) => l.metros <= 50000)
    .sort((a, b) => a.metros - b.metros)
}

export function textoDaDistancia(metros: number): string {
  return metros < 1000 ? `${Math.round(metros / 10) * 10} m` : `${(metros / 1000).toFixed(1).replace('.', ',')} km`
}

// ---------- Buscar lugar com autocompletar (C4, spec 064) ----------
// Photon (OpenStreetMap), puxando pra perto do destino. Sugere o tipo pelo que o OSM diz que é.

export type Estabelecimento = { id: string; nome: string; endereco: string; latitude: number; longitude: number; tipo: 'passeio' | 'comida' | 'outro' }

export function consultaDeEstabelecimentos(texto: string, latitude: number | null, longitude: number | null): string {
  const perto = latitude !== null && longitude !== null ? `&lat=${latitude}&lon=${longitude}&location_bias_scale=0.5` : ''
  return `https://photon.komoot.io/api/?q=${encodeURIComponent(texto.trim())}&limit=6${perto}`
}

const COMIDA = ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'ice_cream', 'bakery', 'food_court', 'biergarten', 'pastry', 'deli']
const PASSEIO_CHAVES = ['tourism', 'historic', 'leisure']

type FeaturePhoton = {
  geometry?: { coordinates?: [number, number] }
  properties?: { osm_type?: string; osm_id?: number; osm_key?: string; osm_value?: string; name?: string; street?: string; housenumber?: string; city?: string; country?: string }
}

export function estabelecimentosDaResposta(resposta: { features?: FeaturePhoton[] }): Estabelecimento[] {
  const lista: Estabelecimento[] = []
  for (const f of resposta.features ?? []) {
    const p = f.properties ?? {}
    const c = f.geometry?.coordinates
    if (!p.name || !c) continue
    const rua = [p.street, p.housenumber].filter(Boolean).join(' ')
    const tipo = COMIDA.includes(p.osm_value ?? '') ? 'comida' : PASSEIO_CHAVES.includes(p.osm_key ?? '') ? 'passeio' : 'outro'
    lista.push({
      id: `${p.osm_type ?? ''}${p.osm_id ?? lista.length}`,
      nome: p.name,
      endereco: [rua, p.city, p.country].filter(Boolean).join(', ').slice(0, 200),
      latitude: c[1],
      longitude: c[0],
      tipo,
    })
  }
  return lista
}

// ---------- Sugestões de lugares por destino (L4, spec 094) ----------
// Atrações do OpenStreetMap perto do destino. Só as que têm verbete na Wikipédia/Wikidata
// (sinal de que são conhecidas). Sem chave e sem custo.

export type Sugestao = {
  id: string
  nome: string
  tipo: 'museu' | 'mirante' | 'atracao' | 'historico'
  latitude: number
  longitude: number
  metros: number
  wikipedia: string | null // link
}

export function consultaDeSugestoes(latitude: number, longitude: number, raioMetros = 5000): string {
  const perto = `(around:${raioMetros},${latitude},${longitude})`
  const q =
    `[out:json][timeout:20];(` +
    `nwr["tourism"~"^(attraction|museum|viewpoint|gallery)$"]["name"]["wikidata"]${perto};` +
    `nwr["historic"~"^(castle|monument|ruins|fort)$"]["name"]["wikidata"]${perto};` +
    `);out center 80;`
  return `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`
}

const simples = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

function linkDaWikipedia(tag: string | undefined): string | null {
  // "pt:Torre Eiffel" → https://pt.wikipedia.org/wiki/Torre_Eiffel
  const m = tag?.match(/^([a-z-]{2,12}):(.+)$/)
  return m ? `https://${m[1]}.wikipedia.org/wiki/${encodeURIComponent(m[2].replace(/ /g, '_'))}` : null
}

// Com Wikipédia primeiro, depois por distância. Tira o que já está salvo (pelo nome). No máximo 12.
export function sugestoesDaResposta(
  resposta: { elements?: ElementoOsm[] },
  latitude: number,
  longitude: number,
  jaSalvos: string[],
): Sugestao[] {
  const salvos = new Set(jaSalvos.map(simples))
  const vistos = new Set<string>()
  const lista: Sugestao[] = []
  for (const e of resposta.elements ?? []) {
    const lat = e.lat ?? e.center?.lat
    const lon = e.lon ?? e.center?.lon
    const t = e.tags ?? {}
    const nome = t['name:pt'] ?? t.name
    if (lat === undefined || lon === undefined || !nome) continue
    const chave = simples(nome)
    if (salvos.has(chave) || vistos.has(chave)) continue
    vistos.add(chave)
    lista.push({
      id: `${e.id}`,
      nome,
      tipo: t.tourism === 'museum' || t.tourism === 'gallery' ? 'museu' : t.tourism === 'viewpoint' ? 'mirante' : t.historic ? 'historico' : 'atracao',
      latitude: lat,
      longitude: lon,
      metros: distanciaEmMetros(latitude, longitude, lat, lon),
      wikipedia: linkDaWikipedia(t['wikipedia']),
    })
  }
  return lista.sort((a, b) => Number(!!b.wikipedia) - Number(!!a.wikipedia) || a.metros - b.metros).slice(0, 12)
}
