import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from '../../../../src/ui/StatusBar'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { SemViagem } from '../../../../src/ui/SemViagem'
import { TelaDePassagens } from '../../../transportes'
import { TelaDeHospedagem } from '../../../hospedagem'

// Aba Reservas (spec 122d, pedido do Victor 08/11): transporte e hospedagem num lugar só,
// na barra de baixo. Em cima, a troca entre as duas partes; embaixo, a tela de cada uma.
// Rota: /viagem/<id>/reservas[?parte=hospedagem]
type Parte = 'transporte' | 'hospedagem'
const PARTES: { chave: Parte; nome: string }[] = [
  { chave: 'transporte', nome: 'Transporte' },
  { chave: 'hospedagem', nome: 'Hospedagem' },
]

export default function Reservas() {
  const insets = useSafeAreaInsets()
  const { atual } = useViagemAtual()
  const { parte } = useLocalSearchParams<{ parte?: string }>()
  const [aberta, setAberta] = useState<Parte>(parte === 'hospedagem' ? 'hospedagem' : 'transporte')
  if (!atual) return <SemViagem titulo="Reservas" />

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <View className="gap-3 px-5 pb-1" style={{ paddingTop: insets.top + 8 }}>
        <Text className="font-display text-[32px] leading-[36px] text-texto">Reservas</Text>
        <View className="flex-row rounded-full border border-borda bg-cartao p-1" accessibilityRole="tablist">
          {PARTES.map((p) => {
            const ativa = aberta === p.chave
            return (
              <Pressable
                key={p.chave}
                onPress={() => setAberta(p.chave)}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativa }}
                className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${ativa ? 'bg-couro' : ''}`}
              >
                <Text className={`text-[14px] ${ativa ? 'font-body-bold text-creme' : 'font-body-semibold text-texto'}`}>{p.nome}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
      {aberta === 'transporte' ? <TelaDePassagens naAba /> : <TelaDeHospedagem naAba />}
    </View>
  )
}
