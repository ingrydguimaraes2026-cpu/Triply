// Posts do feed de fotos (spec 014), com curtidas, comentários e quem foi marcado.
// Veio da web (features/feed/api.ts) pro core: o app usa no Livro e na Retrospectiva.
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type FotoDoPost = { id: string; caminho: string; url: string | null; latitude?: number | null; longitude?: number | null }
export type ComentarioDoPost = Tables<'comentarios'>
export type PostDaViagem = Tables<'posts'> & { fotos: FotoDoPost[]; curtidas: string[]; comentarios: ComentarioDoPost[]; marcados: string[] }

type PostDoBanco = Tables<'posts'> & {
  fotos: { id: string; caminho: string; ordem: number; latitude: number | null; longitude: number | null }[]
  curtidas: { usuario_id: string }[]
  comentarios: ComentarioDoPost[]
  post_marcacoes?: { usuario_id: string }[] // spec 100
}

// Posts da viagem (mais novos primeiro), com link temporário de 1 hora pra cada foto (o bucket é privado)
export async function buscarPostsDaViagem(cli: ClienteTogether, viagemId: string): Promise<PostDaViagem[]> {
  const { data, error } = await cli
    .from('posts')
    .select('*, fotos(id, caminho, ordem, latitude, longitude), curtidas(usuario_id), comentarios(*), post_marcacoes(usuario_id)')
    .eq('viagem_id', viagemId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  // Post ainda sendo enviado (sem foto) não aparece
  const posts = (data as unknown as PostDoBanco[]).filter((p) => p.fotos.length > 0)

  const caminhos = posts.flatMap((p) => p.fotos.map((f) => f.caminho))
  const links = new Map<string, string>()
  for (let i = 0; i < caminhos.length; i += 100) {
    const { data: lote, error: erroLinks } = await cli.storage.from('fotos').createSignedUrls(caminhos.slice(i, i + 100), 60 * 60)
    if (erroLinks) throw erroLinks
    for (const l of lote) if (l.path && l.signedUrl) links.set(l.path, l.signedUrl)
  }

  return posts.map(({ fotos, curtidas, comentarios, post_marcacoes, ...post }) => ({
    ...post,
    marcados: (post_marcacoes ?? []).map((m) => m.usuario_id),
    fotos: [...fotos]
      .sort((a, b) => a.ordem - b.ordem)
      .map((f) => ({ id: f.id, caminho: f.caminho, url: links.get(f.caminho) ?? null, latitude: f.latitude, longitude: f.longitude })),
    curtidas: curtidas.map((c) => c.usuario_id),
    comentarios: [...comentarios].sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
  }))
}
