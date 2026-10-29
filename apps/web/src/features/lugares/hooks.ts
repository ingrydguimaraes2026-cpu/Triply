import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Tables } from '@together/core'
import * as api from './api'
import { lugaresSoltos, montarLugares, type Lugar } from './regras'

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; lugares: Lugar[] }

// Lugares da viagem, já juntos com os destinos do roteiro (aba Lugares, spec 016)
export function useLugares(viagemId: string, destinos: Tables<'destinos'>[]) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  const buscar = useCallback(async (): Promise<Estado> => {
    try {
      return { status: 'pronto', lugares: await api.buscarLugares(viagemId) }
    } catch (erro) {
      console.error('Erro ao carregar os lugares:', erro)
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

  const lugares = useMemo(() => (estado.status === 'pronto' ? estado.lugares : []), [estado])
  const itens = useMemo(() => montarLugares(destinos, lugares), [destinos, lugares])
  const soltos = useMemo(() => lugaresSoltos(destinos, lugares), [destinos, lugares])

  // Grava e busca de novo (assim a tela mostra exatamente o que ficou no banco)
  const comRecarga =
    <A extends unknown[]>(acao: (...args: A) => Promise<void>) =>
    async (...args: A) => {
      await acao(...args)
      await recarregar()
    }

  return {
    estado: estado.status,
    itens,
    soltos,
    total: lugares.length,
    recarregar,
    adicionar: comRecarga((dados: api.DadosDoLugar) => api.adicionarLugar(viagemId, dados)),
    editar: comRecarga(api.editarLugar),
    apagar: comRecarga(api.apagarLugar),
  }
}
