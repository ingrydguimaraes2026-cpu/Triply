import type { ClienteTogether } from './supabase'

// Consultas ao banco compartilhadas. Recebem o client (cada plataforma passa o seu),
// então web e mobile leem os mesmos dados do mesmo jeito. O RLS do banco já filtra:
// a pessoa só enxerga as viagens do próprio comboio.

export type ViagemResumo = {
  id: string
  nome: string
  moeda: string
  dataInicio: string | null
  dataFim: string | null
}

// Todas as viagens da pessoa, mais recente primeiro.
export async function listarMinhasViagens(cli: ClienteTogether): Promise<ViagemResumo[]> {
  const { data, error } = await cli
    .from('viagens')
    .select('id, nome, moeda_principal, data_inicio, data_fim, criado_em')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map((v) => ({
    id: v.id,
    nome: v.nome,
    moeda: v.moeda_principal,
    dataInicio: v.data_inicio,
    dataFim: v.data_fim,
  }))
}

// Quantas pessoas estão no comboio desta viagem.
export async function contarMembros(cli: ClienteTogether, viagemId: string): Promise<number> {
  const { count, error } = await cli
    .from('comboio_membros')
    .select('*', { count: 'exact', head: true })
    .eq('viagem_id', viagemId)
  if (error) throw error
  return count ?? 0
}

// Meu saldo em euro nesta viagem (carteira do spec 015). 0 se ainda não tenho carteira.
export async function saldoDaCarteira(cli: ClienteTogether, viagemId: string, usuarioId: string): Promise<number> {
  const { data, error } = await cli
    .from('carteiras_com_saldo')
    .select('saldo_atual')
    .eq('viagem_id', viagemId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw error
  return data?.saldo_atual == null ? 0 : Number(data.saldo_atual)
}

// Soma do euro de todo o comboio (função do banco que confere se sou do comboio).
export async function saldoEuroDoComboio(cli: ClienteTogether, viagemId: string): Promise<number> {
  const { data, error } = await cli.rpc('saldo_euro_do_comboio', { p_viagem_id: viagemId })
  if (error) throw error
  return Number(data ?? 0)
}
