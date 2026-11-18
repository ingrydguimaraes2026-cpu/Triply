import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { Foto } from '../Foto'
import { Icone } from '../Icone'
import { Avatar } from '../pecas'
import { mola, useReducedMotion } from '../movimento'
import { cor, fonte, trabalho } from '../../../theme'

// Bilhete da viagem: o objeto-herói do caminho B (embarque.html, tela "Viagem (antes)").
// Chega girando de baixo, fica inclinado e balança devagar, e um brilho passa por cima de vez em quando.
// Com "Reduzir movimento" ligado ele só aparece, parado.
type Props = {
  foto: { uri: string } | undefined
  de: string
  para: string
  data: string
  noites: string
  pessoas: string[]
  aoTocar?: () => void
}

const LARGURA = 176

export function Bilhete({ foto, de, para, data, noites, pessoas, aoTocar }: Props) {
  const reduzir = useReducedMotion()
  const chegada = useSharedValue(reduzir ? 1 : 0)
  const balanco = useSharedValue(0)
  const brilho = useSharedValue(0)

  useEffect(() => {
    if (reduzir) {
      chegada.value = 1
      return
    }
    chegada.value = withSpring(1, mola.entrar)
    // Balanço: vai e volta em 4,2 s, pra sempre
    balanco.value = withDelay(900, withRepeat(withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.ease) }), -1, true))
    // Brilho: passa em 1,1 s, espera 2,8 s, passa de novo
    brilho.value = withDelay(800, withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), withDelay(2800, withTiming(0, { duration: 0 }))), -1))
  }, [reduzir, chegada, balanco, brilho])

  const estilo = useAnimatedStyle(() => {
    const c = chegada.value
    const b = balanco.value
    // Descanso: rotateX(10) rotateY(-10) rotateZ(-3); balanço leva até rotateX(-4) rotateY(12) rotateZ(-2)
    const rx = interpolate(c, [0, 1], [55, interpolate(b, [0, 1], [10, -4])])
    const ry = interpolate(c, [0, 1], [0, interpolate(b, [0, 1], [-10, 12])])
    const rz = interpolate(c, [0, 1], [-24, interpolate(b, [0, 1], [-3, -2])])
    return {
      opacity: interpolate(c, [0, 0.2], [0, 1], 'clamp'),
      transform: [
        { perspective: 900 },
        { translateY: interpolate(c, [0, 1], [300, 0]) },
        { rotateX: `${rx}deg` },
        { rotateY: `${ry}deg` },
        { rotateZ: `${rz}deg` },
        { scale: interpolate(c, [0, 1], [0.7, 1]) },
      ],
    }
  })
  // `flex: 1` vem no próprio estilo animado: o brilho preenche a faixa (View comum por fora)
  const estiloDoBrilho = useAnimatedStyle(() => ({ flex: 1, transform: [{ translateX: interpolate(brilho.value, [0, 1], [-LARGURA * 1.4, LARGURA * 1.4]) }, { rotate: '15deg' }] }))

  return (
    <View className="items-center" style={{ paddingVertical: 6 }}>
      <Pressable onPress={aoTocar} accessibilityRole="button" accessibilityLabel={`Bilhete: ${de} para ${para}, ${data}`}>
        {/* Android (teste 17/11): num Animated.View do Reanimated, `style={[fixo, animado]}` perde a
            parte fixa. O giro fica no Animated.View; a forma do bilhete numa View comum por dentro. */}
        <Animated.View style={estilo}>
        <View style={{ width: LARGURA, borderRadius: 22, backgroundColor: cor.creme, overflow: 'hidden', boxShadow: '0 24px 44px rgba(74,46,20,0.32)' }}>
          {foto ? <Foto source={foto} style={{ height: 100, width: '100%' }} /> : <LinearGradient colors={[cor.couro, cor.escuro]} style={{ height: 100 }} />}
          <View className="flex-row items-end justify-between px-3.5 pt-2.5">
            <Codigo texto={de} />
            <View style={{ marginBottom: 3 }}>
              <Icone nome="aviao" tamanho={16} cor={cor.couro} />
            </View>
            <Codigo texto={para} />
          </View>
          {/* Picote: linha tracejada com os dois "furos" na cor do fundo */}
          <View style={{ marginTop: 11, borderTopWidth: 2, borderStyle: 'dashed', borderColor: cor.borda }}>
            <View style={{ position: 'absolute', top: -10, left: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: trabalho.fundo }} />
            <View style={{ position: 'absolute', top: -10, right: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: trabalho.fundo }} />
          </View>
          <View className="flex-row items-center justify-between px-3.5 pb-3 pt-2">
            <Text style={{ fontFamily: fonte.corpoForte, fontSize: 10.5, color: cor.suave, letterSpacing: 0.4 }}>{data}</Text>
            {pessoas.length > 1 ? (
              <View className="flex-row" style={{ paddingLeft: 7 }}>
                {pessoas.slice(0, 4).map((n, i) => (
                  <View key={i} style={{ marginLeft: -7 }}>
                    <Avatar nome={n} indice={i} tamanho={20} borda={cor.creme} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontFamily: fonte.corpoForte, fontSize: 10.5, color: cor.suave, letterSpacing: 0.4 }}>{noites}</Text>
            )}
          </View>
          {/* Brilho que atravessa o bilhete */}
          <View pointerEvents="none" style={{ position: 'absolute', top: -60, bottom: -60, width: 70, left: LARGURA / 2 - 35 }}>
            <Animated.View style={estiloDoBrilho}>
              <LinearGradient colors={['rgba(255,246,232,0)', 'rgba(255,246,232,0.55)', 'rgba(255,246,232,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
            </Animated.View>
          </View>
        </View>
        </Animated.View>
      </Pressable>
    </View>
  )
}

function Codigo({ texto }: { texto: string }) {
  return (
    <Text numberOfLines={1} style={{ fontFamily: fonte.titulo, fontSize: texto.length > 4 ? 18 : 24, letterSpacing: -0.8, color: cor.texto, maxWidth: 70 }}>
      {texto}
    </Text>
  )
}

// "Lisboa" → "LIS"; sem acento, 3 letras, como o código de um aeroporto
export function codigoDoLugar(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase()
}
