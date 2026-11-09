import { useCallback, useEffect, useState } from 'react'
import { indiceDoDia, lerDiasDoRoteiro } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useAoMudar } from '../tempo-real/avisos'
import type { Destino } from '../destinos/api'

type LugarDoDia = { id: string; nome: string; tipo: string; destinoId: string; horario: string | null }
type Dados = { lugares: LugarDoDia[]; roteiros: { destinoId: string; dias: string[][] }[] }

// Os lugares de cada dia, igual ao Roteiro do app (montarDia em apps/mobile/app/viagem/[id]/(abas)/roteiro.tsx):
// cidade com os dias montados no Explorar → só os lugares daquele dia; sem dias montados → os lugares da cidade, como ideias.
export function useLugaresDosDias(viagemId: string) {
  const [dados, setDados] = useState<Dados | null>(null)

  const carregar = useCallback(() => {
    Promise.all([
      supabase.from('lugares').select('id, nome, tipo, destino_id, horario').eq('viagem_id', viagemId),
      supabase.from('roteiros').select('destino_id, dias').eq('viagem_id', viagemId),
    ])
      .then(([l, r]) => {
        if (l.error) throw l.error
        setDados({
          lugares: (l.data ?? []).map((x) => ({ id: x.id, nome: x.nome, tipo: x.tipo, destinoId: x.destino_id ?? '', horario: x.horario })),
          // Sem os dias montados (erro), o dia funciona igual: todos os lugares da cidade
          roteiros: r.error ? [] : (r.data ?? []).map((x) => ({ destinoId: x.destino_id, dias: lerDiasDoRoteiro(x.dias) })),
        })
      })
      .catch((e) => console.error('Erro ao buscar os lugares do roteiro:', e))
  }, [viagemId])

  useEffect(carregar, [carregar])
  useAoMudar(['lugares', 'roteiros'], carregar) // outra pessoa mexeu → recarrega

  // As cidades em que o comboio está nesse dia (no dia da troca, as duas) e os lugares de cada uma
  const doDia = (dia: string, destinos: Destino[]) => {
    if (!dados) return []
    return destinos
      .filter((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia)
      .map((d) => {
        const montado = dados.roteiros.find((r) => r.destinoId === d.id && r.dias.some((x) => x.length))
        const ids = montado ? (montado.dias[indiceDoDia(d.chegada!, dia)] ?? []) : null
        const lugares = ids
          ? ids.map((id) => dados.lugares.find((x) => x.id === id)).filter((x): x is LugarDoDia => !!x)
          : dados.lugares.filter((x) => x.destinoId === d.id)
        return { destino: d, montado: !!montado, lugares }
      })
      .filter((c) => c.lugares.length > 0)
  }

  // Viagem sem datas: os dias montados no Explorar, na ordem das cidades, numerados em sequência
  // (igual a diasDosRoteiros do app e ao resumo da tela Viagem)
  const semDatas = (destinos: Destino[]) => {
    if (!dados) return []
    const saida: { numero: number; destino: Destino; lugares: LugarDoDia[] }[] = []
    for (const d of destinos) {
      for (const ids of dados.roteiros.find((r) => r.destinoId === d.id)?.dias ?? []) {
        const lugares = ids.map((id) => dados.lugares.find((x) => x.id === id)).filter((x): x is LugarDoDia => !!x)
        if (lugares.length) saida.push({ numero: saida.length + 1, destino: d, lugares })
      }
    }
    return saida
  }

  return { doDia, semDatas }
}
