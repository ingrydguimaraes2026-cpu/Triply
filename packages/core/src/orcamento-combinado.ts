// Orçamento combinado (spec 045): cada um diz em segredo quanto topa gastar; o comboio vê só a faixa comum.
// Valores em CENTAVOS, por pessoa, na moeda principal da viagem. Puro + banco. Teste: orcamento-combinado.test.mjs
import type { ClienteTogether } from './supabase'

export type FaixaDoComboio = { responderam: number; pessoas: number; minimo: number | null; maximo: number | null }

// O que a tela diz sobre o resultado
export function leituraDaFaixa(f: FaixaDoComboio): { tipo: 'esperando' | 'comum' | 'sem_acordo'; faltam: number } {
  const faltam = Math.max(0, f.pessoas - f.responderam)
  if (f.minimo === null || f.maximo === null) return { tipo: 'esperando', faltam }
  return { tipo: f.minimo <= f.maximo ? 'comum' : 'sem_acordo', faltam }
}

export async function buscarMinhaFaixa(cli: ClienteTogether, viagemId: string): Promise<{ minimo: number; maximo: number } | null> {
  const { data, error } = await cli.from('orcamento_faixas').select('minimo, maximo').eq('viagem_id', viagemId).maybeSingle()
  if (error) throw error
  return data ? { minimo: Math.round(Number(data.minimo) * 100), maximo: Math.round(Number(data.maximo) * 100) } : null
}

export async function salvarMinhaFaixa(cli: ClienteTogether, viagemId: string, meuId: string, minimo: number, maximo: number) {
  const { error } = await cli
    .from('orcamento_faixas')
    .upsert({ viagem_id: viagemId, usuario_id: meuId, minimo: minimo / 100, maximo: maximo / 100, atualizado_em: new Date().toISOString() })
  if (error) throw error
}

export async function buscarFaixaDoComboio(cli: ClienteTogether, viagemId: string): Promise<FaixaDoComboio> {
  const { data, error } = await cli.rpc('faixa_do_comboio', { p_viagem: viagemId })
  if (error) throw error
  const r = data?.[0]
  return {
    responderam: r?.responderam ?? 0,
    pessoas: r?.pessoas ?? 0,
    minimo: r?.minimo == null ? null : Math.round(Number(r.minimo) * 100),
    maximo: r?.maximo == null ? null : Math.round(Number(r.maximo) * 100),
  }
}
