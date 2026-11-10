import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Image, Platform, View } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { ANCORAS_DA_NORTI, CORES_DOS_EFEITOS, MOVIMENTO_DA_NORTI, MotorDaNorti, type EfeitoDaNorti, type EstadoDaNorti, type PoseDaNorti } from '@together/core'
import { Icone } from './Icone'

// A Norti: mascote e nome do app (uma bússola em forma de pino de mapa, de chapéu de safári).
// Mesmos movimentos do site, quadro a quadro: o MotorDaNorti (packages/core/src/norti-movimento.ts)
// diz onde ela está a cada instante, e aqui só aplicamos (esticar, girar, pular, trocar de pose).
//   parada   → respira, balança, pisca e dá um pulinho      feliz    → pula e solta confete
//   dormindo → respira fundo e solta "z"                     pensando → quica com pontinhos (carregando)
//   oi       → acena                                          ops      → leva um susto (erro)
//   apontando→ se inclina pra dica                            amor     → bate como coração, com corações
// Ela chega com um pulinho e um brilho; `chegar={false}` pula isso. Tocar nela dá um apertãozinho.
// Com "Reduzir movimento" ligado, só a pose troca (nada pula nem treme).
export type Humor = 'parada' | 'feliz' | 'dormindo' | 'pensando' | 'oi' | 'ops' | 'apontando' | 'amor'

const POSES: Record<PoseDaNorti, number> = {
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

// Estado do motor e as poses que ele usa (só essas imagens entram na tela)
const MOVIMENTO: Record<Humor, { estado: EstadoDaNorti; poses: PoseDaNorti[] }> = {
  parada: { estado: 'idle', poses: ['idle', 'blink'] },
  feliz: { estado: 'celebrate', poses: ['idle', 'blink', 'celebrate'] },
  dormindo: { estado: 'sleep', poses: ['idle', 'sleep'] },
  pensando: { estado: 'think', poses: ['idle', 'think'] },
  oi: { estado: 'hello', poses: ['idle', 'blink', 'wave'] },
  ops: { estado: 'oops', poses: ['idle', 'oops'] },
  apontando: { estado: 'point', poses: ['idle', 'point'] },
  amor: { estado: 'love', poses: ['idle', 'love'] },
}

const CHAO = MOVIMENTO_DA_NORTI.ground // onde ficam os pés no desenho
const A = ANCORAS_DA_NORTI
const nativo = Platform.OS !== 'web'
const agora = () => Date.now() / 1000
let contador = 0

type Props = { humor?: Humor; tamanho?: number; sombra?: boolean; chegar?: boolean }

export function Norti({ humor = 'parada', tamanho = 120, sombra = true, chegar = tamanho >= 48 }: Props) {
  const reduzir = useReducedMotion()
  const { estado, poses } = MOVIMENTO[humor]
  const motor = useMemo(() => new MotorDaNorti(++contador), [])
  // Valores que o motor muda a cada quadro (sem redesenhar a tela inteira)
  const v = useMemo(
    () => ({
      sx: new Animated.Value(1),
      sy: new Animated.Value(1),
      rot: new Animated.Value(0),
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      opacidade: new Animated.Value(chegar ? 0 : 1),
      sombraLarg: new Animated.Value(1),
      sombraOp: new Animated.Value(0.14),
      pose: Object.fromEntries((Object.keys(POSES) as PoseDaNorti[]).map((p) => [p, new Animated.Value(0)])) as Record<PoseDaNorti, Animated.Value>,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  // Efeitos ligados agora (só redesenha quando muda); o número troca a cada vez que um de uma vez só começa
  const [efeitos, setEfeitos] = useState<{ tipo: EfeitoDaNorti; vez: number }[]>([])

  // Chegada e troca de humor
  const estadoRef = useRef(estado)
  useEffect(() => {
    estadoRef.current = estado
    if (motor.estado !== 'appear') motor.tocar(estado, agora())
  }, [estado, motor])
  useEffect(() => {
    if (chegar && !reduzir) motor.tocar('appear', agora())
    else motor.tocar(estadoRef.current, agora())
    motor.aoTerminar = (acabou) => {
      if (acabou === 'appear' && estadoRef.current !== 'idle') motor.tocar(estadoRef.current, agora())
    }
    return () => {
      motor.aoTerminar = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Um quadro por vez: pergunta ao motor e aplica
  useEffect(() => {
    let quadro = 0
    let ligados = ''
    const vezes: Partial<Record<EfeitoDaNorti, number>> = {}
    const passo = () => {
      const f = motor.quadro(agora(), reduzir)
      v.sx.setValue(f.sx)
      v.sy.setValue(f.sy)
      v.rot.setValue(f.rot)
      v.tx.setValue(f.tx * tamanho)
      v.ty.setValue(f.ty * tamanho)
      v.opacidade.setValue(f.opacity)
      const subida = Math.min(0.6, Math.max(0, -f.ty) * 3)
      v.sombraLarg.setValue((1 - subida * 0.6) * f.sx)
      v.sombraOp.setValue(0.14 * f.opacity * (1 - subida))
      for (const p of Object.keys(v.pose) as PoseDaNorti[]) {
        const o = p === f.pose ? (f.anterior ? f.mistura : 1) : p === f.anterior ? 1 - f.mistura : 0
        v.pose[p].setValue(o)
      }
      const agoraLigados = f.efeitos.join(',')
      if (agoraLigados !== ligados) {
        const antes = ligados.split(',')
        for (const tipo of f.efeitos) if (!antes.includes(tipo)) vezes[tipo] = (vezes[tipo] ?? 0) + 1
        ligados = agoraLigados
        setEfeitos(f.efeitos.map((tipo) => ({ tipo, vez: vezes[tipo] ?? 0 })))
      }
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [motor, v, tamanho, reduzir])

  const camada = { position: 'absolute' as const, width: tamanho, height: tamanho }
  const visiveis = new Set<PoseDaNorti>([...poses, 'idle', 'blink'])
  return (
    <View
      style={{ width: tamanho, height: tamanho }}
      // Toque: apertãozinho (não segura o toque: o botão em volta continua funcionando)
      onTouchStart={tamanho >= 60 ? () => motor.cutucar(agora()) : undefined}
    >
      {sombra ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: tamanho * CHAO - tamanho * 0.016,
            left: tamanho * (0.5 - A.sombra / 2),
            width: tamanho * A.sombra,
            height: tamanho * 0.032,
            borderRadius: tamanho,
            backgroundColor: '#3B2715',
            opacity: v.sombraOp,
            transform: [{ translateX: v.tx }, { scaleX: v.sombraLarg }],
          }}
        />
      ) : null}
      <Animated.View
        style={{
          width: tamanho,
          height: tamanho,
          opacity: v.opacidade,
          transformOrigin: `50% ${CHAO * 100}%`,
          transform: [
            { translateX: v.tx },
            { translateY: v.ty },
            { rotate: v.rot.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
            { scaleX: v.sx },
            { scaleY: v.sy },
          ],
        }}
      >
        {[...visiveis].map((p) => (
          <Animated.Image key={p} source={POSES[p]} style={[camada, { opacity: v.pose[p] }]} />
        ))}
      </Animated.View>
      {efeitos.map((e) => (
        <Efeito key={`${e.tipo}-${e.vez}`} tipo={e.tipo} tamanho={tamanho} />
      ))}
    </View>
  )
}

function Efeito({ tipo, tamanho }: { tipo: EfeitoDaNorti; tamanho: number }) {
  if (tipo === 'sparkle') return <Brilho tamanho={tamanho} />
  if (tipo === 'confetti') return <Confete tamanho={tamanho} />
  if (tipo === 'dots') return <Pontinhos tamanho={tamanho} />
  if (tipo === 'hearts') return <Coracoes tamanho={tamanho} />
  return <Zzz tamanho={tamanho} />
}

// Valor de 0 a 1 em `ms` (uma vez, ou sem parar com `repetir`), começando depois de `atraso`
function useTempo(ms: number, { repetir = false, atraso = 0 }: { repetir?: boolean; atraso?: number } = {}) {
  const t = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const ida = Animated.timing(t, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: nativo })
    const anim = repetir
      ? Animated.sequence([Animated.delay(atraso), Animated.loop(Animated.sequence([ida, Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: nativo })]))])
      : Animated.sequence([Animated.delay(atraso), ida])
    anim.start()
    return () => anim.stop()
  }, [ms, repetir, atraso, t])
  return t
}

// Brilho: quatro estrelinhas (losangos) que acendem e somem em volta da cabeça
function Brilho({ tamanho }: { tamanho: number }) {
  const pontos: [number, number, number, number][] = [
    [A.left - 0.03, A.top + 0.06, 0.07, 0],
    [A.left + 0.05, A.top - 0.05, 0.055, 100],
    [A.left - 0.08, A.top + 0.2, 0.045, 200],
    [A.right + 0.03, A.top + 0.02, 0.05, 150],
  ]
  return (
    <>
      {pontos.map(([x, y, r, atraso], i) => (
        <Estrela key={i} x={x} y={y} r={r} atraso={atraso} tamanho={tamanho} />
      ))}
    </>
  )
}

function Estrela({ x, y, r, atraso, tamanho }: { x: number; y: number; r: number; atraso: number; tamanho: number }) {
  const t = useTempo(550, { atraso })
  const lado = r * tamanho
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x * tamanho - lado / 2,
        top: y * tamanho - lado / 2,
        width: lado,
        height: lado,
        borderRadius: lado * 0.18,
        backgroundColor: CORES_DOS_EFEITOS.brilho,
        opacity: t.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ rotate: '45deg' }, { scale: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.2] }) }],
      }}
    />
  )
}

// Confete: papeizinhos coloridos que sobem da cabeça e caem girando
function Confete({ tamanho }: { tamanho: number }) {
  const t = useTempo(1900)
  const pedacos = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const r = (k: number) => {
          const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
          return x - Math.floor(x)
        }
        const ang = -Math.PI / 2 + (r(1) - 0.5) * 2.4
        const vel = 0.75 + r(2) * 0.75
        return { ang, vel, giro: 360 * (1 + r(3) * 2), cor: CORES_DOS_EFEITOS.confete[i % CORES_DOS_EFEITOS.confete.length], redondo: i % 3 === 0 }
      }),
    [],
  )
  const T = 1.9
  const marcas = [0, 0.25, 0.5, 0.75, 1]
  return (
    <>
      {pedacos.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: A.cx * tamanho,
            top: (A.top + 0.04) * tamanho,
            width: tamanho * (p.redondo ? 0.022 : 0.018),
            height: tamanho * (p.redondo ? 0.022 : 0.032),
            borderRadius: p.redondo ? tamanho : 1,
            backgroundColor: p.cor,
            opacity: t.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: t.interpolate({ inputRange: marcas, outputRange: marcas.map((m) => Math.cos(p.ang) * p.vel * m * T * tamanho) }) },
              { translateY: t.interpolate({ inputRange: marcas, outputRange: marcas.map((m) => (Math.sin(p.ang) * p.vel * m * T + 1.6 * (m * T) ** 2) * tamanho) }) },
              { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.giro}deg`] }) },
            ],
          }}
        />
      ))}
    </>
  )
}

// Pontinhos de "pensando": um balãozinho com três bolinhas que pulam
function Pontinhos({ tamanho }: { tamanho: number }) {
  const chega = useTempo(250)
  const bx = Math.min(0.76, A.right - 0.08)
  const by = Math.max(0, A.top - 0.13)
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: bx * tamanho,
        top: by * tamanho,
        width: 0.24 * tamanho,
        height: 0.12 * tamanho,
        borderRadius: tamanho,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.022 * tamanho,
        boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
        transform: [{ scale: chega }],
      }}
    >
      {[0, 1, 2].map((i) => (
        <Bolinha key={i} indice={i} tamanho={tamanho} />
      ))}
    </Animated.View>
  )
}

function Bolinha({ indice, tamanho }: { indice: number; tamanho: number }) {
  const t = useTempo(1200, { repetir: true, atraso: indice * 180 })
  return (
    <Animated.View
      style={{
        width: 0.032 * tamanho,
        height: 0.032 * tamanho,
        borderRadius: tamanho,
        backgroundColor: CORES_DOS_EFEITOS.tinta,
        opacity: t.interpolate({ inputRange: [0, 0.2, 0.42, 1], outputRange: [0.35, 1, 0.35, 0.35] }),
        transform: [{ translateY: t.interpolate({ inputRange: [0, 0.2, 0.42, 1], outputRange: [0, -0.016 * tamanho, 0, 0] }) }],
      }}
    />
  )
}

// Dois corações que sobem dos lados e somem (humor "amor")
function Coracoes({ tamanho }: { tamanho: number }) {
  return (
    <>
      <Coracao lado={-1} atraso={0} tamanho={tamanho} />
      <Coracao lado={1} atraso={800} tamanho={tamanho} />
    </>
  )
}

function Coracao({ lado, atraso, tamanho }: { lado: number; atraso: number; tamanho: number }) {
  const t = useTempo(1600, { repetir: true, atraso })
  const s = Math.max(10, tamanho * 0.11)
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (A.cx + lado * 0.17) * tamanho - s / 2,
        top: (A.top + 0.12) * tamanho - s / 2,
        opacity: t.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -0.2 * tamanho] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) },
        ],
      }}
    >
      <Icone nome="curtir" tamanho={s} cor={CORES_DOS_EFEITOS.coracao} />
    </Animated.View>
  )
}

// Três "z" que sobem e somem (humor "dormindo")
function Zzz({ tamanho }: { tamanho: number }) {
  return (
    <>
      {[0, 1, 2].map((k) => (
        <Z key={k} atraso={k * 700} tamanho={tamanho} />
      ))}
    </>
  )
}

function Z({ atraso, tamanho }: { atraso: number; tamanho: number }) {
  const t = useTempo(2100, { repetir: true, atraso })
  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (A.right - 0.05) * tamanho,
        top: (A.top + 0.02) * tamanho,
        fontSize: tamanho * 0.09,
        fontWeight: '900',
        color: CORES_DOS_EFEITOS.tinta,
        opacity: t.interpolate({ inputRange: [0, 0.12, 0.65, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, tamanho * 0.1] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -tamanho * 0.22] }) },
          { rotate: '-9deg' },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
        ],
      }}
    >
      z
    </Animated.Text>
  )
}
