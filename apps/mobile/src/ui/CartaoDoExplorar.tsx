import { useEffect, useMemo, useRef } from 'react'
import { Animated, Image, PanResponder, Platform, Pressable, Text, View } from 'react-native'
import { Clock, Sun, Ticket } from 'lucide-react-native'
import { creditoDaFoto, INFO_DO_TIPO, precoLegivel, tempoLegivel, type Escolha, type LugarDoCatalogo } from '@together/core'
import { cor, sombra } from '../../theme'

// Cartão do Explorar (spec 114) no app. Igual ao protótipo aprovado:
// - o de baixo (`parado`) fica imóvel, do mesmo tamanho e com o mesmo conteúdo;
// - só o de cima arrasta; soltar longe decide (voa de onde soltou); soltar perto volta pro centro;
// - os botões da tela mandam um `comando` e o cartão voa igual;
// - a troca de cartão é instantânea (a tela troca o `key`), sem "saltar".

const LIMITE_X = 110
const LIMITE_Y = 110
const NATIVO = Platform.OS !== 'web'
const DESTINO_DO_VOO: Record<Escolha, { x: number; y: number }> = {
  quero: { x: 600, y: 40 },
  passo: { x: -600, y: 40 },
  nao_abro_mao: { x: 0, y: -1000 },
}

type Props = {
  lugar: LugarDoCatalogo
  altura: number
  parado?: boolean
  comando?: { escolha: Escolha; vez: number } | null // os botões pedem pra voar
  podeDecidir?: (e: Escolha) => boolean // false = não aceita (ex.: já tem 3 "não abro mão"): volta pro centro
  aoVoar?: (e: Escolha) => void // terminou de voar: a tela troca de cartão
  aoVerMais?: () => void
}

export function CartaoDoExplorar({ lugar, altura, parado, comando, podeDecidir, aoVoar, aoVerMais }: Props) {
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const voando = useRef(false)

  function voar(e: Escolha) {
    if (voando.current) return
    voando.current = true
    Animated.timing(pos, { toValue: DESTINO_DO_VOO[e], duration: 250, useNativeDriver: NATIVO }).start(() => aoVoar?.(e))
  }

  // Botão da tela (ou teclado) pediu pra voar
  useEffect(() => {
    if (comando && !parado) voar(comando.escolha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comando?.vez])

  const arrasto = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => !parado && !voando.current && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
        // Já pegou o cartão: não solta pra rolagem nem pra outro gesto no meio do arrasto
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => pos.setValue({ x: g.dx, y: Math.min(40, g.dy) }),
        onPanResponderRelease: (_, g) => {
          const e: Escolha | null = g.dx > LIMITE_X ? 'quero' : g.dx < -LIMITE_X ? 'passo' : g.dy < -LIMITE_Y ? 'nao_abro_mao' : null
          if (e && (podeDecidir?.(e) ?? true)) voar(e)
          else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: NATIVO, friction: 6 }).start()
        },
        onPanResponderTerminate: () => Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: NATIVO }).start(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parado, podeDecidir],
  )

  const giro = pos.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-16deg', '0deg', '16deg'] })
  const opQuero = pos.x.interpolate({ inputRange: [0, LIMITE_X], outputRange: [0, 1], extrapolate: 'clamp' })
  const opPasso = pos.x.interpolate({ inputRange: [-LIMITE_X, 0], outputRange: [1, 0], extrapolate: 'clamp' })
  const opEstrela = pos.y.interpolate({ inputRange: [-LIMITE_Y, 0], outputRange: [1, 0], extrapolate: 'clamp' })

  const info = INFO_DO_TIPO[lugar.tipo] ?? INFO_DO_TIPO.outro
  const alturaFoto = Math.round(altura * 0.58)

  return (
    <Animated.View
      {...(parado ? {} : arrasto.panHandlers)}
      importantForAccessibility={parado ? 'no-hide-descendants' : 'auto'}
      style={[
        { position: 'absolute', left: 0, right: 0, top: 0, height: altura, borderRadius: 26, overflow: 'hidden', backgroundColor: cor.cartao },
        sombra.hero,
        parado ? null : { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate: giro }] },
      ]}
    >
      <View style={{ height: alturaFoto, backgroundColor: cor.areia }}>
        {lugar.fotoUrl ? (
          // pointerEvents none: no navegador a foto não "rouba" o arrasto (senão vira arrastar imagem)
          <Image source={{ uri: lugar.fotoUrl }} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} resizeMode="cover" accessibilityLabel={parado ? undefined : lugar.nome} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="font-display text-[22px] text-suave">{info.nome}</Text>
          </View>
        )}
        <View className="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-2.5 py-1.5">
          <Text className="font-body-bold text-[12px] text-texto">{info.nome}</Text>
        </View>
        {lugar.fotoUrl ? (
          <Text numberOfLines={1} className="absolute bottom-2.5 right-3 max-w-[70%] font-body text-[10px] text-white" style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowRadius: 3 }}>
            {creditoDaFoto(lugar.fotoAutor, lugar.fotoLicenca)}
          </Text>
        ) : null}
        {!parado ? (
          <>
            <Animated.View style={{ position: 'absolute', left: 18, top: 56, opacity: opQuero, transform: [{ rotate: '-12deg' }] }}>
              <Text className="rounded-[10px] border-[3px] bg-white/90 px-3 py-1 font-body-bold text-[22px]" style={{ color: cor.verde, borderColor: cor.verde }}>
                QUERO
              </Text>
            </Animated.View>
            <Animated.View style={{ position: 'absolute', right: 18, top: 56, opacity: opPasso, transform: [{ rotate: '12deg' }] }}>
              <Text className="rounded-[10px] border-[3px] bg-white/90 px-3 py-1 font-body-bold text-[22px]" style={{ color: cor.vermelho, borderColor: cor.vermelho }}>
                PASSO
              </Text>
            </Animated.View>
            <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 130, alignItems: 'center', opacity: opEstrela }}>
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
          {parado ? null : (
            <Pressable accessibilityRole="button" onPress={aoVerMais} hitSlop={8} className="ml-auto min-h-[36px] justify-center px-1">
              <Text className="font-body-bold text-[13px] text-couro underline">Ver mais</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

function Chip({ Icone, texto }: { Icone: typeof Clock; texto: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-chip px-2.5 py-1.5">
      <Icone size={14} color={cor.couro} />
      <Text className="font-body-semibold text-[12px] text-texto">{texto}</Text>
    </View>
  )
}
