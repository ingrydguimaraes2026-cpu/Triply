import { useEffect, useRef } from 'react'
import { filtroDaTabela, type TabelaAoVivo } from '@together/core'
import { supabase } from '../lib/supabase'

// Tempo real (spec 085/115): roda `fazer` quando outra pessoa mexe numa destas tabelas da viagem.
// Espera 600 ms pra juntar várias mudanças seguidas num recarregar só (igual ao site).
// Ex.: useAoVivo(viagem.id, ['roteiros', 'lugares'], recarregar)
export function useAoVivo(viagemId: string | undefined, tabelas: TabelaAoVivo[], fazer: () => void) {
  // Guarda a função mais nova sem refazer a escuta a cada render
  const fazerRef = useRef(fazer)
  useEffect(() => {
    fazerRef.current = fazer
  })
  const chave = tabelas.join(',')
  useEffect(() => {
    if (!viagemId) return
    let relogio: ReturnType<typeof setTimeout> | null = null
    let canal = supabase.channel(`app:${chave}:${viagemId}:${Math.random().toString(36).slice(2)}`)
    for (const tabela of chave.split(',') as TabelaAoVivo[]) {
      canal = canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela, filter: filtroDaTabela(tabela, viagemId) }, () => {
        if (relogio) clearTimeout(relogio)
        relogio = setTimeout(() => fazerRef.current(), 600)
      })
    }
    canal.subscribe()
    return () => {
      if (relogio) clearTimeout(relogio)
      void supabase.removeChannel(canal)
    }
  }, [viagemId, chave])
}
