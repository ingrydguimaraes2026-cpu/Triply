import { useEffect } from 'react'
import { Text, View, useWindowDimensions } from 'react-native'
import { Foto } from './Foto'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { Clock, Sun, Ticket } from './icones'
import { creditoDaFoto, INFO_DO_TIPO, precoLegivel, tempoLegivel, type Escolha, type LugarDoCatalogo } from '@together/core'
import { Avatar } from './pecas'
import { mola, tum, useReducedMotion } from './movimento'
import { cor, sombra } from '../../theme'

// Cartão do Explorar (specs 114 e 117), estilo Tinder:
// - arrastar pro lado decide (direita = quero, esquerda = passo, pra cima = não abro mão);
// - um "peteleco" rápido também decide, mesmo curto;
// - o gesto roda na thread nativa (Gesture Handler + Reanimated): segue o dedo sem travar;
// - vibra leve quando passa do ponto de decidir; tocar no cartão abre o "ver mais";
// - o de baixo (`parado`) espera menor e sobe com mola quando vira o de cima.

const LIMITE_X = 100
const LIMITE_Y = 110
const VELOCIDADE = 500 // px/s: peteleco

type Props = {
  lugar: LugarDoCatalogo
  altura: number
  parado?: boolean
  comando?: { escolha: Escolha; vez: number } | null // teclado/atalho pede pra voar
  podeDecidir?: (e: Escolha) => boolean // false = não aceita (ex.: já tem 3 "não abro mão"): volta pro centro
  aoVoar?: (e: Escolha) => void // terminou de voar: a tela troca de cartão
  aoVerMais?: () => void
  querem?: { nome: string; indice: number }[] // spec 117: quem do comboio já deu "quero" (fora eu)
}

export function CartaoDoExplorar({ lugar, altura, parado, comando, podeDecidir, aoVoar, aoVerMais, querem }: Props) {
  const { width } = useWindowDimensions()
  const reduzir = useReducedMotion()
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const voando = useSharedValue(false)
  const passou = useSharedValue(0) // 0 = no meio; 1/-1/2 = passou do limite (quero/passo/estrela): vibra 1 vez
  const subida = useSharedValue(parado ? 0 : 0.6)
  // Velocidade medida por nós (no navegador a do gesto chega zerada quando solta o dedo)
  const ultimo = useSharedValue({ x: 0, y: 0, t: 0 })
  const velocidade = useSharedValue({ x: 0, y: 0 })

  useEffect(() => {
    if (!parado) subida.value = reduzir ? withTiming(1, { duration: 160 }) : withSpring(1, mola.padrao)
  }, [parado, reduzir, subida])

  // Voa pra fora (quem chama já decidiu que pode)
  function voar(e: Escolha) {
    if (voando.value) return
    voando.value = true
    tum()
    const fim = () => aoVoar?.(e)
    const longe = width * 1.4
    if (e === 'nao_abro_mao') {
      y.value = withTiming(-altura * 2, { duration: 260 }, (ok) => ok && runOnJS(fim)())
    } else {
      x.value = withTiming(e === 'quero' ? longe : -longe, { duration: 240 }, (ok) => ok && runOnJS(fim)())
      y.value = withTiming(y.value + 30, { duration: 240 })
    }
  }

  function voltarProCentro() {
    x.value = withSpring(0, mola.firme)
    y.value = withSpring(0, mola.firme)
  }

  // Soltou: decide no JS (podeDecidir é função da tela)
  function soltou(e: Escolha | null) {
    if (e && (podeDecidir?.(e) ?? true)) voar(e)
    else voltarProCentro()
  }

  // Botão da tela (ou teclado) pediu pra voar
  useEffect(() => {
    if (comando && !parado) voar(comando.escolha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comando?.vez])

  const arrasto = Gesture.Pan()
    .enabled(!parado)
    .minDistance(6)
    .onBegin(() => {
      ultimo.value = { x: 0, y: 0, t: Date.now() }
      velocidade.value = { x: 0, y: 0 }
    })
    .onUpdate((g) => {
      if (voando.value) return
      const agoraMs = Date.now()
      const dt = Math.max(1, agoraMs - ultimo.value.t)
      // média suave das últimas mudanças, em px/s
      velocidade.value = {
        x: velocidade.value.x * 0.4 + ((g.translationX - ultimo.value.x) / dt) * 1000 * 0.6,
        y: velocidade.value.y * 0.4 + ((g.translationY - ultimo.value.y) / dt) * 1000 * 0.6,
      }
      ultimo.value = { x: g.translationX, y: g.translationY, t: agoraMs }
      x.value = g.translationX
      // Pra cima anda livre; pra baixo, quase nada
      y.value = g.translationY < 0 ? g.translationY : g.translationY * 0.2
      const agora = g.translationX > LIMITE_X ? 1 : g.translationX < -LIMITE_X ? -1 : g.translationY < -LIMITE_Y ? 2 : 0
      if (agora !== 0 && agora !== passou.value) runOnJS(tum)()
      passou.value = agora
    })
    .onEnd((g) => {
      if (voando.value) return
      passou.value = 0
      // Velocidade: a do gesto ou a nossa, a maior (parado há mais de 120 ms = sem peteleco)
      const parou = Date.now() - ultimo.value.t > 120
      const vx = Math.abs(g.velocityX) > Math.abs(velocidade.value.x) ? g.velocityX : parou ? 0 : velocidade.value.x
      const vy = Math.abs(g.velocityY) > Math.abs(velocidade.value.y) ? g.velocityY : parou ? 0 : velocidade.value.y
      const direita = g.translationX > LIMITE_X || (vx > VELOCIDADE && g.translationX > 30)
      const esquerda = g.translationX < -LIMITE_X || (vx < -VELOCIDADE && g.translationX < -30)
      const cima = g.translationY < -LIMITE_Y || (vy < -VELOCIDADE && g.translationY < -30)
      const e: Escolha | null = direita ? 'quero' : esquerda ? 'passo' : cima ? 'nao_abro_mao' : null
      runOnJS(soltou)(e)
    })

  const toque = Gesture.Tap()
    .enabled(!parado && !!aoVerMais)
    .maxDistance(8)
    .onEnd((_e, ok) => {
      if (ok && aoVerMais) runOnJS(aoVerMais)()
    })

  const gesto = Gesture.Race(arrasto, toque)

  const estiloDoCartao = useAnimatedStyle(() => {
    const escala = interpolate(subida.value, [0, 1], [0.94, 1])
    const descida = interpolate(subida.value, [0, 1], [14, 0])
    const giro = interpolate(x.value, [-300, 0, 300], [-14, 0, 14])
    return {
      transform: [{ translateX: x.value }, { translateY: y.value + descida }, { rotate: `${giro}deg` }, { scale: escala }],
    }
  })
  const estiloQuero = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [10, LIMITE_X], [0, 1], Extrapolation.CLAMP) }))
  const estiloPasso = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-LIMITE_X, -10], [1, 0], Extrapolation.CLAMP) }))
  const estiloEstrela = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [-LIMITE_Y, -10], [1, 0], Extrapolation.CLAMP) }))

  const info = INFO_DO_TIPO[lugar.tipo] ?? INFO_DO_TIPO.outro
  const alturaFoto = Math.round(altura * 0.6)

  return (
    <GestureDetector gesture={gesto}>
      <Animated.View
        importantForAccessibility={parado ? 'no-hide-descendants' : 'auto'}
        accessibilityHint={parado ? undefined : 'Arraste pra direita se quer, pra esquerda se passa, pra cima se não abre mão. Toque pra ver mais.'}
        style={[
          { position: 'absolute', left: 0, right: 0, top: 0, height: altura, borderRadius: 26, overflow: 'hidden', backgroundColor: cor.cartao },
          sombra.hero,
          estiloDoCartao,
        ]}
      >
        <View style={{ height: alturaFoto, backgroundColor: cor.areia }}>
          {lugar.fotoUrl ? (
            // pointerEvents none: no navegador a foto não "rouba" o arrasto (senão vira arrastar imagem)
            <Foto source={{ uri: lugar.fotoUrl }} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} accessibilityLabel={parado ? undefined : lugar.nome} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="font-display text-[22px] text-suave">{info.nome}</Text>
            </View>
          )}
          {querem?.length ? (
            // Match do comboio: "Ana e Ju querem"
            <View className="absolute left-3.5 top-3.5 flex-row items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1 pr-3">
              <View className="flex-row" style={{ paddingLeft: 6 }}>
                {querem.slice(0, 3).map((q) => (
                  <View key={q.indice} style={{ marginLeft: -6 }}>
                    <Avatar nome={q.nome} indice={q.indice} tamanho={22} borda="#fff" />
                  </View>
                ))}
              </View>
              <Text className="font-body-bold text-[12px] text-texto">{textoDeQuemQuer(querem.map((q) => q.nome))}</Text>
            </View>
          ) : (
            <View className="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-2.5 py-1.5">
              <Text className="font-body-bold text-[12px] text-texto">{info.nome}</Text>
            </View>
          )}
          {lugar.fotoUrl ? (
            <Text numberOfLines={1} className="absolute bottom-2.5 right-3 max-w-[70%] font-body text-[10px] text-white" style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowRadius: 3 }}>
              {creditoDaFoto(lugar.fotoAutor, lugar.fotoLicenca)}
            </Text>
          ) : null}
          {!parado ? (
            <>
              <Animated.View style={[{ position: 'absolute', left: 18, top: 56, transform: [{ rotate: '-12deg' }] }, estiloQuero]}>
                <Text className="rounded-[10px] border-[3px] bg-white/90 px-3 py-1 font-body-bold text-[24px]" style={{ color: cor.verde, borderColor: cor.verde }}>
                  QUERO
                </Text>
              </Animated.View>
              <Animated.View style={[{ position: 'absolute', right: 18, top: 56, transform: [{ rotate: '12deg' }] }, estiloPasso]}>
                <Text className="rounded-[10px] border-[3px] bg-white/90 px-3 py-1 font-body-bold text-[24px]" style={{ color: cor.vermelho, borderColor: cor.vermelho }}>
                  PASSO
                </Text>
              </Animated.View>
              <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' }, estiloEstrela]}>
                <Text className="rounded-[10px] border-[3px] bg-white/90 px-3 py-1 font-body-bold text-[18px]" style={{ color: cor.couro, borderColor: cor.caramelo }}>
                  NÃO ABRO MÃO
                </Text>
              </Animated.View>
            </>
          ) : null}
        </View>

        <View className="flex-1 gap-2 px-[18px] pb-[18px] pt-4">
          <View>
            <Text numberOfLines={2} className="font-display text-[24px] leading-[28px] text-texto">
              {lugar.nome}
            </Text>
            {lugar.bairro ? <Text className="mt-0.5 font-body text-[13px] text-suave">{lugar.bairro}</Text> : null}
          </View>
          {lugar.porQue ? (
            <Text numberOfLines={3} className="font-body text-[15px] leading-[21px] text-corpo">
              {lugar.porQue}
            </Text>
          ) : null}
          <View className="mt-auto flex-row flex-wrap items-center gap-1.5">
            <Chip Icone={Clock} texto={tempoLegivel(lugar.tempoMin)} />
            <Chip Icone={Ticket} texto={precoLegivel(lugar.gratis)} />
            {lugar.melhorHora ? <Chip Icone={Sun} texto={lugar.melhorHora} /> : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

function textoDeQuemQuer(nomes: string[]) {
  if (nomes.length === 1) return `${nomes[0]} quer`
  if (nomes.length <= 3) return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]} querem`
  return `${nomes.slice(0, 2).join(', ')} e mais ${nomes.length - 2} querem`
}

function Chip({ Icone, texto }: { Icone: typeof Clock; texto: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-chip px-2.5 py-1.5">
      <Icone size={14} color={cor.couro} />
      <Text className="font-body-semibold text-[12px] text-texto">{texto}</Text>
    </View>
  )
}
