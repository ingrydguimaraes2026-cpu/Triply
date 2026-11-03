import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Link } from 'lucide-react-native'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { convidarProComboio } from '../src/lib/convite'
import { Agulha } from '../src/ui/Agulha'
import { Selo, type NomeDoSelo } from '../src/ui/Selos'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao } from '../src/ui/pecas'
import { cor } from '../theme'

// Primeira viagem guiada (spec 116), passo depois do roteiro: chamar a galera (pode pular).
// Depois daqui, a pessoa cai no dashboard da viagem.
export default function ChamarGalera() {
  const { viagem: id } = useLocalSearchParams<{ viagem: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { viagens } = useViagemAtual()
  const viagem = viagens.find((v) => v.id === id)
  const [aviso, setAviso] = useState<string | null>(null)
  const [mandou, setMandou] = useState(false)

  const seguir = () => router.replace(`/viagem/${id}`)

  async function convidar() {
    const r = await convidarProComboio(id, viagem?.nome ?? 'nossa viagem')
    setAviso(r?.texto ?? null)
    setMandou(true)
  }

  return (
    <LinearGradient colors={['#B97A22', '#8A5A26', '#4A2E14']} locations={[0, 0.55, 1]} style={{ flex: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28, paddingHorizontal: 24 }}>
      <StatusBar style="light" />
      <View className="flex-1 justify-center gap-4">
        <View className="-ml-1.5">
          <Agulha humor="feliz" tamanho={120} />
        </View>
        <Text className="font-body-semibold text-[13px] uppercase tracking-wider text-creme">Roteiro de {viagem?.nome ?? 'viagem'} montado</Text>
        <Text className="font-display text-[40px] leading-[43px] text-fundo">Agora, chame a galera</Text>
        <View className="mt-2 gap-3">
          <Item selo="cartas">Cada um desliza os lugares no próprio celular.</Item>
          <Item selo="coracoes">O que mais gente curtir entra primeiro no roteiro.</Item>
          <Item selo="caminho">Todo mundo vê e arruma o mesmo roteiro, ao vivo.</Item>
        </View>
        {aviso ? <Text className="font-body-semibold text-[14px] text-dourado">{aviso}</Text> : null}
      </View>
      <View className="gap-2.5">
        {mandou ? (
          <Botao titulo="Ver a viagem" tipo="claro" aoTocar={seguir} />
        ) : (
          <Botao titulo="Mandar convite" tipo="claro" icone={<Link size={18} color={cor.escuro} />} aoTocar={convidar} />
        )}
        <Pressable onPress={mandou ? convidar : seguir} className="h-12 items-center justify-center">
          <Text className="font-body-bold text-[15px] text-fundo">{mandou ? 'Mandar de novo' : 'Agora não'}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  )
}

function Item({ selo, children }: { selo: NomeDoSelo; children: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-fundo">
        <Selo nome={selo} tamanho={36} />
      </View>
      <Text className="flex-1 font-body text-[15px] leading-[21px] text-creme">{children}</Text>
    </View>
  )
}
