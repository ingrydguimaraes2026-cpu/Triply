import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Platform, View } from 'react-native'
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg'

// A Agulha: mascote do Together (uma bússola de chapéu de safári que acena). Desenho
// vetorial do design "Together Mascote" (variante "chapéu e braços") em react-native-svg.
// Cada humor tem um jeito de se mexer:
//   parada  → flutua devagar, pisca, a agulha balança e o braço acena
//   feliz   → pula, olhos fechadinhos de alegria e estrelinhas
//   dormindo→ respira e solta "z"
//   pensando→ chacoalha, olha pros lados e a agulha gira rápido (carregando)
export type Humor = 'parada' | 'feliz' | 'dormindo' | 'pensando'

const ESCURO = '#2A1A0C'
const nativo = Platform.OS !== 'web' // o web não tem driver nativo de animação

type Props = { humor?: Humor; tamanho?: number; sombra?: boolean }

export function Agulha({ humor = 'parada', tamanho = 120, sombra = true }: Props) {
  const corpo = useVaiVem({ parada: 1400, feliz: 500, dormindo: 1800, pensando: 550 }[humor])
  const agulha = useVaiVem(humor === 'pensando' ? 225 : 1400)
  const braco = useVaiVem(700)
  const piscando = usePiscar(humor === 'parada')
  const olhar = useVaiVem(humor === 'pensando' ? 600 : 0)

  const transform =
    humor === 'feliz'
      ? [{ translateY: corpo.interpolate({ inputRange: [0, 1], outputRange: [0, -tamanho * 0.12] }) }]
      : humor === 'dormindo'
        ? [{ scaleX: corpo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }, { scaleY: corpo.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }]
        : humor === 'pensando'
          ? [{ rotate: corpo.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) }]
          : [{ translateY: corpo.interpolate({ inputRange: [0, 1], outputRange: [0, -tamanho * 0.035] }) }]

  const giro = humor === 'pensando' ? ['-35deg', '35deg'] : humor === 'dormindo' ? ['0deg', '0deg'] : ['-10deg', '10deg']
  const camada = { position: 'absolute' as const, width: tamanho, height: tamanho }

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      {sombra ? (
        <Svg width={tamanho} height={tamanho} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
          <Ellipse cx={60} cy={112} rx={30} ry={4} fill="#3B2715" opacity={0.14} />
        </Svg>
      ) : null}
      <Animated.View style={{ width: tamanho, height: tamanho, transform, transformOrigin: 'bottom' }}>
        {/* braço que acena (atrás do corpo, gira pelo ombro) */}
        <Animated.View
          style={[
            camada,
            {
              transformOrigin: '20% 61.7%',
              transform: [{ rotate: humor === 'dormindo' ? '0deg' : braco.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '10deg'] }) }],
            },
          ]}
        >
          <Svg width={tamanho} height={tamanho} viewBox="0 0 120 120">
            <Path d="M24 74 Q12 68 11 55" fill="none" stroke="#7B4E28" strokeWidth={5.5} strokeLinecap="round" />
            <Circle cx={11} cy={52} r={5.5} fill="#A8703F" />
          </Svg>
        </Animated.View>

        <Svg width={tamanho} height={tamanho} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="agulhaOuro" cx="38%" cy="32%" r="72%">
              <Stop offset="0" stopColor="#E9B866" />
              <Stop offset="0.55" stopColor="#C08530" />
              <Stop offset="1" stopColor="#8E5E22" />
            </RadialGradient>
            <RadialGradient id="agulhaRosto" cx="45%" cy="38%" r="68%">
              <Stop offset="0" stopColor="#FFFCF5" />
              <Stop offset="1" stopColor="#F0E0C4" />
            </RadialGradient>
          </Defs>
          {/* pezinhos */}
          <Ellipse cx={46} cy={106} rx={8} ry={4.5} fill="#7B542F" />
          <Ellipse cx={74} cy={106} rx={8} ry={4.5} fill="#7B542F" />
          {/* outro braço, parado */}
          <Path d="M96 76 Q106 84 104 94" fill="none" stroke="#7B4E28" strokeWidth={5.5} strokeLinecap="round" />
          <Circle cx={104} cy={96} r={5.5} fill="#A8703F" />
          {/* caixa dourada e o mostrador */}
          <Circle cx={60} cy={64} r={40} fill="url(#agulhaOuro)" />
          <Circle cx={60} cy={64} r={35} fill="#8E5E22" />
          <Circle cx={60} cy={64} r={32.5} fill="url(#agulhaRosto)" />
          <Path d="M29 45 A36 36 0 0 1 45 29" fill="none" stroke="#F6DB9E" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
          {Array.from({ length: 12 }, (_, i) => (
            <Rect key={i} x={59.3} y={33.5} width={1.4} height={i % 3 ? 2.5 : 4} rx={0.7} fill="#C9A473" transform={`rotate(${i * 30} 60 64)`} />
          ))}
          {/* sobrancelhas */}
          {humor !== 'dormindo' ? (
            <G>
              <Path d="M36 50.5 q6 -4 12 -.5" stroke="#3B2715" strokeWidth={2} strokeLinecap="round" fill="none" />
              <Path d="M72 50 q6 -3.5 12 .5" stroke="#3B2715" strokeWidth={2} strokeLinecap="round" fill="none" />
            </G>
          ) : null}
          {/* bochechas */}
          <Ellipse cx={39} cy={73} rx={4.5} ry={2.8} fill="#E58C6A" opacity={0.55} />
          <Ellipse cx={81} cy={73} rx={4.5} ry={2.8} fill="#E58C6A" opacity={0.55} />
          <Olhos humor={humor} piscando={piscando} />
          <Boca humor={humor} />
          {/* chapéu de safári */}
          <G transform="rotate(-8 60 28)">
            <Ellipse cx={60} cy={30} rx={36} ry={7.5} fill="#7B4E28" />
            <Path d="M40 30 Q41 11 60 11 Q79 11 80 30Z" fill="#A8703F" />
            <Path d="M40.6 25 Q60 21 79.4 25 L79.8 29.5 Q60 26 40.2 29.5Z" fill="#5E3D20" />
            <Path d="M47 18 Q52 14 58 14" stroke="#C99257" strokeWidth={2} strokeLinecap="round" fill="none" />
          </G>
        </Svg>

        {/* pupilas que olham pros lados (pensando) */}
        {humor === 'pensando' ? (
          <Animated.View style={[camada, { transform: [{ translateX: olhar.interpolate({ inputRange: [0, 1], outputRange: [-tamanho * 0.02, tamanho * 0.02] }) }] }]}>
            <Svg width={tamanho} height={tamanho} viewBox="0 0 120 120">
              {[42, 78].map((x) => (
                <G key={x}>
                  <Ellipse cx={x} cy={61} rx={3.4} ry={4} fill={ESCURO} />
                  <Circle cx={x + 1.3} cy={59.4} r={1.3} fill="#fff" />
                </G>
              ))}
            </Svg>
          </Animated.View>
        ) : null}

        {/* a agulha da bússola (gira pelo pino do meio) */}
        <Animated.View
          style={[camada, { transformOrigin: '50% 51.7%', transform: [{ rotate: agulha.interpolate({ inputRange: [0, 1], outputRange: giro }) }] }]}
        >
          <Svg width={tamanho} height={tamanho} viewBox="0 0 120 120">
            <Path d="M60 38 L60 62 L54 62Z" fill="#E06A4E" />
            <Path d="M60 38 L66 62 L60 62Z" fill="#B5462F" />
            <Path d="M60 80 L60 62 L54 62Z" fill="#8E6A3E" />
            <Path d="M60 80 L66 62 L60 62Z" fill="#6B4A2A" />
            <Circle cx={60} cy={62} r={3.2} fill="#C08530" />
            <Circle cx={59.2} cy={61.2} r={1.1} fill="#FFF3D6" />
          </Svg>
        </Animated.View>
      </Animated.View>
      {humor === 'feliz' ? <Estrelas tamanho={tamanho} /> : null}
      {humor === 'dormindo' ? <Zzz tamanho={tamanho} /> : null}
    </View>
  )
}

function Olhos({ humor, piscando }: { humor: Humor; piscando: boolean }) {
  const xs = [42, 78]
  const y = 60
  if (humor === 'feliz')
    return xs.map((x) => <Path key={x} d={`M${x - 5} ${y + 2} Q${x} ${y - 5} ${x + 5} ${y + 2}`} fill="none" stroke={ESCURO} strokeWidth={3} strokeLinecap="round" />)
  if (humor === 'dormindo' || piscando)
    return xs.map((x) => <Path key={x} d={`M${x - 5} ${y} Q${x} ${y + 4} ${x + 5} ${y}`} fill="none" stroke={ESCURO} strokeWidth={2.6} strokeLinecap="round" />)
  return (
    <G>
      {xs.map((x) => (
        <G key={x}>
          <Ellipse cx={x} cy={y} rx={5.5} ry={6.5} fill="#FFFDF8" />
          {/* pensando: as pupilas ficam numa camada que se mexe */}
          {humor !== 'pensando' ? (
            <G>
              <Ellipse cx={x} cy={y + 1} rx={3.4} ry={4} fill={ESCURO} />
              <Circle cx={x + 1.3} cy={y - 0.6} r={1.3} fill="#fff" />
            </G>
          ) : null}
        </G>
      ))}
    </G>
  )
}

function Boca({ humor }: { humor: Humor }) {
  const x = 60
  const y = 87
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

// Valor que vai de 0 a 1 e volta, sem parar (duração 0 = parado)
function useVaiVem(duracao: number) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!duracao) return
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
      <Z atraso={0} tamanho={tamanho} fonte={15} x={92} y={20} />
      <Z atraso={1300} tamanho={tamanho} fonte={11} x={98} y={18} />
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
