// Quando avisar (spec 013). Puro: roda no servidor (Deno) e nos testes (Node).

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

const reais = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

// Texto da notificação
export function mensagem(moeda: string, comIOF: number, meta: number, nomeDaViagem: string) {
  const simbolo = moeda === 'EUR' ? '💶' : moeda === 'USD' ? '💵' : moeda === 'GBP' ? '💷' : '💱'
  return {
    titulo: `${simbolo} ${moeda} bateu sua meta`,
    corpo: `1 ${moeda} está saindo ${reais(comIOF)} com IOF (sua meta: ${reais(meta)}). Bom momento pra comprar pra ${nomeDaViagem}.`,
  }
}
