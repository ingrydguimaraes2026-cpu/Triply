// "Cheguei bem" (spec 051). Teste: apps/web/tests/chegadas.test.mjs
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type Chegada = Tables<'chegadas'>

// Só a última chegada de cada pessoa nas últimas 24 h (a mais nova primeiro)
export function chegadasRecentes<C extends Pick<Chegada, 'usuario_id' | 'criado_em'>>(chegadas: C[], agora: Date = new Date()): C[] {
  const limite = new Date(agora.getTime() - 24 * 3600000).toISOString()
  const vistas = new Set<string>()
  return [...chegadas]
    .filter((c) => c.criado_em >= limite)
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
    .filter((c) => (vistas.has(c.usuario_id) ? false : (vistas.add(c.usuario_id), true)))
}

export async function buscarChegadas(cli: ClienteTogether, viagemId: string): Promise<Chegada[]> {
  const desde = new Date(Date.now() - 24 * 3600000).toISOString()
  const { data, error } = await cli.from('chegadas').select('*').eq('viagem_id', viagemId).gte('criado_em', desde).order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function registrarChegada(cli: ClienteTogether, viagemId: string, onde: string | null): Promise<Chegada> {
  const { data, error } = await cli.from('chegadas').insert({ viagem_id: viagemId, onde: onde?.trim() || null }).select('*').single()
  if (error) throw error
  return data
}
