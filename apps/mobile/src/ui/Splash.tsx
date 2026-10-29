import { useEffect, useRef } from 'react'
import { Animated, Easing, Platform, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Malinha } from './Malinha'

// Abertura (tela "1o" do design): a Malinha entra com mola, depois "Together" e
// "Viajem juntos.", com três pontinhos pulando embaixo.
const nativo = Platform.OS !== 'web'

export function Splash() {
  const mala = useRef(new Animated.Value(0)).current
  const nome = useRef(new Animated.Value(0)).current
  const frase = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(mala, { toValue: 1, friction: 5, tension: 60, useNativeDriver: nativo }),
      Animated.timing(nome, { toValue: 1, duration: 700, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: nativo }),
      Animated.timing(frase, { toValue: 1, duration: 700, delay: 400, easing: Easing.out(Easing.cubic), useNativeDriver: nativo }),
    ]).start()
  }, [mala, nome, frase])

  const subir = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  })

  return (
    <LinearGradient colors={['#F6E4C6', '#FBF3E6']} start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center gap-[18px] pb-10">
        <Animated.View style={subir(mala)}>
          <Malinha tamanho={190} />
        </Animated.View>
        <Animated.Text style={[{ fontFamily: 'Fraunces_600SemiBold', fontSize: 48, letterSpacing: -1, color: '#3B2715' }, subir(nome)]}>
          Together
        </Animated.Text>
        <Animated.Text style={[{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#6E5540' }, subir(frase)]}>
          Viajem juntos.
        </Animated.Text>
      </View>
      <View className="absolute bottom-[70px] left-0 right-0 flex-row justify-center gap-2">
        {[0, 150, 300].map((atraso) => (
          <Pontinho key={atraso} atraso={atraso} />
        ))}
      </View>
    </LinearGradient>
  )
}

function Pontinho({ atraso }: { atraso: number }) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(atraso),
        Animated.timing(v, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: nativo }),
        Animated.timing(v, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: nativo }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [atraso, v])
  return (
    <Animated.View
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#B97A22', transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }}
    />
  )
}
