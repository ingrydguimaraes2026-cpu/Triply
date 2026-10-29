import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, PanResponder, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../../src/ui/StatusBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Ellipse, Path, Polyline, Rect } from 'react-native-svg'
import { Bed, Bus, Car, Footprints, MapPin, Mountain, Plane, Route, Ship, TrainFront, Utensils, type LucideIcon } from 'lucide-react-native'
import { buscarClima, buscarDestinos, buscarLugares, buscarTrajetos, interpretarTempo, type Destino, type Lugar, type PrevisaoDia, type Trajeto, type ViagemComDetalhes } from '@together/core'
import { useCarregar } from '../../src/dados/useCarregar'
import { useViagemAtual } from '../../src/dados/viagemAtual'
import { diaCurto, diaLongo, diasDaViagem, hora, paraIso } from '../../src/lib/formato'
import { supabase } from '../../src/lib/supabase'
import { Carregando, ErroNaTela, IconeQuadrado } from '../../src/ui/pecas'
import { SemViagem } from '../../src/ui/SemViagem'
import { useTamanhoDaTela } from '../../src/ui/Moldura'
import { cor } from '../../theme'

// Roteiro (tela "1h" do design): mapa ilustrado com os destinos numerados e uma
// folha que sobe por cima (arraste a alça) com a linha do tempo de cada dia.
const ICONE_DO_MEIO: Record<string, LucideIcon> = { aviao: Plane, carro: Car, onibus: Bus, trem: TrainFront, barco: Ship, a_pe: Footprints }
const ICONE_DO_LUGAR: Record<string, LucideIcon> = { passeio: Mountain, comida: Utensils }

export default function Roteiro() {
  const { atual } = useViagemAtual()
  if (!atual) return <SemViagem titulo="Roteiro" />
  return <RoteiroDaViagem viagem={atual} />
}

type Item = { chave: string; hora: string; Icone: LucideIcon; titulo: string; detalhe: string }

function RoteiroDaViagem({ viagem }: { viagem: ViagemComDetalhes }) {
  const carga = useCarregar(
    () => Promise.all([buscarDestinos(supabase, viagem.id), buscarLugares(supabase, viagem.id), buscarTrajetos(supabase, viagem.id)]),
    [viagem.id],
  )
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const [destinos, lugares, trajetos] = carga.dados
  return <Tela viagem={viagem} destinos={destinos} lugares={lugares} trajetos={trajetos} />
}

function Tela({ viagem, destinos, lugares, trajetos }: { viagem: ViagemComDetalhes; destinos: Destino[]; lugares: Lugar[]; trajetos: Trajeto[] }) {
  const insets = useSafeAreaInsets()
  const { width, height } = useTamanhoDaTela()
  const largura = width
  const alturaDoMapa = Math.round(height * 0.66)

  const dias = useMemo(() => {
    const d = diasDaViagem(viagem.dataInicio, viagem.dataFim)
    return d.length ? d : [new Date()]
  }, [viagem.dataInicio, viagem.dataFim])
  const [diaEscolhido, setDiaEscolhido] = useState(0)
  const dia = dias[Math.min(diaEscolhido, dias.length - 1)]
  const itens = useMemo(() => montarDia(paraIso(dia), destinos, lugares, trajetos), [dia, destinos, lugares, trajetos])
  const pinos = useMemo(() => posicionarPinos(destinos, largura, insets.top + 80, Math.round(height * 0.38) - 36), [destinos, largura, insets.top, height])
  const onde = destinoDoDia(paraIso(dia), destinos)

  // Clima do destino de hoje (roadmap #8): busca a previsão do destino inteiro e
  // guarda por data; o chip mostra a do dia escolhido. Sem coordenadas/datas → sem chip.
  const [clima, setClima] = useState<Record<string, PrevisaoDia>>({})
  useEffect(() => {
    if (!onde?.chegada || onde.latitude == null || onde.longitude == null) {
      setClima({})
      return
    }
    let vivo = true
    buscarClima(onde.latitude, onde.longitude, onde.chegada, onde.saida ?? onde.chegada, paraIso(new Date()))
      .then((dias) => vivo && setClima(Object.fromEntries(dias.map((p) => [p.data, p]))))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [onde?.id, onde?.chegada, onde?.saida, onde?.latitude, onde?.longitude])
  const previsaoDoDia = clima[paraIso(dia)]

  // Folha arrastável com 3 paradas: alta, média, baixa
  const paradas = [insets.top + 90, Math.round(height * 0.38), Math.round(height * 0.66)]
  const topo = useRef(new Animated.Value(paradas[1])).current
  const atualTopo = useRef(paradas[1])
  const arraste = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_e, g) => topo.setValue(Math.max(paradas[0], Math.min(paradas[2], atualTopo.current + g.dy))),
      onPanResponderRelease: (_e, g) => {
        const solto = atualTopo.current + g.dy
        const alvo = paradas.reduce((a, b) => (Math.abs(b - solto) < Math.abs(a - solto) ? b : a))
        atualTopo.current = alvo
        Animated.spring(topo, { toValue: alvo, useNativeDriver: false, friction: 9 }).start()
      },
    }),
  ).current

  return (
    <View className="flex-1" style={{ backgroundColor: '#EADBC2' }}>
      <StatusBar style="dark" />
      <MapaIlustrado largura={largura} altura={alturaDoMapa} pinos={pinos} destaque={onde ? destinos.indexOf(onde) : -1} />

      <View className="absolute left-5 right-5 items-center" style={{ top: insets.top + 8 }}>
        <View className="h-10 justify-center rounded-full bg-fundo px-4" style={{ boxShadow: '0 4px 12px rgba(74,46,20,0.15)' }}>
          <Text className="font-body-bold text-[14px] text-texto" numberOfLines={1}>
            Roteiro · {viagem.nome}
          </Text>
        </View>
      </View>

      <Animated.View
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: topo, backgroundColor: cor.fundo, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: '0 -10px 30px rgba(74,46,20,0.15)' }}
      >
        <View {...arraste.panHandlers} className="items-center pb-1.5 pt-2.5" style={{ cursor: 'grab' } as object}>
          <View className="h-[5px] w-10 rounded-full bg-tracejado" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }} style={{ flexGrow: 0 }}>
          {dias.map((d, i) => {
            const ativo = i === diaEscolhido
            return (
              <Pressable key={i} onPress={() => setDiaEscolhido(i)} className={`items-center rounded-xl border px-3.5 py-2 ${ativo ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}>
                <Text className={`font-body-bold text-[13px] ${ativo ? 'text-white' : 'text-texto'}`}>Dia {i + 1}</Text>
                <Text className={`font-body text-[11px] ${ativo ? 'text-white/85' : 'text-texto/85'}`}>{diaCurto(d)}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
        <View className="flex-row items-baseline justify-between px-5 pb-2 pt-3.5">
          <Text className="font-display text-[22px] text-texto">{diaLongo(dia)}</Text>
          <Text className="font-body text-[13px] text-suave">{onde ? onde.nome : `${itens.length} paradas`}</Text>
        </View>
        {previsaoDoDia ? (
          <View className="flex-row items-center gap-1.5 px-5 pb-1">
            <Text className="text-[16px]">{interpretarTempo(previsaoDoDia.codigo).emoji}</Text>
            <Text className="font-body-medium text-[13px] text-corpo">
              {interpretarTempo(previsaoDoDia.codigo).rotulo}
              {previsaoDoDia.tempMax != null ? ` · ${Math.round(previsaoDoDia.tempMax)}°` : ''}
              {previsaoDoDia.tempMin != null ? ` / ${Math.round(previsaoDoDia.tempMin)}°` : ''}
              {previsaoDoDia.tipo === 'estimativa' ? ' · estimativa' : ''}
            </Text>
          </View>
        ) : null}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120 }}>
          {itens.length === 0 ? (
            <Text className="mt-4 text-center font-body text-[14px] leading-5 text-corpo">
              Nada marcado pra esse dia ainda.{'\n'}Os lugares e trajetos que vocês adicionarem aparecem aqui.
            </Text>
          ) : (
            itens.map((it, i) => (
              <View key={it.chave} className="flex-row gap-3">
                <Text className="w-[52px] pt-4 font-display text-[17px] text-texto">{it.hora}</Text>
                <View className="w-3.5 items-center">
                  <View className="h-5 w-0.5" style={{ backgroundColor: i === 0 ? 'transparent' : '#E3D2B8' }} />
                  <View className="h-2.5 w-2.5 rounded-full border-2 border-fundo bg-couro" style={{ boxShadow: '0 0 0 1.5px #7B542F' }} />
                  <View className="w-0.5 flex-1" style={{ backgroundColor: i === itens.length - 1 ? 'transparent' : '#E3D2B8' }} />
                </View>
                <View className="mb-2.5 min-w-0 flex-1 flex-row items-center gap-3 rounded-2xl bg-cartao p-3.5" style={{ boxShadow: '0 4px 14px rgba(74,46,20,0.06)' }}>
                  <IconeQuadrado tamanho={36}>
                    <it.Icone size={19} color={cor.couro} />
                  </IconeQuadrado>
                  <View className="min-w-0 flex-1">
                    <Text className="font-body-bold text-[14px] text-texto">{it.titulo}</Text>
                    {it.detalhe ? <Text className="mt-0.5 font-body text-[12.5px] text-suave">{it.detalhe}</Text> : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  )
}

// Onde o comboio está nesse dia (o destino cujo período inclui o dia)
function destinoDoDia(dia: string, destinos: Destino[]) {
  return destinos.find((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia)
}

// Linha do tempo do dia: trajetos que partem nele, chegadas/saídas e os lugares do destino
function montarDia(dia: string, destinos: Destino[], lugares: Lugar[], trajetos: Trajeto[]): Item[] {
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const itens: Item[] = []
  for (const t of trajetos) {
    if (!t.partida || paraIso(new Date(t.partida)) !== dia) continue
    itens.push({
      chave: 't' + t.id,
      hora: hora(t.partida),
      Icone: ICONE_DO_MEIO[t.meio] ?? Route,
      titulo: `${nomeDe(t.origem_id)} → ${nomeDe(t.destino_id)}`,
      detalhe: [t.observacao, t.chegada ? `chega ${hora(t.chegada)}` : null].filter(Boolean).join(' · '),
    })
  }
  for (const d of destinos) {
    if (d.chegada === dia) itens.push({ chave: 'c' + d.id, hora: '', Icone: Bed, titulo: `Chegada em ${d.nome}`, detalhe: d.pais ?? '' })
    if (d.saida === dia && d.saida !== d.chegada) itens.push({ chave: 's' + d.id, hora: '', Icone: MapPin, titulo: `Saída de ${d.nome}`, detalhe: '' })
  }
  const onde = destinoDoDia(dia, destinos)
  if (onde) {
    for (const l of lugares.filter((x) => x.destino_id === onde.id)) {
      itens.push({ chave: 'l' + l.id, hora: '', Icone: ICONE_DO_LUGAR[l.tipo] ?? MapPin, titulo: l.nome, detalhe: [l.horario, l.observacao].filter(Boolean).join(' · ') })
    }
  }
  return itens
}

// O mapa é ilustrado (não é geográfico): os destinos ficam espalhados numa curva, na ordem
// do roteiro, entre o título e a folha. Com coordenadas reais, destinos perto uns dos
// outros (ex.: 5 cidades na Itália + 1 no Brasil) ficariam empilhados.
function posicionarPinos(destinos: Destino[], largura: number, topo: number, base: number) {
  const area = { x0: 44, x1: largura - 44, y0: topo, y1: base }
  return destinos.map((_d, i) => {
    const t = destinos.length <= 1 ? 0.5 : i / (destinos.length - 1)
    return { x: area.x0 + t * (area.x1 - area.x0), y: area.y0 + (area.y1 - area.y0) * (0.5 + 0.45 * Math.sin(t * Math.PI * 2)) }
  })
}

function MapaIlustrado({ largura, altura, pinos, destaque }: { largura: number; altura: number; pinos: { x: number; y: number }[]; destaque: number }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura }}>
      <Svg width={largura} height={altura} viewBox="0 0 393 560" preserveAspectRatio="none">
        <Rect width={393} height={560} fill="#EADBC2" />
        <Path d="M-20 120 C60 80 120 140 200 100 S340 60 420 110 L420 -10 L-20 -10Z" fill="#E1CDAE" />
        <Path d="M-20 300 C40 260 110 330 170 290 S300 250 420 300 L420 380 C320 340 220 400 120 360 S20 360 -20 380Z" fill="#E4D2B5" />
        <Ellipse cx={300} cy={170} rx={70} ry={40} fill="#DCC6A3" />
        <Ellipse cx={90} cy={220} rx={50} ry={28} fill="#DFCBAA" />
        <Path d="M-10 250 C60 240 90 200 150 210 S250 260 300 230 S380 160 410 170" fill="none" stroke="#C9B79A" strokeWidth={7} strokeLinecap="round" />
        <Path d="M40 -10 C60 80 30 160 70 260 S120 420 100 560" fill="none" stroke="#F6EEDF" strokeWidth={5} />
        <Path d="M-10 160 L130 170 L240 120 L410 140" fill="none" stroke="#F6EEDF" strokeWidth={4} />
        <Path d="M200 -10 L215 185 L250 560" fill="none" stroke="#F6EEDF" strokeWidth={3} />
      </Svg>
      {pinos.length > 1 ? (
        <Svg width={largura} height={altura} style={{ position: 'absolute' }}>
          <Polyline points={pinos.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#7B542F" strokeWidth={2.5} strokeDasharray="6 6" strokeLinecap="round" />
        </Svg>
      ) : null}
      {pinos.map((p, i) => (
        <View
          key={i}
          className="absolute h-[30px] w-[30px] items-center justify-center border-2 border-fundo"
          style={{
            left: p.x - 15,
            top: p.y - 15,
            borderRadius: 15,
            borderBottomLeftRadius: 4,
            transform: [{ rotate: '-45deg' }],
            backgroundColor: i === destaque ? cor.caramelo : cor.couro,
            boxShadow: '0 4px 10px rgba(74,46,20,0.3)',
          }}
        >
          <Text className="font-body-bold text-[12px] text-white" style={{ transform: [{ rotate: '45deg' }] }}>
            {i + 1}
          </Text>
        </View>
      ))}
    </View>
  )
}
