import { useCallback, useEffect, useState } from 'react'
import { buscarAtividades, buscarVistoEm, contarNovas, marcarAtividadesComoVistas, type Atividade } from '@together/core'
import { supabase } from '../../lib/supabase'

const DE_TEMPOS_EM_TEMPOS = 2 * 60 * 1000 // 2 min com a aba aberta

// Central de notificações (spec 031): as últimas atividades da viagem, o "visto até" e quantas são novas.
// Atualiza ao abrir, ao voltar pra aba do navegador e a cada 2 minutos.
export function useNovidades(viagemId: string, meuId: string) {
  const [atividades, setAtividades] = useState<Atividade[] | null>(null)
  const [vistoEm, setVistoEm] = useState<string | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!viagemId || !meuId) return // a viagem ainda está carregando
    let ativo = true
    const buscar = () =>
      Promise.all([buscarAtividades(supabase, viagemId), buscarVistoEm(supabase, viagemId)])
        .then(([lista, visto]) => {
          if (!ativo) return
          setAtividades(lista)
          setVistoEm(visto)
          setErro(false)
        })
        .catch((e) => {
          console.error('Erro ao carregar as novidades:', e)
          if (ativo) setErro(true)
        })
    buscar()
    const quandoVoltar = () => {
      if (document.visibilityState === 'visible') buscar()
    }
    document.addEventListener('visibilitychange', quandoVoltar)
    const timer = setInterval(quandoVoltar, DE_TEMPOS_EM_TEMPOS)
    return () => {
      ativo = false
      document.removeEventListener('visibilitychange', quandoVoltar)
      clearInterval(timer)
    }
  }, [viagemId, meuId])

  // Marca como visto até a mais nova da lista (hora do banco)
  const marcarComoVistas = useCallback(async () => {
    const maisNova = atividades?.[0]?.criado_em
    if (!maisNova || (vistoEm && vistoEm >= maisNova)) return
    try {
      await marcarAtividadesComoVistas(supabase, viagemId, maisNova)
      setVistoEm(maisNova)
    } catch (e) {
      console.error('Erro ao marcar as novidades como vistas:', e)
    }
  }, [atividades, vistoEm, viagemId])

  const novas = atividades ? contarNovas(atividades, vistoEm, meuId) : 0
  return { atividades, vistoEm, novas, erro, marcarComoVistas }
}
