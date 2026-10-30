// Pagamentos previstos (spec 057): sinal/saldo de reserva, diárias repetidas. Ficam fora dos acertos
// até virarem gasto. Valores em CENTAVOS. Teste: apps/web/tests/previstos.test.mjs
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type PagamentoPrevisto = Omit<Tables<'pagamentos_previstos'>, 'valor'> & { valor: number }
export type NovoPrevisto = { descricao: string; valor: number; moeda: string; categoria: string; venceEm: string | null; quemPaga: string | null }

// "Repetir todo dia" de uma data a outra (no máximo 60): uma linha por dia, com "(1/5)" na descrição
export function repetirPorDia(base: NovoPrevisto, de: string, ate: string): NovoPrevisto[] {
  const dias: string[] = []
  const d = new Date(`${de}T12:00:00Z`)
  while (dias.length < 60) {
    const dia = d.toISOString().slice(0, 10)
    if (dia > ate) break
    dias.push(dia)
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return dias.map((dia, i) => ({ ...base, venceEm: dia, descricao: `${base.descricao} (${i + 1}/${dias.length})`.slice(0, 200) }))
}

export function situacaoDoPrevisto(p: Pick<PagamentoPrevisto, 'vence_em' | 'pago_em'>, hoje: string): 'pago' | 'atrasado' | 'hoje' | 'em_breve' | 'depois' {
  if (p.pago_em) return 'pago'
  if (!p.vence_em) return 'depois'
  if (p.vence_em < hoje) return 'atrasado'
  if (p.vence_em === hoje) return 'hoje'
  const um = Date.UTC(+p.vence_em.slice(0, 4), +p.vence_em.slice(5, 7) - 1, +p.vence_em.slice(8, 10))
  const dois = Date.UTC(+hoje.slice(0, 4), +hoje.slice(5, 7) - 1, +hoje.slice(8, 10))
  return (um - dois) / 86400000 <= 7 ? 'em_breve' : 'depois'
}

// Quanto falta pagar, por moeda
export function totalAPagar(previstos: Pick<PagamentoPrevisto, 'valor' | 'moeda' | 'pago_em'>[]): Record<string, number> {
  const total: Record<string, number> = {}
  for (const p of previstos) if (!p.pago_em) total[p.moeda] = (total[p.moeda] ?? 0) + p.valor
  return total
}

export async function buscarPrevistos(cli: ClienteTogether, viagemId: string): Promise<PagamentoPrevisto[]> {
  const { data, error } = await cli.from('pagamentos_previstos').select('*').eq('viagem_id', viagemId).order('vence_em', { nullsFirst: false })
  if (error) throw error
  return (data ?? []).map((p) => ({ ...p, valor: Math.round(Number(p.valor) * 100) }))
}

export async function criarPrevistos(cli: ClienteTogether, viagemId: string, novos: NovoPrevisto[]) {
  const { error } = await cli.from('pagamentos_previstos').insert(
    novos.map((n) => ({
      viagem_id: viagemId,
      descricao: n.descricao.trim(),
      valor: n.valor / 100,
      moeda: n.moeda,
      categoria: n.categoria,
      vence_em: n.venceEm,
      quem_paga: n.quemPaga,
    })),
  )
  if (error) throw error
}

export async function marcarPrevistoPago(cli: ClienteTogether, id: string, pago: boolean) {
  const { error } = await cli.from('pagamentos_previstos').update({ pago_em: pago ? new Date().toISOString() : null }).eq('id', id)
  if (error) throw error
}

export async function apagarPrevisto(cli: ClienteTogether, id: string) {
  const { error } = await cli.from('pagamentos_previstos').delete().eq('id', id)
  if (error) throw error
}
