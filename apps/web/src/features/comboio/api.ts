import { supabase } from '../../lib/supabase'

// Gera um link de convite (vale 7 dias) pra alguém entrar no comboio
export async function criarConvite(viagemId: string) {
  const { data, error } = await supabase
    .from('convites')
    .insert({ viagem_id: viagemId })
    .select('codigo')
    .single()
  if (error) throw error
  return `${window.location.origin}/convite/${data.codigo}`
}

// Quem do comboio entrou como convidado, sem conta (spec 018)
export async function buscarConvidados(viagemId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('convidados_da_viagem', { p_viagem: viagemId })
  if (error) throw error
  return data ?? []
}

// ---------- Gestão do comboio (spec 007) ----------

// O banco recusa deixar a viagem sem ADM (erro com dica TR_ULTIMO_ADM)
export class UltimoAdm extends Error {}
// Convidado (spec 018) precisa criar conta antes de virar ADM (erro TR_CONVIDADO_ADM)
export class ConvidadoNaoViraAdm extends Error {}

function erroDoComboio(error: { hint?: string; message: string }) {
  if (error.hint === 'TR_ULTIMO_ADM') return new UltimoAdm(error.message)
  if (error.hint === 'TR_CONVIDADO_ADM') return new ConvidadoNaoViraAdm(error.message)
  return error
}

export async function mudarPapel(viagemId: string, usuarioId: string, papel: 'adm' | 'membro') {
  const { error } = await supabase.from('comboio_membros').update({ papel }).eq('viagem_id', viagemId).eq('usuario_id', usuarioId)
  if (error) throw erroDoComboio(error)
}

// ADM remove alguém, ou a própria pessoa sai
export async function removerDoComboio(viagemId: string, usuarioId: string) {
  const { error, count } = await supabase
    .from('comboio_membros')
    .delete({ count: 'exact' })
    .eq('viagem_id', viagemId)
    .eq('usuario_id', usuarioId)
  if (error) throw erroDoComboio(error)
  if (count === 0) throw new Error('Sem permissão pra remover essa pessoa')
}

export type Convite = { codigo: string; expiraEm: string; link: string }

// Convites que ainda valem (só o ADM vê)
export async function buscarConvites(viagemId: string): Promise<Convite[]> {
  const { data, error } = await supabase
    .from('convites')
    .select('codigo, expira_em')
    .eq('viagem_id', viagemId)
    .gt('expira_em', new Date().toISOString())
    .order('expira_em', { ascending: false })
  if (error) throw error
  return data.map((c) => ({ codigo: c.codigo, expiraEm: c.expira_em, link: `${window.location.origin}/convite/${c.codigo}` }))
}

export async function cancelarConvite(codigo: string) {
  const { error } = await supabase.from('convites').delete().eq('codigo', codigo)
  if (error) throw error
}