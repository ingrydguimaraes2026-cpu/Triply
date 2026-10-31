import { buscarStatusDosDocumentos, marcarStatusDoDocumento, type StatusDoComboio } from '@together/core'
import { supabase } from '../../lib/supabase'
import type { Status } from './checklist'

export type { StatusDoComboio }

// Status de todo mundo do comboio nesta viagem (spec 010). A consulta mora no core.
export function buscarStatus(viagemId: string) {
  return buscarStatusDosDocumentos(supabase, viagemId)
}

// Marca o MEU status num item. Desmarcar = voltar pra 'pendente'.
export function marcarStatus(viagemId: string, meuId: string, item: string, status: Status) {
  return marcarStatusDoDocumento(supabase, viagemId, meuId, item, status)
}
