// Dinheiro na mão (spec 083 / H12): quanto de cada moeda em espécie a pessoa ainda tem =
// compras de moeda em espécie − gastos que ela pagou em dinheiro vivo. CENTAVOS. Teste: dinheiro-na-mao.test.mjs

export const MEIOS_DE_PAGAMENTO: { chave: 'cartao' | 'conta_global' | 'especie'; nome: string }[] = [
  { chave: 'cartao', nome: 'Cartão' },
  { chave: 'conta_global', nome: 'Conta global' },
  { chave: 'especie', nome: 'Dinheiro' },
]

export function dinheiroNaMao(
  compras: { usuario_id: string; moeda_destino: string; valorDestino: number; especie?: boolean }[],
  gastos: { pago_por: string; moeda: string; valor: number; meio_pagamento?: string | null }[],
  meuId: string,
): { moeda: string; valor: number }[] {
  const saldo = new Map<string, number>()
  for (const c of compras) if (c.especie && c.usuario_id === meuId) saldo.set(c.moeda_destino, (saldo.get(c.moeda_destino) ?? 0) + c.valorDestino)
  for (const g of gastos) if (g.meio_pagamento === 'especie' && g.pago_por === meuId) saldo.set(g.moeda, (saldo.get(g.moeda) ?? 0) - g.valor)
  return [...saldo].map(([moeda, valor]) => ({ moeda, valor })).filter((s) => s.valor !== 0)
}
