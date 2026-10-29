import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'

// Fotos soltas, mais novas primeiro (cartão da Overview). O feed com posts fica em src/features/feed (spec 014).
export type Foto = Tables<'fotos'> & { url: string | null }

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

// Apaga todos os arquivos de fotos de uma viagem (antes de apagar a viagem, spec 008).
// Os posts guardam as fotos em subpastas (<viagem>/<post>/<arquivo>, spec 014): entra em cada uma.
export async function apagarArquivosDaViagem(viagemId: string) {
  const pastas = [viagemId]
  while (pastas.length > 0) {
    const pasta = pastas.pop()!
    for (;;) {
      const { data, error } = await supabase.storage.from(BUCKET).list(pasta, { limit: 100 })
      if (error) throw error
      const arquivos = data.filter((item) => item.id !== null).map((item) => `${pasta}/${item.name}`)
      const subpastas = data.filter((item) => item.id === null).map((item) => `${pasta}/${item.name}`)
      for (const p of subpastas) if (!pastas.includes(p)) pastas.push(p)
      if (arquivos.length === 0) break
      const { error: erroRemover } = await supabase.storage.from(BUCKET).remove(arquivos)
      if (erroRemover) throw erroRemover
    }
  }
}
