import { useEffect, type ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import Reanimated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { mola } from './movimento'

// Cascata de entrada do caminho B: cada bloco sobe um pouco depois do outro (mola.entrar).
// Com "reduzir movimento" ligado, aparece direto.
export function Entra({ ordem, style, children }: { ordem: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const reduzir = useReducedMotion()
  const p = useSharedValue(reduzir ? 1 : 0)
  useEffect(() => {
    if (!reduzir) p.value = withDelay(ordem * 70, withSpring(1, mola.entrar))
  }, [reduzir, ordem, p])
  const estilo = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 1.4), transform: [{ translateY: (1 - p.value) * 18 }] }))
  return <Reanimated.View style={[style, estilo]}>{children}</Reanimated.View>
}
