// Gestão do comboio (spec 007): papéis, remover, sair e convites. Veio da web pro app usar também.
// O cliente vem de fora (a web e o app passam o seu).
import type { ClienteTogether } from './supabase'

// O banco recusa deixar a viagem sem ADM (erro com dica TR_ULTIMO_ADM)
export class UltimoAdm extends Error {}
// Convidado (spec 018) precisa criar conta antes de virar ADM (erro TR_CONVIDADO_ADM)
export class ConvidadoNaoViraAdm extends Error {}

function erroDoComboio(error: { hint?: string; message: string }) {
  if (error.hint === 'TR_ULTIMO_ADM') return new UltimoAdm(error.message)
  if (error.hint === 'TR_CONVIDADO_ADM') return new ConvidadoNaoViraAdm(error.message)
  return error
}

export async function mudarPapelNoComboio(cli: ClienteTogether, viagemId: string, usuarioId: string, papel: 'adm' | 'membro') {
  const { error } = await cli.from('comboio_membros').update({ papel }).eq('viagem_id', viagemId).eq('usuario_id', usuarioId)
  if (error) throw erroDoComboio(error)
}

// ADM remove alguém, ou a própria pessoa sai
export async function removerDoComboio(cli: ClienteTogether, viagemId: string, usuarioId: string) {
  const { error, count } = await cli.from('comboio_membros').delete({ count: 'exact' }).eq('viagem_id', viagemId).eq('usuario_id', usuarioId)
  if (error) throw erroDoComboio(error)
  if (count === 0) throw new Error('Sem permissão pra remover essa pessoa')
}

// Quem do comboio entrou como convidado, sem conta (spec 018)
export async function buscarConvidados(cli: ClienteTogether, viagemId: string): Promise<string[]> {
  const { data, error } = await cli.rpc('convidados_da_viagem', { p_viagem: viagemId })
  if (error) throw error
  return data ?? []
}

// Convites que ainda valem (só o ADM vê). O link fica com quem chama (web e app têm endereços diferentes).
export async function buscarConvitesAtivos(cli: ClienteTogether, viagemId: string): Promise<{ codigo: string; expiraEm: string }[]> {
  const { data, error } = await cli
    .from('convites')
    .select('codigo, expira_em')
    .eq('viagem_id', viagemId)
    .gt('expira_em', new Date().toISOString())
    .order('expira_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map((c) => ({ codigo: c.codigo, expiraEm: c.expira_em }))
}

export async function cancelarConvite(cli: ClienteTogether, codigo: string) {
  const { error } = await cli.from('convites').delete().eq('codigo', codigo)
  if (error) throw error
}
