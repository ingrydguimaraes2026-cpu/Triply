// Descobre o código do país (ISO, ex.: "FR") a partir do nome guardado no destino.
// O banco só guarda o nome, e ele chega escrito de jeitos diferentes conforme a busca
// ("Mónaco", "Mônaco", "Italia", "Itália"). Aqui a gente compara sem acento e sem maiúscula,
// em vários idiomas, usando os nomes que o próprio aparelho conhece (Intl.DisplayNames).
// Veio da web (features/documentos/paises.ts) pro app usar também.

const IDIOMAS = ['pt-BR', 'pt-PT', 'en', 'es', 'it', 'fr', 'de']

// Nomes que o navegador não usa mas aparecem nas buscas
const APELIDOS: Record<string, string> = {
  'estados unidos da america': 'US',
  eua: 'US',
  usa: 'US',
  inglaterra: 'GB',
  escocia: 'GB',
  'pais de gales': 'GB',
  'irlanda do norte': 'GB',
  holanda: 'NL',
  vaticano: 'VA',
  'cidade do vaticano': 'VA',
  'santa se': 'VA',
}

// Quando o aparelho não tem Intl.DisplayNames (o motor do app no celular pode não ter):
// os destinos mais comuns, em português, espanhol, italiano e inglês
const RESERVA: Record<string, string> = {
  franca: 'FR', france: 'FR', francia: 'FR',
  italia: 'IT', italy: 'IT',
  espanha: 'ES', espana: 'ES', spain: 'ES', spagna: 'ES',
  portugal: 'PT',
  alemanha: 'DE', germany: 'DE', deutschland: 'DE', alemania: 'DE', germania: 'DE',
  suica: 'CH', switzerland: 'CH', schweiz: 'CH', suiza: 'CH', svizzera: 'CH',
  austria: 'AT', osterreich: 'AT',
  belgica: 'BE', belgium: 'BE', belgio: 'BE',
  'paises baixos': 'NL', netherlands: 'NL', 'paesi bassi': 'NL',
  'reino unido': 'GB', 'united kingdom': 'GB', 'regno unito': 'GB',
  irlanda: 'IE', ireland: 'IE',
  monaco: 'MC', 'principado de monaco': 'MC',
  grecia: 'GR', greece: 'GR',
  croacia: 'HR', croatia: 'HR', croazia: 'HR',
  'republica tcheca': 'CZ', tchequia: 'CZ', czechia: 'CZ', 'czech republic': 'CZ',
  hungria: 'HU', hungary: 'HU',
  polonia: 'PL', poland: 'PL',
  dinamarca: 'DK', denmark: 'DK',
  suecia: 'SE', sweden: 'SE',
  noruega: 'NO', norway: 'NO',
  turquia: 'TR', turkey: 'TR', turkiye: 'TR',
  'estados unidos': 'US', 'united states': 'US',
  canada: 'CA',
  mexico: 'MX',
  argentina: 'AR',
  chile: 'CL',
  uruguai: 'UY', uruguay: 'UY',
  peru: 'PE',
  colombia: 'CO',
  brasil: 'BR', brazil: 'BR',
  japao: 'JP', japan: 'JP',
  china: 'CN',
  tailandia: 'TH', thailand: 'TH',
  'africa do sul': 'ZA', 'south africa': 'ZA',
  australia: 'AU',
  'san marino': 'SM',
  andorra: 'AD',
  luxemburgo: 'LU', luxembourg: 'LU',
  malta: 'MT',
}

export function semAcento(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

let mapa: Map<string, string> | null = null

function montarMapa() {
  const m = new Map<string, string>(Object.entries(RESERVA))
  if (typeof Intl.DisplayNames === 'function') {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (const idioma of IDIOMAS) {
      let nomes: Intl.DisplayNames
      try {
        nomes = new Intl.DisplayNames([idioma], { type: 'region', fallback: 'none' })
      } catch {
        continue
      }
      for (const a of letras)
        for (const b of letras) {
          const codigo = a + b
          let nome: string | undefined
          try {
            nome = nomes.of(codigo)
          } catch {
            nome = undefined
          }
          if (nome) {
            const chave = semAcento(nome)
            if (!m.has(chave)) m.set(chave, codigo)
          }
        }
    }
  }
  for (const [nome, codigo] of Object.entries(APELIDOS)) m.set(nome, codigo)
  return m
}

// "Mónaco" → "MC". Não reconheceu → null.
export function codigoDoPais(nome: string | null | undefined): string | null {
  if (!nome) return null
  mapa ??= montarMapa()
  return mapa.get(semAcento(nome)) ?? null
}

// Moeda mais provável pelo país
const ZONA_EURO = ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'MC', 'SM', 'VA', 'AD', 'ME', 'XK']
const OUTRAS: Record<string, string> = { US: 'USD', GB: 'GBP', CH: 'CHF', BR: 'BRL', AR: 'ARS', CL: 'CLP', JP: 'JPY', CA: 'CAD', AU: 'AUD', MX: 'MXN', UY: 'UYU', CZ: 'CZK', HU: 'HUF', PL: 'PLN', DK: 'DKK', SE: 'SEK', NO: 'NOK', TR: 'TRY', TH: 'THB', CN: 'CNY', ZA: 'ZAR' }

export function moedaDoPais(codigoPais: string): string {
  if (ZONA_EURO.includes(codigoPais)) return 'EUR'
  return OUTRAS[codigoPais] ?? 'EUR'
}

/**
 * Cotações de hoje pra converter pra moeda `base`.
 * Devolve `taxas[X]` = quantas unidades de X valem 1 da base (o mesmo formato de cotacao.ts).
 * Sem internet ou moeda que o Frankfurter não tem → null.
 */
const TRES_HORAS = 3 * 60 * 60 * 1000
const memoria = new Map<string, { quando: number; taxas: Record<string, number> }>()

export async function cotacoesDeHoje(base: string, moedas: string[]): Promise<Record<string, number> | null> {
  const lista = [...new Set(moedas.filter((m) => m !== base))].sort()
  if (lista.length === 0) return {}
  const chave = `${base}:${lista.join(',')}`
  const guardado = memoria.get(chave)
  if (guardado && Date.now() - guardado.quando < TRES_HORAS) return guardado.taxas
  try {
    const resposta = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${lista.join(',')}`)
    if (!resposta.ok) return null
    const dados: { rates?: Record<string, number> } = await resposta.json()
    const taxas = dados.rates ?? {}
    memoria.set(chave, { quando: Date.now(), taxas })
    return taxas
  } catch {
    return null
  }
}
