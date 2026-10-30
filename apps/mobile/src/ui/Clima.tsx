import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { CloudSun } from 'lucide-react-native'
import { buscarClima, buscarDestinos, interpretarTempo, type PrevisaoDia } from '@together/core'
import { supabase } from '../lib/supabase'
import { hojeIso } from '../lib/formato'
import { cor } from '../../theme'

// Spec 022 no mobile: o tempo do primeiro destino nos dias da viagem (Open-Meteo).
// Longe da viagem é estimativa (mesma época do ano passado); perto, previsão.
export function Clima({ viagemId }: { viagemId: string }) {
  const [dias, setDias] = useState<PrevisaoDia[] | null>(null)
  const [nome, setNome] = useState('')

  useEffect(() => {
    let vivo = true
    buscarDestinos(supabase, viagemId)
      .then(async (destinos) => {
        const hoje = hojeIso()
        // O destino de agora; antes da viagem, o primeiro
        const d = destinos.find((x) => x.chegada && x.chegada <= hoje && (x.saida ?? x.chegada) >= hoje) ?? destinos.find((x) => x.chegada)
        if (!d) return
        const lista = await buscarClima(d.latitude, d.longitude, d.chegada, d.saida ?? d.chegada, hoje)
        if (vivo) {
          setNome(d.nome)
          setDias(lista)
        }
      })
      .catch(() => vivo && setDias(null))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (!dias || dias.length === 0) return null
  const estimativa = dias.every((x) => x.tipo === 'estimativa')

  return (
    <View className="gap-2 rounded-2xl bg-cartao p-4" style={{ boxShadow: '0 4px 14px rgba(74,46,20,0.06)' }}>
      <View className="flex-row items-center gap-2">
        <CloudSun size={18} color={cor.couro} />
        <Text className="font-body-bold text-[15px] text-texto">Tempo em {nome}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {dias.map((x) => {
          const t = interpretarTempo(x.codigo)
          const [, m, d] = x.data.split('-')
          return (
            <View key={x.data} className="items-center rounded-xl bg-areia px-3 py-2" accessibilityLabel={`${d}/${m}: ${t.rotulo}`}>
              <Text className="font-body text-[12px] text-suave">
                {Number(d)}/{m}
              </Text>
              <Text className="text-[20px]">{t.emoji}</Text>
              <Text className="font-body-semibold text-[12px] text-texto">
                {x.tempMax != null ? Math.round(x.tempMax) : '–'}° / {x.tempMin != null ? Math.round(x.tempMin) : '–'}°
              </Text>
            </View>
          )
        })}
      </ScrollView>
      {estimativa ? <Text className="font-body text-[12px] text-suave">Estimativa pela mesma época do ano passado.</Text> : null}
    </View>
  )
}
