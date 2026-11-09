import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Image, Platform, View } from 'react-native'

// A Norti: mascote e nome do app (uma bússola em forma de pino de mapa, de chapéu de safári).
// As poses são as mesmas do site (assets/norti, vindas de docs/marketing/norti/app-web).
// Lá quem anima é o mascot.js; aqui imitamos os movimentos dele com Animated:
//   parada   → respira, balança de leve e pisca     feliz    → pula
//   dormindo → respira fundo e solta "z"            pensando → balança devagar (carregando)
//   oi       → acena                                 ops      → chacoalha (erro)
//   apontando→ aponta pra uma dica                   amor     → bate como coração
export type Humor = 'parada' | 'feliz' | 'dormindo' | 'pensando' | 'oi' | 'ops' | 'apontando' | 'amor'

const POSES = {
  idle: require('../../assets/norti/idle.webp'),
  blink: require('../../assets/norti/blink.webp'),
  celebrate: require('../../assets/norti/celebrate.webp'),
  sleep: require('../../assets/norti/sleep.webp'),
  think: require('../../assets/norti/think.webp'),
  wave: require('../../assets/norti/wave.webp'),
  oops: require('../../assets/norti/oops.webp'),
  point: require('../../assets/norti/point.webp'),
  love: require('../../assets/norti/love.webp'),
}

// Pose de cada humor e quanto dura meia volta do movimento (ms)
const JEITO: Record<Humor, { pose: keyof typeof POSES; ritmo: number }> = {
  parada: { pose: 'idle', ritmo: 1800 },
  feliz: { pose: 'celebrate', ritmo: 450 },
  dormindo: { pose: 'sleep', ritmo: 2200 },
  pensando: { pose: 'think', ritmo: 1200 },
  oi: { pose: 'wave', ritmo: 300 },
  ops: { pose: 'oops', ritmo: 90 },
  apontando: { pose: 'point', ritmo: 500 },
  amor: { pose: 'love', ritmo: 380 },
}

const CHAO = 0.94 // onde ficam os pés no desenho (mesmo "ground" do mascot.json)
const nativo = Platform.OS !== 'web' // o web não tem driver nativo de animação

type Props = { humor?: Humor; tamanho?: number; sombra?: boolean }

export function Norti({ humor = 'parada', tamanho = 120, sombra = true }: Props) {
  const { pose, ritmo } = JEITO[humor]
  const v = useVaiVem(ritmo)
  const piscando = usePiscar(humor === 'parada')

  // De "a" até "b" acompanhando o vai e vem (número pra mover/esticar, "Xdeg" pra girar)
  const entre = (a: number | string, b: number | string) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [a, b] as string[] })
  const transform =
    humor === 'feliz'
      ? [{ translateY: entre(0, -tamanho * 0.14) }]
      : humor === 'dormindo'
        ? [{ scaleX: entre(1, 1.012) }, { scaleY: entre(1, 1.03) }]
        : humor === 'pensando'
          ? [{ translateY: entre(0, -tamanho * 0.018) }, { rotate: entre('-1.5deg', '1.5deg') }]
          : humor === 'oi'
            ? [{ rotate: entre('-3deg', '3.5deg') }]
            : humor === 'ops'
              ? [{ translateX: entre(-tamanho * 0.02, tamanho * 0.02) }]
              : humor === 'apontando'
                ? [{ rotate: entre('0deg', '2.5deg') }]
                : humor === 'amor'
                  ? [{ scaleX: entre(1, 1.02) }, { scaleY: entre(1, 1.035) }]
                  : [{ scaleY: entre(1, 1.016) }, { scaleX: entre(1, 0.992) }, { rotate: entre('-0.6deg', '0.6deg') }]

  const camada = { position: 'absolute' as const, width: tamanho, height: tamanho }
  return (
    <View style={{ width: tamanho, height: tamanho }}>
      {sombra ? (
        <View
          style={{
            position: 'absolute',
            top: tamanho * CHAO - tamanho * 0.016,
            left: tamanho * 0.27,
            width: tamanho * 0.46,
            height: tamanho * 0.032,
            borderRadius: tamanho,
            backgroundColor: '#3B2715',
            opacity: 0.14,
          }}
        />
      ) : null}
      <Animated.View style={{ width: tamanho, height: tamanho, transform, transformOrigin: `50% ${CHAO * 100}%` }}>
        <Image source={POSES[pose]} style={[camada, { opacity: piscando ? 0 : 1 }]} />
        {/* A pose de olhos fechados fica embaixo, já carregada, pra piscar sem atraso */}
        {humor === 'parada' ? <Image source={POSES.blink} style={[camada, { opacity: piscando ? 1 : 0 }]} /> : null}
      </Animated.View>
      {humor === 'dormindo' ? <Zzz tamanho={tamanho} /> : null}
    </View>
  )
}

// Valor que vai de 0 a 1 e volta, sem parar
function useVaiVem(duracao: number) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: duracao, easing: Easing.inOut(Easing.ease), useNativeDriver: nativo }),
        Animated.timing(v, { toValue: 0, duration: duracao, easing: Easing.inOut(Easing.ease), useNativeDriver: nativo }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [duracao, v])
  return v
}

// Pisca a cada ~3,5 s (troca pela pose de olhos fechados por um instante)
function usePiscar(ligado: boolean) {
  const [piscando, setPiscando] = useState(false)
  useEffect(() => {
    if (!ligado) return
    let abrir: ReturnType<typeof setTimeout>
    const ciclo = setInterval(() => {
      setPiscando(true)
      abrir = setTimeout(() => setPiscando(false), 130)
    }, 3500)
    return () => {
      clearInterval(ciclo)
      clearTimeout(abrir)
    }
  }, [ligado])
  return piscando
}

// Dois "z" que sobem e somem (humor "dormindo")
function Zzz({ tamanho }: { tamanho: number }) {
  return (
    <>
      <Z atraso={0} tamanho={tamanho} fonte={0.13} x={0.72} y={0.22} />
      <Z atraso={1300} tamanho={tamanho} fonte={0.09} x={0.8} y={0.14} />
    </>
  )
}

function Z({ atraso, tamanho, fonte, x, y }: { atraso: number; tamanho: number; fonte: number; x: number; y: number }) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(atraso),
        Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.out(Easing.ease), useNativeDriver: nativo }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: nativo }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [atraso, v])
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: tamanho * x,
        top: tamanho * y,
        fontSize: tamanho * fonte,
        fontWeight: '800',
        color: '#7B542F',
        opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, tamanho * 0.08] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -tamanho * 0.18] }) },
        ],
      }}
    >
      z
    </Animated.Text>
  )
}
