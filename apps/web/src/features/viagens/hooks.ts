import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'
import { hojeTexto } from '../destinos/datas'

export type Membro = {
  id: string
  nome: string
  avatarUrl: string | null
  papel: 'adm' | 'membro'
}

export type DadosDaViagem = {
  viagem: Tables<'viagens'>
  destinos: Tables<'destinos'>[]
  membros: Membro[]
  meuId: string
  euSouAdm: boolean
  // Troca a lista de destinos de todas as abas de uma vez (ex.: depois de salvar o roteiro)
  atualizarDestinos: (destinos: Tables<'destinos'>[]) => void
  // Troca os dados da viagem (nome, datas, moeda) em todas as abas e no menu
  atualizarViagem: (viagem: Tables<'viagens'>) => void
  // Busca tudo de novo no banco (ex.: depois de mudar o comboio)
  recarregar: () => Promise<void>
}

type Estado =
  | { status: 'carregando' }
  | { status: 'nao-encontrada' }
  | { status: 'pronta'; dados: Omit<DadosDaViagem, 'atualizarDestinos' | 'atualizarViagem' | 'recarregar'> }

// Lê viagem, destinos e comboio do banco. Sem acesso (não está no comboio) → null.
async function carregarViagem(viagemId: string) {
  const [{ data: viagem }, { data: destinos }, { data: membros }, { data: sessao }] = await Promise.all([
    supabase.from('viagens').select('*').eq('id', viagemId).maybeSingle(),
    supabase.from('destinos').select('*').eq('viagem_id', viagemId).order('ordem'),
    supabase.from('comboio_membros').select('papel, perfis(id, nome, avatar_url)').eq('viagem_id', viagemId),
    supabase.auth.getUser(),
  ])
  const meuId = sessao.user?.id ?? ''
  const lista: Membro[] = (membros ?? []).flatMap((m) =>
    m.perfis
      ? [{ id: m.perfis.id, nome: m.perfis.nome ?? 'Sem nome', avatarUrl: m.perfis.avatar_url, papel: m.papel as Membro['papel'] }]
      : [],
  )
  // Removido do comboio enquanto estava com a tela aberta: a viagem some pra ele
  if (!viagem || !lista.some((m) => m.id === meuId)) return null
  return {
    viagem,
    destinos: destinos ?? [],
    membros: lista,
    meuId,
    euSouAdm: lista.some((m) => m.id === meuId && m.papel === 'adm'),
  }
}

// Busca tudo que as telas da viagem precisam: a viagem, os destinos e o comboio.
// Se a pessoa não estiver no comboio, as regras do banco escondem a viagem → "nao-encontrada".
export function useViagem(id: string | undefined) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  // Fonte única: Overview, mapa, Transportes, Fotos... leem os destinos daqui
  const atualizarDestinos = useCallback((destinos: Tables<'destinos'>[]) => {
    setEstado((atual) => (atual.status === 'pronta' ? { status: 'pronta', dados: { ...atual.dados, destinos } } : atual))
  }, [])

  const atualizarViagem = useCallback((viagem: Tables<'viagens'>) => {
    setEstado((atual) => (atual.status === 'pronta' ? { status: 'pronta', dados: { ...atual.dados, viagem } } : atual))
  }, [])

  const recarregar = useCallback(async () => {
    if (!id) return
    const dados = await carregarViagem(id)
    setEstado(dados ? { status: 'pronta', dados } : { status: 'nao-encontrada' })
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelado = false
    carregarViagem(id).then((dados) => {
      if (!cancelado) setEstado(dados ? { status: 'pronta', dados } : { status: 'nao-encontrada' })
    })
    return () => {
      cancelado = true
    }
  }, [id])

  if (estado.status !== 'pronta') return estado
  return {
    status: 'pronta' as const,
    dados: { ...estado.dados, atualizarDestinos, atualizarViagem, recarregar } satisfies DadosDaViagem,
  }
}

// Abas que ficam guardadas (Overview, Hospedagem, Transportes) não passam pelo <Outlet>:
// recebem os dados da viagem por este contexto.
export const ViagemContexto = createContext<DadosDaViagem | null>(null)

// A aba guardada está na tela agora? (false = escondida, esperando a pessoa voltar)
export const AbaAtivaContexto = createContext(true)
export function useAbaAtiva() {
  return useContext(AbaAtivaContexto)
}

// Nas telas de dentro da viagem (Overview, Financeiro...), pega os dados já carregados pela moldura.
// Exemplo: const { viagem, destinos } = useViagemAtual()
export function useViagemAtual() {
  const guardada = useContext(ViagemContexto)
  const doOutlet = useOutletContext<DadosDaViagem>()
  return guardada ?? doOutlet
}

// Viagem pra abrir direto depois do login (spec 008):
// a que está acontecendo agora; se nenhuma, a mais recente.
export async function buscarUltimaViagem() {
  const { data } = await supabase.from('viagens').select('id, data_inicio, data_fim').order('criado_em', { ascending: false })
  if (!data || data.length === 0) return null
  const hoje = hojeTexto()
  const agora = data.find((v) => v.data_inicio && v.data_inicio <= hoje && (!v.data_fim || v.data_fim >= hoje))
  return (agora ?? data[0]).id
}
