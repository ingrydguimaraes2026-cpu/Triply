import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Platform, View } from 'react-native'
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg'

// A Malinha: mascote do Together (uma mala com carinha). Desenho vetorial do design
// "Together App" convertido pra react-native-svg. Cada humor tem um jeito de se mexer:
//   parada  → balança devagar e pisca
//   feliz   → pula, olhos fechadinhos de alegria e estrelinhas
//   dormindo→ respira e solta "z"
//   pensando→ chacoalha e olha pros lados (carregando)
export type Humor = 'parada' | 'feliz' | 'dormindo' | 'pensando'

const ESCURO = '#2A1A0C'
const CREME = '#FBF3E6'
const nativo = Platform.OS !== 'web' // o web não tem driver nativo de animação

type Props = { humor?: Humor; tamanho?: number; sombra?: boolean }

export function Malinha({ humor = 'parada', tamanho = 120, sombra = true }: Props) {
  const corpo = useRef(new Animated.Value(0)).current
  const piscando = usePiscar(humor === 'parada' || humor === 'pensando')

  useEffect(() => {
    const dur = { parada: 1400, feliz: 500, dormindo: 1800, pensando: 550 }[humor]
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(corpo, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: nativo }),
        Animated.timing(corpo, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: nativo }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [humor, corpo])

  const transform =
    humor === 'feliz'
      ? [{ translateY: corpo.interpolate({ inputRange: [0, 1], outputRange: [0, -tamanho * 0.12] }) }]
      : humor === 'dormindo'
        ? [{ scaleX: corpo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }, { scaleY: corpo.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }]
        : humor === 'pensando'
          ? [{ rotate: corpo.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) }]
          : [{ translateY: corpo.interpolate({ inputRange: [0, 1], outputRange: [0, -tamanho * 0.035] }) }]

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      {sombra ? (
        <Svg width={tamanho} height={tamanho} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
          <Ellipse cx={60} cy={112} rx={30} ry={4} fill="#3B2715" opacity={0.14} />
        </Svg>
      ) : null}
      <Animated.View style={{ width: tamanho, height: tamanho, transform, transformOrigin: 'bottom' }}>
        <Svg width={tamanho} height={tamanho} viewBox="0 0 120 120">
          {/* alça */}
          <Path d="M44 34 V27 a9 9 0 0 1 9-9 h14 a9 9 0 0 1 9 9 V34" fill="none" stroke="#7B542F" strokeWidth={6} strokeLinecap="round" />
          {/* etiqueta */}
          <Path d="M74 26 L80 40" stroke="#7B542F" strokeWidth={2} strokeLinecap="round" />
          <Rect x={74} y={38} width={14} height={10} rx={3} fill={CREME} stroke="#7B542F" strokeWidth={1.5} />
          {/* rodinhas */}
          <Circle cx={34} cy={106} r={5.5} fill="#3B2715" />
          <Circle cx={86} cy={106} r={5.5} fill="#3B2715" />
          {/* corpo */}
          <Rect x={16} y={32} width={88} height={72} rx={26} fill="#B97A22" />
          <Rect x={31} y={32} width={7} height={72} fill="#8A5A26" opacity={0.45} />
          <Rect x={82} y={32} width={7} height={72} fill="#8A5A26" opacity={0.45} />
          <Path d="M24 50 q4 -9 14 -11" stroke="#E3B572" strokeWidth={3} strokeLinecap="round" fill="none" />
          {/* bochechas */}
          <Ellipse cx={46} cy={78} rx={4.5} ry={2.8} fill="#E58C6A" opacity={0.55} />
          <Ellipse cx={74} cy={78} rx={4.5} ry={2.8} fill="#E58C6A" opacity={0.55} />
          <Olhos humor={humor} piscando={piscando} />
          <Boca humor={humor} />
        </Svg>
      </Animated.View>
      {humor === 'feliz' ? <Estrelas tamanho={tamanho} /> : null}
      {humor === 'dormindo' ? <Zzz tamanho={tamanho} /> : null}
    </View>
  )
}

function Olhos({ humor, piscando }: { humor: Humor; piscando: boolean }) {
  const xs = [51, 69]
  const y = 64
  if (humor === 'feliz')
    return xs.map((x) => <Path key={x} d={`M${x - 5} ${y + 2} Q${x} ${y - 5} ${x + 5} ${y + 2}`} fill="none" stroke={ESCURO} strokeWidth={3} strokeLinecap="round" />)
  if (humor === 'dormindo' || piscando)
    return xs.map((x) => <Path key={x} d={`M${x - 5} ${y} Q${x} ${y + 4} ${x + 5} ${y}`} fill="none" stroke={ESCURO} strokeWidth={2.6} strokeLinecap="round" />)
  return (
    <G>
      {xs.map((x) => (
        <G key={x}>
          <Ellipse cx={x} cy={y} rx={5.5} ry={6.5} fill="#FFFDF8" />
          <Ellipse cx={x} cy={y + 1} rx={3.4} ry={4} fill={ESCURO} />
          <Circle cx={x + 1.3} cy={y - 0.6} r={1.3} fill="#fff" />
        </G>
      ))}
    </G>
  )
}

function Boca({ humor }: { humor: Humor }) {
  const x = 60
  const y = 76
  if (humor === 'feliz')
    return (
      <G>
        <Path d={`M${x - 6} ${y - 1} Q${x} ${y + 9} ${x + 6} ${y - 1} Z`} fill={ESCURO} />
        <Ellipse cx={x} cy={y + 4} rx={3} ry={1.6} fill="#E07A5F" />
      </G>
    )
  if (humor === 'pensando') return <Ellipse cx={x} cy={y + 1} rx={2.4} ry={2.8} fill={ESCURO} />
  if (humor === 'dormindo') return <Path d={`M${x - 3} ${y + 1} h6`} stroke={ESCURO} strokeWidth={2.4} strokeLinecap="round" />
  return <Path d={`M${x - 4} ${y} Q${x} ${y + 4.5} ${x + 4} ${y}`} fill="none" stroke={ESCURO} strokeWidth={2.6} strokeLinecap="round" />
}

// Pisca a cada ~4s (fecha os olhos por um instante)
function usePiscar(ligado: boolean) {
  const [piscando, setPiscando] = useState(false)
  useEffect(() => {
    if (!ligado) return
    let fechar: ReturnType<typeof setTimeout>
    const ciclo = setInterval(() => {
      setPiscando(true)
      fechar = setTimeout(() => setPiscando(false), 140)
    }, 4200)
    return () => {
      clearInterval(ciclo)
      clearTimeout(fechar)
    }
  }, [ligado])
  return piscando
}

// Estrelinhas que aparecem e somem em volta (humor "feliz")
function Estrelas({ tamanho }: { tamanho: number }) {
  const posicoes = [
    { x: 14, y: 34, r: 7, atraso: 0 },
    { x: 106, y: 28, r: 6, atraso: 400 },
    { x: 104, y: 74, r: 4.5, atraso: 800 },
  ]
  return (
    <>
      {posicoes.map((p) => (
        <Pisca key={p.x} atraso={p.atraso} style={{ position: 'absolute', left: ((p.x - p.r) / 120) * tamanho, top: ((p.y - p.r) / 120) * tamanho }}>
          <Svg width={(p.r * 2 * tamanho) / 120} height={(p.r * 2 * tamanho) / 120} viewBox={`0 0 ${p.r * 2} ${p.r * 2}`}>
            <Path
              d={`M${p.r} 0 Q${p.r} ${p.r} ${p.r * 2} ${p.r} Q${p.r} ${p.r} ${p.r} ${p.r * 2} Q${p.r} ${p.r} 0 ${p.r} Q${p.r} ${p.r} ${p.r} 0Z`}
              fill="#E3A04A"
            />
          </Svg>
        </Pisca>
      ))}
    </>
  )
}

function Pisca({ atraso, style, children }: { atraso: number; style: object; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(atraso),
        Animated.timing(v, { toValue: 1, duration: 520, useNativeDriver: nativo }),
        Animated.delay(260),
        Animated.timing(v, { toValue: 0, duration: 520, useNativeDriver: nativo }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [atraso, v])
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] })
  return <Animated.View style={[style, { transform: [{ scale: v }, { rotate }] }]}>{children}</Animated.View>
}

// "z" subindo e sumindo (humor "dormindo")
function Zzz({ tamanho }: { tamanho: number }) {
  return (
    <>
      <Z atraso={0} tamanho={tamanho} fonte={15} x={90} y={22} />
      <Z atraso={1300} tamanho={tamanho} fonte={11} x={96} y={20} />
    </>
  )
}

function Z({ atraso, tamanho, fonte, x, y }: { atraso: number; tamanho: number; fonte: number; x: number; y: number }) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([Animated.delay(atraso), Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.out(Easing.ease), useNativeDriver: nativo }), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: nativo })]),
    )
    anim.start()
    return () => anim.stop()
  }, [atraso, v])
  const escala = tamanho / 120
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x * escala,
        top: y * escala,
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: fonte * escala,
        color: '#7B542F',
        opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 10 * escala] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -22 * escala] }) },
        ],
      }}
    >
      z
    </Animated.Text>
  )
}
