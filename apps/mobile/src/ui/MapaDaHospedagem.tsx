import { useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import Svg, { Circle, Line } from 'react-native-svg'
import { ATRIBUICAO_DO_MAPA, enquadrarNoMapa, textoDosMinutos, type MapaDaHospedagem as Mapa } from '@together/core'
import { Footprints, Plane, Star, TrainFront } from './icones'
import { cor, sombra } from '../../theme'

// Spec 124: o mapa das opções de hospedagem de uma cidade. Retrato fixo (sem arrastar) que enquadra
// as opções numeradas, a estação/aeroporto de chegada e o ponto principal. Fundo: azulejos do OpenStreetMap.
// Tocar num pino (ou na linha embaixo) destaca a opção e desenha chegada → opção → ponto.

type Props = {
  mapa: Mapa
  selecionada: string | null
  aoSelecionar: (id: string) => void
  aoTrocarPonto: (id: string) => void
}

const PINO = 28

export function MapaDaHospedagem({ mapa, selecionada, aoSelecionar, aoTrocarPonto }: Props) {
  const [largura, setLargura] = useState(0)
  const altura = Math.round(Math.min(largura * 0.8, 460))
  const quadro = useMemo(() => {
    const pontos = [...mapa.pinos, ...(mapa.chegada ? [mapa.chegada] : []), ...(mapa.ponto ? [mapa.ponto] : [])]
    return enquadrarNoMapa(pontos, largura, altura)
  }, [mapa, largura, altura])

  const destaque = mapa.pinos.find((p) => p.opcao.id === selecionada) ?? null
  const ehAeroporto = /aeroporto|airport|aeroport/i.test(mapa.chegada?.nome ?? '')
  const IconeDaChegada = ehAeroporto ? Plane : TrainFront

  if (!mapa.pinos.length && !mapa.chegada) {
    return <Text className="font-body text-[14px] leading-6 text-corpo">Informe o endereço das opções pra ver no mapa.</Text>
  }

  return (
    <View className="gap-3">
      <View
        onLayout={(e) => setLargura(Math.round(e.nativeEvent.layout.width))}
        style={{ height: altura || 260, borderRadius: 18, overflow: 'hidden', backgroundColor: cor.areia }}
        accessibilityLabel={`Mapa com ${mapa.pinos.length} opções${mapa.chegada ? `, ${mapa.chegada.nome}` : ''}${mapa.ponto ? ` e ${mapa.ponto.nome}` : ''}`}
      >
        {quadro ? (
          <>
            {quadro.azulejos.map((a) => (
              <Image key={a.chave} source={{ uri: a.url }} style={{ position: 'absolute', left: a.esquerda, top: a.topo, width: a.tamanho, height: a.tamanho, opacity: 0.9 }} />
            ))}

            <Svg width={largura} height={altura} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
              {/* Os outros lugares da cidade, como pontinhos */}
              {mapa.lugares
                .filter((l) => l.id !== mapa.ponto?.id)
                .map((l) => {
                  const [x, y] = quadro.xy(l)
                  return <Circle key={l.id} cx={x} cy={y} r={4} fill={cor.caramelo} stroke={cor.cartao} strokeWidth={1.5} opacity={0.8} />
                })}
              {destaque && mapa.chegada ? <Reta de={quadro.xy(mapa.chegada)} ate={quadro.xy(destaque)} /> : null}
              {destaque && mapa.ponto ? <Reta de={quadro.xy(destaque)} ate={quadro.xy(mapa.ponto)} /> : null}
            </Svg>

            {mapa.chegada ? (
              <Marco xy={quadro.xy(mapa.chegada)} fundo={cor.escuro} rotulo={mapa.chegada.nome}>
                <IconeDaChegada size={15} color={cor.creme} />
              </Marco>
            ) : null}
            {mapa.ponto ? (
              <Marco xy={quadro.xy(mapa.ponto)} fundo={cor.caramelo} rotulo={mapa.ponto.nome}>
                <Star size={15} color={cor.cartao} />
              </Marco>
            ) : null}

            {mapa.pinos.map((p) => {
              const [x, y] = quadro.xy(p)
              const ativo = p.opcao.id === selecionada
              const escura = p.opcao.escolhida
              return (
                <Pressable
                  key={p.opcao.id}
                  onPress={() => aoSelecionar(p.opcao.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.numero}. ${p.opcao.nome}, ${p.rotulo}`}
                  style={{ position: 'absolute', left: x - 60, top: y - PINO / 2 - 22, width: 120, alignItems: 'center', zIndex: ativo ? 3 : 2 }}
                >
                  <View className="rounded-md px-1.5 py-0.5" style={[{ backgroundColor: ativo ? cor.texto : cor.cartao }, sombra.flutuante]}>
                    <Text numberOfLines={1} className="font-body-bold text-[10.5px]" style={{ color: ativo ? cor.cartao : cor.texto }}>
                      {p.rotulo}
                    </Text>
                  </View>
                  <View
                    style={[
                      { marginTop: 3, width: PINO, height: PINO, borderRadius: PINO / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5 },
                      { backgroundColor: escura ? cor.couro : cor.cartao, borderColor: ativo ? cor.texto : cor.couro },
                      sombra.flutuante,
                    ]}
                  >
                    <Text className="font-body-bold text-[13px]" style={{ color: escura ? cor.creme : cor.couro }}>
                      {p.numero}
                    </Text>
                  </View>
                </Pressable>
              )
            })}

            <Text className="absolute bottom-1 right-1.5 rounded px-1 font-body text-[9.5px] text-suave" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
              {ATRIBUICAO_DO_MAPA}
            </Text>
          </>
        ) : null}
      </View>

      {mapa.lugares.length > 1 ? (
        <View className="gap-1.5">
          <Text className="font-body-bold text-[11.5px] uppercase tracking-widest text-caramelo">Medir até</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {mapa.lugares.map((l) => {
              const ativo = l.id === mapa.ponto?.id
              return (
                <Pressable
                  key={l.id}
                  onPress={() => aoTrocarPonto(l.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  className={`rounded-full px-3 py-1.5 active:opacity-80 ${ativo ? 'bg-couro' : 'border border-borda bg-cartao'}`}
                >
                  <Text numberOfLines={1} className={`max-w-[220px] font-body-bold text-[12.5px] ${ativo ? 'text-creme' : 'text-couro'}`}>
                    {l.nome}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      ) : null}

      <View className="overflow-hidden rounded-[18px] border border-borda bg-cartao">
        {mapa.pinos.map((p, i) => {
          const ativo = p.opcao.id === selecionada
          const minutos = textoDosMinutos(p, mapa)
          return (
            <Pressable
              key={p.opcao.id}
              onPress={() => aoSelecionar(p.opcao.id)}
              className={`flex-row items-center gap-3 px-3 py-2.5 active:opacity-80 ${i ? 'border-t border-linha' : ''}`}
              style={ativo ? { backgroundColor: cor.chip } : undefined}
            >
              <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: p.opcao.escolhida ? cor.couro : cor.chip, borderWidth: 1.5, borderColor: cor.couro }}>
                <Text className="font-body-bold text-[12.5px]" style={{ color: p.opcao.escolhida ? cor.creme : cor.couro }}>
                  {p.numero}
                </Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="font-body-bold text-[13.5px] text-texto">
                  {p.opcao.nome}
                </Text>
                {minutos ? (
                  <View className="flex-row items-center gap-1">
                    <Footprints size={12} color={cor.suave} />
                    <Text className="flex-1 font-body text-[12px] text-suave">{minutos}</Text>
                  </View>
                ) : null}
              </View>
              <Text className="font-body-bold text-[12.5px] text-couro">{p.rotulo}</Text>
            </Pressable>
          )
        })}
        {mapa.semLugar.map((o) => (
          <View key={o.id} className="border-t border-linha px-3 py-2.5">
            <Text numberOfLines={1} className="font-body-bold text-[13px] text-suave">
              {o.nome}
            </Text>
            <Text className="font-body text-[12px] text-suave">Sem lugar no mapa: informe o endereço ou o link do anúncio</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function Reta({ de, ate }: { de: [number, number]; ate: [number, number] }) {
  return <Line x1={de[0]} y1={de[1]} x2={ate[0]} y2={ate[1]} stroke={cor.texto} strokeWidth={2.5} strokeDasharray="6 5" strokeLinecap="round" />
}

// Estação/aeroporto e ponto principal: bolinha com ícone e o nome embaixo
function Marco({ xy: [x, y], fundo, rotulo, children }: { xy: [number, number]; fundo: string; rotulo: string; children: React.ReactNode }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - 70, top: y - 15, width: 140, alignItems: 'center', zIndex: 1 }}>
      <View style={[{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: fundo, borderWidth: 2, borderColor: cor.cartao }, sombra.flutuante]}>
        {children}
      </View>
      <Text numberOfLines={1} className="mt-0.5 rounded px-1 font-body-bold text-[10.5px] text-texto" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}>
        {rotulo}
      </Text>
    </View>
  )
}
