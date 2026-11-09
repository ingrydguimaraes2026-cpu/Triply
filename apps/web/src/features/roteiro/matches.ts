import { supabase } from '../../lib/supabase'

// Match do comboio (spec 117), igual ao app (apps/mobile/src/dados/matches.ts):
// lugares do Explorar que o grupo quer, com quem quer.
export type Match = {
  catalogoId: string
  destinoId: string
  nome: string
  foto: string | null
  querem: number
  quem: string[] // ids, na ordem em que deram "quero"
  noDia: boolean
}

// Quantos "quero" fazem um match: 3, ou todo mundo se o comboio tem menos de 3
export const limiteDoMatch = (pessoas: number) => Math.min(3, pessoas)
export const ehMatch = (querem: number, pessoas: number) => pessoas >= 2 && querem >= limiteDoMatch(pessoas)
// "3 ou mais querem" ou, em comboio pequeno, "todo mundo quer"
export const quemFazMatch = (pessoas: number) => (limiteDoMatch(pessoas) >= pessoas ? 'todo mundo quer' : `${limiteDoMatch(pessoas)} ou mais querem`)

export async function buscarMatches(viagemId: string): Promise<Match[]> {
  const { data, error } = await supabase.rpc('matches_da_viagem', { p_viagem: viagemId })
  if (error) throw error
  return (data ?? [])
    .map((m) => ({ catalogoId: m.catalogo_lugar_id, destinoId: m.destino_id, nome: m.nome, foto: m.foto_url, querem: m.querem, quem: m.quem ?? [], noDia: m.no_dia }))
    .sort((a, b) => b.querem - a.querem || a.nome.localeCompare(b.nome))
}

// Os 3 grupos da aba Matches
export function agruparMatches(matches: Match[], pessoas: number) {
  return {
    todos: matches.filter((m) => pessoas >= 2 && m.querem >= pessoas),
    match: matches.filter((m) => ehMatch(m.querem, pessoas) && m.querem < pessoas),
    quase: matches.filter((m) => m.querem === 2 && !ehMatch(m.querem, pessoas)),
  }
}
