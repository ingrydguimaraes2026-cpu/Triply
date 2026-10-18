import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'

export type Destino = Tables<'destinos'>

// Um destino enquanto o roteiro está sendo editado.
// - `id`: só existe se o destino já está salvo no banco
// - `chave`: identificador na tela (os novos ainda não têm id)
export type ItemRoteiro = {
  chave: string
  id?: string
  nome: string
  pais: string | null
  latitude: number | null
  longitude: number | null
  chegada?: string | null
  saida?: string | null
}

export function paraItem(destino: Destino): ItemRoteiro {
  return {
    chave: destino.id,
    id: destino.id,
    nome: destino.nome,
    pais: destino.pais,
    latitude: destino.latitude,
    longitude: destino.longitude,
    chegada: destino.chegada,
    saida: destino.saida,
  }
}

// Busca os destinos da viagem, na ordem
export async function buscarDestinos(viagemId: string): Promise<Destino[]> {
  const { data, error } = await supabase.from('destinos').select('*').eq('viagem_id', viagemId).order('ordem')
  if (error) throw error
  return data
}

export type Vinculos = { trajetos: number; fotos: number }

// Conta o que está ligado a um destino antes de removê-lo.
// (No banco, ao apagar o destino, trajetos e fotos NÃO são apagados: só perdem a ligação.)
export async function contarVinculos(destinoId: string): Promise<Vinculos> {
  const [trajetos, fotos] = await Promise.all([
    supabase
      .from('trajetos')
      .select('id', { count: 'exact', head: true })
      .or(`origem_id.eq.${destinoId},destino_id.eq.${destinoId}`),
    supabase.from('fotos').select('id', { count: 'exact', head: true }).eq('destino_id', destinoId),
  ])
  if (trajetos.error) throw trajetos.error
  if (fotos.error) throw fotos.error
  return { trajetos: trajetos.count ?? 0, fotos: fotos.count ?? 0 }
}

// O roteiro mudou em outro lugar (outra aba, outro aparelho, outra pessoa ADM) desde que a edição começou
export class RoteiroDesatualizado extends Error {
  constructor() {
    super('O roteiro foi alterado em outro lugar')
  }
}

// Traduz um erro do salvamento numa mensagem honesta pra tela.
// (O detalhe técnico vai pro Console, pra quem estiver investigando.)
export function mensagemDeErroAoSalvar(erro: unknown): string {
  const campo = (nome: 'code' | 'message') =>
    typeof erro === 'object' && erro !== null && nome in erro ? String((erro as Record<string, unknown>)[nome] ?? '') : ''
  const codigo = campo('code')
  if (codigo === 'PGRST202') return 'O salvamento do roteiro ainda não está disponível. Nada foi alterado.'
  if (codigo === '42501') return 'Só quem organiza a viagem (ADM) pode editar o roteiro. Nada foi alterado.'
  if (/failed to fetch|network|load failed/i.test(campo('message'))) {
    return 'Não deu pra falar com o servidor. Confira a internet e tente de novo. Nada foi alterado.'
  }
  return `Não deu pra salvar o roteiro. Nada foi alterado.${codigo ? ` (código ${codigo})` : ''}`
}

// Ids que estavam salvos e saíram do rascunho = os que a pessoa removeu de propósito
export function idsRemovidos(salvos: Destino[], rascunho: ItemRoteiro[]): string[] {
  const mantidos = new Set(rascunho.map((item) => item.id).filter(Boolean))
  return salvos.map((d) => d.id).filter((id) => !mantidos.has(id))
}

/**
 * Salva o roteiro inteiro de uma vez, no formato "tudo ou nada".
 * Quem faz isso é a função `salvar_roteiro` do banco (uma transação só):
 * - apaga SÓ os destinos em `removidos` (nunca "tudo que não está na lista")
 * - insere os novos e grava a nova ordem de todos
 * - se o roteiro mudou em outro lugar desde que a edição começou, desfaz tudo (RoteiroDesatualizado)
 * Datas e outros dados dos destinos não são tocados.
 */
export async function salvarRoteiro(viagemId: string, itens: ItemRoteiro[], removidos: string[]): Promise<Destino[]> {
  if (itens.length === 0) throw new Error('O roteiro precisa ter pelo menos um destino')
  const { data, error } = await supabase.rpc('salvar_roteiro', {
    p_viagem: viagemId,
    p_destinos: itens.map((item) => ({
      id: item.id ?? null,
      nome: item.nome,
      pais: item.pais,
      latitude: item.latitude,
      longitude: item.longitude,
    })),
    p_removidos: removidos,
  })
  if (error) throw error.code === 'TR409' ? new RoteiroDesatualizado() : error
  return data
}
