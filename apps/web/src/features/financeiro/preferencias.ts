// Preferências guardadas no próprio celular (localStorage)
const CHAVE_ULTIMA_MOEDA = 'together:ultima-moeda'

// Moeda do último gasto lançado (padrão do lançamento rápido, spec 009)
export function ultimaMoeda(padrao: string) {
  try {
    return localStorage.getItem(CHAVE_ULTIMA_MOEDA) ?? padrao
  } catch {
    return padrao
  }
}

export function lembrarMoeda(moeda: string) {
  try {
    localStorage.setItem(CHAVE_ULTIMA_MOEDA, moeda)
  } catch {
    // sem localStorage (aba anônima): tudo bem
  }
}