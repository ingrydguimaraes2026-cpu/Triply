// Se a pessoa já viu o tour guiado (neste navegador). M7 (QA 16/11): a marca é por pessoa,
// senão uma conta nova no mesmo navegador nunca via o tour.
const CHAVE = 'together:tour-v1'
const chaveDe = (usuarioId: string) => `${CHAVE}:${usuarioId}`

export function jaViu(usuarioId: string) {
  try {
    return localStorage.getItem(chaveDe(usuarioId)) === '1'
  } catch {
    return true // sem armazenamento: melhor não insistir a cada visita
  }
}

export function marcarVisto(usuarioId: string) {
  try {
    localStorage.setItem(chaveDe(usuarioId), '1')
  } catch {
    // sem armazenamento: só não lembra
  }
}

// Apaga a marca de todo mundo neste navegador (o Perfil não precisa saber quem é)
export function verTourDeNovo() {
  try {
    for (const k of Object.keys(localStorage)) if (k === CHAVE || k.startsWith(`${CHAVE}:`)) localStorage.removeItem(k)
  } catch {
    // sem armazenamento: o tour aparece de qualquer jeito
  }
}
