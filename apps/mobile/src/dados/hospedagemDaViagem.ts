import { useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { buscarDestinos, buscarOpcoesDeHospedagem, buscarTrajetos } from '@together/core'
import { supabase } from '../lib/supabase'
import { useCarregar } from './useCarregar'

// Spec 123: o que as telas de hospedagem precisam (noites, cidade e opção).
// Recarrega ao voltar pra tela (depois de pôr ou editar uma opção).
export function useHospedagemDaViagem(viagemId: string | undefined) {
  const carga = useCarregar(
    viagemId
      ? async () => {
          const [opcoes, destinos, trajetos] = await Promise.all([
            buscarOpcoesDeHospedagem(supabase, viagemId),
            buscarDestinos(supabase, viagemId),
            buscarTrajetos(supabase, viagemId, { comOpcoes: true }),
          ])
          // Chegada e volta de cada um não contam como "o grupo chega na cidade"
          const doGrupo = trajetos.filter((t) => t.tipo !== 'chegada' && t.tipo !== 'saida')
          return { opcoes, destinos, trajetos: doGrupo }
        }
      : null,
    [viagemId],
  )
  const primeiraVez = useRef(true)
  const { recarregar } = carga
  useFocusEffect(
    useCallback(() => {
      if (primeiraVez.current) primeiraVez.current = false
      else recarregar()
    }, [recarregar]),
  )
  return carga
}
