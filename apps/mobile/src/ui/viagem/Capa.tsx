import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { Foto } from '../Foto'
import { mola, useReducedMotion } from '../movimento'
import { cor, fonte } from '../../../theme'

// Capa da viagem (referências: Tripsy e Luggo, 10/11): a foto do destino grande, com o nome
// enorme e as datas por cima. Sem desenho inventado: é o próprio lugar que aparece.
// Chega com a foto se assentando (de 1,06 pra 1); com "Reduzir movimento", só aparece.
type Props = {
  foto: { uri: string } | undefined
  nome: string
  linha: string
  aoTocar?: () => void
}

export function Capa({ foto, nome, linha, aoTocar }: Props) {
  const reduzir = useReducedMotion()
  const p = useSharedValue(reduzir ? 1 : 0)
  useEffect(() => {
    if (!reduzir) p.value = withSpring(1, mola.macia)
  }, [reduzir, p])
  const fotoEstilo = useAnimatedStyle(() => ({ transform: [{ scale: 1.06 - p.value * 0.06 }] }))
  const textoEstilo = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 14 }] }))

  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" accessibilityLabel={`${nome}, ${linha}`} className="mx-3.5 overflow-hidden rounded-[26px] active:opacity-95" style={{ height: 300 }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, fotoEstilo]}>
        {foto ? <Foto source={foto} style={{ width: '100%', height: '100%' }} /> : <LinearGradient colors={[cor.couro, cor.escuro]} style={{ flex: 1 }} />}
      </Animated.View>
      <LinearGradient colors={['rgba(30,18,8,0)', 'rgba(30,18,8,0)', 'rgba(30,18,8,0.82)']} locations={[0, 0.45, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Animated.View style={[{ position: 'absolute', left: 18, right: 18, bottom: 18 }, textoEstilo]}>
        <Text numberOfLines={2} adjustsFontSizeToFit style={{ fontFamily: fonte.titulo, fontSize: 46, lineHeight: 46, letterSpacing: -2, color: cor.creme }}>
          {nome}
        </Text>
        {linha ? <Text style={{ fontFamily: fonte.corpoForte, fontSize: 13, color: 'rgba(245,233,214,0.85)', marginTop: 6 }}>{linha}</Text> : null}
      </Animated.View>
    </Pressable>
  )
}
