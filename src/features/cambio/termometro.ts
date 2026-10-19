// Termômetro do câmbio: o euro (ou outra moeda) está barato ou caro agora? Funções puras, testadas em tests/termometro.test.mjs.
// "Barato" e "caro" são em relação aos últimos 90 dias: não é previsão, é comparação com o passado recente.

export type Ponto = { data: string; valor: number } // valor = quantos reais vale 1 da moeda

// IOF em 2026 pra comprar moeda pra gastar (conta global, cartão internacional): 3,5%.
// Investimento (ex.: Wise com Rende+) paga 1,1%, mas não é o caso de viagem.
export const IOF_GASTOS = 0.035

export type Nivel = 'barato' | 'medio' | 'caro'

// Fração dos valores da série que estão abaixo de `valor` (0 = o menor de todos, 1 = o maior)
export function percentil(valores: number[], valor: number) {
  if (valores.length === 0) return 0.5
  const abaixo = valores.filter((v) => v < valor).length
  const iguais = valores.filter((v) => v === valor).length
  return (abaixo + iguais / 2) / valores.length
}

// Últimos `dias` dias corridos da série, contando a partir de `hoje` ("2026-10-18")
export function ultimosDias(serie: Ponto[], dias: number, hoje: string) {
  const [a, m, d] = hoje.split('-').map(Number)
  const corte = new Date(Date.UTC(a, m - 1, d - dias)).toISOString().slice(0, 10)
  return serie.filter((p) => p.data > corte && p.data <= hoje)
}

const media = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length

/**
 * Compara a cotação de agora com os últimos 90 dias.
 * - barato: entre os 25% menores valores dos 90 dias
 * - caro: entre os 25% maiores
 * Série vazia → null.
 */
export function analisar(serie: Ponto[], agora: number, hoje: string) {
  const d90 = ultimosDias(serie, 90, hoje).map((p) => p.valor)
  if (d90.length === 0) return null
  const d30 = ultimosDias(serie, 30, hoje)
  const p = percentil(d90, agora)
  const nivel: Nivel = p <= 0.25 ? 'barato' : p >= 0.75 ? 'caro' : 'medio'
  const media90 = media(d90)
  const ano = ultimosDias(serie, 365, hoje).map((x) => x.valor)
  return {
    nivel,
    percentil: p,
    media90,
    min90: Math.min(...d90),
    max90: Math.max(...d90),
    // Agora × média dos 90 dias, em % (negativo = mais barato que a média)
    vsMedia: ((agora - media90) / media90) * 100,
    // Agora × 30 dias atrás
    em30dias: d30.length ? ((agora - d30[0].valor) / d30[0].valor) * 100 : null,
    minAno: ano.length ? Math.min(...ano) : null,
    maxAno: ano.length ? Math.max(...ano) : null,
  }
}

// Quanto sai 1 da moeda no app (Wise, Nomad...) somando o IOF: o piso, sem a taxa do app
export function comIOF(comercial: number, iof = IOF_GASTOS) {
  return comercial * (1 + iof)
}

// Cotação que a pessoa viu no app × comercial: quanto o app cobra por cima (já tirando o IOF), em %
export function taxaDoApp(vista: number, comercial: number, iof = IOF_GASTOS) {
  return (vista / comIOF(comercial, iof) - 1) * 100
}

// Quantos reais (centavos) custam `centavosMoeda` da moeda na cotação `cotacao`
export function custoEmReais(centavosMoeda: number, cotacao: number) {
  return Math.round(centavosMoeda * cotacao)
}

// Meta: "quero comprar abaixo de R$ X". true quando a cotação com IOF chegou lá.
export function bateuMeta(meta: number | null, comercial: number, iof = IOF_GASTOS) {
  return meta !== null && meta > 0 && comIOF(comercial, iof) <= meta
}

// Pontos do gráfico (SVG): x de 0 a largura, y de 0 (topo, maior valor) a altura
export function pontosDoGrafico(serie: Ponto[], largura: number, altura: number) {
  if (serie.length < 2) return []
  const valores = serie.map((p) => p.valor)
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const faixa = max - min || 1
  return serie.map((p, i) => ({
    x: (i / (serie.length - 1)) * largura,
    y: altura - ((p.valor - min) / faixa) * altura,
    ...p,
  }))
}
