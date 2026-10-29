import { supabase } from '../../lib/supabase'
import { deBanco, paraBanco } from '@together/core'
import type { Lugar, TipoDeLugar } from './regras'

// O que o formulário manda (preço em centavos)
export type DadosDoLugar = {
  destinoId: string | null
  tipo: TipoDeLugar
  nome: string
  link: string | null
  horario: string | null
  preco: number | null
  moeda: string
  observacao: string | null
}

// Lugares da viagem (spec 016). O banco só devolve os das viagens em que a pessoa está no comboio.
export async function buscarLugares(viagemId: string): Promise<Lugar[]> {
  const { data, error } = await supabase.from('lugares').select('*').eq('viagem_id', viagemId).order('criado_em')
  if (error) throw error
  return (data ?? []).map((l) => ({
    id: l.id,
    destinoId: l.destino_id,
    tipo: l.tipo as TipoDeLugar,
    nome: l.nome,
    link: l.link,
    horario: l.horario,
    preco: l.preco === null ? null : deBanco(l.preco),
    moeda: l.moeda,
    observacao: l.observacao,
    criadoPor: l.criado_por,
  }))
}

function paraLinha(d: DadosDoLugar) {
  return {
    destino_id: d.destinoId,
    tipo: d.tipo,
    nome: d.nome.trim(),
    link: d.link?.trim() || null,
    horario: d.horario?.trim() || null,
    preco: d.preco === null ? null : Number(paraBanco(d.preco)),
    moeda: d.moeda,
    observacao: d.observacao?.trim() || null,
  }
}

export async function adicionarLugar(viagemId: string, dados: DadosDoLugar) {
  const { error } = await supabase.from('lugares').insert({ viagem_id: viagemId, ...paraLinha(dados) })
  if (error) throw error
}

// Quem criou ou o ADM (o banco confere)
export async function editarLugar(id: string, dados: DadosDoLugar) {
  const { error, count } = await supabase.from('lugares').update(paraLinha(dados), { count: 'exact' }).eq('id', id)
  if (error) throw error
  if (count === 0) throw new Error('Sem permissão pra editar este lugar')
}

export async function apagarLugar(id: string) {
  const { error, count } = await supabase.from('lugares').delete({ count: 'exact' }).eq('id', id)
  if (error) throw error
  if (count === 0) throw new Error('Sem permissão pra apagar este lugar')
}
