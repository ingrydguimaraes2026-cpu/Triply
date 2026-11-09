// Livro da viagem (spec 106, K8): junta, dia a dia, o que aconteceu (agenda), o que cada um
// escreveu (diário) e as fotos. Puro, pra dar pra testar.

type ComDia = { dia: string }

export type PaginaDoLivro<A, D, F> = { dia: string; agenda: A[]; diario: D[]; fotos: F[] }

// Uma página por dia que tem alguma coisa, na ordem
export function paginasDoLivro<A extends ComDia, D extends ComDia, F extends ComDia>(agenda: A[], diario: D[], fotos: F[]): PaginaDoLivro<A, D, F>[] {
  const dias = [...new Set([...agenda, ...diario, ...fotos].map((x) => x.dia))].sort()
  return dias.map((dia) => ({
    dia,
    agenda: agenda.filter((a) => a.dia === dia),
    diario: diario.filter((d) => d.dia === dia),
    fotos: fotos.filter((f) => f.dia === dia),
  }))
}
