import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { CalendarDays } from 'lucide-react-native'
import {
  buscarDestinos,
  buscarEventosDaAgenda,
  buscarTrajetos,
  destinoDoDia,
  diasDoPeriodo,
  montarAgendaDoDia,
  type ItemDaAgenda,
} from '@together/core'
import { supabase } from '../lib/supabase'
import { hojeIso } from '../lib/formato'
import { cor } from '../../theme'

// Spec 029 no mobile: a agenda de hoje (ou do 1º dia, antes da viagem). Só leitura:
// criar e editar evento continua no site por enquanto.
export function AgendaDeHoje({ viagemId, inicio, fim }: { viagemId: string; inicio: string | null; fim: string | null }) {
  const [dia, setDia] = useState<{ data: string; onde: string | null; itens: ItemDaAgenda[] } | null>(null)

  useEffect(() => {
    let vivo = true
    Promise.all([buscarDestinos(supabase, viagemId), buscarTrajetos(supabase, viagemId), buscarEventosDaAgenda(supabase, viagemId)])
      .then(([destinos, trajetos, eventos]) => {
        if (!vivo) return
        const dias = diasDoPeriodo(inicio, fim)
        const hoje = hojeIso()
        const data = dias.includes(hoje) ? hoje : dias.find((d) => d > hoje)
        if (!data) return setDia(null)
        setDia({ data, onde: destinoDoDia(data, destinos)?.nome ?? null, itens: montarAgendaDoDia(data, { destinos, trajetos, eventos }) })
      })
      .catch(() => vivo && setDia(null))
    return () => {
      vivo = false
    }
  }, [viagemId, inicio, fim])

  if (!dia || dia.itens.length === 0) return null
  const ehHoje = dia.data === hojeIso()
  const [, m, d] = dia.data.split('-')

  return (
    <View className="gap-2 rounded-2xl bg-cartao p-4" style={{ boxShadow: '0 4px 14px rgba(74,46,20,0.06)' }}>
      <View className="flex-row items-center gap-2">
        <CalendarDays size={18} color={cor.couro} />
        <Text className="font-body-bold text-[15px] text-texto">
          {ehHoje ? 'Hoje' : `Dia ${Number(d)}/${m}`}
          {dia.onde ? ` · ${dia.onde}` : ''}
        </Text>
      </View>
      {dia.itens.map((i) => (
        <View key={i.chave} className="flex-row gap-3 border-t border-linha pt-2">
          <Text className="w-12 font-body-semibold text-[13px] text-suave">{i.hora || '—'}</Text>
          <View className="min-w-0 flex-1">
            <Text className="font-body-medium text-[14px] text-texto">{i.titulo}</Text>
            {i.detalhe ? <Text className="font-body text-[12px] text-suave">{i.detalhe}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  )
}
