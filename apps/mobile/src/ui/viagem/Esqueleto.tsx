import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { ALTURA_DA_CAPA } from './Secoes'
import { useReducedMotion } from '../movimento'

// Carregando a aba Viagem: blocos com a mesma forma das seções (sem spinner no meio da tela)
export function EsqueletoDaViagem() {
  const reduzir = useReducedMotion()
  const brilho = useSharedValue(0.5)
  useEffect(() => {
    if (!reduzir) brilho.value = withRepeat(withTiming(1, { duration: 700 }), -1, true)
  }, [brilho, reduzir])
  const pulso = useAnimatedStyle(() => ({ opacity: brilho.value }))
  return (
    <Animated.View className="flex-1 bg-fundo" style={pulso}>
      <View className="bg-areia" style={{ height: ALTURA_DA_CAPA }} />
      <View className="gap-6 px-5 pt-5">
        <View className="flex-row gap-3.5">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="h-[58px] w-[58px] rounded-full bg-areia" />
          ))}
        </View>
        <View className="h-[200px] rounded-3xl bg-areia" />
        <View className="h-[90px] rounded-2xl bg-areia" />
        <View className="flex-row gap-3">
          <View className="h-[140px] w-[150px] rounded-2xl bg-areia" />
          <View className="h-[140px] w-[150px] rounded-2xl bg-areia" />
        </View>
      </View>
    </Animated.View>
  )
}
