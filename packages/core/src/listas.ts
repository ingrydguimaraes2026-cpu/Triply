// Listas do comboio (spec 048): "quem leva" (adaptador, secador, kit remédio) e lista de compras.
// Teste: apps/web/tests/listas.test.mjs
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type ItemDeLista = Tables<'itens_lista'>
export type TipoDeLista = 'levar' | 'compras'

// Sugestões pra começar a lista "quem leva" (evita 5 secadores e nenhum adaptador)
export const SUGESTOES_LEVAR = ['Adaptador de tomada', 'Carregador portátil', 'Kit remédio', 'Secador', 'Caixa de som', 'Guarda-chuva', 'Cadeado de mala']

export function resumoDaLista(itens: Pick<ItemDeLista, 'feito' | 'quem_id'>[]): { feitos: number; total: number; semDono: number } {
  return { feitos: itens.filter((i) => i.feito).length, total: itens.length, semDono: itens.filter((i) => !i.quem_id && !i.feito).length }
}

// Ordem: pendentes primeiro, depois feitos; dentro de cada um, por criação
export function ordenarItens<I extends Pick<ItemDeLista, 'feito' | 'criado_em'>>(itens: I[]): I[] {
  return [...itens].sort((a, b) => Number(a.feito) - Number(b.feito) || a.criado_em.localeCompare(b.criado_em))
}

// "Água (2), Pão" — descrição pro gasto das compras feitas
export function descricaoDasCompras(itens: Pick<ItemDeLista, 'texto' | 'quantidade'>[]): string {
  const texto = itens.map((i) => (i.quantidade ? `${i.texto} (${i.quantidade})` : i.texto)).join(', ')
  return `Compras: ${texto}`.slice(0, 200)
}

export async function buscarItensDaLista(cli: ClienteTogether, viagemId: string): Promise<ItemDeLista[]> {
  const { data, error } = await cli.from('itens_lista').select('*').eq('viagem_id', viagemId).order('criado_em')
  if (error) throw error
  return data ?? []
}

// `id` opcional: gerado no aparelho quando o item pode ficar na fila sem internet (spec 086)
export async function criarItemDaLista(cli: ClienteTogether, viagemId: string, lista: TipoDeLista, texto: string, quantidade?: string | null, id?: string): Promise<ItemDeLista> {
  const { data, error } = await cli
    .from('itens_lista')
    .insert({ ...(id ? { id } : {}), viagem_id: viagemId, lista, texto: texto.trim(), quantidade: quantidade?.trim() || null })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function mudarItemDaLista(cli: ClienteTogether, id: string, mudanca: { feito?: boolean; quem_id?: string | null }) {
  const { error } = await cli.from('itens_lista').update(mudanca).eq('id', id)
  if (error) throw error
}

export async function apagarItemDaLista(cli: ClienteTogether, id: string) {
  const { error } = await cli.from('itens_lista').delete().eq('id', id)
  if (error) throw error
}
