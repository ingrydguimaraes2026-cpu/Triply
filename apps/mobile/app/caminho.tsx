import { useMemo, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import Svg, { Circle, Path, Polyline } from 'react-native-svg'
import { geoMercator, geoPath } from 'd3-geo'
import { buscarCaminho, buscarDestinos, kmEstimados, linkDoCaminho, lerCaminho, nomeDoMeio, type Caminho } from '@together/core'
import { ArrowLeft, ExternalLink, Locate, MapPin } from '../src/ui/icones'
import { useCarregar } from '../src/dados/useCarregar'
import { hora } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { PAISES } from '../src/ui/MapaDaGalera'
import { BotaoRedondo, Cartao, Carregando, ErroNaTela } from '../src/ui/pecas'
import { cor } from '../theme'

// "Ver o caminho" (spec 121c, ideia da Ingryd): por onde o trem ou o ônibus passa, com as paradas
// e o horário de cada uma. Dados do Transitous (aberto e grátis); guardados no trajeto depois da
// 1ª busca. Sem dado (ex.: ônibus rodoviário no Brasil), fica o link do Google Maps.
// Rota: /caminho?trajeto=<id>

async function carregar(trajetoId: string) {
  const { data: t, error } = await supabase.from('trajetos').select('*').eq('id', trajetoId).single()
  if (error) throw error
  const destinos = await buscarDestinos(supabase, t.viagem_id)
  const de = destinos.find((d) => d.id === t.origem_id) ?? null
  const para = destinos.find((d) => d.id === t.destino_id) ?? null
  const ponto = (d: typeof de) => (d && d.latitude != null && d.longitude != null ? { latitude: d.latitude, longitude: d.longitude } : null)
  let caminho = lerCaminho(t.caminho)
  if (!caminho) {
    caminho = await buscarCaminho({ estacao: t.estacao_partida, cidade: ponto(de) }, { estacao: t.estacao_chegada, cidade: ponto(para) }, t.partida, new Date().toISOString())
    // Guarda pra próxima vez (quem não pode editar o trajeto só vê, sem guardar)
    if (caminho) void supabase.from('trajetos').update({ caminho: caminho as never }).eq('id', t.id).then(() => undefined)
  }
  const nomeDe = t.estacao_partida ?? de?.nome ?? 'Origem'
  const nomePara = t.estacao_chegada ?? para?.nome ?? 'Destino'
  return { trajeto: t, caminho, nomeDe, nomePara, link: linkDoCaminho(nomeDe, nomePara) }
}

export default function TelaDoCaminho() {
  const { trajeto } = useLocalSearchParams<{ trajeto: string }>()
  const carga = useCarregar(trajeto ? () => carregar(trajeto) : null, [trajeto])
  if (!trajeto) return <ErroNaTela aoTentar={() => {}} />
  if (carga.status === 'carregando') return <Carregando texto="Procurando o caminho…" />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  return <Tela {...carga.dados} />
}

function Tela({ trajeto, caminho, nomeDe, nomePara, link }: Awaited<ReturnType<typeof carregar>>) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [proxima, setProxima] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // "Estou no caminho": acha a parada mais perto e diz qual é a próxima
  async function ondeEstou() {
    if (!caminho) return
    setAviso(null)
    const permissao = await Location.requestForegroundPermissionsAsync()
    if (!permissao.granted) return setAviso('Sem a localização não dá pra saber a próxima parada.')
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const aqui = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
    let perto = 0
    let menor = Infinity
    caminho.paradas.forEach((p, i) => {
      const km = kmEstimados(aqui, p) ?? Infinity
      if (km < menor) {
        menor = km
        perto = i
      }
    })
    // Passou da mais perto (está mais perto da seguinte do que a mais perto está da seguinte)? Próxima = a seguinte
    const seguinte = Math.min(perto + 1, caminho.paradas.length - 1)
    const distSeguinte = kmEstimados(aqui, caminho.paradas[seguinte]) ?? Infinity
    const entre = kmEstimados(caminho.paradas[perto], caminho.paradas[seguinte]) ?? 0
    setProxima(menor < 1 ? perto : distSeguinte < entre ? seguinte : perto)
  }

  const ultima = caminho ? caminho.paradas.length - 1 : 0
  const noMeio = caminho ? caminho.paradas.slice(1, -1) : []

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 14 }}>
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/transportes'))}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-body-bold text-[12px] uppercase tracking-widest text-caramelo">{nomeDoMeio(trajeto.meio)}</Text>
          <Text className="font-display text-[26px] leading-[30px] text-texto">
            {nomeDe} → {nomePara}
          </Text>
          {caminho?.linhas.length ? <Text className="mt-1 font-body text-[14px] text-suave">{caminho.linhas.join(' · ')}</Text> : null}
        </View>

        {caminho ? (
          <>
            <MapaDoCaminho caminho={caminho} proxima={proxima} />
            {proxima != null ? (
              <Cartao className="p-4">
                <Text className="font-body-bold text-[15px] text-texto">
                  {proxima === ultima ? `A sua é a próxima: ${caminho.paradas[ultima].nome}` : `Próxima parada: ${caminho.paradas[proxima].nome}`}
                </Text>
              </Cartao>
            ) : null}
            <Pressable onPress={() => void ondeEstou()} accessibilityRole="button" className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-full border border-borda bg-cartao active:opacity-80">
              <Locate size={17} color={cor.couro} />
              <Text className="font-body-bold text-[14px] text-couro">Estou no caminho: qual a próxima?</Text>
            </Pressable>
            {aviso ? <Text className="text-center font-body text-[13px] text-vermelho">{aviso}</Text> : null}

            <View className="gap-0">
              {caminho.paradas.map((p, i) => {
                const ponta = i === 0 || i === ultima
                return (
                  <View key={`${p.nome}${i}`} className="flex-row gap-3">
                    <View className="w-5 items-center">
                      <View className="w-[2px] flex-1" style={{ backgroundColor: i === 0 ? 'transparent' : cor.caramelo }} />
                      <View style={{ width: ponta ? 14 : 10, height: ponta ? 14 : 10, borderRadius: 7, backgroundColor: i === proxima ? cor.verde : ponta ? cor.couro : cor.caramelo }} />
                      <View className="w-[2px] flex-1" style={{ backgroundColor: i === ultima ? 'transparent' : cor.caramelo }} />
                    </View>
                    <View className="flex-1 flex-row items-center justify-between py-2.5">
                      <Text className={`flex-1 text-[14px] ${ponta ? 'font-body-bold text-texto' : 'font-body text-corpo'}`} numberOfLines={1}>
                        {p.nome}
                        {i === ultima ? '  · você desce aqui' : ''}
                      </Text>
                      <Text className="font-body-medium text-[13px] text-suave">{hora(p.chega ?? p.sai)}</Text>
                    </View>
                  </View>
                )
              })}
            </View>

            {noMeio.length ? (
              <Cartao className="gap-1 p-4">
                <View className="flex-row items-center gap-2">
                  <MapPin size={16} color={cor.couro} />
                  <Text className="font-body-bold text-[15px] text-texto">Dá pra conhecer no caminho</Text>
                </View>
                <Text className="font-body text-[13.5px] leading-5 text-corpo">
                  O {nomeDoMeio(trajeto.meio).toLowerCase()} para em {noMeio.slice(0, 3).map((p) => p.nome).join(', ')}
                  {noMeio.length > 3 ? ' e outras' : ''}. Se der, desçam umas horas e sigam no próximo: vira carimbo novo.
                </Text>
              </Cartao>
            ) : null}
            <Text className="font-body text-[12px] text-suave">Horários da tabela das empresas (Transitous). Confira na passagem.</Text>
          </>
        ) : (
          <Cartao className="gap-2 p-4">
            <Text className="font-body-bold text-[15px] text-texto">Ainda não temos as paradas desse trajeto</Text>
            <Text className="font-body text-[14px] leading-5 text-corpo">Abra no Google Maps pra ver por onde passa. Ônibus de viagem no Brasil quase nunca tem esse dado aberto.</Text>
          </Cartao>
        )}

        <Pressable onPress={() => void Linking.openURL(link)} accessibilityRole="link" className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-full bg-couro active:opacity-90">
          <ExternalLink size={16} color={cor.creme} />
          <Text className="font-body-bold text-[14px] text-creme">Abrir no Google Maps</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

function MapaDoCaminho({ caminho, proxima }: { caminho: Caminho; proxima: number | null }) {
  const [largura, setLargura] = useState(0)
  const altura = Math.round(largura * 0.7)
  const desenho = useMemo(() => {
    const pontos = caminho.linha.length ? caminho.linha : caminho.paradas.map((p) => [p.latitude, p.longitude] as [number, number])
    if (!largura || pontos.length < 2) return null
    const forma = { type: 'MultiPoint' as const, coordinates: pontos.map(([la, lo]) => [lo, la]) }
    const projecao = geoMercator().fitExtent([[18, 18], [largura - 18, altura - 18]], forma)
    const desenhar = geoPath(projecao)
    const paises = PAISES.map((f, i) => ({ d: desenhar(f) ?? '', chave: String(f.id ?? i) })).filter((p) => p.d)
    const linha = pontos.map(([la, lo]) => projecao([lo, la])).filter((xy): xy is [number, number] => !!xy).map((xy) => xy.join(',')).join(' ')
    const paradas = caminho.paradas.map((p) => projecao([p.longitude, p.latitude]))
    return { paises, linha, paradas }
  }, [largura, altura, caminho])

  return (
    <View onLayout={(e) => setLargura(Math.round(e.nativeEvent.layout.width))} style={{ height: altura || 220, borderRadius: 18, overflow: 'hidden', backgroundColor: cor.areia }}>
      {desenho ? (
        <Svg width={largura} height={altura} accessibilityLabel={`Mapa do caminho: ${caminho.paradas.map((p) => p.nome).join(', ')}`}>
          {desenho.paises.map((p) => (
            <Path key={p.chave} d={p.d} fill={cor.couro} stroke={cor.areia} strokeWidth={0.8} opacity={0.18} />
          ))}
          <Polyline points={desenho.linha} fill="none" stroke={cor.couro} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
          {desenho.paradas.map((xy, i) =>
            xy ? (
              <Circle
                key={i}
                cx={xy[0]}
                cy={xy[1]}
                r={i === 0 || i === desenho.paradas.length - 1 ? 7 : 4.5}
                fill={i === proxima ? cor.verde : i === 0 || i === desenho.paradas.length - 1 ? cor.couro : cor.creme}
                stroke={cor.couro}
                strokeWidth={2}
              />
            ) : null,
          )}
        </Svg>
      ) : null}
    </View>
  )
}
