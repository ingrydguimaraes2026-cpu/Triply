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
