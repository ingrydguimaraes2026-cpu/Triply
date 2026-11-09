import { useEffect, type ReactNode } from 'react'
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from 'react-native-reanimated'
import { Norti } from './Norti'
import { duracao, mola, tum, useReducedMotion } from './movimento'
import { cor } from '../../theme'

// Comemoração dos marcos (spec 117): carimbo novo, deu match, fim da viagem.
// Fundo couro escuro, a Norti (ou a foto) entra com mola e cai um confete simples.
// A Norti só aparece aqui, nos marcos. Nunca em toda tela.
type Props = {
  visivel: boolean
  acima: string // "CARIMBO 5 DE 6"
  titulo: string
  texto?: string
  topo?: ReactNode // no lugar da Norti (ex.: foto redonda do lugar do match)
  desenho?: ReactNode // embaixo do título (ex.: o selo grande)
  botoes: { titulo: string; aoTocar: () => void; icone?: ReactNode; principal?: boolean }[]
  aoFechar: () => void
}

export function Comemoracao({ visivel, acima, titulo, texto, topo, desenho, botoes, aoFechar }: Props) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar} statusBarTranslucent>
      {visivel ? <Conteudo {...{ acima, titulo, texto, topo, desenho, botoes }} /> : null}
    </Modal>
  )
}

function Conteudo({ acima, titulo, texto, topo, desenho, botoes }: Omit<Props, 'visivel' | 'aoFechar'>) {
  const reduzir = useReducedMotion()
  const entrada = useSharedValue(0)
  useEffect(() => {
    entrada.value = reduzir ? withTiming(1, { duration: duracao.media }) : withSpring(1, mola.solta)
    tum(true)
  }, [entrada, reduzir])
  const estiloDoTopo = useAnimatedStyle(() => ({
    opacity: Math.min(1, entrada.value),
    transform: reduzir ? [] : [{ translateY: (1 - entrada.value) * -60 }, { scale: 0.6 + entrada.value * 0.4 }],
  }))
  const estiloDoTexto = useAnimatedStyle(() => ({
    opacity: Math.min(1, entrada.value),
    transform: reduzir ? [] : [{ translateY: (1 - entrada.value) * 24 }],
  }))

  return (
    <View className="flex-1 items-center justify-center px-7" style={{ backgroundColor: '#3B2715' }}>
      {reduzir ? null : <Confete />}
      <Animated.View style={estiloDoTopo} className="items-center">
        {topo ?? <Norti humor="feliz" tamanho={150} />}
      </Animated.View>
      <Animated.View style={estiloDoTexto} className="mt-5 items-center self-stretch">
        <Text className="font-body-bold text-[12px] uppercase tracking-widest" style={{ color: cor.dourado }}>
          {acima}
        </Text>
        <Text className="mt-2 text-center font-display text-[34px] leading-[38px] text-white">{titulo}</Text>
        {desenho ? <View className="my-5">{desenho}</View> : null}
        {texto ? <Text className="text-center font-body text-[15px] leading-6 text-creme">{texto}</Text> : null}
        <View className="mt-7 gap-3 self-stretch">
          {botoes.map((b) => (
            <Pressable
              key={b.titulo}
              onPress={b.aoTocar}
              className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90 ${b.principal ? 'bg-fundo' : 'border border-[#7B542F]'}`}
            >
              {b.icone}
              <Text className={`font-body-bold text-[16px] ${b.principal ? 'text-escuro' : 'text-creme'}`}>{b.titulo}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  )
}

// Confete simples: papeizinhos dourados caindo e girando (só Reanimated, sem Lottie)
const CORES_DO_CONFETE = [cor.dourado, cor.caramelo, cor.creme, '#C99257']
function Confete() {
  const { width, height } = useWindowDimensions()
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {Array.from({ length: 26 }, (_, i) => (
        <Papel key={i} i={i} largura={width} altura={height} />
      ))}
    </View>
  )
}

function Papel({ i, largura, altura }: { i: number; largura: number; altura: number }) {
  const queda = useSharedValue(0)
  // Posição e ritmo "aleatórios" mas fixos por índice (não mudam a cada render)
  const x = ((i * 37) % 100) / 100
  const tempo = 2200 + ((i * 53) % 9) * 180
  useEffect(() => {
    queda.value = withDelay((i % 8) * 120, withRepeat(withTiming(1, { duration: tempo, easing: Easing.linear }), 2, false))
  }, [queda, i, tempo])
  const estilo = useAnimatedStyle(() => ({
    opacity: queda.value > 0.92 ? (1 - queda.value) * 12 : 1,
    transform: [
      { translateX: x * largura + Math.sin(queda.value * 6 + i) * 18 },
      { translateY: -20 + queda.value * (altura + 40) },
      { rotate: `${queda.value * 540 + i * 30}deg` },
    ],
  }))
  return (
    <Animated.View
      style={[{ position: 'absolute', width: i % 3 ? 7 : 10, height: i % 3 ? 12 : 6, borderRadius: 2, backgroundColor: CORES_DO_CONFETE[i % CORES_DO_CONFETE.length] }, estilo]}
    />
  )
}
