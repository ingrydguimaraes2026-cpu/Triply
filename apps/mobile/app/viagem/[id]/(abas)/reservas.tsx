import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from '../../../../src/ui/StatusBar'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { fonte, titulo, trabalho } from '../../../../theme'
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
      {/* Caminho B "Embarque" (10/11/2026): título grande e a troca Transporte / Hospedagem */}
      <View className="gap-3 pb-1" style={{ paddingTop: insets.top + 6, paddingHorizontal: 18 }}>
        <Text style={[titulo(32), { color: trabalho.texto }]}>Reservas</Text>
        <View className="flex-row rounded-full border p-[3px]" style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }} accessibilityRole="tablist">
          {PARTES.map((p) => {
            const ativa = aberta === p.chave
            return (
              <Pressable
                key={p.chave}
                onPress={() => setAberta(p.chave)}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativa }}
                className="min-h-[38px] flex-1 items-center justify-center rounded-full"
                style={{ backgroundColor: ativa ? trabalho.acento : 'transparent' }}
              >
                <Text style={{ fontFamily: fonte.item, fontSize: 13, color: ativa ? trabalho.acentoTexto : trabalho.texto2 }}>{p.nome}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
      {aberta === 'transporte' ? <TelaDePassagens naAba /> : <TelaDeHospedagem naAba />}
    </View>
  )
}
