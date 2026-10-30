import { Bus, Car, Footprints, Plane, Route, Ship, TrainFront, type LucideIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Tables } from '@together/core'

// passageiros: spec 067 (lista vazia = o comboio inteiro vai)
export type Trajeto = Tables<'trajetos'> & { passageiros: string[] }

// Mesmos meios da tabela "trajetos" no banco
export const MEIOS: { chave: string; nome: string; icone: LucideIcon }[] = [
  { chave: 'trem', nome: 'Trem', icone: TrainFront },
  { chave: 'onibus', nome: 'Ônibus', icone: Bus },
  { chave: 'aviao', nome: 'Avião', icone: Plane },
  { chave: 'carro', nome: 'Carro', icone: Car },
  { chave: 'barco', nome: 'Barco', icone: Ship },
  { chave: 'a_pe', nome: 'A pé', icone: Footprints },
  { chave: 'outro', nome: 'Outro', icone: Route },
]

export function meio(chave: string) {
  return MEIOS.find((m) => m.chave === chave) ?? MEIOS[6]
}

// Trajetos da viagem em ordem de partida (os sem horário no fim)
export async function buscarTrajetos(viagemId: string): Promise<Trajeto[]> {
  const { data, error } = await supabase
    .from('trajetos')
    .select('*, trajeto_passageiros (usuario_id)')
    .eq('viagem_id', viagemId)
    .order('partida', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data.map(({ trajeto_passageiros, ...t }) => ({ ...t, passageiros: (trajeto_passageiros ?? []).map((p) => p.usuario_id) }))
}

// Spec 067: troca a lista de passageiros do trajeto (vazia = todo mundo). Só o ADM (o banco confere).
export async function definirPassageiros(trajetoIds: string[], passageiros: string[]) {
  const { error } = await supabase.from('trajeto_passageiros').delete().in('trajeto_id', trajetoIds)
  if (error) throw error
  if (passageiros.length === 0) return
  const { error: erro2 } = await supabase
    .from('trajeto_passageiros')
    .insert(trajetoIds.flatMap((trajeto_id) => passageiros.map((usuario_id) => ({ trajeto_id, usuario_id }))))
  if (erro2) throw erro2
}

// "Meu itinerário": os trajetos em que eu vou
export function vouNesse(t: Pick<Trajeto, 'passageiros'>, meuId: string) {
  return t.passageiros.length === 0 || t.passageiros.includes(meuId)
}

export type DadosDoTrajeto = {
  origem_id: string | null
  destino_id: string | null
  meio: string
  partida: string | null
  chegada: string | null
  bate_e_volta: boolean
  observacao: string | null
  link_reserva: string | null
  situacao: string
  preco: number | null
  moeda: string | null
  motorista_id?: string | null // spec 073
  estacao_partida?: string | null // spec 074
  estacao_chegada?: string | null
  escalas?: { local: string; chegada: string | null; partida: string | null }[]
}

// Só o ADM consegue (regra do banco)
export async function salvarTrajeto(viagemId: string, dados: DadosDoTrajeto, id?: string): Promise<string> {
  if (id) {
    const { error } = await supabase.from('trajetos').update(dados).eq('id', id)
    if (error) throw error
    return id
  }
  const { data, error } = await supabase.from('trajetos').insert({ ...dados, viagem_id: viagemId }).select('id').single()
  if (error) throw error
  return data.id
}

// Bate-e-volta: ida e volta gravadas juntas (um insert só = tudo ou nada)
export async function criarBateEVolta(viagemId: string, ida: DadosDoTrajeto, volta: Pick<DadosDoTrajeto, 'partida' | 'chegada'>): Promise<string[]> {
  const { data, error } = await supabase.from('trajetos').insert([
    { ...ida, viagem_id: viagemId, bate_e_volta: true },
    {
      ...ida,
      viagem_id: viagemId,
      bate_e_volta: true,
      origem_id: ida.destino_id,
      destino_id: ida.origem_id,
      partida: volta.partida,
      chegada: volta.chegada,
      preco: null, // o preço (ida e volta) fica só na ida, pra não contar em dobro
      moeda: null,
    },
  ]).select('id')
  if (error) throw error
  return data.map((t) => t.id)
}

export async function apagarTrajeto(id: string) {
  const { error } = await supabase.from('trajetos').delete().eq('id', id)
  if (error) throw error
}
