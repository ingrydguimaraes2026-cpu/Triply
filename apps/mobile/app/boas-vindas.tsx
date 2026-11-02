import { useRef, useState, type ComponentRef, type ReactNode } from 'react'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Calendar, Heart, MapPin, ReceiptText, Star, X } from 'lucide-react-native'
import { Agulha } from '../src/ui/Agulha'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao } from '../src/ui/pecas'
import { useTamanhoDaTela } from '../src/ui/Moldura'
import { cor, sombra } from '../theme'

// Boas-vindas (spec 116): 3 telas que contam como o app funciona, na ordem da jornada:
// destino → deslizar os lugares → dividir tudo na viagem. Fotos do Unsplash por enquanto.
const foto = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`

const SLIDES: { t: string; b: string; img: string; mostra: ReactNode }[] = [
  {
    t: 'Diga pra onde e quantos dias',
    b: 'Em 1 minuto a viagem do grupo está criada. Datas e detalhes podem vir depois.',
    img: foto('1507525428034-b723cf961d3e'),
    mostra: (
      <Ficha>
        <MapPin size={18} color={cor.couro} />
        <Text className="font-body-bold text-[15px] text-texto">Jericoacoara</Text>
        <View className="ml-1 flex-row items-center gap-1 rounded-full bg-chip px-2.5 py-1">
          <Calendar size={13} color={cor.couro} />
          <Text className="font-body-semibold text-[12px] text-couro">4 dias</Text>
        </View>
      </Ficha>
    ),
  },
  {
    t: 'Deslizem e o roteiro se monta',
    b: 'Cada um curte os lugares que quer conhecer. O que o grupo mais quer vira o roteiro, dia a dia.',
    img: foto('1529156069898-49953e39b3ac'),
    mostra: (
      <View className="flex-row items-center gap-3">
        <Bolinha tamanho={52}>
          <X size={24} color={cor.vermelho} strokeWidth={2.6} />
        </Bolinha>
        <Bolinha tamanho={44}>
          <Star size={20} color={cor.caramelo} fill={cor.dourado} />
        </Bolinha>
        <Bolinha tamanho={52} principal>
          <Heart size={24} color="#fff" fill="#fff" />
        </Bolinha>
      </View>
    ),
  },
  {
    t: 'E na viagem, tudo num lugar só',
    b: 'Contas divididas sem planilha, hospedagem, transporte e as fotos de todo mundo.',
    img: foto('1414235077428-338989a2e8c0'),
    mostra: (
      <Ficha>
        <ReceiptText size={18} color={cor.couro} />
        <Text className="font-body-semibold text-[14px] text-corpo">Jantar · 4 pessoas</Text>
        <Text className="ml-1 font-body-bold text-[14px] text-verde">Você recebe R$ 120</Text>
      </Ficha>
    ),
  },
]

export default function BoasVindas() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width, height } = useTamanhoDaTela()
  const [atual, setAtual] = useState(0)
  const rolagem = useRef<ComponentRef<typeof ScrollView>>(null)
  const alturaDaFoto = Math.round(height * (height < 760 ? 0.44 : 0.52))

  const irPara = (modo: 'entrar' | 'criar') => router.push({ pathname: '/login', params: { modo } })
  const ultimo = atual === SLIDES.length - 1

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="light" />
      <ScrollView
        ref={rolagem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={64}
      >
        {SLIDES.map((s) => (
          <View key={s.t} style={{ width, height }}>
            <ImageBackground source={{ uri: s.img }} resizeMode="cover" style={{ height: alturaDaFoto, overflow: 'hidden', borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
              <LinearGradient colors={['rgba(30,20,11,0.45)', 'rgba(30,20,11,0)', 'rgba(30,20,11,0.25)']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
              {/* O que a tela mostra, em miniatura, sobre a foto */}
              <View className="absolute bottom-7 left-0 right-0 items-center">{s.mostra}</View>
            </ImageBackground>
            <View className="px-7 pt-8">
              <Text className="font-display text-[34px] leading-[38px] text-texto">{s.t}</Text>
              <Text className="mt-3 font-body text-[16px] leading-6 text-corpo">{s.b}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Marca no topo */}
      <View className="absolute left-6 right-5 flex-row items-center justify-between" style={{ top: insets.top + 10 }} pointerEvents="box-none">
        <View className="flex-row items-center gap-1">
          <View className="-ml-2 -my-3">
            <Agulha tamanho={52} sombra={false} />
          </View>
          <Text className="font-display text-[22px] text-white">Tripwave</Text>
        </View>
        {!ultimo ? (
          <Pressable onPress={() => rolagem.current?.scrollTo({ x: (SLIDES.length - 1) * width, animated: true })} className="rounded-full bg-black/25 px-3.5 py-2">
            <Text className="font-body-semibold text-[13px] text-white">Pular</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="absolute left-6 right-6 gap-3" style={{ bottom: insets.bottom + 24 }} pointerEvents="box-none">
        <View className="mb-2 flex-row gap-1.5">
          {SLIDES.map((s, i) => (
            <View key={s.t} className={`h-2 rounded ${i === atual ? 'w-6 bg-couro' : 'w-2 bg-[#E3D2B8]'}`} />
          ))}
        </View>
        <Botao
          titulo={ultimo ? 'Criar minha conta' : 'Continuar'}
          aoTocar={() => (ultimo ? irPara('criar') : rolagem.current?.scrollTo({ x: (atual + 1) * width, animated: true }))}
        />
        <Pressable onPress={() => irPara('entrar')} className="h-11 items-center justify-center">
          <Text className="font-body-semibold text-[15px] text-couro">Já tenho conta</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Ficha({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row items-center gap-2 rounded-2xl bg-cartao px-4 py-3" style={sombra.hero}>
      {children}
    </View>
  )
}

function Bolinha({ children, tamanho, principal }: { children: ReactNode; tamanho: number; principal?: boolean }) {
  return (
    <View className={`items-center justify-center rounded-full ${principal ? 'bg-couro' : 'bg-cartao'}`} style={[{ width: tamanho, height: tamanho }, sombra.hero]}>
      {children}
    </View>
  )
}
