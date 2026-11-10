import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { Animated, Easing, Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { PASSOS_DO_TOUR, type AlvoDoTour } from '@together/core'
import { Norti } from '../Norti'
import { guardar, lerGuardado } from '../../lib/guardado'
import { tum, useReducedMotion } from '../movimento'
import { cor, fonte, titulo, trabalho } from '../../../theme'

// Tour guiado da viagem (tutorial "de videogame", pedido do Victor em 10/11/2026; refeito no mesmo dia).
// A pessoa FAZ: "Toque em Roteiro" só anda quando ela toca na aba acesa; a aba abre e a Norti
// mostra a peça principal dali (os dias, a troca Transporte/Hospedagem, Lançar gasto, Publicar).
// Textos e ordem no @together/core (PASSOS_DO_TOUR).
//
// Como usar:
// - <PalcoDoTour aba="roteiro"> em volta da tela da viagem (já está no layout das abas);
// - na peça que acende: <View ref={useAlvoDoTour('contas-lancar')} collapsable={false}>…</View>.
// Pra ver de novo: verTourDeNovo() (Perfil).

export const CHAVE_DO_TOUR = 'tripwave.tour.v1'
const FOLGA = 4 // o foco fica um pouco maior que a peça
const RAIO = 18
const ESCURO = 'rgba(12,8,4,0.86)' // escuro firme: a peça acesa salta, o resto some
const LARGURA_DO_BALAO = 340
const MARGEM = 16
const DISTANCIA = 14 // do balão até a peça (a setinha ocupa esse espaço)
const SETA = 12
const ESPERA_DA_ABA = 420 // a aba nova termina de entrar antes de medir a peça

type Peca = ComponentRef<typeof View>
type Registro = (alvo: AlvoDoTour, ref: RefObject<Peca | null>) => () => void
const Contexto = createContext<Registro | null>(null)

// Quem já está com a viagem aberta por baixo (o Perfil empilhado em cima) também fica sabendo
const ouvintes = new Set<() => void>()
export async function verTourDeNovo() {
  await guardar(CHAVE_DO_TOUR, false)
  ouvintes.forEach((f) => f())
}

// `null`: essa peça não entra no tour (ex.: a aba Viagem na barra)
export function useAlvoDoTour(alvo: AlvoDoTour | null) {
  const registrar = useContext(Contexto)
  const ref = useRef<Peca>(null)
  useEffect(() => (alvo && registrar ? registrar(alvo, ref) : undefined), [registrar, alvo])
  return ref
}

type Caixa = { x: number; y: number; w: number; h: number }

export function PalcoDoTour({
  children,
  aba,
  aoComecar,
  aoTerminar,
}: {
  children: ReactNode
  aba: string // aba aberta agora ('index', 'roteiro', 'reservas', 'contas', 'fotos')
  aoComecar?: () => void // volta pra aba Viagem
  aoTerminar?: () => void
}) {
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
  // undefined = medindo (a cortina some enquanto a aba entra); null = sem peça (balão no meio)
  const [caixa, setCaixa] = useState<Caixa | null | undefined>(undefined)
  const funcoes = useRef({ aoComecar, aoTerminar })
  useEffect(() => {
    funcoes.current = { aoComecar, aoTerminar }
  }, [aoComecar, aoTerminar])

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
          funcoes.current.aoComecar?.()
          setCaixa(undefined)
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

  // Passo de fazer: a aba pedida abriu → próximo passo
  useEffect(() => {
    if (passo === null) return
    const pedido = PASSOS_DO_TOUR[passo].tocar
    if (pedido && aba === pedido) {
      tum()
      setCaixa(undefined)
      setPasso(passo + 1)
    }
  }, [aba, passo])

  // Mede a peça do passo (em relação ao palco). Espera a aba entrar; se a peça ainda não
  // apareceu (tela carregando), tenta de novo umas vezes antes de mostrar o balão no meio.
  useEffect(() => {
    if (passo === null) return
    let vivo = true
    let t: ReturnType<typeof setTimeout>
    const alvo = PASSOS_DO_TOUR[passo].alvo
    const tentarDeNovo = (tentativa: number) => {
      if (tentativa < 5) t = setTimeout(() => medir(tentativa + 1), 250)
      else setCaixa(null)
    }
    const medir = (tentativa: number) => {
      if (!vivo) return
      const peca = alvo ? alvos.current.get(alvo)?.current : null
      if (!alvo || !palco.current) return setCaixa(null)
      if (!peca) return tentarDeNovo(tentativa)
      palco.current.measureInWindow((px: number, py: number, pw: number) => {
        peca.measureInWindow((xv: number, yv: number, wv: number, hv: number) => {
          if (!vivo) return
          if (!wv || !hv) return tentarDeNovo(tentativa)
          const { w: largura, h: altura } = tamanhoRef.current
          // No site do app (computador) a Moldura de iPhone encolhe a tela inteira (scale). A medida
          // vem encolhida, mas o desenho do tour é em tamanho normal: divide pela escala, senão o foco
          // fica fora do lugar. No celular a escala é 1.
          const k = pw && largura ? pw / largura : 1
          const x = (xv - px) / k
          const y = (yv - py) / k
          const w = wv / k
          const h = hv / k
          // O foco não passa das bordas do palco
          const esq = Math.max(4, x - FOLGA)
          const topo = Math.max(4, y - FOLGA)
          const dir = Math.min(largura - 4, x + w + FOLGA)
          const fim = Math.min(altura - 4, y + h + FOLGA)
          setCaixa({ x: esq, y: topo, w: dir - esq, h: fim - topo })
        })
      })
    }
    t = setTimeout(() => medir(0), passo === 0 ? 0 : ESPERA_DA_ABA)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [passo])

  const fechar = useCallback(() => {
    setPasso(null)
    setCaixa(undefined)
    void guardar(CHAVE_DO_TOUR, true)
    funcoes.current.aoTerminar?.()
  }, [])
  const avancar = useCallback(() => {
    if (passo === null) return
    tum()
    if (passo >= PASSOS_DO_TOUR.length - 1) return fechar()
    setCaixa(undefined)
    setPasso(passo + 1)
  }, [passo, fechar])

  return (
    <Contexto.Provider value={registrar}>
      <View
        ref={palco}
        collapsable={false}
        className="flex-1"
        onLayout={(e) => setTamanho({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {children}
        {passo !== null && caixa !== undefined && tamanho.h > 0 && (
          <Cortina key={passo} passo={passo} caixa={caixa} tamanho={tamanho} aoAvancar={avancar} />
        )}
      </View>
    </Contexto.Provider>
  )
}

// Retângulo de cantos redondos, pro buraco do foco (SVG)
function retanguloRedondo({ x, y, w, h }: Caixa, r: number) {
  const k = Math.min(r, w / 2, h / 2)
  return `M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}A${k} ${k} 0 0 1 ${x + w - k} ${y + h}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`
}

function Cortina({
  passo,
  caixa,
  tamanho,
  aoAvancar,
}: {
  passo: number
  caixa: Caixa | null
  tamanho: { w: number; h: number }
  aoAvancar: () => void
}) {
  const reduzir = useReducedMotion()
  const p = PASSOS_DO_TOUR[passo]
  const fazer = Boolean(p.tocar) && Boolean(caixa)
  const ultimo = passo === PASSOS_DO_TOUR.length - 1

  // Entrada: a cortina aparece e o balão sobe uns 12px
  const entra = useRef(new Animated.Value(reduzir ? 1 : 0)).current
  // "Toque aqui": o anel pulsa pra fora
  const pulso = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (reduzir) return
    Animated.timing(entra, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }, [entra, reduzir])
  useEffect(() => {
    if (!fazer || reduzir) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [fazer, reduzir, pulso])

  const { w: W, h: H } = tamanho
  const raio = caixa ? Math.min(RAIO, caixa.h / 2) : RAIO
  const total = PASSOS_DO_TOUR.length

  // Balão: largura fixa, alinhado com a peça (sem sair da tela), do lado que tem mais espaço,
  // com uma setinha apontando pro meio da peça. Sem peça: no meio da tela, sem seta.
  const largura = Math.min(LARGURA_DO_BALAO, W - MARGEM * 2)
  const meio = caixa ? caixa.x + caixa.w / 2 : W / 2
  const esquerda = Math.min(Math.max(meio - largura / 2, MARGEM), W - MARGEM - largura)
  const emCima = caixa ? caixa.y + caixa.h / 2 > H / 2 : false
  const lugar = !caixa
    ? { top: Math.max(24, H / 2 - 110) }
    : emCima
      ? { bottom: H - caixa.y + DISTANCIA }
      : { top: caixa.y + caixa.h + DISTANCIA }
  const setaX = Math.min(Math.max(meio - esquerda - SETA / 2, 22), largura - 22 - SETA)

  return (
    <Animated.View
      // box-none: a camada em si não segura toque; quem bloqueia são os retângulos em volta do foco
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, opacity: entra }}
      accessibilityViewIsModal
    >
      {/* O escuro com o buraco redondo do foco */}
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
        <Path d={`M0 0H${W}V${H}H0Z${caixa ? ` ${retanguloRedondo(caixa, raio)}` : ''}`} fill={ESCURO} fillRule="evenodd" />
      </Svg>

      {/* Toques: fora do foco não fazem nada. No passo de fazer, o foco deixa o toque passar pra aba. */}
      {fazer && caixa ? (
        <>
          <Pressable accessible={false} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: caixa.y }} />
          <Pressable accessible={false} style={{ position: 'absolute', left: 0, right: 0, top: caixa.y + caixa.h, bottom: 0 }} />
          <Pressable accessible={false} style={{ position: 'absolute', left: 0, width: caixa.x, top: caixa.y, height: caixa.h }} />
          <Pressable
            accessible={false}
            style={{ position: 'absolute', left: caixa.x + caixa.w, right: 0, top: caixa.y, height: caixa.h }}
          />
        </>
      ) : (
        <Pressable accessible={false} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      )}

      {caixa ? (
        <>
          {/* Anel do foco, colado na borda do buraco */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: caixa.x - 1,
              top: caixa.y - 1,
              width: caixa.w + 2,
              height: caixa.h + 2,
              borderRadius: raio + 1,
              borderWidth: 2,
              borderColor: cor.dourado,
            }}
          />
          {fazer ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: caixa.x - 1,
                top: caixa.y - 1,
                width: caixa.w + 2,
                height: caixa.h + 2,
                borderRadius: raio + 1,
                borderWidth: 2,
                borderColor: cor.dourado,
                opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
              }}
            />
          ) : null}
        </>
      ) : null}

      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          {
            position: 'absolute',
            left: esquerda,
            width: largura,
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            gap: 14,
            backgroundColor: trabalho.fundo,
            boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
            transform: [{ translateY: entra.interpolate({ inputRange: [0, 1], outputRange: [emCima ? 10 : -10, 0] }) }],
          },
          lugar,
        ]}
      >
        {/* Setinha apontando pra peça */}
        {caixa ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: setaX,
              width: SETA,
              height: SETA,
              borderRadius: 2,
              backgroundColor: trabalho.fundo,
              transform: [{ rotate: '45deg' }],
              ...(emCima ? { bottom: -SETA / 2 + 1 } : { top: -SETA / 2 + 1 }),
            }}
          />
        ) : null}

        <View className="flex-row items-center gap-3">
          <View className="items-center justify-center rounded-full" style={{ width: 52, height: 52, backgroundColor: trabalho.superficie2 }}>
            <Norti humor={p.humor} tamanho={44} sombra={false} />
          </View>
          <View className="flex-1" style={{ gap: 3 }}>
            <Text style={[titulo(19), { color: trabalho.texto }]}>{p.titulo}</Text>
            <Text style={{ fontFamily: fonte.corpo, fontSize: 14, lineHeight: 19, color: trabalho.texto2 }}>{p.texto}</Text>
          </View>
        </View>

        <View className="flex-row items-center" style={{ minHeight: 40, gap: 10 }}>
          {/* Progresso: "3 de 10" e uma barrinha */}
          <View className="flex-1 flex-row items-center" style={{ gap: 8 }} accessibilityLabel={`Passo ${passo + 1} de ${total}`}>
            <Text style={{ fontFamily: fonte.corpoForte, fontSize: 12, color: trabalho.texto2, fontVariant: ['tabular-nums'] }}>
              {passo + 1} de {total}
            </Text>
            <View style={{ flex: 1, maxWidth: 90, height: 4, borderRadius: 2, backgroundColor: cor.borda, overflow: 'hidden' }}>
              <View style={{ width: `${((passo + 1) / total) * 100}%`, height: 4, borderRadius: 2, backgroundColor: trabalho.acento }} />
            </View>
          </View>
          {/* No passo de fazer não tem "Próximo": quem anda é o toque na peça acesa */}
          {fazer ? null : (
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
          )}
        </View>
      </Animated.View>
    </Animated.View>
  )
}
