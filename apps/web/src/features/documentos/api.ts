import { supabase } from '../../lib/supabase'
import type { Status } from './checklist'

export type StatusDoComboio = { usuario_id: string; item: string; status: Status }

// Status de todo mundo do comboio nesta viagem (spec 010)
export async function buscarStatus(viagemId: string): Promise<StatusDoComboio[]> {
  const { data, error } = await supabase
    .from('documentos_status')
    .select('usuario_id, item, status')
    .eq('viagem_id', viagemId)
  if (error) throw error
  return (data ?? []) as StatusDoComboio[]
}

// Marca o MEU status num item. Desmarcar = voltar pra 'pendente'.
export async function marcarStatus(viagemId: string, meuId: string, item: string, status: Status) {
  const { error } = await supabase
    .from('documentos_status')
    .upsert(
      { viagem_id: viagemId, usuario_id: meuId, item, status, atualizado_em: new Date().toISOString() },
      { onConflict: 'viagem_id,usuario_id,item' },
    )
  if (error) throw error
}
