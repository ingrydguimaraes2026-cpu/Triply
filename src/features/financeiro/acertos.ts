// Regras de divisão e acertos do Financeiro. Funções puras (sem banco), testadas em tests/financeiro.test.mjs.
// Todos os valores em centavos.

export type Divisao = { usuarioId: string; valor: number }

export type GastoParaConta = {
  pagoPor: string
  moeda: string
  valor: number
  pessoal: boolean
  divisoes: Divisao[]
}

export type Acerto = { de: string; para: string; valor: number; moeda: string }

/**
 * Divide igual entre as pessoas. Os centavos que sobram (ex.: € 10 entre 3)
 * ficam com quem pagou, se ele participa; senão, 1 centavo pra cada um, na ordem.
 */
export function dividirIgual(total: number, pessoas: string[], pagador: string): Divisao[] {
  if (pessoas.length === 0) return []
  const base = Math.floor(total / pessoas.length)
  let sobra = total - base * pessoas.length
  const divisoes = pessoas.map((usuarioId) => ({ usuarioId, valor: base }))
  const doPagador = divisoes.find((d) => d.usuarioId === pagador)
  if (doPagador) {
    doPagador.valor += sobra
    return divisoes
  }
  for (const d of divisoes) {
    if (sobra === 0) break
    d.valor += 1
    sobra -= 1
  }
  return divisoes
}

// Quanto a divisão soma e quanto falta pra fechar o total (negativo = passou)
export function conferirDivisao(total: number, divisoes: Divisao[]) {
  const soma = divisoes.reduce((s, d) => s + d.valor, 0)
  return { soma, falta: total - soma, fecha: soma === total && divisoes.length > 0 }
}

/**
 * Saldo de cada pessoa, separado por moeda.
 * Positivo = tem a receber; negativo = deve. Gastos pessoais não entram.
 */
export function calcularSaldos(gastos: GastoParaConta[]): Map<string, Map<string, number>> {
  const porMoeda = new Map<string, Map<string, number>>()
  for (const g of gastos) {
    if (g.pessoal) continue
    let saldos = porMoeda.get(g.moeda)
    if (!saldos) {
      saldos = new Map()
      porMoeda.set(g.moeda, saldos)
    }
    saldos.set(g.pagoPor, (saldos.get(g.pagoPor) ?? 0) + g.valor)
    for (const d of g.divisoes) saldos.set(d.usuarioId, (saldos.get(d.usuarioId) ?? 0) - d.valor)
  }
  return porMoeda
}

/**
 * "Quem deve pra quem" com poucos pagamentos: quem mais deve paga pra quem mais tem a receber,
 * até zerar todo mundo. Cada moeda é acertada separado.
 */
export function calcularAcertos(gastos: GastoParaConta[]): Acerto[] {
  const acertos: Acerto[] = []
  for (const [moeda, saldos] of calcularSaldos(gastos)) {
    const devedores = [...saldos].filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v }))
    const credores = [...saldos].filter(([, v]) => v > 0).map(([id, v]) => ({ id, v }))
    devedores.sort((a, b) => b.v - a.v || a.id.localeCompare(b.id))
    credores.sort((a, b) => b.v - a.v || a.id.localeCompare(b.id))
    let i = 0
    let j = 0
    while (i < devedores.length && j < credores.length) {
      const valor = Math.min(devedores[i].v, credores[j].v)
      if (valor > 0) acertos.push({ de: devedores[i].id, para: credores[j].id, valor, moeda })
      devedores[i].v -= valor
      credores[j].v -= valor
      if (devedores[i].v === 0) i++
      if (credores[j].v === 0) j++
    }
  }
  return acertos
}

// Total por moeda: { EUR: 32000, BRL: 15000 }. Os pessoais entram (cada pessoa só vê os dela).
export function totalPorMoeda(gastos: { moeda: string; valor: number }[]): Record<string, number> {
  const total: Record<string, number> = {}
  for (const g of gastos) total[g.moeda] = (total[g.moeda] ?? 0) + g.valor
  return total
}
