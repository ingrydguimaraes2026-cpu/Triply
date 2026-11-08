import { useMemo, useRef, useState, type ComponentRef } from 'react'
import { Modal, Platform, Pressable, Text, View } from 'react-native'
import Svg, { Circle, G, Path } from 'react-native-svg'
import { geoContains, geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, Geometry } from 'geojson'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'
import mundo from 'world-atlas/countries-110m.json'
import { mapaDaGalera, type DadosDoMapa, type FiltroDoMapa } from '@together/core'
import { hojeIso } from '../lib/formato'
import { cor } from '../../theme'

// Desenho dos países uma vez só (sem a Antártida)
export const PAISES: Feature<Geometry>[] = (
  feature(mundo as unknown as Topology, (mundo as unknown as Topology).objects.countries as GeometryCollection) as unknown as { features: Feature<Geometry>[] }
).features.filter((f) => f.id !== '010')

// Mapa da galera (spec 118b): os lugares carimbados de todas as viagens acendem.
// Números, "quem carimbou mais este ano" e "postar mapa" (9:16).
export function MapaDaGalera({ dados, meuId, aoAntigas }: { dados: DadosDoMapa; meuId: string; aoAntigas?: () => void }) {
  const [filtro, setFiltro] = useState<FiltroDoMapa>('todos')
  const [postando, setPostando] = useState(false)
  const hoje = hojeIso()
  const m = useMemo(() => mapaDaGalera(dados.carimbos, dados.viagens, meuId, filtro, hoje), [dados, meuId, filtro, hoje])
  const nome = (id: string) => (id === meuId ? 'Você' : (dados.nomes.get(id) ?? 'Alguém').split(' ')[0])

  if (!dados.carimbos.length)
    return (
      <View className="gap-2 rounded-3xl bg-cartao p-5">
        <Text className="font-display text-[20px] text-texto">Mapa da galera</Text>
        <MapaDesenhado pontos={[]} />
        <Text className="font-body text-[14px] leading-5 text-corpo">Seu mapa está vazio. Cada lugar onde a galera chegar vira um carimbo e acende aqui.</Text>
        {aoAntigas ? <BotaoPequeno titulo="Contar onde a galera já foi" aoTocar={aoAntigas} /> : null}
      </View>
    )

  return (
    <View className="gap-3 rounded-3xl bg-cartao p-5">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-display text-[20px] text-texto">Mapa da galera</Text>
        {Platform.OS !== 'web' ? (
          <Pressable onPress={() => setPostando(true)} accessibilityRole="button" className="active:opacity-70">
            <Text className="font-body-bold text-[13px] text-caramelo">Postar mapa</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <Chip ativo={filtro === 'todos'} titulo="A galera toda" aoTocar={() => setFiltro('todos')} />
        <Chip ativo={filtro === 'meus'} titulo="Só os meus" aoTocar={() => setFiltro('meus')} />
      </View>

      <MapaDesenhado pontos={m.pontos} />
      <Numeros m={m} />

      {m.podio.length ? (
        <View className="gap-1.5 border-t border-linha pt-3">
          <Text className="font-body-bold text-[13px] text-suave">Quem carimbou mais em {hoje.slice(0, 4)}</Text>
          {m.podio.map((p, i) => (
            <View key={p.pessoaId} className="flex-row items-center justify-between">
              <Text className="font-body-semibold text-[14px] text-texto">
                {i + 1}. {nome(p.pessoaId)}
              </Text>
              <Text className="font-body text-[13px] text-suave">
                {p.carimbos} {p.carimbos === 1 ? 'carimbo' : 'carimbos'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <PostarMapa visivel={postando} m={m} aoFechar={() => setPostando(false)} />
    </View>
  )
}

type Resumo = ReturnType<typeof mapaDaGalera>

function Numeros({ m, claro = false }: { m: Resumo; claro?: boolean }) {
  const itens: [number, string][] = [
    [m.lugares, m.lugares === 1 ? 'lugar' : 'lugares'],
    [m.viagens, m.viagens === 1 ? 'viagem' : 'viagens'],
    ...(m.roles ? ([[m.roles, m.roles === 1 ? 'rolê' : 'rolês']] as [number, string][]) : []),
    [m.diasJuntos, 'dias juntos'],
    [m.km, 'km'],
  ]
  return (
    <View className="flex-row justify-between">
      {itens.map(([n, rotulo]) => (
        <View key={rotulo} className="items-center">
          <Text className={`font-display text-[22px] ${claro ? 'text-creme' : 'text-texto'}`}>{n.toLocaleString('pt-BR')}</Text>
          <Text className={`font-body text-[11px] ${claro ? 'text-dourado' : 'text-suave'}`}>{rotulo}</Text>
        </View>
      ))}
    </View>
  )
}

// O mapa: países com carimbo acendem em dourado; cada lugar é uma bolinha
function MapaDesenhado({ pontos, claro = false }: { pontos: Resumo['pontos']; claro?: boolean }) {
  const [largura, setLargura] = useState(0)
  const altura = Math.round(largura * 0.52)
  const desenho = useMemo(() => {
    if (!largura) return null
    const projecao = geoNaturalEarth1().fitSize([largura, altura], { type: 'FeatureCollection', features: PAISES })
    const caminho = geoPath(projecao)
    const paises = PAISES.map((f, i) => ({
      d: caminho(f) ?? '',
      aceso: pontos.some((p) => geoContains(f, [p.longitude, p.latitude])),
      chave: String(f.id ?? i),
    }))
    const bolinhas = pontos.map((p) => ({ ...p, xy: projecao([p.longitude, p.latitude]) })).filter((p) => p.xy)
    return { paises, bolinhas }
  }, [largura, altura, pontos])

  return (
    <View onLayout={(e) => setLargura(Math.round(e.nativeEvent.layout.width))} style={{ height: altura || 160 }}>
      {desenho ? (
        <Svg width={largura} height={altura} accessibilityLabel={`Mapa com ${pontos.length} ${pontos.length === 1 ? 'lugar carimbado' : 'lugares carimbados'}`}>
          <G>
            {desenho.paises.map((p) => (
              <Path key={p.chave} d={p.d} fill={p.aceso ? cor.dourado : claro ? '#6A4626' : cor.areia} stroke={claro ? cor.couro : cor.cartao} strokeWidth={0.5} />
            ))}
          </G>
          {desenho.bolinhas.map((p) => (
            <G key={p.nome}>
              <Circle cx={p.xy![0]} cy={p.xy![1]} r={5} fill={cor.dourado} opacity={0.35} />
              <Circle cx={p.xy![0]} cy={p.xy![1]} r={2.5} fill={claro ? cor.creme : cor.couro} />
            </G>
          ))}
        </Svg>
      ) : null}
    </View>
  )
}

// "Postar mapa": cartão 9:16 que vira PNG 1080×1920
function PostarMapa({ visivel, m, aoFechar }: { visivel: boolean; m: Resumo; aoFechar: () => void }) {
  const ref = useRef<ComponentRef<typeof View>>(null)
  const [gerando, setGerando] = useState(false)

  async function compartilhar() {
    setGerando(true)
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, width: 1080, height: 1920 })
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' })
    } catch (e) {
      console.error('Erro ao gerar a imagem do mapa:', e)
    }
    setGerando(false)
  }

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
      <View className="flex-1 items-center justify-center gap-4 bg-black/70 px-8">
        <View ref={ref} collapsable={false} style={{ width: '100%', aspectRatio: 9 / 16, borderRadius: 24, overflow: 'hidden' }}>
          <View className="flex-1 justify-between bg-couro px-5 py-10">
            <View className="items-center gap-1">
              <Text className="font-body-bold text-[12px] uppercase tracking-widest text-dourado">O mapa da nossa galera</Text>
              <Text className="font-display text-[34px] text-creme">
                {m.lugares} {m.lugares === 1 ? 'lugar' : 'lugares'}
              </Text>
            </View>
            <MapaDesenhado pontos={m.pontos} claro />
            <Numeros m={m} claro />
            <Text className="text-center font-body-bold text-[11px] uppercase tracking-widest text-dourado">Feito com Norti</Text>
          </View>
        </View>
        <View className="w-full gap-2.5">
          <BotaoPequeno titulo={gerando ? 'Gerando...' : 'Compartilhar'} principal aoTocar={() => void compartilhar()} />
          <BotaoPequeno titulo="Fechar" aoTocar={aoFechar} />
        </View>
      </View>
    </Modal>
  )
}

function Chip({ ativo, titulo, aoTocar }: { ativo: boolean; titulo: string; aoTocar: () => void }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      className={`rounded-full px-3.5 py-1.5 ${ativo ? 'bg-couro' : 'bg-areia'}`}
    >
      <Text className={`font-body-bold text-[12px] ${ativo ? 'text-white' : 'text-couro'}`}>{titulo}</Text>
    </Pressable>
  )
}

function BotaoPequeno({ titulo, aoTocar, principal = false }: { titulo: string; aoTocar: () => void; principal?: boolean }) {
  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" className={`items-center rounded-full px-4 py-2.5 active:opacity-80 ${principal ? 'bg-couro' : 'bg-areia'}`}>
      <Text className={`font-body-bold text-[14px] ${principal ? 'text-white' : 'text-couro'}`}>{titulo}</Text>
    </Pressable>
  )
}
