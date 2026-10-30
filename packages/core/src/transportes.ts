// Situação e preço dos trajetos (spec 035). Puro, testado em apps/web/tests/transportes-situacao.test.mjs.

export type SituacaoTrajeto = 'sugestao' | 'reservado' | 'comprado'

export const SITUACOES_DO_TRAJETO: { chave: SituacaoTrajeto; nome: string }[] = [
  { chave: 'sugestao', nome: 'Sugestão' },
  { chave: 'reservado', nome: 'Reservado' },
  { chave: 'comprado', nome: 'Comprado' },
]

export function nomeDaSituacao(chave: string): string {
  return SITUACOES_DO_TRAJETO.find((s) => s.chave === chave)?.nome ?? 'Sugestão'
}

type TrajetoComPreco = { situacao: string; preco: number | null; moeda: string | null }

// "2 de 5 comprados" + quanto falta pagar (sugestão e reservado), por moeda, em CENTAVOS (como o resto do app)
export function resumoDosTrajetos(trajetos: TrajetoComPreco[]): {
  comprados: number
  total: number
  aPagar: { moeda: string; valor: number }[]
  semPreco: number
} {
  const aPagar = new Map<string, number>()
  let semPreco = 0
  for (const t of trajetos) {
    if (t.situacao === 'comprado') continue
    if (t.preco === null || !t.moeda) {
      semPreco++
      continue
    }
    aPagar.set(t.moeda, (aPagar.get(t.moeda) ?? 0) + Math.round(Number(t.preco) * 100))
  }
  return {
    comprados: trajetos.filter((t) => t.situacao === 'comprado').length,
    total: trajetos.length,
    aPagar: [...aPagar].map(([moeda, valor]) => ({ moeda, valor })).sort((a, b) => b.valor - a.valor),
    semPreco,
  }
}
