// Se a pessoa já viu o tour guiado (neste navegador)
const CHAVE = 'together:tour-v1'

export function jaViu() {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return true // sem armazenamento: melhor não insistir a cada visita
  }
}

export function marcarVisto() {
  try {
    localStorage.setItem(CHAVE, '1')
  } catch {
    // sem armazenamento: só não lembra
  }
}

export function verTourDeNovo() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // sem armazenamento: o tour aparece de qualquer jeito
  }
}
