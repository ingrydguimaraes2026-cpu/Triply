import { useCallback, useEffect, useState } from 'react'
import { buscarFotos, type Foto } from './api'

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; fotos: Foto[] }

// Fotos da viagem. `limite` = só as mais recentes (cartão da Overview).
export function useFotos(viagemId: string, limite?: number) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  const buscar = useCallback(async (): Promise<Estado> => {
    try {
      return { status: 'pronto', fotos: await buscarFotos(viagemId, limite) }
    } catch (erro) {
      console.error('Erro ao carregar as fotos:', erro)
      return { status: 'erro' }
    }
  }, [viagemId, limite])

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
  return { estado, recarregar }
}
