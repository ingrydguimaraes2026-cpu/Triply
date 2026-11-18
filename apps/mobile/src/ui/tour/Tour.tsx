import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { Animated, Easing, Image, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { CORES_DOS_EFEITOS, PASSOS_DO_TOUR, pedacosDaFala, tamanhoDaFala, type AlvoDoTour } from '@together/core'
import { Norti, type Humor } from '../Norti'
import { guardar, lerGuardado } from '../../lib/guardado'
import { supabase } from '../../lib/supabase'
import { tum, useReducedMotion } from '../movimento'
import { cor, fonte } from '../../../theme'

// Tour guiado da viagem, com cara de jogo (versão aprovada pelo Victor em 10/11/2026 no protótipo
// docs/design/direcao-redesenho/tour-jogo.html). Igual ao do site (apps/web/src/features/tour/Tour.tsx).
// - A Norti fala numa caixa de diálogo; o texto aparece letra por letra.
// - Toque em qualquer lugar pra seguir (tocar enquanto ela escreve mostra a frase inteira).
// - Passo de fazer ("Toque em Roteiro"): só a peça acesa recebe o toque; o tour anda quando a aba
//   abre de verdade. Tocou fora: a parte acesa balança e a Norti faz "ops".
// - O foco desliza de uma peça pra outra; a caixa fica do lado oposto pra não tapar a peça.
// Falas e ordem no @together/core (PASSOS_DO_TOUR).
//
// Como usar:
// - <PalcoDoTour aba="roteiro"> em volta da tela da viagem (já está no layout das abas);
// - na peça que acende: <View ref={useAlvoDoTour('contas-lancar')} collapsable={false}>…</View>.
// Pra ver de novo: verTourDeNovo() (Perfil).

export const CHAVE_DO_TOUR = 'tripwave.tour.v1'
// M7 (QA 16/11): a marca "já viu o tour" é por pessoa, não por aparelho.
// Antes, uma conta nova no mesmo celular nunca via o tour.
async function chaveDoTour() {
  const { data } = await supabase.auth.getSession()
  return `${CHAVE_DO_TOUR}.${data.session?.user.id ?? 'sem-conta'}`
}
const FOLGA = 4 // o foco fica um pouco maior que a peça
const RAIO = 18
const ESCURO = 'rgba(18,11,4,0.66)'
const ESPERA_DA_ABA = 420 // a aba nova termina de entrar antes de medir a peça
const LETRA_MS = 26 // velocidade da "máquina de escrever"
// Mesmas curvas do protótipo (passam um pouquinho do ponto e voltam, como mola)
const MOLA_DO_FOCO = Easing.bezier(0.3, 1.25, 0.5, 1)
const MOLA_DA_CAIXA = Easing.bezier(0.3, 1.2, 0.5, 1)
const CORES_DO_CONFETE = [cor.dourado, cor.creme, cor.caramelo, '#A8703F', cor.verde, CORES_DOS_EFEITOS.brilho]
const DESENHOS_DO_TOUR = [
  require('../../../assets/norti/point.webp'),
  require('../../../assets/norti/oops.webp'),
  require('../../../assets/norti/celebrate.webp'),
]

type Peca = ComponentRef<typeof View>
type Registro = (alvo: AlvoDoTour, ref: RefObject<Peca | null>) => () => void
const Contexto = createContext<Registro | null>(null)

// Quem já está com a viagem aberta por baixo (o Perfil empilhado em cima) também fica sabendo
const ouvintes = new Set<() => void>()
export async function verTourDeNovo() {
  await guardar(await chaveDoTour(), false)
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
const mesmaCaixa = (a: Caixa, b: Caixa) =>
  Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5
// O que está na tela: o passo e onde fica a peça dele (null = sem peça, caixa no meio)
type Mostrado = { passo: number; caixa: Caixa | null }

export function PalcoDoTour({
  children,
  aba,
  aoComecar,
  aoTerminar,
  ligado = true,
}: {
  children: ReactNode
  ligado?: boolean // false: não começa (viagem antiga ou rolê)
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
  // `passo` é onde o tour está; `mostrado` só troca quando a peça do passo já foi medida.
  // Assim a fala nova e o foco chegam juntos, e o foco desliza da peça anterior pra nova.
  const [passo, setPasso] = useState<number | null>(null)
  const [mostrado, setMostrado] = useState<Mostrado | null>(null)
  const funcoes = useRef({ aoComecar, aoTerminar })
  useEffect(() => {
    funcoes.current = { aoComecar, aoTerminar }
  }, [aoComecar, aoTerminar])
  const ligadoRef = useRef(ligado)
  useEffect(() => {
    ligadoRef.current = ligado
  }, [ligado])

  // Primeira vez numa viagem: começa sozinho, depois que o bilhete chegou.
  // Também começa quando alguém pede "Ver o tour de novo" com esta viagem aberta.
  useEffect(() => {
    let vivo = true
    let t: ReturnType<typeof setTimeout>
    const tentar = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        void chaveDoTour().then((chave) => lerGuardado<boolean>(chave)).then((visto) => {
          if (!vivo || visto || !ligadoRef.current) return
          funcoes.current.aoComecar?.()
          setMostrado(null)
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
      setPasso(passo + 1)
    }
  }, [aba, passo])

  // Mede a peça do passo (em relação ao palco). Depois de trocar de aba, espera a aba entrar; se a
  // peça ainda não apareceu (tela carregando), tenta de novo umas vezes antes de deixar sem foco.
  // Os botões chegam com animação (o "Lançar gasto" sobe): só mostra quando duas medidas seguidas
  // batem (a peça parou), e depois continua seguindo a peça (se a tela rolar, o foco vai junto).
  useEffect(() => {
    if (passo === null) return
    let vivo = true
    let t: ReturnType<typeof setTimeout>
    const alvo = PASSOS_DO_TOUR[passo].alvo
    let anterior: Caixa | null = null // última medida
    let mostrada: Caixa | null = null // o que está na tela
    let leituras = 0
    const mostrar = (caixa: Caixa | null) => vivo && setMostrado({ passo, caixa })
    const tentarDeNovo = (tentativa: number) => {
      if (mostrada) t = setTimeout(() => medir(0), 300) // sumiu por um instante: o foco fica onde estava
      else if (tentativa < 5) t = setTimeout(() => medir(tentativa + 1), 250)
      else mostrar(null)
    }
    const chegou = (c: Caixa) => {
      leituras += 1
      if (mostrada) {
        if (!mesmaCaixa(mostrada, c)) {
          mostrada = c
          mostrar(c)
        }
        t = setTimeout(() => medir(0), 300)
      } else if ((anterior && mesmaCaixa(anterior, c)) || leituras >= 12) {
        mostrada = c
        mostrar(c)
        t = setTimeout(() => medir(0), 300)
      } else {
        anterior = c
        t = setTimeout(() => medir(0), 120)
      }
    }
    const medir = (tentativa: number) => {
      if (!vivo) return
      const peca = alvo ? alvos.current.get(alvo)?.current : null
      if (!alvo || !palco.current) return mostrar(null)
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
          chegou({ x: esq, y: topo, w: dir - esq, h: fim - topo })
        })
      })
    }
    // Só espera quando o passo anterior trocou de aba
    const trocouDeAba = passo > 0 && Boolean(PASSOS_DO_TOUR[passo - 1].tocar)
    t = setTimeout(() => medir(0), trocouDeAba ? ESPERA_DA_ABA : 0)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [passo])

  const fechar = useCallback(() => {
    setPasso(null)
    setMostrado(null)
    void chaveDoTour().then((chave) => guardar(chave, true))
    funcoes.current.aoTerminar?.()
  }, [])
  const avancar = useCallback(() => {
    if (passo === null) return
    tum()
    if (passo >= PASSOS_DO_TOUR.length - 1) return fechar()
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
        {mostrado && tamanho.h > 0 && (
          <Cortina
            passo={mostrado.passo}
            caixa={mostrado.caixa}
            esperando={passo !== mostrado.passo}
            tamanho={tamanho}
            aoAvancar={avancar}
            aoPular={fechar}
          />
        )}
      </View>
    </Contexto.Provider>
  )
}

// A fala sem as marcas de destaque (pro leitor de tela)
const falaLimpa = (fala: string) => fala.replace(/\*/g, '')

function Cortina({
  passo,
  caixa,
  esperando,
  tamanho,
  aoAvancar,
  aoPular,
}: {
  passo: number
  caixa: Caixa | null
  esperando: boolean // a aba nova está entrando: a fala anterior fica parada na tela
  tamanho: { w: number; h: number }
  aoAvancar: () => void
  aoPular: () => void // encerra o tour e marca como visto (igual ao fim)
}) {
  const reduzir = useReducedMotion()
  const insets = useSafeAreaInsets()
  const p = PASSOS_DO_TOUR[passo]
  const fazer = Boolean(p.tocar) && Boolean(caixa)
  const ultimo = passo === PASSOS_DO_TOUR.length - 1
  const total = PASSOS_DO_TOUR.length
  const { w: W, h: H } = tamanho

  // ---- Foco: desliza de uma peça pra outra (sem peça: vira um ponto no meio e a tela fica toda escura)
  const destino = caixa ?? { x: W / 2, y: H / 2, w: 0, h: 0 }
  const raio = caixa ? Math.min(RAIO, caixa.h / 2) : 0
  const foco = useRef({
    x: new Animated.Value(destino.x),
    y: new Animated.Value(destino.y),
    w: new Animated.Value(destino.w),
    h: new Animated.Value(destino.h),
    r: new Animated.Value(raio),
    anel: new Animated.Value(caixa ? 1 : 0),
  }).current
  const chaveDoFoco = `${destino.x},${destino.y},${destino.w},${destino.h}`
  useEffect(() => {
    const pares: [Animated.Value, number][] = [
      [foco.x, destino.x],
      [foco.y, destino.y],
      [foco.w, destino.w],
      [foco.h, destino.h],
      [foco.r, raio],
      [foco.anel, caixa ? 1 : 0],
    ]
    if (reduzir) {
      pares.forEach(([v, n]) => v.setValue(n))
      return
    }
    const anim = Animated.parallel(
      pares.map(([v, n]) => Animated.timing(v, { toValue: n, duration: 500, easing: MOLA_DO_FOCO, useNativeDriver: false })),
    )
    anim.start()
    return () => anim.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDoFoco, reduzir])
  // A mola passa um pouco do ponto: tamanho nunca fica negativo
  const larg = foco.w.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: 'clamp' })
  const alt = foco.h.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: 'clamp' })
  // O escuro é uma borda enorme em volta de uma caixa do tamanho da peça: o "buraco" é o miolo
  const B = Math.ceil(Math.max(W, H) * 2)

  // ---- Entrada: o escuro aparece e a caixa de diálogo sobe
  const fundo = useRef(new Animated.Value(reduzir ? 1 : 0)).current
  const entra = useRef(new Animated.Value(reduzir ? 1 : 0)).current
  const [saindo, setSaindo] = useState(false)
  useEffect(() => {
    if (reduzir) return
    Animated.timing(fundo, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }, [fundo, reduzir])

  // ---- Caixa de diálogo: do lado oposto ao foco (peça embaixo → caixa em cima)
  const [altDaCaixa, setAltDaCaixa] = useState(0)
  const embaixo = caixa ? caixa.y + caixa.h / 2 > H * 0.5 : false
  const topoDaCaixa = embaixo
    ? insets.top + 14
    : caixa
      ? H - insets.bottom - 18 - altDaCaixa
      : (H - altDaCaixa) / 2
  const posY = useRef(new Animated.Value(0)).current
  const jaPosicionou = useRef(false)
  useEffect(() => {
    if (!altDaCaixa) return
    if (!jaPosicionou.current || reduzir) {
      // Primeira vez: já nasce no lugar e entra subindo
      jaPosicionou.current = true
      posY.setValue(topoDaCaixa)
      if (!reduzir) {
        Animated.timing(entra, { toValue: 1, duration: 450, easing: MOLA_DA_CAIXA, useNativeDriver: true }).start()
      }
      return
    }
    Animated.timing(posY, { toValue: topoDaCaixa, duration: 450, easing: MOLA_DA_CAIXA, useNativeDriver: true }).start()
  }, [topoDaCaixa, altDaCaixa, reduzir, posY, entra])

  // ---- Fala letra por letra
  const pedacos = useMemo(() => pedacosDaFala(p.fala), [p.fala])
  const letrasDaFala = tamanhoDaFala(pedacos)
  const [letras, setLetras] = useState(reduzir ? letrasDaFala : 0)
  const relogio = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  useEffect(() => {
    if (reduzir) {
      setLetras(letrasDaFala)
      return
    }
    setLetras(0)
    relogio.current = setInterval(() => setLetras((n) => n + 1), LETRA_MS)
    return () => clearInterval(relogio.current)
  }, [passo, letrasDaFala, reduzir])
  const digitando = letras < letrasDaFala
  useEffect(() => {
    if (!digitando) clearInterval(relogio.current)
  }, [digitando])

  // ---- A Norti pula a cada fala (e quando a pessoa erra)
  const [humor, setHumor] = useState<Humor>(p.humor)
  const pulo = useRef(new Animated.Value(1)).current
  const pular = useCallback(() => {
    if (reduzir) return
    pulo.setValue(0)
    Animated.timing(pulo, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()
  }, [pulo, reduzir])
  useEffect(() => {
    setHumor(p.humor)
    pular()
  }, [passo, p.humor, pular])

  // ---- Tocou fora no passo de fazer: a parte acesa balança e a Norti faz "ops"
  const balanco = useRef(new Animated.Value(0)).current
  const voltaDoOps = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(voltaDoOps.current), [])
  const errou = () => {
    setHumor('ops')
    pular()
    clearTimeout(voltaDoOps.current)
    voltaDoOps.current = setTimeout(() => setHumor(p.humor), 900)
    if (reduzir) return
    balanco.setValue(0)
    Animated.sequence(
      [-6, 6, -4, 3, 0].map((v) => Animated.timing(balanco, { toValue: v, duration: 84, useNativeDriver: true })),
    ).start()
  }

  // ---- Laços: anel pulsando e seta quicando (passo de fazer), triângulo piscando ("toque pra seguir")
  const pulso = useRef(new Animated.Value(0)).current
  const quica = useRef(new Animated.Value(0)).current
  const pisca = useRef(new Animated.Value(1)).current
  const mostrarFazer = fazer && !esperando
  useEffect(() => {
    if (!mostrarFazer || reduzir) return
    const anim = Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulso, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulso, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(quica, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(quica, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    ])
    anim.start()
    return () => anim.stop()
  }, [mostrarFazer, reduzir, pulso, quica])
  const podeSeguir = !digitando && !p.tocar && !esperando
  useEffect(() => {
    if (!podeSeguir || reduzir) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(pisca, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(450),
        Animated.timing(pisca, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [podeSeguir, reduzir, pisca])

  // ---- Fim: some devagar e só então fecha
  const sair = () => {
    setSaindo(true)
    if (reduzir) return aoAvancar()
    Animated.parallel([
      Animated.timing(fundo, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(entra, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => aoAvancar())
  }

  const aoTocar = () => {
    if (esperando || saindo) return
    if (digitando) return setLetras(letrasDaFala) // mostra a frase inteira
    if (p.tocar && caixa) return errou()
    if (ultimo) return sair()
    aoAvancar()
  }

  // Fala: o que já "foi escrito" aparece, o resto fica invisível (a caixa não muda de tamanho)
  const fala = pedacos.map((pd, i) => {
    const antes = tamanhoDaFala(pedacos.slice(0, i)) // letras dos pedaços anteriores
    const vistas = Math.min(Math.max(letras - antes, 0), pd.texto.length)
    return (
      <Text key={i} style={pd.destaque ? { color: cor.dourado, fontFamily: fonte.corpoNegrito } : undefined}>
        {pd.texto.slice(0, vistas)}
        <Text style={{ color: 'transparent' }}>{pd.texto.slice(vistas)}</Text>
      </Text>
    )
  })

  return (
    <Animated.View
      // box-none: a camada em si não segura toque; quem segura são as áreas de toque abaixo
      pointerEvents={saindo ? 'none' : 'box-none'}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, opacity: fundo }}
      accessibilityViewIsModal
    >
      {/* Escuro com o buraco do foco, anel dourado e o pulso. Tudo balança junto quando a pessoa erra. */}
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transform: [{ translateX: balanco }] }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: Animated.add(foco.x, -B),
            top: Animated.add(foco.y, -B),
            width: Animated.add(larg, B * 2),
            height: Animated.add(alt, B * 2),
            borderWidth: B,
            borderColor: ESCURO,
            borderRadius: Animated.add(foco.r, B),
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            left: Animated.add(foco.x, -2),
            top: Animated.add(foco.y, -2),
            width: Animated.add(larg, 4),
            height: Animated.add(alt, 4),
            borderRadius: Animated.add(foco.r, 2),
            borderWidth: 2,
            borderColor: cor.dourado,
            opacity: foco.anel,
          }}
        />
        {mostrarFazer ? (
          <Animated.View
            style={{
              position: 'absolute',
              left: Animated.add(foco.x, -2),
              top: Animated.add(foco.y, -2),
              width: Animated.add(larg, 4),
              height: Animated.add(alt, 4),
            }}
          >
            <Animated.View
              style={{
                flex: 1,
                borderRadius: raio + 2,
                borderWidth: 2,
                borderColor: cor.dourado,
                opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) }],
              }}
            />
          </Animated.View>
        ) : null}
      </Animated.View>

      {/* Seta quicando em cima da peça, no passo de fazer */}
      {mostrarFazer ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: Animated.add(foco.x, Animated.add(Animated.multiply(larg, 0.5), -13)),
            top: Animated.add(foco.y, -32),
            transform: [{ translateY: quica.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
          }}
        >
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path d="M12 22 3 10h6V2h6v8h6z" fill={cor.dourado} />
          </Svg>
        </Animated.View>
      ) : null}

      {/* Toques. Normal: a tela toda segue. Passo de fazer: a peça acesa deixa o toque passar pra aba de
          verdade; em volta, tocar faz a parte acesa balançar. */}
      {fazer && caixa ? (
        <>
          <Pressable accessible={false} onPress={aoTocar} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: caixa.y }} />
          <Pressable
            accessible={false}
            onPress={aoTocar}
            style={{ position: 'absolute', left: 0, right: 0, top: caixa.y + caixa.h, bottom: 0 }}
          />
          <Pressable
            accessible={false}
            onPress={aoTocar}
            style={{ position: 'absolute', left: 0, width: caixa.x, top: caixa.y, height: caixa.h }}
          />
          <Pressable
            accessible={false}
            onPress={aoTocar}
            style={{ position: 'absolute', left: caixa.x + caixa.w, right: 0, top: caixa.y, height: caixa.h }}
          />
        </>
      ) : (
        <Pressable accessible={false} onPress={aoTocar} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      )}

      {/* Confete no fim */}
      {ultimo && !reduzir ? <Confete altura={H} /> : null}

      {/* Caixa de diálogo de jogo */}
      <Animated.View
        onLayout={(e) => setAltDaCaixa(Math.round(e.nativeEvent.layout.height))}
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: 0,
          alignItems: 'center',
          opacity: entra,
          transform: [
            { translateY: Animated.add(posY, entra.interpolate({ inputRange: [0, 1], outputRange: [30, 0] })) },
            { scale: entra.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        }}
      >
        <Pressable
          onPress={aoTocar}
          accessibilityRole="button"
          accessibilityLabel={falaLimpa(p.fala)}
          accessibilityHint={p.tocar ? undefined : 'Toque pra seguir'}
          accessibilityLiveRegion="polite"
          style={{
            width: '100%',
            maxWidth: 520,
            marginTop: 12, // espaço pra plaquinha com o nome
            minHeight: 104,
            paddingTop: 14,
            paddingRight: 16,
            paddingBottom: 12,
            paddingLeft: 96,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: cor.dourado,
            backgroundColor: cor.escuro,
            boxShadow: '0 14px 34px rgba(0,0,0,0.4)',
          }}
        >
          {/* Linha fina por dentro, como moldura de jogo */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              right: 4,
              bottom: 4,
              borderRadius: 15,
              borderWidth: 1,
              borderColor: 'rgba(227,160,74,0.25)',
            }}
          />
          {/* A Norti, grande, saindo da caixa */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 4,
              bottom: 6,
              width: 92,
              height: 104,
              alignItems: 'center',
              justifyContent: 'flex-end',
              transformOrigin: 'bottom',
              transform: [
                { translateY: pulo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [10, -8, 0] }) },
                { scaleX: pulo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.04, 1] }) },
                { scaleY: pulo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.08, 0.96, 1] }) },
              ],
            }}
          >
            <Norti humor={humor} tamanho={88} sombra={false} chegar={false} />
          </Animated.View>
          {/* Já carrega os desenhos que vêm depois (no site do app a Norti piscava em branco na
              primeira vez de cada um: o "ops" do erro e a festa do fim) */}
          {DESENHOS_DO_TOUR.map((desenho, i) => (
            <Image
              key={i}
              source={desenho}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
              accessible={false}
            />
          ))}
          {/* Plaquinha com o nome */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -12,
              left: 92,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: cor.dourado,
            }}
          >
            <Text style={{ fontFamily: fonte.titulo, fontSize: 11, letterSpacing: 0.9, color: cor.escuro }}>NORTI</Text>
          </View>

          <Text
            style={{ marginTop: 4, minHeight: 44, fontFamily: fonte.corpoMedio, fontSize: 15.5, lineHeight: 22, color: cor.creme }}
          >
            {fala}
          </Text>

          <View className="flex-row items-center justify-between" style={{ marginTop: 6 }}>
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <Text style={{ fontFamily: fonte.corpoForte, fontSize: 11, color: 'rgba(245,233,214,0.6)', fontVariant: ['tabular-nums'] }}>
                {passo + 1}/{total}
              </Text>
              {/* Android (teste 17/11): não dava pra sair do tour. "Pular" encerra e marca como visto. */}
              {!ultimo ? (
                <Pressable onPress={aoPular} disabled={saindo} accessibilityRole="button" accessibilityLabel="Pular o tour" hitSlop={14}>
                  <Text style={{ fontFamily: fonte.corpoForte, fontSize: 12, color: cor.dourado }}>Pular</Text>
                </Pressable>
              ) : null}
            </View>
            {podeSeguir ? (
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Text style={{ fontFamily: fonte.corpoForte, fontSize: 11, color: 'rgba(245,233,214,0.6)' }}>toque pra seguir</Text>
                <Animated.View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 6,
                    borderRightWidth: 6,
                    borderTopWidth: 8,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: cor.dourado,
                    opacity: pisca,
                  }}
                />
              </View>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

// Confete caindo pela tela toda (o fim do tour)
function Confete({ altura }: { altura: number }) {
  const pecas = useRef(Array.from({ length: 40 }, () => new Animated.Value(0))).current
  useEffect(() => {
    const anim = Animated.parallel(
      pecas.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 2600,
          delay: (i % 8) * 50,
          easing: Easing.bezier(0.3, 0.6, 0.6, 1),
          useNativeDriver: true,
        }),
      ),
    )
    anim.start()
    return () => anim.stop()
  }, [pecas])
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {pecas.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -12,
            left: `${(i * 29) % 100}%`,
            width: 8,
            height: 12,
            borderRadius: 2,
            backgroundColor: CORES_DO_CONFETE[i % CORES_DO_CONFETE.length],
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] }),
            transform: [
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, altura + 24] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '620deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  )
}
