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

// Entra no comboio usando o código do link. Devolve o id da viagem.
export async function aceitarConvite(codigo: string) {
  const { data, error } = await supabase.rpc('aceitar_convite', { p_codigo: codigo })
  if (error) throw error
  return data
}

// ---------- Gestão do comboio (spec 007) ----------

// O banco recusa deixar a viagem sem ADM (erro com dica TR_ULTIMO_ADM)
export class UltimoAdm extends Error {}

function erroDoComboio(error: { hint?: string; message: string }) {
  return error.hint === 'TR_ULTIMO_ADM' ? new UltimoAdm(error.message) : error
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