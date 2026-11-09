// Seguro viagem (spec 039). Regras puras testadas em apps/web/tests/seguro.test.mjs.
import type { ClienteTogether } from './supabase'
import type { Tables, TablesInsert } from './database'

export type SeguroViagem = Tables<'seguros_viagem'>
export type DadosDoSeguro = Pick<TablesInsert<'seguros_viagem'>, 'seguradora' | 'telefone' | 'apolice' | 'valido_de' | 'valido_ate' | 'cobertura' | 'cobertos'>

// Quem do comboio ainda não está em nenhum seguro
export function semSeguro<M extends { id: string }>(seguros: Pick<SeguroViagem, 'cobertos'>[], membros: M[]): M[] {
  const cobertos = new Set(seguros.flatMap((s) => s.cobertos))
  return membros.filter((m) => !cobertos.has(m.id))
}

// "+55 (11) 4000-0000" → "+551140000000" (pro link tel:)
export function telefoneParaLigar(telefone: string): string {
  return telefone.replace(/[^\d+]/g, '')
}

// O seguro cobre o período da viagem?
export function cobreAViagem(s: Pick<SeguroViagem, 'valido_de' | 'valido_ate'>, inicio: string | null, fim: string | null): boolean | null {
  if (!s.valido_de || !s.valido_ate || !inicio) return null
  return s.valido_de <= inicio && s.valido_ate >= (fim ?? inicio)
}

export async function buscarSeguros(cli: ClienteTogether, viagemId: string): Promise<SeguroViagem[]> {
  const { data, error } = await cli.from('seguros_viagem').select('*').eq('viagem_id', viagemId).order('criado_em')
  if (error) throw error
  return data ?? []
}

export async function salvarSeguro(cli: ClienteTogether, viagemId: string, dados: DadosDoSeguro, id?: string) {
  const { error } = id
    ? await cli.from('seguros_viagem').update(dados).eq('id', id)
    : await cli.from('seguros_viagem').insert({ ...dados, viagem_id: viagemId })
  if (error) throw error
}

export async function apagarSeguro(cli: ClienteTogether, id: string) {
  const { error } = await cli.from('seguros_viagem').delete().eq('id', id)
  if (error) throw error
}
