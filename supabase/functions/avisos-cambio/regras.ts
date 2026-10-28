// Boletim do câmbio 2x por dia (12h e 20h) + aviso extra quando bate a meta (spec 013).
// Puro: roda no servidor (Deno) e nos testes (Node).

// IOF 2026 pra comprar moeda pra gastar (o mesmo do termômetro no app)
export const IOF_GASTOS = 0.035

// Folga pra não ficar avisando quando a cotação fica oscilando em cima da meta:
// depois de avisar, só "rearma" quando subir 0,3% acima da meta.
export const FOLGA_REARMAR = 0.003

export type Meta = { meta: number; abaixo: boolean }

export type Decisao = { acao: 'avisar' | 'rearmar' | 'nada'; comIOF: number }

/**
 * Compara a cotação comercial (com IOF) com a meta:
 * - cruzou pra baixo (e ainda não avisou) → avisar
 * - voltou a subir bem acima da meta → rearmar (pra avisar de novo na próxima queda)
 */
export function decidir(meta: Meta, comercial: number): Decisao {
  const comIOF = comercial * (1 + IOF_GASTOS)
  if (comIOF <= meta.meta && !meta.abaixo) return { acao: 'avisar', comIOF }
  if (meta.abaixo && comIOF > meta.meta * (1 + FOLGA_REARMAR)) return { acao: 'rearmar', comIOF }
  return { acao: 'nada', comIOF }
}

export type Nivel = 'barato' | 'medio' | 'caro'

/**
 * Barato ou caro em relação aos últimos 90 dias (a mesma régua do termômetro na tela):
 * barato = entre os 25% menores valores; caro = entre os 25% maiores. Sem histórico → null.
 */
export function nivelDoCambio(historico90: number[], comercial: number): Nivel | null {
  if (historico90.length === 0) return null
  const abaixo = historico90.filter((v) => v < comercial).length
  const iguais = historico90.filter((v) => v === comercial).length
  const p = (abaixo + iguais / 2) / historico90.length
  return p <= 0.25 ? 'barato' : p >= 0.75 ? 'caro' : 'medio'
}

const reais = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

const NOMES: Record<string, string> = { EUR: 'Euro', USD: 'Dólar', GBP: 'Libra' }
const SIMBOLOS: Record<string, string> = { EUR: '💶', USD: '💵', GBP: '💷' }

export type DadosDoBoletim = {
  moeda: string
  comIOF: number // 1 da moeda, agora, com IOF
  anterior: number | null // com IOF, no último boletim
  nivel: Nivel | null
  metaBatida: number | null // a meta, se acabou de bater
}

// Texto da notificação. Ex.: "💶 Euro hoje: R$ 6,12 com IOF" / "▼ Caiu R$ 0,08 desde o último aviso. Está barato…"
export function boletim(d: DadosDoBoletim) {
  const nome = NOMES[d.moeda] ?? d.moeda
  const partes: string[] = []

  if (d.metaBatida !== null) partes.push(`🎯 Bateu sua meta de ${reais(d.metaBatida)}.`)

  if (d.anterior === null) partes.push('Primeiro boletim.')
  else {
    const diferenca = d.comIOF - d.anterior
    if (Math.abs(diferenca) < 0.005) partes.push('Igual ao último aviso.')
    else if (diferenca < 0) partes.push(`▼ Caiu ${reais(-diferenca)} desde o último aviso.`)
    else partes.push(`▲ Subiu ${reais(diferenca)} desde o último aviso.`)
  }

  if (d.nivel === 'barato') partes.push('Está barato: entre os 25% mais baixos dos últimos 90 dias. Bom momento pra comprar.')
  else if (d.nivel === 'caro') partes.push('Está caro: entre os 25% mais altos dos últimos 90 dias. Se der, espere.')
  else if (d.nivel === 'medio') partes.push('Está na média dos últimos 90 dias.')

  return {
    titulo: `${SIMBOLOS[d.moeda] ?? '💱'} ${nome} hoje: ${reais(d.comIOF)} com IOF`,
    corpo: partes.join(' '),
  }
}
