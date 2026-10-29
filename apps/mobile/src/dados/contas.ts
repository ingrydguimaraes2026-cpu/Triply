import { calcularAcertos, calcularSaldos, type GastoDaViagem } from '@together/core'

// Categorias dos gastos (mesmas chaves do banco) com a cor da barrinha do design.
export const CATEGORIAS = [
  { chave: 'hospedagem', nome: 'Hospedagem', cor: '#4A2E14' },
  { chave: 'transporte', nome: 'Transporte', cor: '#7B542F' },
  { chave: 'alimentacao', nome: 'Comida', cor: '#B97A22' },
  { chave: 'passeios', nome: 'Passeios', cor: '#DDB97E' },
  { chave: 'comprinhas', nome: 'Compras', cor: '#C99257' },
  { chave: 'outros', nome: 'Outros', cor: '#D9C3A2' },
] as const

export function categoria(chave: string) {
  return CATEGORIAS.find((c) => c.chave === chave) ?? CATEGORIAS[5]
}

// Resumo das contas na moeda principal da viagem: total do grupo, por categoria,
// saldo de cada um (+ recebe / − deve) e os acertos sugeridos.
export function resumoDasContas(gastos: GastoDaViagem[], moeda: string) {
  const doGrupo = gastos.filter((g) => !g.pessoal && !g.rascunho && g.moeda === moeda)
  const total = doGrupo.reduce((s, g) => s + g.valor, 0)
  const porCategoria = CATEGORIAS.map((c) => ({
    ...c,
    valor: doGrupo.filter((g) => categoria(g.categoria).chave === c.chave).reduce((s, g) => s + g.valor, 0),
  })).filter((c) => c.valor > 0)
  const paraConta = doGrupo.map((g) => ({ pagoPor: g.pago_por, moeda: g.moeda, valor: g.valor, pessoal: g.pessoal, divisoes: g.divisoes }))
  const saldos = calcularSaldos(paraConta).get(moeda) ?? new Map<string, number>()
  const acertos = calcularAcertos(paraConta)
  return { total, porCategoria, saldos, acertos, quantidade: doGrupo.length }
}
