import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'

export type Foto = Tables<'fotos'> & { url: string | null }

export const LIMITE_POR_DESTINO = 5
const BUCKET = 'fotos'

// Fotos da viagem (mais novas primeiro) com um link temporário de 1 hora pra cada (bucket privado)
export async function buscarFotos(viagemId: string, limite?: number): Promise<Foto[]> {
  let consulta = supabase.from('fotos').select('*').eq('viagem_id', viagemId).order('criado_em', { ascending: false })
  if (limite) consulta = consulta.limit(limite)
  const { data, error } = await consulta
  if (error) throw error
  if (data.length === 0) return []
  const { data: links, error: erroLinks } = await supabase.storage.from(BUCKET).createSignedUrls(
    data.map((f) => f.caminho),
    60 * 60,
  )
  if (erroLinks) throw erroLinks
  const porCaminho = new Map(links.map((l) => [l.path, l.signedUrl]))
  return data.map((f) => ({ ...f, url: porCaminho.get(f.caminho) ?? null }))
}

export class LimiteDeFotos extends Error {}

// Envia o arquivo pro Storage e depois grava o registro. Se o registro falhar, apaga o arquivo (não sobra lixo).
export async function enviarFoto(viagemId: string, destinoId: string, legenda: string, arquivo: Blob) {
  const extensao = arquivo.type === 'image/webp' ? 'webp' : 'jpg'
  const caminho = `${viagemId}/${crypto.randomUUID()}.${extensao}`
  const { error: erroEnvio } = await supabase.storage.from(BUCKET).upload(caminho, arquivo, { contentType: arquivo.type })
  if (erroEnvio) throw erroEnvio

  const { error } = await supabase.from('fotos').insert({ viagem_id: viagemId, destino_id: destinoId, caminho, legenda: legenda.trim() || null })
  if (error) {
    await supabase.storage.from(BUCKET).remove([caminho])
    if (error.hint === 'TR_LIMITE_FOTOS') throw new LimiteDeFotos(error.message)
    throw error
  }
}

// Primeiro o arquivo, depois o registro (spec 005)
export async function apagarFoto(foto: Tables<'fotos'>) {
  const { error: erroArquivo } = await supabase.storage.from(BUCKET).remove([foto.caminho])
  if (erroArquivo) throw erroArquivo
  const { error } = await supabase.from('fotos').delete().eq('id', foto.id)
  if (error) throw new Error('O arquivo foi apagado, mas o registro da foto não. Atualize a página e tente de novo.')
}

// Apaga todos os arquivos de fotos de uma viagem (antes de apagar a viagem, spec 008)
export async function apagarArquivosDaViagem(viagemId: string) {
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(viagemId, { limit: 100 })
    if (error) throw error
    if (data.length === 0) return
    const { error: erroRemover } = await supabase.storage.from(BUCKET).remove(data.map((f) => `${viagemId}/${f.name}`))
    if (erroRemover) throw erroRemover
  }
}
