import { supabase } from '../../lib/supabase'
import { deBanco, paraBanco } from '@together/core'
import type { GuiaDaCasa, Opcao } from './regras'

// O que o formulário manda (preço em centavos)
export type DadosDaOpcao = {
  destinoId: string
  nome: string
  link: string | null
  precoTotal: number | null
  moeda: string
  checkin: string | null
  checkout: string | null
  horaCheckin: string | null // "22:00"
  horaCheckout: string | null
  observacao: string | null
}

// Opções de hospedagem da viagem, com quem votou em cada uma (spec 011)
export async function buscarOpcoes(viagemId: string): Promise<Opcao[]> {
  const { data, error } = await supabase
    .from('hospedagens')
    .select('*, hospedagem_votos (usuario_id)')
    .eq('viagem_id', viagemId)
    .order('criado_em')
  if (error) throw error
  return (data ?? []).map((h) => ({
    id: h.id,
    destinoId: h.destino_id,
    nome: h.nome,
    link: h.link,
    precoTotal: h.preco_total === null ? null : deBanco(h.preco_total),
    moeda: h.moeda,
    checkin: h.checkin,
    checkout: h.checkout,
    // O banco devolve "22:00:00": a tela usa "22:00"
    horaCheckin: h.hora_checkin?.slice(0, 5) ?? null,
    horaCheckout: h.hora_checkout?.slice(0, 5) ?? null,
    observacao: h.observacao,
    escolhida: h.escolhida,
    criadoPor: h.criado_por,
    votos: (h.hospedagem_votos ?? []).map((v) => v.usuario_id),
    guia: {
      endereco: h.endereco,
      wifiRede: h.wifi_rede,
      wifiSenha: h.wifi_senha,
      codigoPorta: h.codigo_porta,
      regras: h.regras_casa,
    },
  }))
}

function paraLinha(d: DadosDaOpcao) {
  return {
    destino_id: d.destinoId,
    nome: d.nome.trim(),
    link: d.link?.trim() || null,
    preco_total: d.precoTotal === null ? null : Number(paraBanco(d.precoTotal)),
    moeda: d.moeda,
    checkin: d.checkin || null,
    checkout: d.checkout || null,
    hora_checkin: d.horaCheckin || null,
    hora_checkout: d.horaCheckout || null,
    observacao: d.observacao?.trim() || null,
  }
}

export async function adicionarOpcao(viagemId: string, dados: DadosDaOpcao) {
  const { error } = await supabase.from('hospedagens').insert({ viagem_id: viagemId, ...paraLinha(dados) })
  if (error) throw error
}

export async function editarOpcao(id: string, dados: DadosDaOpcao) {
  const { error } = await supabase.from('hospedagens').update(paraLinha(dados)).eq('id', id)
  if (error) throw error
}

export async function apagarOpcao(id: string) {
  const { error } = await supabase.from('hospedagens').delete().eq('id', id)
  if (error) throw error
}

export async function votar(hospedagemId: string, meuId: string, sim: boolean) {
  const { error } = sim
    ? await supabase.from('hospedagem_votos').insert({ hospedagem_id: hospedagemId, usuario_id: meuId })
    : await supabase.from('hospedagem_votos').delete().eq('hospedagem_id', hospedagemId).eq('usuario_id', meuId)
  // Voto repetido (clicou duas vezes) não é erro
  if (error && error.code !== '23505') throw error
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
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  // A RLS não dá erro quando barra o update: só não muda nada
  if (!data?.length) throw new Error('Só quem adicionou a opção ou o ADM pode editar o guia.')
}

// Só o ADM (o banco confere)
export async function escolherOpcao(id: string, escolher: boolean) {
  const { error } = await supabase.rpc('escolher_hospedagem', { p_hospedagem: id, p_escolher: escolher })
  if (error) throw error
}
