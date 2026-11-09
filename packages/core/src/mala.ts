// Mala individual (spec 069): modelos pelo tipo de viagem e pela duração. Teste: apps/web/tests/mala.test.mjs
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type ItemDaMala = Tables<'mala_itens'>
export type ModeloDeMala = 'frio' | 'calor' | 'meia_estacao'

export const MODELOS_DE_MALA: { chave: ModeloDeMala; nome: string }[] = [
  { chave: 'frio', nome: 'Frio (inverno europeu)' },
  { chave: 'meia_estacao', nome: 'Meia-estação' },
  { chave: 'calor', nome: 'Calor / praia' },
]

// Lista sugerida. Roupa do dia a dia escala com os dias (até 7: dá pra lavar no meio do caminho).
export function modeloDeMala(modelo: ModeloDeMala, dias: number): { texto: string; quantidade: number | null }[] {
  const d = Math.max(1, Math.min(7, Math.round(dias)))
  const base = [
    { texto: 'Passaporte / documento', quantidade: null },
    { texto: 'Carregador e cabo', quantidade: null },
    { texto: 'Adaptador de tomada', quantidade: null },
    { texto: 'Remédios de uso contínuo', quantidade: null },
    { texto: 'Escova e pasta de dente', quantidade: null },
    { texto: 'Roupa íntima', quantidade: d + 1 },
    { texto: 'Meias', quantidade: d + 1 },
    { texto: 'Camisetas', quantidade: d },
    { texto: 'Pijama', quantidade: 1 },
    { texto: 'Tênis confortável pra andar', quantidade: 1 },
  ]
  const extra: Record<ModeloDeMala, { texto: string; quantidade: number | null }[]> = {
    frio: [
      { texto: 'Casaco pesado', quantidade: 1 },
      { texto: 'Blusas de manga longa / segunda pele', quantidade: Math.ceil(d / 2) },
      { texto: 'Calças', quantidade: Math.ceil(d / 3) + 1 },
      { texto: 'Gorro, luva e cachecol', quantidade: null },
      { texto: 'Hidratante labial', quantidade: null },
    ],
    meia_estacao: [
      { texto: 'Jaqueta leve', quantidade: 1 },
      { texto: 'Calças', quantidade: Math.ceil(d / 3) + 1 },
      { texto: 'Guarda-chuva pequeno', quantidade: null },
    ],
    calor: [
      { texto: 'Roupa de banho', quantidade: 2 },
      { texto: 'Shorts / saias', quantidade: Math.ceil(d / 2) },
      { texto: 'Protetor solar', quantidade: null },
      { texto: 'Óculos de sol', quantidade: null },
      { texto: 'Chinelo', quantidade: 1 },
    ],
  }
  return [...base, ...extra[modelo]]
}

export function progressoDaMala(itens: Pick<ItemDaMala, 'feito'>[]): { feitos: number; total: number } {
  return { feitos: itens.filter((i) => i.feito).length, total: itens.length }
}

export async function buscarMinhaMala(cli: ClienteTogether, viagemId: string): Promise<ItemDaMala[]> {
  const { data, error } = await cli.from('mala_itens').select('*').eq('viagem_id', viagemId).order('criado_em')
  if (error) throw error
  return data ?? []
}

export async function porNaMala(cli: ClienteTogether, viagemId: string, itens: { texto: string; quantidade: number | null }[]) {
  const { error } = await cli.from('mala_itens').insert(itens.map((i) => ({ viagem_id: viagemId, texto: i.texto.trim(), quantidade: i.quantidade })))
  if (error) throw error
}

export async function marcarNaMala(cli: ClienteTogether, id: string, feito: boolean) {
  const { error } = await cli.from('mala_itens').update({ feito }).eq('id', id)
  if (error) throw error
}

export async function tirarDaMala(cli: ClienteTogether, id: string) {
  const { error } = await cli.from('mala_itens').delete().eq('id', id)
  if (error) throw error
}
