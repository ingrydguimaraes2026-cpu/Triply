import { supabase } from '../../lib/supabase'
import { comprimirFoto } from '../fotos/comprimir'

export type MeuPerfil = { id: string; nome: string; avatarUrl: string | null; email: string | null }

export async function buscarMeuPerfil(): Promise<MeuPerfil | null> {
  const { data: sessao } = await supabase.auth.getUser()
  const usuario = sessao.user
  if (!usuario) return null
  const { data, error } = await supabase.from('perfis').select('id, nome, avatar_url').eq('id', usuario.id).maybeSingle()
  if (error) throw error
  return { id: usuario.id, nome: data?.nome ?? '', avatarUrl: data?.avatar_url ?? null, email: usuario.email ?? null }
}

export async function salvarNome(id: string, nome: string) {
  const { error } = await supabase.from('perfis').update({ nome: nome.trim() }).eq('id', id)
  if (error) throw error
}

const BUCKET = 'avatares'

// Comprime, envia pra avatares/<meu id>/, troca no perfil e apaga a foto antiga
export async function trocarFoto(id: string, arquivo: File): Promise<string> {
  const foto = await comprimirFoto(arquivo, { ladoMaximo: 400, tamanhoMaximo: 500 * 1024 })
  const caminho = `${id}/${crypto.randomUUID()}.${foto.type === 'image/webp' ? 'webp' : 'jpg'}`
  const { error: erroEnvio } = await supabase.storage.from(BUCKET).upload(caminho, foto, { contentType: foto.type })
  if (erroEnvio) throw erroEnvio
  const url = supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl

  const { error } = await supabase.from('perfis').update({ avatar_url: url }).eq('id', id)
  if (error) {
    await supabase.storage.from(BUCKET).remove([caminho])
    throw error
  }

  // Limpa as fotos antigas (não é grave se falhar)
  const { data: antigas } = await supabase.storage.from(BUCKET).list(id)
  const sobrando = (antigas ?? []).map((f) => `${id}/${f.name}`).filter((c) => c !== caminho)
  if (sobrando.length) await supabase.storage.from(BUCKET).remove(sobrando)
  return url
}

// Volta pra sem foto (as iniciais aparecem no lugar)
export async function tirarFoto(id: string) {
  const { error } = await supabase.from('perfis').update({ avatar_url: null }).eq('id', id)
  if (error) throw error
  const { data: antigas } = await supabase.storage.from(BUCKET).list(id)
  if (antigas?.length) await supabase.storage.from(BUCKET).remove(antigas.map((f) => `${id}/${f.name}`))
}
