// Cofre da viagem (spec 028): reservas, ingressos e PDFs num lugar só.
// O bilhete de um trajeto é um arquivo do cofre com `trajeto_id`.
import { supabase } from '../../lib/supabase'
import type { Tables } from '@together/core'

const BUCKET = 'cofre'
export const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10 MB
export const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
export const ACEITAR_NO_SELETOR = '.pdf,image/jpeg,image/png,image/webp'

// `url`: link temporário (o bucket é privado). Null se não deu pra gerar.
export type Arquivo = Tables<'arquivos_viagem'> & { url: string | null }

// Antes de enviar: o banco também confere, mas aqui a mensagem é mais clara
export function problemaDoArquivo(arquivo: File): string | null {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) return 'Só dá pra guardar PDF ou imagem (JPG, PNG, WebP).'
  if (arquivo.size > TAMANHO_MAXIMO) return 'Arquivo muito grande: o limite é 10 MB.'
  return null
}

// "Reserva-trem.pdf" → "Reserva-trem": o nome que aparece na lista
export function nomeSemExtensao(nomeDoArquivo: string): string {
  const nome = nomeDoArquivo.replace(/\.[a-z0-9]{2,5}$/i, '').trim()
  return (nome || 'Arquivo').slice(0, 120)
}

// "1,2 MB", "340 KB"
export function textoDoTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Arquivos da viagem, mais novos primeiro, já com o link pra abrir (vale 1 hora)
export async function buscarArquivos(viagemId: string): Promise<Arquivo[]> {
  const { data, error } = await supabase
    .from('arquivos_viagem')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  if (!data?.length) return []
  const { data: links, error: erroLinks } = await supabase.storage.from(BUCKET).createSignedUrls(
    data.map((a) => a.caminho),
    60 * 60,
  )
  if (erroLinks) console.error('Erro ao gerar os links do cofre:', erroLinks)
  const linkPorCaminho = new Map((links ?? []).map((l) => [l.path, l.signedUrl]))
  return data.map((a) => ({ ...a, url: linkPorCaminho.get(a.caminho) ?? null }))
}

// Envia o arquivo e grava na tabela. Se a gravação falhar, apaga o arquivo enviado (não sobra lixo).
export async function enviarArquivo(viagemId: string, arquivo: File, trajetoId: string | null = null) {
  const extensao = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[arquivo.type] ?? 'bin'
  const caminho = `${viagemId}/${crypto.randomUUID()}.${extensao}`
  const { error: erroEnvio } = await supabase.storage.from(BUCKET).upload(caminho, arquivo, { contentType: arquivo.type })
  if (erroEnvio) throw erroEnvio
  const { data, error } = await supabase
    .from('arquivos_viagem')
    .insert({
      viagem_id: viagemId,
      trajeto_id: trajetoId,
      nome: nomeSemExtensao(arquivo.name),
      caminho,
      tipo: arquivo.type,
      tamanho: arquivo.size,
    })
    .select('id')
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([caminho])
    throw error
  }
  return data.id
}

// Primeiro a linha (é ela que diz quem pode), depois o arquivo
export async function apagarArquivo(arquivo: Arquivo) {
  const { error, count } = await supabase.from('arquivos_viagem').delete({ count: 'exact' }).eq('id', arquivo.id)
  if (error) throw error
  if (count === 0) throw new Error('Só quem enviou ou o ADM pode apagar este arquivo.')
  const { error: erroArquivo } = await supabase.storage.from(BUCKET).remove([arquivo.caminho])
  if (erroArquivo) console.error('O registro saiu, mas o arquivo ficou no storage:', erroArquivo)
}

// Antes de apagar a viagem: o banco apaga as linhas sozinho, mas não os arquivos do storage
export async function apagarArquivosDoCofre(viagemId: string) {
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(viagemId, { limit: 100 })
    if (error) throw error
    const arquivos = data.filter((item) => item.id !== null).map((item) => `${viagemId}/${item.name}`)
    if (arquivos.length === 0) break
    const { error: erroRemover } = await supabase.storage.from(BUCKET).remove(arquivos)
    if (erroRemover) throw erroRemover
  }
}
