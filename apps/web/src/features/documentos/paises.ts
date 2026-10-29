// Descobre o código do país (ISO, ex.: "FR") a partir do nome guardado no destino.
// O banco só guarda o nome, e ele chega escrito de jeitos diferentes conforme a busca
// ("Mónaco", "Mônaco", "Italia", "Itália"). Aqui a gente compara sem acento e sem maiúscula,
// em vários idiomas, usando os nomes que o próprio navegador conhece (Intl.DisplayNames).

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

export function semAcento(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

let mapa: Map<string, string> | null = null

function montarMapa() {
  const m = new Map<string, string>()
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (const idioma of IDIOMAS) {
    const nomes = new Intl.DisplayNames([idioma], { type: 'region', fallback: 'none' })
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
  for (const [nome, codigo] of Object.entries(APELIDOS)) m.set(nome, codigo)
  return m
}

// "Mónaco" → "MC". Não reconheceu → null.
export function codigoDoPais(nome: string | null | undefined): string | null {
  if (!nome) return null
  mapa ??= montarMapa()
  return mapa.get(semAcento(nome)) ?? null
}

const nomesPt = new Intl.DisplayNames(['pt-BR'], { type: 'region' })

// "MC" → "Mônaco"
export function nomeDoPais(codigo: string) {
  return nomesPt.of(codigo) ?? codigo
}
