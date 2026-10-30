// Relatórios do Financeiro (spec 082). Recebe os gastos do comboio já com o valor convertido pra
// moeda da viagem (centavos) e a parte de cada pessoa convertida também. Puro (teste: relatorios.test.mjs).

export type GastoConvertido = { data: string; valor: number; pago_por: string; divisoes: { usuarioId: string; valor: number }[] }

export function relatorio(gastos: GastoConvertido[], pessoas: number) {
  const porDia = new Map<string, number>()
  const pagou = new Map<string, number>()
  const consumiu = new Map<string, number>()
  let total = 0
  for (const g of gastos) {
    total += g.valor
    porDia.set(g.data, (porDia.get(g.data) ?? 0) + g.valor)
    pagou.set(g.pago_por, (pagou.get(g.pago_por) ?? 0) + g.valor)
    for (const d of g.divisoes) consumiu.set(d.usuarioId, (consumiu.get(d.usuarioId) ?? 0) + d.valor)
  }
  const dias = [...porDia.keys()].sort()
  const ids = [...new Set([...pagou.keys(), ...consumiu.keys()])]
  return {
    total,
    porDia: dias.map((dia) => ({ dia, valor: porDia.get(dia)! })),
    porPessoa: ids
      .map((id) => ({ usuarioId: id, pagou: pagou.get(id) ?? 0, consumiu: consumiu.get(id) ?? 0 }))
      .sort((a, b) => b.consumiu - a.consumiu),
    // Custo médio por pessoa por dia (só os dias com gasto)
    porPessoaPorDia: dias.length && pessoas ? Math.round(total / pessoas / dias.length) : 0,
    diaMaisCaro: dias.length ? dias.reduce((a, b) => (porDia.get(b)! > porDia.get(a)! ? b : a)) : null,
  }
}
