// Feed de fotos (spec 014): posts com 1 a 10 fotos, curtidas e comentários.
import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'

export const MAX_FOTOS_POR_POST = 10
const BUCKET = 'fotos'

export type FotoDoPost = { id: string; caminho: string; url: string | null }
export type Comentario = Tables<'comentarios'>
export type Post = Tables<'posts'> & { fotos: FotoDoPost[]; curtidas: string[]; comentarios: Comentario[] }

type PostDoBanco = Tables<'posts'> & {
  fotos: { id: string; caminho: string; ordem: number }[]
  curtidas: { usuario_id: string }[]
  comentarios: Comentario[]
}

// Posts da viagem (mais novos primeiro), com link temporário de 1 hora pra cada foto (o bucket é privado)
export async function buscarPosts(viagemId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, fotos(id, caminho, ordem), curtidas(usuario_id), comentarios(*)')
    .eq('viagem_id', viagemId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  // Post ainda sendo enviado (sem foto) não aparece
  const posts = (data as unknown as PostDoBanco[]).filter((p) => p.fotos.length > 0)

  const caminhos = posts.flatMap((p) => p.fotos.map((f) => f.caminho))
  const links = new Map<string, string>()
  for (let i = 0; i < caminhos.length; i += 100) {
    const { data: lote, error: erroLinks } = await supabase.storage.from(BUCKET).createSignedUrls(caminhos.slice(i, i + 100), 60 * 60)
    if (erroLinks) throw erroLinks
    for (const l of lote) if (l.path && l.signedUrl) links.set(l.path, l.signedUrl)
  }

  return posts.map(({ fotos, curtidas, comentarios, ...post }) => ({
    ...post,
    fotos: [...fotos].sort((a, b) => a.ordem - b.ordem).map((f) => ({ id: f.id, caminho: f.caminho, url: links.get(f.caminho) ?? null })),
    curtidas: curtidas.map((c) => c.usuario_id),
    comentarios: [...comentarios].sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
  }))
}

// Cria o post, envia as fotos (já comprimidas) e grava. Se algo falhar no meio, desfaz tudo (não sobra arquivo perdido).
export async function criarPost(
  viagemId: string,
  destinoId: string | null,
  legenda: string,
  fotos: Blob[],
  aoEnviar?: (quantas: number) => void,
) {
  const { data: post, error } = await supabase
    .from('posts')
    .insert({ viagem_id: viagemId, destino_id: destinoId, legenda: legenda.trim() || null })
    .select('id')
    .single()
  if (error) throw error

  const enviados: string[] = []
  try {
    for (const foto of fotos) {
      const extensao = foto.type === 'image/webp' ? 'webp' : 'jpg'
      const caminho = `${viagemId}/${post.id}/${crypto.randomUUID()}.${extensao}`
      const { error: erroEnvio } = await supabase.storage.from(BUCKET).upload(caminho, foto, { contentType: foto.type })
      if (erroEnvio) throw erroEnvio
      enviados.push(caminho)
      aoEnviar?.(enviados.length)
    }
    const { error: erroFotos } = await supabase
      .from('fotos')
      .insert(enviados.map((caminho, ordem) => ({ viagem_id: viagemId, destino_id: destinoId, post_id: post.id, caminho, ordem })))
    if (erroFotos) throw erroFotos
  } catch (erro) {
    if (enviados.length) await supabase.storage.from(BUCKET).remove(enviados)
    await supabase.from('posts').delete().eq('id', post.id)
    throw erro
  }
  return post.id
}

// Primeiro os arquivos, depois o post (as fotos, curtidas e comentários saem junto)
export async function apagarPost(post: Post) {
  const { error: erroArquivos } = await supabase.storage.from(BUCKET).remove(post.fotos.map((f) => f.caminho))
  if (erroArquivos) throw erroArquivos
  const { error } = await supabase.from('posts').delete().eq('id', post.id)
  if (error) throw new Error('As fotos foram apagadas, mas o post não. Atualize a página e tente de novo.')
}

export async function curtir(postId: string) {
  const { error } = await supabase.from('curtidas').insert({ post_id: postId })
  // Já curtido (toque duplo repetido): tudo bem
  if (error && error.code !== '23505') throw error
}

export async function descurtir(postId: string, meuId: string) {
  const { error } = await supabase.from('curtidas').delete().eq('post_id', postId).eq('usuario_id', meuId)
  if (error) throw error
}

export async function comentar(postId: string, texto: string): Promise<Comentario> {
  const { data, error } = await supabase.from('comentarios').insert({ post_id: postId, texto: texto.trim() }).select('*').single()
  if (error) throw error
  return data
}

export async function apagarComentario(id: string) {
  const { error } = await supabase.from('comentarios').delete().eq('id', id)
  if (error) throw error
}

// Avisa o comboio no celular (função avisos-feed). Se falhar, o post/comentário continua: só não chega o aviso.
export function avisarComboio(corpo: { post_id: string } | { comentario_id: string }) {
  supabase.functions
    .invoke('avisos-feed', { body: corpo })
    .then(({ error }) => error && console.error('Aviso do feed não foi:', error))
    .catch((e) => console.error('Aviso do feed não foi:', e))
}
