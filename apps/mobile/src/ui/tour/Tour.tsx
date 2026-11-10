import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { PASSOS_DO_TOUR, type AlvoDoTour } from '@together/core'
import { Norti } from '../Norti'
import { guardar, lerGuardado } from '../../lib/guardado'
import { animar, mola, tum, useReducedMotion } from '../movimento'
import { cor, fonte, titulo, trabalho } from '../../../theme'

// Tour guiado da viagem (tutorial "de videogame", pedido do Victor em 10/11/2026).
// Na primeira vez que a pessoa abre uma viagem, a tela escurece, a peça do passo fica acesa
// (o foco anda de uma pra outra com mola) e a Norti explica num balão. Textos no @together/core.
//
// Como usar:
// - <PalcoDoTour> em volta da tela da viagem (já está no layout das abas);
// - na peça que acende: <View ref={useAlvoDoTour('galera')} collapsable={false}>…</View>.
// Passo cuja peça não está na tela é pulado. Pra ver de novo: verTourDeNovo() (Perfil).

export const CHAVE_DO_TOUR = 'tripwave.tour.v1'
const FOLGA = 6 // o foco fica um pouco maior que a peça
const ESCURO = 'rgba(31,18,6,0.66)'

// Quem já está com a viagem aberta por baixo (o Perfil empilhado em cima) também fica sabendo
const ouvintes = new Set<() => void>()
export async function verTourDeNovo() {
  await guardar(CHAVE_DO_TOUR, false)
  ouvintes.forEach((f) => f())
}

type Peca = ComponentRef<typeof View>
type Registro = (alvo: AlvoDoTour, ref: RefObject<Peca | null>) => () => void
const Contexto = createContext<Registro | null>(null)

// `null`: essa peça não entra no tour (ex.: a aba Viagem na barra)
export function useAlvoDoTour(alvo: AlvoDoTour | null) {
  const registrar = useContext(Contexto)
  const ref = useRef<Peca>(null)
  useEffect(() => (alvo && registrar ? registrar(alvo, ref) : undefined), [registrar, alvo])
  return ref
}

type Caixa = { x: number; y: number; w: number; h: number }

export function PalcoDoTour({ children, aoComecar }: { children: ReactNode; aoComecar?: () => void }) {
  const alvos = useRef(new Map<AlvoDoTour, RefObject<Peca | null>>())
  const registrar = useCallback<Registro>((alvo, ref) => {
    alvos.current.set(alvo, ref)
    return () => {
      if (alvos.current.get(alvo) === ref) alvos.current.delete(alvo)
    }
  }, [])
  const palco = useRef<Peca>(null)
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 })
  const tamanhoRef = useRef(tamanho)
  useEffect(() => {
    tamanhoRef.current = tamanho
  }, [tamanho])
  const [passo, setPasso] = useState<number | null>(null)
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const aoComecarRef = useRef(aoComecar)
  useEffect(() => {
    aoComecarRef.current = aoComecar
  }, [aoComecar])

  // Próximo passo que dá pra mostrar (sem alvo, ou com a peça na tela)
  const proximoDe = useCallback((de: number) => {
    for (let i = de; i < PASSOS_DO_TOUR.length; i++) {
      const alvo = PASSOS_DO_TOUR[i].alvo
      if (!alvo || alvos.current.get(alvo)?.current) return i
    }
    return null
  }, [])

  // Primeira vez numa viagem: começa sozinho, depois que o bilhete chegou.
  // Também começa quando alguém pede "Ver o tour de novo" com esta viagem aberta.
  useEffect(() => {
    let vivo = true
    let t: ReturnType<typeof setTimeout>
    const tentar = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        void lerGuardado<boolean>(CHAVE_DO_TOUR).then((visto) => {
          if (!vivo || visto) return
          aoComecarRef.current?.()
          setPasso(0)
        })
      }, 1100)
    }
    tentar()
    ouvintes.add(tentar)
    return () => {
      vivo = false
      clearTimeout(t)
      ouvintes.delete(tentar)
    }
  }, [])

  // Mede a peça do passo (em relação ao palco)
  useEffect(() => {
    if (passo === null) return
    let vivo = true
    const alvo = PASSOS_DO_TOUR[passo].alvo
    const peca = alvo ? alvos.current.get(alvo)?.current : null
    if (!peca || !palco.current) {
      setCaixa(null)
      return
    }
    palco.current.measureInWindow((px: number, py: number) => {
      peca.measureInWindow((x: number, y: number, w: number, h: number) => {
        if (!vivo) return
        if (!w || !h) return setCaixa(null)
        // O foco não passa das bordas do palco (cartão de ponta a ponta, peça colada no topo)
        const { w: largura, h: altura } = tamanhoRef.current
        const esq = Math.max(4, x - px - FOLGA)
        const topo = Math.max(4, y - py - FOLGA)
        const dir = Math.min(largura - 4, x - px + w + FOLGA)
        const fim = Math.min(altura - 4, y - py + h + FOLGA)
        setCaixa({ x: esq, y: topo, w: dir - esq, h: fim - topo })
      })
    })
    return () => {
      vivo = false
    }
  }, [passo])

  const fechar = useCallback(() => {
    setPasso(null)
    setCaixa(null)
    void guardar(CHAVE_DO_TOUR, true)
  }, [])
  const avancar = useCallback(() => {
    if (passo === null) return
    tum()
    const prox = proximoDe(passo + 1)
    if (prox === null) fechar()
    else setPasso(prox)
  }, [passo, proximoDe, fechar])

  return (
    <Contexto.Provider value={registrar}>
      <View
        ref={palco}
        collapsable={false}
        className="flex-1"
        onLayout={(e) => setTamanho({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {children}
        {passo !== null && tamanho.h > 0 && <Cortina passo={passo} caixa={caixa} tamanho={tamanho} aoAvancar={avancar} aoPular={fechar} />}
      </View>
    </Contexto.Provider>
  )
}

function Cortina({
  passo,
  caixa,
  tamanho,
  aoAvancar,
  aoPular,
}: {
  passo: number
  caixa: Caixa | null
  tamanho: { w: number; h: number }
  aoAvancar: () => void
  aoPular: () => void
}) {
  const reduzir = useReducedMotion()
  // Sem peça: o foco vira um ponto no meio (a tela fica toda escura)
  const alvo = caixa ?? { x: tamanho.w / 2, y: tamanho.h / 2, w: 0, h: 0 }
  const x = useSharedValue(alvo.x)
  const y = useSharedValue(alvo.y)
  const w = useSharedValue(alvo.w)
  const h = useSharedValue(alvo.h)
  useEffect(() => {
    x.value = animar(alvo.x, reduzir, mola.macia)
    y.value = animar(alvo.y, reduzir, mola.macia)
    w.value = animar(alvo.w, reduzir, mola.macia)
    h.value = animar(alvo.h, reduzir, mola.macia)
  }, [alvo.x, alvo.y, alvo.w, alvo.h, reduzir, x, y, w, h])

  // A cortina são 4 retângulos escuros em volta do foco, mais um anel dourado no foco
  // (a mola pode passar um tiquinho do ponto: o foco nunca sai do palco)
  const cima = useAnimatedStyle(() => ({ top: 0, left: 0, right: 0, height: Math.max(0, y.value) }))
  const baixo = useAnimatedStyle(() => ({ top: Math.max(0, y.value) + Math.max(0, h.value), left: 0, right: 0, bottom: 0 }))
  const esquerda = useAnimatedStyle(() => ({ top: Math.max(0, y.value), height: Math.max(0, h.value), left: 0, width: Math.max(0, x.value) }))
  const direita = useAnimatedStyle(() => ({ top: Math.max(0, y.value), height: Math.max(0, h.value), left: Math.max(0, x.value) + Math.max(0, w.value), right: 0 }))
  const anel = useAnimatedStyle(() => ({
    top: Math.max(2, y.value),
    left: Math.max(2, x.value),
    width: Math.max(0, w.value),
    height: Math.max(0, h.value),
    opacity: w.value > 4 ? 1 : 0,
  }))

  const p = PASSOS_DO_TOUR[passo]
  const ultimo = passo === PASSOS_DO_TOUR.length - 1
  // Balão do lado que tem mais espaço: peça embaixo → balão em cima, e vice-versa
  const lugar = useMemo(() => {
    if (!caixa) return { top: Math.max(24, tamanho.h / 2 - 110) }
    const embaixo = caixa.y + caixa.h / 2 > tamanho.h / 2
    return embaixo ? { bottom: tamanho.h - caixa.y + 12 } : { top: caixa.y + caixa.h + 12 }
  }, [caixa, tamanho.h])

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}
    >
      {/* Toque fora do balão não faz nada (só o "Próximo" e o "Pular" andam) */}
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} accessible={false} />
      {[cima, baixo, esquerda, direita].map((estilo, i) => (
        <Animated.View key={i} pointerEvents="none" style={[{ position: 'absolute', backgroundColor: ESCURO }, estilo]} />
      ))}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', borderRadius: 18, borderWidth: 2, borderColor: cor.dourado }, anel]} />

      <Animated.View
        key={passo}
        entering={FadeInDown.springify().damping(mola.macia.damping).stiffness(mola.macia.stiffness)}
        accessibilityViewIsModal
        accessibilityLiveRegion="polite"
        style={[
          {
            position: 'absolute',
            left: 14,
            right: 14,
            borderRadius: 24,
            padding: 16,
            gap: 12,
            backgroundColor: trabalho.fundo,
            borderWidth: 1,
            borderColor: trabalho.linha,
            boxShadow: '0 18px 40px rgba(31,18,6,0.35)',
          },
          lugar,
        ]}
      >
        <View className="flex-row items-center gap-3">
          <Norti humor={p.humor} tamanho={58} sombra={false} />
          <View className="flex-1 gap-1">
            <Text style={[titulo(20), { color: trabalho.texto }]}>{p.titulo}</Text>
            <Text style={{ fontFamily: fonte.corpo, fontSize: 14, lineHeight: 20, color: trabalho.texto2 }}>{p.texto}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {/* Bolinhas: em que passo está */}
          <View className="flex-1 flex-row gap-1.5" accessibilityLabel={`Passo ${passo + 1} de ${PASSOS_DO_TOUR.length}`}>
            {PASSOS_DO_TOUR.map((_, i) => (
              <View
                key={i}
                style={{ width: i === passo ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i <= passo ? trabalho.acento : cor.borda }}
              />
            ))}
          </View>
          {!ultimo && (
            <Pressable onPress={aoPular} accessibilityRole="button" className="h-10 justify-center px-3 active:opacity-70">
              <Text style={{ fontFamily: fonte.corpoForte, fontSize: 14, color: trabalho.texto2 }}>Pular</Text>
            </Pressable>
          )}
          <Pressable
            onPress={aoAvancar}
            accessibilityRole="button"
            className="h-10 justify-center rounded-full px-5 active:opacity-85"
            style={{ backgroundColor: trabalho.acento }}
          >
            <Text style={{ fontFamily: fonte.item, fontSize: 14, color: trabalho.acentoTexto }}>
              {passo === 0 ? 'Bora' : ultimo ? 'Começar' : 'Próximo'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  )
}
