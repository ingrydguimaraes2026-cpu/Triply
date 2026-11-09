import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Tables } from '@together/core'
import * as api from './api'
import { montarHospedagem, resumoDaHospedagem, type Opcao } from './regras'
import { buscarTrajetos } from '../transportes/api'
import { useAoMudar } from '../tempo-real/avisos'

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; opcoes: Opcao[] }

// Opções de hospedagem da viagem, já agrupadas por destino (aba Hospedagem e Overview)
export function useHospedagem(viagemId: string, destinos: Tables<'destinos'>[], meuId: string, pessoas: number) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  const buscar = useCallback(async (): Promise<Estado> => {
    try {
      return { status: 'pronto', opcoes: await api.buscarOpcoes(viagemId) }
    } catch (erro) {
      console.error('Erro ao carregar a hospedagem:', erro)
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
  useAoMudar(['hospedagens'], recarregar) // spec 085: outra pessoa mudou → recarrega

  const opcoes = useMemo(() => (estado.status === 'pronto' ? estado.opcoes : []), [estado])
  const itens = useMemo(() => montarHospedagem(destinos, opcoes), [destinos, opcoes])
  const resumo = useMemo(() => resumoDaHospedagem(itens, pessoas), [itens, pessoas])
  // Opções cujo destino saiu do roteiro (o banco guarda, sem destino)
  const soltas = useMemo(() => opcoes.filter((o) => !o.destinoId || !destinos.some((d) => d.id === o.destinoId)), [opcoes, destinos])

  // Voto muda na tela na hora; se o banco recusar, recarrega
  const votar = useCallback(
    async (id: string, sim: boolean) => {
      setEstado((atual) =>
        atual.status !== 'pronto'
          ? atual
          : {
              status: 'pronto',
              opcoes: atual.opcoes.map((o) =>
                o.id !== id ? o : { ...o, votos: sim ? [...o.votos.filter((v) => v !== meuId), meuId] : o.votos.filter((v) => v !== meuId) },
              ),
            },
      )
      try {
        await api.votar(id, meuId, sim)
      } catch (erro) {
        console.error('Erro ao votar:', erro)
        await recarregar()
        throw erro
      }
    },
    [meuId, recarregar],
  )

  // Ações que mudam mais coisas: grava e recarrega
  const comRecarga =
    <A extends unknown[]>(acao: (...args: A) => Promise<void>) =>
    async (...args: A) => {
      await acao(...args)
      await recarregar()
    }

  return {
    estado: estado.status,
    itens,
    resumo,
    soltas,
    recarregar,
    votar,
    adicionar: comRecarga((dados: api.DadosDaOpcao) => api.adicionarOpcao(viagemId, dados)),
    editar: comRecarga(api.editarOpcao),
    apagar: comRecarga(api.apagarOpcao),
    escolher: comRecarga(api.escolherOpcao),
    salvarGuia: comRecarga(api.salvarGuiaDaCasa),
  }
}

// ---------------- Spec 123: hospedagem por noite ----------------
// Opções + deslocamentos (a chegada em cada cidade vem do último deslocamento do dia).
// `opcoes` pode ser trocado na hora (voto, escolher, reservada) antes do banco responder.
type EstadoDasNoites = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; opcoes: Opcao[]; trajetos: Tables<'trajetos'>[] }

export function useNoitesDaViagem(viagemId: string) {
  const [estado, setEstado] = useState<EstadoDasNoites>({ status: 'carregando' })

  const buscar = useCallback(async (): Promise<EstadoDasNoites> => {
    try {
      const [opcoes, trajetos] = await Promise.all([api.buscarOpcoes(viagemId), buscarTrajetos(viagemId, { comOpcoes: true })])
      // Chegada e volta de cada um não contam como "o grupo chega na cidade" (igual ao app)
      return { status: 'pronto', opcoes, trajetos: trajetos.filter((t) => t.tipo !== 'chegada' && t.tipo !== 'saida') }
    } catch (erro) {
      console.error('Erro ao carregar as noites:', erro)
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
  useAoMudar(['hospedagens', 'trajetos'], recarregar)

  const trocarOpcoes = useCallback((mudar: (opcoes: Opcao[]) => Opcao[]) => {
    setEstado((atual) => (atual.status === 'pronto' ? { ...atual, opcoes: mudar(atual.opcoes) } : atual))
  }, [])

  return { estado, recarregar, trocarOpcoes }
}
