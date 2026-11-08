import { useMemo, useState } from 'react'
import { View } from 'react-native'
import Svg, { Circle, G, Path, Polyline, Text as TextoSvg } from 'react-native-svg'
import { geoMercator, geoPath } from 'd3-geo'
import { areaDoTrajeto, type PontoDoTrajeto } from '@together/core'
import { PAISES } from '../MapaDaGalera'
import { cor } from '../../../theme'

// Mapa percorrido (spec 118c): os destinos da viagem ligados na ordem do roteiro.
// Usa o mesmo desenho dos países do mapa da galera, com zoom só na região da viagem.
export function MapaPercorrido({ pontos, fundo, destaque, texto }: { pontos: PontoDoTrajeto[]; fundo: string; destaque: string; texto: string }) {
  const [largura, setLargura] = useState(0)
  const altura = Math.round(largura * 0.75)
  const desenho = useMemo(() => {
    const area = areaDoTrajeto(pontos)
    if (!largura || !area) return null
    const cantos = { type: 'MultiPoint' as const, coordinates: [[area.oeste, area.sul], [area.leste, area.norte]] }
    const projecao = geoMercator().fitExtent([[12, 12], [largura - 12, altura - 12]], cantos)
    const caminho = geoPath(projecao)
    const paises = PAISES.map((f, i) => ({ d: caminho(f) ?? '', chave: String(f.id ?? i) })).filter((p) => p.d)
    const nos = pontos.map((p) => ({ ...p, xy: projecao([p.longitude, p.latitude]) })).filter((p) => p.xy)
    return { paises, nos }
  }, [largura, altura, pontos])

  if (pontos.length === 0) return null
  return (
    <View onLayout={(e) => setLargura(Math.round(e.nativeEvent.layout.width))} style={{ height: altura || 200, borderRadius: 18, overflow: 'hidden' }}>
      {desenho ? (
        <Svg width={largura} height={altura} accessibilityLabel={`Mapa da viagem: ${pontos.map((p) => p.nome).join(', ')}`}>
          <Path d={`M0 0H${largura}V${altura}H0Z`} fill={fundo} opacity={0.6} />
          <G>
            {desenho.paises.map((p) => (
              <Path key={p.chave} d={p.d} fill={cor.couro} stroke={fundo} strokeWidth={0.8} opacity={0.55} />
            ))}
          </G>
          {desenho.nos.length > 1 ? (
            <Polyline points={desenho.nos.map((p) => p.xy!.join(',')).join(' ')} fill="none" stroke={destaque} strokeWidth={2.5} strokeDasharray="6 5" />
          ) : null}
          {desenho.nos.map((p, i) => (
            <G key={`${p.nome}-${i}`}>
              <Circle cx={p.xy![0]} cy={p.xy![1]} r={7} fill={destaque} opacity={0.35} />
              <Circle cx={p.xy![0]} cy={p.xy![1]} r={3.5} fill={destaque} />
              <TextoSvg x={p.xy![0] + 9} y={p.xy![1] + 4} fill={texto} fontSize={12} fontWeight="700">
                {p.nome}
              </TextoSvg>
            </G>
          ))}
        </Svg>
      ) : null}
    </View>
  )
}
