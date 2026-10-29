import { useEffect, useState } from 'react'
import { contarMembros, listarMinhasViagens, saldoDaCarteira, saldoEuroDoComboio, type ViagemResumo } from '@together/core'
import { supabase } from '../lib/supabase'

// Resumo pra home: a viagem mais recente da pessoa + quantos no comboio + (se for euro)
// meu saldo e o saldo do comboio. Tudo via @together/core, o mesmo que a web usaria.
export type DadosResumo = {
  viagem: ViagemResumo
  membros: number
  meuEuro: number // em euros (ex.: 20.00), não centavos
  euroComboio: number
}

export type EstadoResumo =
  | { status: 'carregando' }
  | { status: 'vazio' }
  | { status: 'erro' }
  | { status: 'pronto'; dados: DadosResumo }

export function useResumoViagem(): EstadoResumo {
  const [estado, setEstado] = useState<EstadoResumo>({ status: 'carregando' })

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const { data: sessao } = await supabase.auth.getUser()
        const uid = sessao.user?.id
        const viagens = await listarMinhasViagens(supabase)
        if (!viagens.length) {
          if (vivo) setEstado({ status: 'vazio' })
          return
        }
        const viagem = viagens[0]
        const membros = await contarMembros(supabase, viagem.id)
        let meuEuro = 0
        let euroComboio = 0
        if (viagem.moeda === 'EUR' && uid) {
          ;[meuEuro, euroComboio] = await Promise.all([
            saldoDaCarteira(supabase, viagem.id, uid),
            saldoEuroDoComboio(supabase, viagem.id),
          ])
        }
        if (vivo) setEstado({ status: 'pronto', dados: { viagem, membros, meuEuro, euroComboio } })
      } catch {
        if (vivo) setEstado({ status: 'erro' })
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  return estado
}
