import { useRef, useState, type ComponentRef } from 'react'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Botao } from '../src/ui/pecas'
import { useTamanhoDaTela } from '../src/ui/Moldura'

// Onboarding (telas "1a–1c" do design): 3 fotos de viagem que deslizam pro lado.
// Fotos do Unsplash por enquanto (trocar pelas nossas antes de lançar).
const foto = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`

const SLIDES = [
  { t: 'Planejem juntos', b: 'Roteiro, transportes e reservas do grupo inteiro, organizados num lugar só.', img: foto('1529156069898-49953e39b3ac') },
  { t: 'Dividam as contas', b: 'Cada gasto lançado na hora. O Together calcula quem deve quanto, sem planilha.', img: foto('1414235077428-338989a2e8c0') },
  { t: 'Guardem as memórias', b: 'As fotos de todo mundo, juntas e separadas por dia, prontas pra rever.', img: foto('1527631746610-bca00a040d60') },
]

export default function BoasVindas() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width, height } = useTamanhoDaTela()
  const largura = width
  const [atual, setAtual] = useState(0)
  const rolagem = useRef<ComponentRef<typeof ScrollView>>(null)

  const irPara = (modo: 'entrar' | 'criar') => router.push({ pathname: '/login', params: { modo } })

  return (
    <View className="flex-1 bg-escuro">
      <StatusBar style="light" />
      <ScrollView
        ref={rolagem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / largura))}
        onScroll={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / largura))}
        scrollEventThrottle={64}
      >
        {SLIDES.map((s) => (
          <ImageBackground key={s.t} source={{ uri: s.img }} resizeMode="cover" style={{ width: largura, height }}>
            <LinearGradient
              colors={['rgba(30,20,11,0.35)', 'rgba(30,20,11,0)', 'rgba(30,20,11,0)', 'rgba(42,26,12,0.72)', 'rgba(30,20,11,0.94)']}
              locations={[0, 0.22, 0.42, 0.66, 1]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => irPara('criar')}
        className="absolute right-5 rounded-full bg-fundo/90 px-3.5 py-2"
        style={{ top: insets.top + 12 }}
      >
        <Text className="font-body-semibold text-[13px] text-texto">Pular</Text>
      </Pressable>

      <View className="absolute left-6 right-6 gap-4" style={{ bottom: insets.bottom + 34 }} pointerEvents="box-none">
        <View className="flex-row gap-1.5">
          {SLIDES.map((s, i) => (
            <View key={s.t} className={`h-2 rounded ${i === atual ? 'w-6 bg-fundo' : 'w-2 bg-fundo/40'}`} />
          ))}
        </View>
        <Text className="font-display text-[40px] leading-[42px] text-white">{SLIDES[atual].t}</Text>
        <Text className="mb-3 font-body text-[16px] leading-6 text-creme">{SLIDES[atual].b}</Text>
        <Botao
          titulo={atual < SLIDES.length - 1 ? 'Continuar' : 'Começar'}
          tipo="claro"
          aoTocar={() => {
            if (atual < SLIDES.length - 1) rolagem.current?.scrollTo({ x: (atual + 1) * largura, animated: true })
            else irPara('criar')
          }}
        />
        <Pressable onPress={() => irPara('entrar')} className="h-11 items-center justify-center">
          <Text className="font-body-semibold text-[15px] text-white">Já tenho conta</Text>
        </Pressable>
      </View>
    </View>
  )
}
