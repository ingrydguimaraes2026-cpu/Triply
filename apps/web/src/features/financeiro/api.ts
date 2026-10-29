import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'
import { deBanco, paraBanco } from './dinheiro'
import type { Divisao } from './acertos'

// Gasto com valores já em centavos
export type Gasto = Omit<Tables<'gastos'>, 'valor'> & { valor: number; divisoes: Divisao[] }
export type Orcamento = { categoria: string; meta: number; moeda: string }
export type Perfil = { id: string; nome: string; avatarUrl: string | null }

export async function buscarGastos(viagemId: string): Promise<Gasto[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('*, gasto_divisoes(usuario_id, valor)')
    .eq('viagem_id', viagemId)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data.map(({ gasto_divisoes, ...g }) => ({
    ...g,
    valor: deBanco(g.valor),
    divisoes: gasto_divisoes.map((d) => ({ usuarioId: d.usuario_id, valor: deBanco(d.valor) })),
  }))
}

export type DadosDoGasto = {
  id?: string // vem do celular quando é novo (evita duplicar ao reenviar)
  descricao: string
  valor: number // centavos
  moeda: string
  categoria: string
  data: string
  pagoPor: string
  pessoal: boolean
  rascunho?: boolean
  divisoes: Divisao[]
}

// Cria ou edita o gasto junto com as divisões ("tudo ou nada", função salvar_gasto do banco)
export async function salvarGasto(viagemId: string, gasto: DadosDoGasto): Promise<string> {
  const { data, error } = await supabase.rpc('salvar_gasto', {
    p_viagem: viagemId,
    p_gasto: {
      id: gasto.id ?? crypto.randomUUID(),
      descricao: gasto.descricao,
      valor: paraBanco(gasto.valor),
      moeda: gasto.moeda,
      categoria: gasto.categoria,
      data: gasto.data,
      pago_por: gasto.pagoPor,
      pessoal: gasto.pessoal,
      rascunho: gasto.rascunho ?? false,
    },
    p_divisoes: gasto.pessoal ? [] : gasto.divisoes.map((d) => ({ usuario_id: d.usuarioId, valor: paraBanco(d.valor) })),
  })
  if (error) throw error
  return data
}

export async function apagarGasto(id: string) {
  const { error, count } = await supabase.from('gastos').delete({ count: 'exact' }).eq('id', id)
  if (error) throw error
  if (count === 0) throw new Error('Sem permissão pra apagar esse gasto')
}

// Avisa as outras telas abertas (lista do Financeiro, Overview) que os gastos mudaram
export const EVENTO_GASTOS = 'together:gastos-mudaram'
export function avisarQueGastosMudaram() {
  window.dispatchEvent(new Event(EVENTO_GASTOS))
}

// ---------- Orçamento (spec 003) ----------
export async function buscarOrcamentos(viagemId: string): Promise<Orcamento[]> {
  const { data, error } = await supabase.from('orcamentos').select('categoria, valor_meta, moeda').eq('viagem_id', viagemId)
  if (error) throw error
  return data.map((o) => ({ categoria: o.categoria, meta: deBanco(o.valor_meta), moeda: o.moeda }))
}

// Grava as metas (null = sem meta pra essa categoria). Só o ADM consegue (regra do banco).
export async function salvarOrcamentos(viagemId: string, moeda: string, metas: Record<string, number | null>) {
  const definir = Object.entries(metas).filter(([, v]) => v !== null && v > 0)
  const tirar = Object.entries(metas)
    .filter(([, v]) => v === null || v === 0)
    .map(([c]) => c)
  if (definir.length > 0) {
    const { error } = await supabase.from('orcamentos').upsert(
      definir.map(([categoria, v]) => ({ viagem_id: viagemId, categoria, moeda, valor_meta: Number(paraBanco(v!)) })),
      { onConflict: 'viagem_id,categoria' },
    )
    if (error) throw error
  }
  if (tirar.length > 0) {
    const { error } = await supabase.from('orcamentos').delete().eq('viagem_id', viagemId).in('categoria', tirar)
    if (error) throw error
  }
}

// Nome e foto de quem não está mais no comboio, mas aparece em gastos antigos
export async function buscarPerfis(ids: string[]): Promise<Perfil[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('perfis').select('id, nome, avatar_url').in('id', ids)
  if (error) throw error
  return data.map((p) => ({ id: p.id, nome: p.nome ?? 'Sem nome', avatarUrl: p.avatar_url }))
}

// Erro do banco → frase pra tela
export function mensagemDeErro(erro: unknown, padrao: string): string {
  const e = (typeof erro === 'object' && erro !== null ? erro : {}) as { code?: string; message?: string }
  if (e.code === 'TR422' && e.message) return e.message
  if (e.code === '42501') return e.message || 'Você não tem permissão pra fazer isso.'
  if (/failed to fetch|network|load failed/i.test(e.message ?? '')) return 'Sem conexão com o servidor. Confira a internet.'
  return padrao
}
