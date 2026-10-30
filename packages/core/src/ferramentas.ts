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
