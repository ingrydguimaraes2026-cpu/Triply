import { useCallback, useEffect, useMemo, useState } from 'react'
import { buscarExigencias, buscarMeusPassaportes, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import { buscarStatus, marcarStatus, type StatusDoComboio } from './api'
import { montarChecklist, type ExigenciaAutomatica, type Status } from './checklist'

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; lista: StatusDoComboio[] }

// Checklist da viagem + o que cada pessoa do comboio já marcou (aba Documentos e Overview)
export function useDocumentos(viagem: Tables<'viagens'>, destinos: Tables<'destinos'>[], meuId: string) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })
  const [automaticas, setAutomaticas] = useState<Map<string, ExigenciaAutomatica>>(new Map())
  const checklist = useMemo(() => montarChecklist(viagem, destinos, automaticas), [viagem, destinos, automaticas])

  // Spec 111: exigências automáticas dos países sem regra à mão, pelo meu passaporte mais fácil.
  // Se falhar, o checklist continua com o link do Itamaraty nesses países.
  const semRegra = checklist.semRegra.join(',')
  useEffect(() => {
    if (!semRegra) return
    let ativo = true
    buscarMeusPassaportes(supabase, meuId)
      .catch((): string[] => ['BR'])
      .then((passaportes) => buscarExigencias(supabase, semRegra.split(','), passaportes))
      .then(({ porDestino, fontes }) => {
        if (!ativo) return
        const dadosDe = (fonte: string) => fontes.find((f) => f.fonte === fonte)?.dadosDe ?? null
        setAutomaticas(new Map([...porDestino].map(([p, e]) => [p, { ...e, dadosDe: dadosDe(e.fonte) }])))
      })
      .catch((erro) => console.error('Erro ao buscar exigências automáticas:', erro))
    return () => {
      ativo = false
    }
  }, [semRegra, meuId])

  const buscar = useCallback(async (): Promise<Estado> => {
    try {
      return { status: 'pronto', lista: await buscarStatus(viagem.id) }
    } catch (erro) {
      console.error('Erro ao carregar os documentos:', erro)
      return { status: 'erro' }
    }
  }, [viagem.id])

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

  const lista = estado.status === 'pronto' ? estado.lista : []
  const meus: Record<string, Status> = {}
  for (const s of lista) if (s.usuario_id === meuId) meus[s.item] = s.status

  // Muda na tela na hora; se o banco recusar, volta como estava
  const marcar = useCallback(
    async (item: string, status: Status) => {
      setEstado((atual) =>
        atual.status !== 'pronto'
          ? atual
          : {
              status: 'pronto',
              lista: [
                ...atual.lista.filter((s) => !(s.usuario_id === meuId && s.item === item)),
                { usuario_id: meuId, item, status },
              ],
            },
      )
      try {
        await marcarStatus(viagem.id, meuId, item, status)
      } catch (erro) {
        console.error('Erro ao marcar documento:', erro)
        await recarregar()
        throw erro
      }
    },
    [viagem.id, meuId, recarregar],
  )

  // Quem já resolveu cada item
  const resolveram = (item: string) => lista.filter((s) => s.item === item && s.status === 'resolvido').map((s) => s.usuario_id)

  return { checklist, estado: estado.status, meus, marcar, resolveram, recarregar }
}
