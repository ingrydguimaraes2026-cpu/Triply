// Divisão por pesos e por item (spec 081). Só calcula quanto cada um deve no gasto; o resto do app
// (saldos, acertos) continua igual, porque o gasto é salvo com os valores de cada pessoa.
// Valores em CENTAVOS. Sem imports de propósito (teste: apps/web/tests/divisao.test.mjs).

export type Parte = { usuarioId: string; valor: number }

// Reparte `total` proporcional aos pesos (casal = 2, criança = 0,5). A sobra dos centavos vai pra quem pagou
// (ou, se ele não está na conta, 1 centavo pra cada um na ordem).
export function dividirPorPesos(total: number, pesos: { usuarioId: string; peso: number }[], pagador: string): Parte[] {
  const validos = pesos.filter((p) => p.peso > 0)
  const soma = validos.reduce((s, p) => s + p.peso, 0)
  if (soma === 0) return []
  const partes = validos.map((p) => ({ usuarioId: p.usuarioId, valor: Math.floor((total * p.peso) / soma) }))
  let sobra = total - partes.reduce((s, p) => s + p.valor, 0)
  const doPagador = partes.find((p) => p.usuarioId === pagador)
  if (doPagador) doPagador.valor += sobra
  else
    for (const p of partes) {
      if (sobra === 0) break
      p.valor += 1
      sobra -= 1
    }
  return partes
}

// Conta de restaurante item a item: cada item dividido igual entre quem consumiu; o que sobra do total
// (taxa de serviço, couvert, item não marcado) é dividido igual entre todos os participantes.
export function dividirPorItens(
  total: number,
  itens: { valor: number; pessoas: string[] }[],
  participantes: string[],
  pagador: string,
): { partes: Parte[]; semDono: number; passou: boolean } {
  const conta = new Map<string, number>(participantes.map((p) => [p, 0]))
  let somaItens = 0
  for (const item of itens) {
    const quem = item.pessoas.filter((p) => conta.has(p))
    if (quem.length === 0 || item.valor <= 0) continue
    somaItens += item.valor
    for (const p of dividirPorPesos(item.valor, quem.map((usuarioId) => ({ usuarioId, peso: 1 })), pagador)) {
      conta.set(p.usuarioId, (conta.get(p.usuarioId) ?? 0) + p.valor)
    }
  }
  const semDono = total - somaItens
  if (semDono < 0) return { partes: [], semDono, passou: true }
  if (semDono > 0) {
    for (const p of dividirPorPesos(semDono, participantes.map((usuarioId) => ({ usuarioId, peso: 1 })), pagador)) {
      conta.set(p.usuarioId, (conta.get(p.usuarioId) ?? 0) + p.valor)
    }
  }
  return { partes: [...conta].map(([usuarioId, valor]) => ({ usuarioId, valor })).filter((p) => p.valor > 0), semDono, passou: false }
}
