import { supabase } from './supabase'
import { novoId } from './id'

// Guarda um arquivo no cofre da viagem (spec 028), amarrado ao trajeto, à casa ou ao item da agenda
// (spec 120b: a reserva lida vai junto do que ela virou). Se a gravação falhar, apaga o arquivo enviado.
const EXTENSAO: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const TIPOS_DO_COFRE = Object.keys(EXTENSAO)

export async function guardarNoCofre(
  viagemId: string,
  arquivo: { bytes: Uint8Array; tipo: string; nome: string },
  ligacao: { trajeto_id?: string; hospedagem_id?: string; evento_id?: string },
): Promise<void> {
  const caminho = `${viagemId}/${novoId()}.${EXTENSAO[arquivo.tipo] ?? 'bin'}`
  const { error: erroEnvio } = await supabase.storage.from('cofre').upload(caminho, arquivo.bytes, { contentType: arquivo.tipo })
  if (erroEnvio) throw erroEnvio
  const nome = (arquivo.nome.replace(/\.[a-z0-9]{2,5}$/i, '').trim() || 'Reserva').slice(0, 120)
  const { error } = await supabase
    .from('arquivos_viagem')
    .insert({ viagem_id: viagemId, ...ligacao, nome, caminho, tipo: arquivo.tipo, tamanho: arquivo.bytes.length })
  if (error) {
    await supabase.storage.from('cofre').remove([caminho])
    throw error
  }
}
