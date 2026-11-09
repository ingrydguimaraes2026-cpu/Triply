// Decisões registradas (spec 044). Puro, testado em apps/web/tests/decisoes.test.mjs.

// Spec 044: o resultado de uma enquete (a "decisão"). Empate = mais de uma vencedora.
export function resultadoDaEnquete(opcoes: { texto: string; votos: string[] }[]): { vencedoras: string[]; votos: number; empate: boolean } | null {
  const max = Math.max(0, ...opcoes.map((o) => o.votos.length))
  if (max === 0) return null
  const vencedoras = opcoes.filter((o) => o.votos.length === max).map((o) => o.texto)
  return { vencedoras, votos: max, empate: vencedoras.length > 1 }
}
