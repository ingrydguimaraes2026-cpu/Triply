// Contas do câmbio. Funções puras, testadas em tests/financeiro.test.mjs.
// Cotação aqui é sempre "quanto da moeda de ORIGEM custa 1 da moeda de DESTINO" (ex.: R$ 6,12 por € 1).

export type Compra = { moedaOrigem: string; moedaDestino: string; valorOrigem: number; valorDestino: number }

// Média ponderada: soma do que pagou ÷ soma do que recebeu. Sem compras → null.
export function cotacaoMedia(compras: Compra[]): number | null {
  const pago = compras.reduce((s, c) => s + c.valorOrigem, 0)
  const recebido = compras.reduce((s, c) => s + c.valorDestino, 0)
  return recebido > 0 ? pago / recebido : null
}

// Agrupa por par de moedas ("BRL→EUR") e calcula a média de cada um
export function mediasPorPar(compras: Compra[]) {
  const pares = new Map<string, Compra[]>()
  for (const c of compras) {
    const chave = `${c.moedaOrigem}>${c.moedaDestino}`
    pares.set(chave, [...(pares.get(chave) ?? []), c])
  }
  return [...pares].map(([chave, lista]) => {
    const [origem, destino] = chave.split('>')
    return {
      origem,
      destino,
      media: cotacaoMedia(lista)!,
      totalOrigem: lista.reduce((s, c) => s + c.valorOrigem, 0),
      totalDestino: lista.reduce((s, c) => s + c.valorDestino, 0),
    }
  })
}

/**
 * Comparação com a cotação de hoje, em %.
 * Positivo = compraram mais barato do que está hoje (bom). Ex.: média 6,12, hoje 6,30 → 2,9.
 */
export function comparacaoComHoje(media: number, hoje: number): number {
  return ((hoje - media) / hoje) * 100
}

/**
 * Converte um valor pra moeda da viagem.
 * `taxas[X]` = quantas unidades de X valem 1 da moeda da viagem (ex.: taxas.BRL = 6.12 numa viagem em EUR).
 * Sem taxa pra moeda → null (a tela mostra "sem cotação").
 */
export function converter(centavos: number, moeda: string, moedaViagem: string, taxas: Record<string, number>): number | null {
  if (moeda === moedaViagem) return centavos
  const taxa = taxas[moeda]
  if (!taxa || taxa <= 0) return null
  return Math.round(centavos / taxa)
}

/**
 * Monta as taxas pra converter: primeiro a cotação média do comboio (quem comprou X pra ter a moeda da viagem),
 * e o que faltar, a cotação de hoje.
 */
export function montarTaxas(compras: Compra[], moedaViagem: string, deHoje: Record<string, number>): Record<string, number> {
  const taxas: Record<string, number> = { ...deHoje }
  for (const par of mediasPorPar(compras)) {
    if (par.destino === moedaViagem) taxas[par.origem] = par.media
  }
  return taxas
}
