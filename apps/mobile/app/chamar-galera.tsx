import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Link } from '../src/ui/icones'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { convidarProComboio } from '../src/lib/convite'
import { Norti } from '../src/ui/Norti'
import { Foto } from '../src/ui/Foto'
import { useCapas } from '../src/dados/useCapas'
import { periodo } from '../src/lib/formato'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao } from '../src/ui/pecas'
import { cor, fonte } from '../theme'

// Chamar a galera (pode pular): vem depois de criar a viagem (primeiro minuto, 16/11/2026) ou do roteiro guiado.
// Depois daqui, a pessoa cai no dashboard da viagem.
// 10/11: no lugar da lista de vantagens, a prévia de como o convite chega no grupo
// (referência: Rhyme). Ver antes o que a galera vai receber tira o medo de mandar.
export default function ChamarGalera() {
  const { viagem: id } = useLocalSearchParams<{ viagem: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { viagens } = useViagemAtual()
  const viagem = viagens.find((v) => v.id === id)
  const [aviso, setAviso] = useState<string | null>(null)
  const [mandou, setMandou] = useState(false)
  const capa = useCapas(id ? [id] : [])
  // Endereço sem viagem (caso de borda, QA 16/11): não há o que convidar, volta pro Início
  if (!id) return <Redirect href="/" />

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
          <Norti humor="feliz" tamanho={88} />
        </View>
        <Text className="font-body-semibold text-[13px] uppercase tracking-wider text-creme">{viagem ? `Viagem pra ${viagem.nome.replace(/^viagem pra /i, '')} criada` : 'Viagem criada'}</Text>
        <Text className="font-display text-[40px] leading-[43px] text-fundo">Agora, chame a galera</Text>
        <Text style={{ fontFamily: fonte.corpoMedio, fontSize: 15, lineHeight: 21, color: 'rgba(245,233,214,0.85)' }}>É assim que chega no grupo. Cada um topa com um toque, sem baixar nada.</Text>

        {/* Prévia da mensagem no grupo */}
        <View className="rounded-[20px] p-3" style={{ backgroundColor: 'rgba(42,27,14,0.55)' }}>
          <Text style={{ fontFamily: fonte.corpoForte, fontSize: 10.5, letterSpacing: 0.6, color: 'rgba(245,233,214,0.55)', textAlign: 'center', marginBottom: 8 }}>GRUPO DA GALERA</Text>
          <View className="self-end overflow-hidden" style={{ width: '84%', backgroundColor: '#5A3A1C', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 }}>
            {id && capa(id) ? <Foto source={capa(id)} style={{ height: 96, width: '100%' }} /> : <LinearGradient colors={[cor.couro, cor.escuro]} style={{ height: 96 }} />}
            <View className="px-2.5 py-2">
              <Text style={{ fontFamily: fonte.titulo, fontSize: 15, lineHeight: 17, letterSpacing: -0.2, color: cor.creme }}>{viagem ? `Bora pra ${viagem.nome.replace(/^viagem pra /i, '')} com a galera?` : 'Bora com a galera?'}</Text>
              {viagem?.dataInicio ? (
                <Text style={{ fontFamily: fonte.corpoMedio, fontSize: 11.5, color: 'rgba(245,233,214,0.65)', marginTop: 2 }}>{periodo(viagem.dataInicio, viagem.dataFim)}</Text>
              ) : null}
              <Text style={{ fontFamily: fonte.corpoForte, fontSize: 11, color: cor.dourado, marginTop: 4 }}>Toque pra topar · Norti</Text>
            </View>
          </View>
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
