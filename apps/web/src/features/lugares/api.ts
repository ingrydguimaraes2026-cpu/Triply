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
  // Spec 064: onde fica (vem da sugestão do autocompletar)
  latitude?: number | null
  longitude?: number | null
  endereco?: string | null
}

// Lugares da viagem (spec 016). O banco só devolve os das viagens em que a pessoa está no comboio.
// Já traz os votos de cada lugar (spec 022).
export async function buscarLugares(viagemId: string): Promise<Lugar[]> {
  const { data, error } = await supabase
    .from('lugares')
    .select('*, lugar_votos (usuario_id), lugar_prioridades (usuario_id)')
    .eq('viagem_id', viagemId)
    .order('criado_em')
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
    votos: (l.lugar_votos ?? []).map((v) => v.usuario_id),
    prioridades: (l.lugar_prioridades ?? []).map((p) => p.usuario_id),
    visitadoEm: l.visitado_em,
    latitude: l.latitude,
    longitude: l.longitude,
    endereco: l.endereco,
  }))
}

// Curtir ou descurtir um lugar (spec 022). Voto repetido não é erro.
export async function votarLugar(lugarId: string, meuId: string, sim: boolean) {
  const { error } = sim
    ? await supabase.from('lugar_votos').insert({ lugar_id: lugarId, usuario_id: meuId })
    : await supabase.from('lugar_votos').delete().eq('lugar_id', lugarId).eq('usuario_id', meuId)
  if (error && error.code !== '23505') throw error
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
    ...(d.latitude !== undefined ? { latitude: d.latitude, longitude: d.longitude ?? null, endereco: d.endereco ?? null } : {}),
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

// "Já fomos" (spec 061): qualquer um do comboio marca
export async function marcarVisitado(id: string, visitado: boolean) {
  const { error } = await supabase.rpc('marcar_visitado', { p_lugar: id, p_visitado: visitado })
  if (error) throw error
}

// "Não abro mão" (spec 066): até 3 por destino (o banco confere)
export async function marcarPrioridade(id: string, meuId: string, sim: boolean) {
  const { error } = sim
    ? await supabase.from('lugar_prioridades').insert({ lugar_id: id })
    : await supabase.from('lugar_prioridades').delete().eq('lugar_id', id).eq('usuario_id', meuId)
  if (error) throw error
}
