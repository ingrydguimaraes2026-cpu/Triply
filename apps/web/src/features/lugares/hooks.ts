import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Tables } from '@together/core'
import * as api from './api'
import { lugaresSoltos, montarLugares, type Lugar } from './regras'

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; lugares: Lugar[] }

// Lugares da viagem, já juntos com os destinos do roteiro (aba Lugares, spec 016).
// `meuId` é usado pra votar (spec 022).
export function useLugares(viagemId: string, destinos: Tables<'destinos'>[], meuId = '') {
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

  // Voto muda na tela na hora; se o banco recusar, recarrega (igual à hospedagem)
  const votar = useCallback(
    async (id: string, sim: boolean) => {
      setEstado((atual) =>
        atual.status !== 'pronto'
          ? atual
          : {
              status: 'pronto',
              lugares: atual.lugares.map((l) =>
                l.id !== id ? l : { ...l, votos: sim ? [...l.votos.filter((v) => v !== meuId), meuId] : l.votos.filter((v) => v !== meuId) },
              ),
            },
      )
      try {
        await api.votarLugar(id, meuId, sim)
      } catch (erro) {
        console.error('Erro ao votar no lugar:', erro)
        await recarregar()
        throw erro
      }
    },
    [meuId, recarregar],
  )

  // Spec 061: "já fomos" muda na hora; se o banco recusar, recarrega
  const marcarVisitado = useCallback(
    async (id: string, sim: boolean) => {
      setEstado((atual) =>
        atual.status !== 'pronto'
          ? atual
          : { status: 'pronto', lugares: atual.lugares.map((l) => (l.id !== id ? l : { ...l, visitadoEm: sim ? new Date().toISOString() : null })) },
      )
      try {
        await api.marcarVisitado(id, sim)
      } catch (erro) {
        console.error('Erro ao marcar visitado:', erro)
        await recarregar()
      }
    },
    [recarregar],
  )

  return {
    marcarVisitado,
    lugares,
    estado: estado.status,
    itens,
    soltos,
    total: lugares.length,
    recarregar,
    votar,
    adicionar: comRecarga((dados: api.DadosDoLugar) => api.adicionarLugar(viagemId, dados)),
    editar: comRecarga(api.editarLugar),
    apagar: comRecarga(api.apagarLugar),
  }
}
