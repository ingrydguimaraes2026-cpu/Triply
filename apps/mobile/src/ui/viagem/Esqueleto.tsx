import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { ALTURA_DA_CAPA } from './Secoes'
import { useReducedMotion } from '../movimento'
import { titulo, trabalho } from '../../../theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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

// Primeira carga das outras abas (Roteiro, Reservas, Contas, Fotos): o título de verdade e
// blocos creme no formato da tela, pulsando de leve. Depois da primeira vez a aba abre na hora
// (o useCarregar guarda o último resultado), então isso só aparece uma vez.
type FormaDaAba = 'roteiro' | 'contas' | 'fotos' | 'passagens' | 'hospedagem'
const TITULO_DA_FORMA: Record<FormaDaAba, string> = {
  roteiro: 'Roteiro',
  contas: 'Contas',
  fotos: 'Fotos',
  passagens: 'Passagens',
  hospedagem: 'Hospedagem',
}

export function EsqueletoDaAba({ forma, titulo: comTitulo = true }: { forma: FormaDaAba; titulo?: boolean }) {
  const reduzir = useReducedMotion()
  const insets = useSafeAreaInsets() // dentro das abas o topo já vem 0 (o cabeçalho cuidou)
  const brilho = useSharedValue(1)
  useEffect(() => {
    if (!reduzir) brilho.value = withRepeat(withTiming(0.55, { duration: 800 }), -1, true)
  }, [brilho, reduzir])
  const pulso = useAnimatedStyle(() => ({ opacity: brilho.value }))
  const bloco = { backgroundColor: trabalho.superficie2 }
  const cartao = { backgroundColor: trabalho.superficie, borderColor: trabalho.linha, borderWidth: 1 }
  return (
    <View className="flex-1" style={{ backgroundColor: trabalho.fundo, paddingTop: insets.top }} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      {comTitulo ? (
        <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 }}>
          <Animated.View className="h-[11px] w-[110px] rounded-full" style={[bloco, pulso]} />
          <Text style={[titulo(32), { color: trabalho.texto, marginTop: 6 }]}>{TITULO_DA_FORMA[forma]}</Text>
        </View>
      ) : (
        <View style={{ height: 8 }} />
      )}
      <Animated.View className="gap-3 px-[14px]" style={pulso}>
        {forma === 'roteiro' ? (
          <>
            <View className="flex-row gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} className="h-[58px] w-[54px] rounded-[16px]" style={i === 0 ? { backgroundColor: trabalho.acento, opacity: 0.25 } : cartao} />
              ))}
            </View>
            {[0, 1, 2].map((i) => (
              <View key={i} className="h-[84px] rounded-[20px]" style={cartao} />
            ))}
          </>
        ) : forma === 'contas' ? (
          <>
            <View className="h-[168px] rounded-[24px]" style={cartao} />
            {[0, 1, 2, 3].map((i) => (
              <View key={i} className="flex-row items-center gap-3 rounded-[18px] p-3" style={cartao}>
                <View className="h-9 w-9 rounded-full" style={bloco} />
                <View className="flex-1 gap-2">
                  <View className="h-[11px] w-3/5 rounded-full" style={bloco} />
                  <View className="h-[9px] w-2/5 rounded-full" style={bloco} />
                </View>
              </View>
            ))}
          </>
        ) : forma === 'fotos' ? (
          <>
            <View className="flex-row gap-2">
              <View className="h-[34px] w-[84px] rounded-full" style={cartao} />
              <View className="h-[34px] w-[84px] rounded-full" style={cartao} />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} className="aspect-square rounded-[16px]" style={[bloco, { width: '48.5%' }]} />
              ))}
            </View>
          </>
        ) : (
          [0, 1, 2].map((i) => <View key={i} className="h-[120px] rounded-[22px]" style={cartao} />)
        )}
      </Animated.View>
    </View>
  )
}
