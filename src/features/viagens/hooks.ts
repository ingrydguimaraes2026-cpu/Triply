import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'

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
  euSouAdm: boolean
  // Troca a lista de destinos de todas as abas de uma vez (ex.: depois de salvar o roteiro)
  atualizarDestinos: (destinos: Tables<'destinos'>[]) => void
}

type Estado =
  | { status: 'carregando' }
  | { status: 'nao-encontrada' }
  | { status: 'pronta'; dados: DadosDaViagem }

// Busca tudo que as telas da viagem precisam: a viagem, os destinos e o comboio.
// Se a pessoa não estiver no comboio, as regras do banco escondem a viagem → "nao-encontrada".
export function useViagem(id: string | undefined) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  // Fonte única: Overview, mapa, Transportes, Fotos... leem os destinos daqui
  const atualizarDestinos = useCallback((destinos: Tables<'destinos'>[]) => {
    setEstado((atual) => (atual.status === 'pronta' ? { status: 'pronta', dados: { ...atual.dados, destinos } } : atual))
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelado = false

    async function carregar(viagemId: string) {
      const [{ data: viagem }, { data: destinos }, { data: membros }, { data: sessao }] = await Promise.all([
        supabase.from('viagens').select('*').eq('id', viagemId).maybeSingle(),
        supabase.from('destinos').select('*').eq('viagem_id', viagemId).order('ordem'),
        supabase.from('comboio_membros').select('papel, perfis(id, nome, avatar_url)').eq('viagem_id', viagemId),
        supabase.auth.getUser(),
      ])
      if (cancelado) return
      if (!viagem) {
        setEstado({ status: 'nao-encontrada' })
        return
      }

      const lista: Membro[] = (membros ?? []).flatMap((m) =>
        m.perfis
          ? [{ id: m.perfis.id, nome: m.perfis.nome ?? 'Sem nome', avatarUrl: m.perfis.avatar_url, papel: m.papel as Membro['papel'] }]
          : [],
      )
      const meuId = sessao.user?.id
      setEstado({
        status: 'pronta',
        dados: {
          viagem,
          destinos: destinos ?? [],
          membros: lista,
          euSouAdm: lista.some((m) => m.id === meuId && m.papel === 'adm'),
          atualizarDestinos,
        },
      })
    }

    carregar(id)
    return () => {
      cancelado = true
    }
  }, [id, atualizarDestinos])

  return estado
}

// Nas telas de dentro da viagem (Overview, Financeiro...), pega os dados já carregados pela moldura.
// Exemplo: const { viagem, destinos } = useViagemAtual()
export function useViagemAtual() {
  return useOutletContext<DadosDaViagem>()
}

// Id da viagem mais recente da pessoa (pra abrir direto depois do login)
export async function buscarUltimaViagem() {
  const { data } = await supabase
    .from('viagens')
    .select('id')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}
