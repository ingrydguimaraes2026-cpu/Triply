import {
  buscarConvidados as buscarConvidadosDoCore,
  buscarConvitesAtivos,
  cancelarConvite as cancelarConviteNoCore,
  mudarPapelNoComboio,
  removerDoComboio as removerDoComboioNoCore,
} from '@together/core'
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

// ---------- Gestão do comboio (spec 007) ----------
// Mora no @together/core (o app usa também); aqui só passa o cliente da web.
export { UltimoAdm, ConvidadoNaoViraAdm } from '@together/core'

export const buscarConvidados = (viagemId: string) => buscarConvidadosDoCore(supabase, viagemId)
export const mudarPapel = (viagemId: string, usuarioId: string, papel: 'adm' | 'membro') => mudarPapelNoComboio(supabase, viagemId, usuarioId, papel)
export const removerDoComboio = (viagemId: string, usuarioId: string) => removerDoComboioNoCore(supabase, viagemId, usuarioId)
export const cancelarConvite = (codigo: string) => cancelarConviteNoCore(supabase, codigo)

export type Convite = { codigo: string; expiraEm: string; link: string }

// Convites que ainda valem (só o ADM vê)
export async function buscarConvites(viagemId: string): Promise<Convite[]> {
  const convites = await buscarConvitesAtivos(supabase, viagemId)
  return convites.map((c) => ({ ...c, link: `${window.location.origin}/convite/${c.codigo}` }))
}
