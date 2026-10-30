import { useEffect } from 'react'
import { filtroDaTabela, oQueRecarregar, TABELAS_AO_VIVO } from '@together/core'
import { supabase } from '../../lib/supabase'
import { avisarQueGastosMudaram } from '../financeiro/api'
import { avisarQueMudou } from './avisos'

// Escuta o banco (Supabase Realtime) enquanto a viagem está aberta (spec 085).
// Quando outra pessoa muda algo, a aba certa recarrega sozinha.
// Vários avisos seguidos (ex.: salvar o roteiro inteiro) viram uma recarga só.
export function useTempoReal(viagemId: string | undefined, recarregarViagem: () => Promise<void>) {
  useEffect(() => {
    if (!viagemId) return
    let pendentes = new Set<string>()
    let relogio: ReturnType<typeof setTimeout> | null = null

    function agendar(alvo: string) {
      pendentes.add(alvo)
      if (relogio) clearTimeout(relogio)
      relogio = setTimeout(() => {
        const alvos = pendentes
        pendentes = new Set()
        relogio = null
        for (const a of alvos) {
          if (a === 'viagem') recarregarViagem().catch((e) => console.error('Erro ao recarregar a viagem:', e))
          else if (a === 'gastos') avisarQueGastosMudaram()
          else avisarQueMudou(a)
        }
      }, 600)
    }

    let canal = supabase.channel(`viagem:${viagemId}`)
    for (const tabela of TABELAS_AO_VIVO) {
      canal = canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela, filter: filtroDaTabela(tabela, viagemId) }, () => {
        const alvo = oQueRecarregar(tabela)
        if (alvo) agendar(alvo)
      })
    }
    canal.subscribe()

    return () => {
      if (relogio) clearTimeout(relogio)
      supabase.removeChannel(canal)
    }
  }, [viagemId, recarregarViagem])
}
