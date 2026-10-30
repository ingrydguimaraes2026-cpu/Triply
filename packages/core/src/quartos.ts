// Quem dorme onde (spec 068). Teste: apps/web/tests/quartos.test.mjs
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type Quarto = Tables<'quartos'>

// Sorteio: embaralha as pessoas e enche os quartos na ordem, respeitando as vagas.
// `aleatorio` (0..1) vem de fora pra dar pra testar. Quem não couber fica em `sobrou`.
export function sortearQuartos(
  quartos: Pick<Quarto, 'id' | 'vagas'>[],
  pessoas: string[],
  aleatorio: () => number = Math.random,
): { distribuicao: Record<string, string[]>; sobrou: string[] } {
  const fila = [...pessoas]
  for (let i = fila.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[fila[i], fila[j]] = [fila[j], fila[i]]
  }
  const distribuicao: Record<string, string[]> = {}
  for (const q of quartos) distribuicao[q.id] = fila.splice(0, q.vagas)
  return { distribuicao, sobrou: fila }
}

export function semQuarto(quartos: Pick<Quarto, 'ocupantes'>[], pessoas: string[]): string[] {
  const dentro = new Set(quartos.flatMap((q) => q.ocupantes))
  return pessoas.filter((p) => !dentro.has(p))
}

export async function buscarQuartos(cli: ClienteTogether, hospedagemId: string): Promise<Quarto[]> {
  const { data, error } = await cli.from('quartos').select('*').eq('hospedagem_id', hospedagemId).order('criado_em')
  if (error) throw error
  return data ?? []
}

export async function criarQuarto(cli: ClienteTogether, viagemId: string, hospedagemId: string, nome: string, vagas: number) {
  const { error } = await cli.from('quartos').insert({ viagem_id: viagemId, hospedagem_id: hospedagemId, nome: nome.trim(), vagas })
  if (error) throw error
}

export async function apagarQuarto(cli: ClienteTogether, id: string) {
  const { error } = await cli.from('quartos').delete().eq('id', id)
  if (error) throw error
}

export async function entrarNoQuarto(cli: ClienteTogether, id: string, entrar: boolean) {
  const { error } = await cli.rpc('entrar_no_quarto', { p_quarto: id, p_entrar: entrar })
  if (error) throw error
}

// Grava o sorteio: primeiro esvazia todos (o banco não deixa a mesma pessoa em dois quartos), depois enche
export async function gravarSorteio(cli: ClienteTogether, distribuicao: Record<string, string[]>) {
  const ids = Object.keys(distribuicao)
  const { error } = await cli.from('quartos').update({ ocupantes: [] }).in('id', ids)
  if (error) throw error
  for (const id of ids) {
    const { error: e } = await cli.from('quartos').update({ ocupantes: distribuicao[id] }).eq('id', id)
    if (e) throw e
  }
}
