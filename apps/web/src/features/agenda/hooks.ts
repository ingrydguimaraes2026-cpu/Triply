import { useCallback, useEffect, useState } from 'react'
import { buscarEventosDaAgenda, type EventoDaAgenda } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useAoMudar } from '../tempo-real/avisos'

// Eventos livres da agenda (spec 029). Trajetos e destinos vêm de useTrajetos / useViagemAtual.
export function useEventosDaAgenda(viagemId: string) {
  const [eventos, setEventos] = useState<EventoDaAgenda[] | null>(null)
  const [erro, setErro] = useState(false)

  const recarregar = useCallback(async () => {
    try {
      setEventos(await buscarEventosDaAgenda(supabase, viagemId))
      setErro(false)
    } catch (e) {
      console.error('Erro ao carregar a agenda:', e)
      setErro(true)
    }
  }, [viagemId])
  useAoMudar(['eventos_agenda'], recarregar) // spec 085: outra pessoa mudou → recarrega

  useEffect(() => {
    let ativo = true
    buscarEventosDaAgenda(supabase, viagemId)
      .then((lista) => {
        if (ativo) setEventos(lista)
      })
      .catch((e) => {
        console.error('Erro ao carregar a agenda:', e)
        if (ativo) setErro(true)
      })
    return () => {
      ativo = false
    }
  }, [viagemId])

  return { eventos, erro, recarregar }
}

// "2026-11-20" → "sexta, 20 de novembro"
export function diaPorExtenso(dia: string) {
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

// "2026-11-20" → { semana: "sex", numero: "20" } (pros botões de dia)
export function diaCurtinho(dia: string) {
  const data = new Date(`${dia}T12:00:00Z`)
  return {
    semana: data.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''),
    numero: String(data.getUTCDate()),
  }
}
