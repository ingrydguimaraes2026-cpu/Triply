import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { cssInterop } from 'nativewind'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from 'react-native-reanimated'

// Regras de animação do app (spec 117, parte "Motion"):
// - mola, não linha reta (withSpring sem quique exagerado);
// - com "Reduzir movimento" ligado no celular, tudo vira só fade.

// Molas padrão. `mola` serve pra quase tudo; `firme` pra coisa pequena (botão, selo);
// `solta` pra coisa grande que entra na tela (cartão, folha).
export const mola = {
  padrao: { damping: 18, stiffness: 180, mass: 1 } satisfies WithSpringConfig,
  firme: { damping: 20, stiffness: 320, mass: 0.8 } satisfies WithSpringConfig,
  solta: { damping: 16, stiffness: 120, mass: 1 } satisfies WithSpringConfig,
}

// Durações em ms (fade de quem pediu menos movimento, e transições curtas)
export const duracao = { rapida: 160, media: 260, lenta: 420 }

// Entrada em cascata das seções: cada uma 40 ms depois da outra, sobe 12 px e aparece
export const CASCATA_MS = 40
export const SUBIDA_PX = 12

export { useReducedMotion }

// Deixa usar className (Tailwind) nos componentes animados, como nos normais
cssInterop(Animated.View, { className: 'style' })
cssInterop(Animated.Text, { className: 'style' })
cssInterop(Animated.ScrollView, { className: 'style', contentContainerClassName: 'contentContainerStyle' })

// Estilo de entrada em cascata. Ex.: <Animated.View style={useCascata(2)}>…
export function useCascata(indice: number) {
  const reduzir = useReducedMotion()
  const p = useSharedValue(0)
  useEffect(() => {
    const atraso = indice * CASCATA_MS
    p.value = reduzir ? withDelay(atraso, withTiming(1, { duration: duracao.media })) : withDelay(atraso, withSpring(1, mola.padrao))
  }, [indice, reduzir, p])
  return useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: reduzir ? [] : [{ translateY: (1 - p.value) * SUBIDA_PX }],
  }))
}

// Leva um valor até o alvo com mola (ou fade/tempo curto se reduzir movimento)
export function animar(alvo: number, reduzir: boolean, config: WithSpringConfig = mola.padrao) {
  'worklet'
  return reduzir ? withTiming(alvo, { duration: duracao.rapida }) : withSpring(alvo, config)
}

// Número que corre até o valor novo (barra de votos, saldo). Devolve o número da vez.
export function useNumeroAnimado(valor: number, ms = 600) {
  const reduzir = useReducedMotion()
  const [mostrado, setMostrado] = useState(valor)
  const anterior = useRef(valor)
  useEffect(() => {
    const de = anterior.current
    anterior.current = valor
    if (reduzir || de === valor) return setMostrado(valor)
    const inicio = Date.now()
    let quadro = 0
    const passo = () => {
      const t = Math.min(1, (Date.now() - inicio) / ms)
      const suave = 1 - Math.pow(1 - t, 3)
      setMostrado(de + (valor - de) * suave)
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [valor, ms, reduzir])
  return mostrado
}

// "Tum": vibração leve do carimbo e da comemoração (no navegador não faz nada)
export function tum(forte = false) {
  if (Platform.OS === 'web') return
  void Haptics.impactAsync(forte ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}
