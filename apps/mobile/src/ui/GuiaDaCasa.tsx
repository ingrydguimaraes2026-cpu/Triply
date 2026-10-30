import { useEffect, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { BedDouble, KeyRound, MapPin, Wifi } from 'lucide-react-native'
import { buscarDestinos, type Tables } from '@together/core'
import { supabase } from '../lib/supabase'
import { hojeIso } from '../lib/formato'
import { cor } from '../../theme'

type Casa = Pick<Tables<'hospedagens'>, 'id' | 'nome' | 'endereco' | 'wifi_rede' | 'wifi_senha' | 'codigo_porta' | 'hora_checkin' | 'hora_checkout' | 'checkin' | 'checkout' | 'como_chegar'>

// Spec 026 no mobile: o guia da casa escolhida de onde o comboio dorme hoje
// (antes da viagem, a primeira). Endereço abre no mapa; Wi-Fi e código da porta à mão.
export function GuiaDaCasa({ viagemId }: { viagemId: string }) {
  const [casa, setCasa] = useState<Casa | null>(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const destinos = await buscarDestinos(supabase, viagemId)
      const hoje = hojeIso()
      const d = destinos.find((x) => x.chegada && x.chegada <= hoje && (x.saida ?? x.chegada) > hoje) ?? destinos.find((x) => x.chegada && x.chegada > hoje)
      if (!d) return
      const { data } = await supabase
        .from('hospedagens')
        .select('id, nome, endereco, wifi_rede, wifi_senha, codigo_porta, hora_checkin, hora_checkout, checkin, checkout, como_chegar')
        .eq('viagem_id', viagemId)
        .eq('destino_id', d.id)
        .eq('escolhida', true)
        .maybeSingle()
      if (vivo) setCasa(data ?? null)
    })().catch(() => vivo && setCasa(null))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (!casa) return null
  const hora = (h: string | null) => (h ? h.slice(0, 5) : null)

  return (
    <View className="gap-2 rounded-2xl bg-cartao p-4" style={{ boxShadow: '0 4px 14px rgba(74,46,20,0.06)' }}>
      <View className="flex-row items-center gap-2">
        <BedDouble size={18} color={cor.couro} />
        <Text className="min-w-0 flex-1 font-body-bold text-[15px] text-texto">{casa.nome}</Text>
      </View>
      {casa.hora_checkin || casa.hora_checkout ? (
        <Text className="font-body text-[13px] text-suave">
          {hora(casa.hora_checkin) ? `Check-in a partir das ${hora(casa.hora_checkin)}` : ''}
          {hora(casa.hora_checkin) && hora(casa.hora_checkout) ? ' · ' : ''}
          {hora(casa.hora_checkout) ? `check-out até ${hora(casa.hora_checkout)}` : ''}
        </Text>
      ) : null}
      {casa.endereco ? (
        <Pressable
          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(casa.endereco!)}`)}
          className="flex-row items-start gap-2"
          accessibilityLabel={`Abrir ${casa.endereco} no mapa`}
        >
          <MapPin size={16} color={cor.suave} style={{ marginTop: 2 }} />
          <Text className="min-w-0 flex-1 font-body-medium text-[14px] text-couro underline">{casa.endereco}</Text>
        </Pressable>
      ) : null}
      {casa.wifi_rede ? (
        <View className="flex-row items-center gap-2">
          <Wifi size={16} color={cor.suave} />
          <Text selectable className="font-body text-[14px] text-texto">
            {casa.wifi_rede}
            {casa.wifi_senha ? ` · senha ${casa.wifi_senha}` : ''}
          </Text>
        </View>
      ) : null}
      {casa.codigo_porta ? (
        <View className="flex-row items-center gap-2">
          <KeyRound size={16} color={cor.suave} />
          <Text selectable className="font-body text-[14px] text-texto">
            Código da porta: {casa.codigo_porta}
          </Text>
        </View>
      ) : null}
      {casa.como_chegar ? <Text className="font-body text-[13px] leading-5 text-corpo">{casa.como_chegar}</Text> : null}
    </View>
  )
}
