import { useCallback, useEffect, useState } from 'react'
import { carregarAbaViagem, type DadosDaAbaViagem } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useAoMudar } from '../tempo-real/avisos'

// Dados da tela da viagem (aba Viagem do app, spec 117). A carga mora no @together/core (o app usa a mesma).
type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; dados: DadosDaAbaViagem }

export function useAbaViagem(viagemId: string) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  const buscar = useCallback(async (): Promise<Estado> => {
    try {
      const dados = await carregarAbaViagem(supabase, viagemId)
      return dados ? { status: 'pronto', dados } : { status: 'erro' }
    } catch (erro) {
      console.error('Erro ao carregar a tela da viagem:', erro)
      return { status: 'erro' }
    }
  }, [viagemId])

  useEffect(() => {
    let ativo = true
    buscar().then((novo) => {
      if (ativo) setEstado(novo)
    })
    return () => {
      ativo = false
    }
  }, [buscar])

  // Recarrega sem voltar pro "carregando" (a tela não pisca)
  const recarregar = useCallback(async () => {
    const novo = await buscar()
    setEstado((antes) => (novo.status === 'erro' && antes.status === 'pronto' ? antes : novo))
  }, [buscar])
  useAoMudar(['gastos', 'trajetos', 'hospedagens', 'lugares'], recarregar) // spec 085: outra pessoa mudou → recarrega
  return { estado, recarregar }
}
