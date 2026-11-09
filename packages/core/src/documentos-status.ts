// Marcações do checklist de documentos (spec 010): "resolvido" ou "não preciso", por pessoa.
// Veio da web pro core (o app usa também). O cliente vem de fora.
import type { ClienteTogether } from './supabase'
import type { Status } from './documentos.ts'

export type StatusDoComboio = { usuario_id: string; item: string; status: Status }

// Status de todo mundo do comboio nesta viagem
export async function buscarStatusDosDocumentos(cli: ClienteTogether, viagemId: string): Promise<StatusDoComboio[]> {
  const { data, error } = await cli.from('documentos_status').select('usuario_id, item, status').eq('viagem_id', viagemId)
  if (error) throw error
  return (data ?? []) as StatusDoComboio[]
}

// Marca o MEU status num item. Desmarcar = voltar pra 'pendente'.
export async function marcarStatusDoDocumento(cli: ClienteTogether, viagemId: string, meuId: string, item: string, status: Status) {
  const { error } = await cli
    .from('documentos_status')
    .upsert({ viagem_id: viagemId, usuario_id: meuId, item, status, atualizado_em: new Date().toISOString() }, { onConflict: 'viagem_id,usuario_id,item' })
  if (error) throw error
}
