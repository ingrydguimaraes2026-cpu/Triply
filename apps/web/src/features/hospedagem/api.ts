import { supabase } from '../../lib/supabase'
import {
  adicionarOpcaoDeHospedagem,
  buscarOpcoesDeHospedagem,
  escolherHospedagem,
  linhaDaOpcao,
  votarNaHospedagem,
  type DadosDaOpcao,
} from '@together/core'
import type { GuiaDaCasa, Opcao } from './regras'

// Buscar, adicionar, votar e escolher moram no @together/core (o app usa também)
export type { DadosDaOpcao } from '@together/core'

export const buscarOpcoes = (viagemId: string): Promise<Opcao[]> => buscarOpcoesDeHospedagem(supabase, viagemId)
export const adicionarOpcao = (viagemId: string, dados: DadosDaOpcao) => adicionarOpcaoDeHospedagem(supabase, viagemId, dados)
export const votar = (hospedagemId: string, meuId: string, sim: boolean) => votarNaHospedagem(supabase, hospedagemId, meuId, sim)
export const escolherOpcao = (id: string, escolher: boolean) => escolherHospedagem(supabase, id, escolher)

export async function editarOpcao(id: string, dados: DadosDaOpcao) {
  const { error } = await supabase.from('hospedagens').update(linhaDaOpcao(dados)).eq('id', id)
  if (error) throw error
}

export async function apagarOpcao(id: string) {
  const { error } = await supabase.from('hospedagens').delete().eq('id', id)
  if (error) throw error
}

// Guia da casa (spec 026). Quem criou a opção ou o ADM (o banco confere).
// Separado do editarOpcao: um não apaga o que o outro salvou.
export async function salvarGuiaDaCasa(id: string, guia: GuiaDaCasa) {
  const limpo = (v: string | null) => v?.trim() || null
  const { data, error } = await supabase
    .from('hospedagens')
    .update({
      endereco: limpo(guia.endereco),
      wifi_rede: limpo(guia.wifiRede),
      wifi_senha: limpo(guia.wifiSenha),
      codigo_porta: limpo(guia.codigoPorta),
      regras_casa: limpo(guia.regras),
      como_chegar: limpo(guia.comoChegar ?? null),
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  // A RLS não dá erro quando barra o update: só não muda nada
  if (!data?.length) throw new Error('Só quem adicionou a opção ou o ADM pode editar o guia.')
}
