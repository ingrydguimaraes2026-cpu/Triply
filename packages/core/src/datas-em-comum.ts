// Datas em comum (spec 065). Puro + banco. Teste: apps/web/tests/datas-em-comum.test.mjs
import type { ClienteTogether } from './supabase'

export type Disponibilidade = { usuario_id: string; dia: string }

function proximoDia(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// Quantas pessoas podem em cada dia
export function contarPorDia(disps: Disponibilidade[]): Map<string, Set<string>> {
  const mapa = new Map<string, Set<string>>()
  for (const d of disps) mapa.set(d.dia, (mapa.get(d.dia) ?? new Set()).add(d.usuario_id))
  return mapa
}

// Janelas de dias seguidos em que pelo menos `minimoDePessoas` podem, com pelo menos `minimoDeDias`.
// As melhores primeiro: mais gente, depois mais longas, depois mais cedo.
export function janelasEmComum(
  disps: Disponibilidade[],
  minimoDePessoas: number,
  minimoDeDias = 2,
): { inicio: string; fim: string; dias: number; pessoas: number }[] {
  const porDia = contarPorDia(disps)
  const dias = [...porDia.keys()].filter((d) => porDia.get(d)!.size >= minimoDePessoas).sort()
  const janelas: { inicio: string; fim: string; dias: number; pessoas: number }[] = []
  let atual: { inicio: string; fim: string; dias: number; pessoas: number } | null = null
  for (const dia of dias) {
    const n = porDia.get(dia)!.size
    if (atual && proximoDia(atual.fim) === dia) {
      atual.fim = dia
      atual.dias++
      atual.pessoas = Math.min(atual.pessoas, n)
    } else {
      if (atual) janelas.push(atual)
      atual = { inicio: dia, fim: dia, dias: 1, pessoas: n }
    }
  }
  if (atual) janelas.push(atual)
  return janelas.filter((j) => j.dias >= minimoDeDias).sort((a, b) => b.pessoas - a.pessoas || b.dias - a.dias || a.inicio.localeCompare(b.inicio))
}

export async function buscarDisponibilidades(cli: ClienteTogether, viagemId: string): Promise<Disponibilidade[]> {
  const { data, error } = await cli.from('disponibilidades').select('usuario_id, dia').eq('viagem_id', viagemId)
  if (error) throw error
  return data ?? []
}

export async function marcarDia(cli: ClienteTogether, viagemId: string, meuId: string, dia: string, posso: boolean) {
  const { error } = posso
    ? await cli.from('disponibilidades').insert({ viagem_id: viagemId, dia })
    : await cli.from('disponibilidades').delete().eq('viagem_id', viagemId).eq('usuario_id', meuId).eq('dia', dia)
  if (error) throw error
}
