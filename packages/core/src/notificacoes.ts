// Central de notificações (spec 031). O banco grava o log (`atividades_viagem`) por gatilho;
// aqui ficam a leitura, o "visto até" e o texto de cada atividade (puro, testado em
// apps/web/tests/notificacoes.test.mjs).
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type Atividade = Tables<'atividades_viagem'>

// O que aparece depois do nome: "Ingryd lançou o gasto «Jantar»". `aba` abre o item ('' = Overview).
const COMO: Record<string, { verbo: string; aba: string; comFoco?: boolean }> = {
  gasto: { verbo: 'lançou o gasto', aba: 'financeiro', comFoco: true },
  enquete: { verbo: 'criou a enquete', aba: '', comFoco: true },
  aviso: { verbo: 'publicou um aviso', aba: '' },
  ponto: { verbo: 'marcou um ponto de encontro', aba: '', comFoco: true },
  tarefa: { verbo: 'criou a tarefa', aba: '' },
  lugar: { verbo: 'sugeriu o lugar', aba: 'lugares', comFoco: true },
  hospedagem: { verbo: 'sugeriu a hospedagem', aba: 'hospedagem' },
  hospedagem_escolhida: { verbo: 'escolheu a hospedagem', aba: 'hospedagem' },
  post: { verbo: 'postou fotos', aba: 'fotos' },
  comentario_gasto: { verbo: 'comentou num gasto', aba: 'financeiro', comFoco: true },
  comentario_lugar: { verbo: 'comentou num lugar', aba: 'lugares', comFoco: true },
  comentario_hospedagem: { verbo: 'comentou numa hospedagem', aba: 'hospedagem' },
  evento: { verbo: 'marcou na agenda', aba: 'agenda' },
  trajeto: { verbo: 'adicionou o trajeto', aba: 'transportes' },
  arquivo: { verbo: 'guardou no cofre', aba: '' },
  membro: { verbo: 'entrou no comboio', aba: 'comboio' },
}

// "lançou o gasto" + título entre aspas (comentário mostra o texto) + caminho pra abrir o item
export function descreverAtividade(a: Pick<Atividade, 'tipo' | 'titulo' | 'alvo_id' | 'viagem_id'>): {
  verbo: string
  titulo: string | null
  caminho: string
} {
  const como = COMO[a.tipo] ?? { verbo: 'mexeu na viagem', aba: '' }
  const raiz = `/viagem/${a.viagem_id}${como.aba ? `/${como.aba}` : ''}`
  const caminho = como.comFoco && a.alvo_id ? `${raiz}?foco=${encodeURIComponent(a.alvo_id)}` : raiz
  const titulo = a.tipo === 'membro' ? null : a.titulo?.trim() || null
  return { verbo: como.verbo, titulo, caminho }
}

// Quantas são novas: depois do "visto até" e feitas por outra pessoa
export function contarNovas(atividades: Pick<Atividade, 'autor' | 'criado_em'>[], vistoEm: string | null, meuId: string): number {
  return atividades.filter((a) => a.autor !== meuId && (!vistoEm || a.criado_em > vistoEm)).length
}

// As últimas atividades da viagem (as mais novas primeiro)
export async function buscarAtividades(cli: ClienteTogether, viagemId: string, limite = 50): Promise<Atividade[]> {
  const { data, error } = await cli
    .from('atividades_viagem')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('criado_em', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data ?? []
}

// Até quando eu já vi as novidades dessa viagem (null = nunca abri o sino)
export async function buscarVistoEm(cli: ClienteTogether, viagemId: string): Promise<string | null> {
  const { data, error } = await cli.from('atividades_vistas').select('visto_em').eq('viagem_id', viagemId).maybeSingle()
  if (error) throw error
  return data?.visto_em ?? null
}

// Marca como visto até a atividade mais nova que eu já vi. Usa a hora do banco (criado_em),
// não a do aparelho: relógio do celular atrasado não faz as novidades "voltarem".
export async function marcarAtividadesComoVistas(cli: ClienteTogether, viagemId: string, ate: string): Promise<void> {
  const { error } = await cli.from('atividades_vistas').upsert({ viagem_id: viagemId, visto_em: ate })
  if (error) throw error
}
