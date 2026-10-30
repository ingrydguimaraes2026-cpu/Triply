import { useCallback, useEffect, useState } from 'react'
import { buscarTrajetos, type Trajeto } from './api'
import { useAoMudar } from '../tempo-real/avisos'

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; trajetos: Trajeto[] }

// Trajetos da viagem (aba Transportes e cartão "Próximo trajeto" da Overview)
export function useTrajetos(viagemId: string) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  const buscar = useCallback(async (): Promise<Estado> => {
    try {
      return { status: 'pronto', trajetos: await buscarTrajetos(viagemId) }
    } catch (erro) {
      console.error('Erro ao carregar os trajetos:', erro)
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

  const recarregar = useCallback(async () => setEstado(await buscar()), [buscar])
  useAoMudar(['trajetos'], recarregar) // spec 085: outra pessoa mudou → recarrega
  return { estado, recarregar }
}
