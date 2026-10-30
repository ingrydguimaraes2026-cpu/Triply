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

// Contagem e progresso (spec 049): "78% pronto" = média das partes que existem (cada parte vale igual)
export function prontidao(partes: { nome: string; feitas: number; total: number }[]): { porcento: number; faltando: string[] } | null {
  const validas = partes.filter((p) => p.total > 0)
  if (validas.length === 0) return null
  const media = validas.reduce((soma, p) => soma + Math.min(1, p.feitas / p.total), 0) / validas.length
  return { porcento: Math.round(media * 100), faltando: validas.filter((p) => p.feitas < p.total).map((p) => p.nome) }
}

// ---------- Carro e rodízio (spec 073) ----------

// Distância por estrada ≈ linha reta × 1,3 (estimativa honesta, sem API de rota)
export function kmEstimados(de: { latitude: number | null; longitude: number | null }, para: { latitude: number | null; longitude: number | null }): number | null {
  if (de.latitude === null || de.longitude === null || para.latitude === null || para.longitude === null) return null
  const rad = (g: number) => (g * Math.PI) / 180
  const a =
    Math.sin(rad(para.latitude - de.latitude) / 2) ** 2 +
    Math.cos(rad(de.latitude)) * Math.cos(rad(para.latitude)) * Math.sin(rad(para.longitude - de.longitude) / 2) ** 2
  const reta = 2 * 6371 * Math.asin(Math.sqrt(a))
  return Math.round(reta * 1.3)
}

// Combustível em CENTAVOS: km ÷ km por litro × preço do litro (centavos)
export function combustivelEstimado(km: number, kmPorLitro: number, precoDoLitro: number): number {
  return Math.round((km / kmPorLitro) * precoDoLitro)
}

// Quantos km cada um dirige (pra o rodízio ser justo)
export function rodizio(trechos: { motorista_id: string | null; km: number | null }[]): { motoristaId: string; km: number; trechos: number }[] {
  const mapa = new Map<string, { km: number; trechos: number }>()
  for (const t of trechos) {
    if (!t.motorista_id) continue
    const atual = mapa.get(t.motorista_id) ?? { km: 0, trechos: 0 }
    mapa.set(t.motorista_id, { km: atual.km + (t.km ?? 0), trechos: atual.trechos + 1 })
  }
  return [...mapa].map(([motoristaId, v]) => ({ motoristaId, ...v })).sort((a, b) => b.km - a.km)
}
