import { useEffect, useMemo, useRef, useState } from 'react'
import { geoContains, geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, Geometry } from 'geojson'
import mundoUrl from 'world-atlas/countries-50m.json?url'
import './mapa.css'

export type PontoNoMapa = {
  nome: string
  latitude: number
  longitude: number
}

type Props = {
  pontos: PontoNoMapa[]
  // Espaço da tela que fica livre (sem o painel por cima), em pixels.
  // O mapa centraliza os destinos nessa área.
  areaLivre?: { esquerda: number; topo: number; direita: number; baixo: number }
}

type Visao = { k: number; x: number; y: number }
type Pais = Feature<Geometry>

const VISAO_INICIAL: Visao = { k: 1, x: 0, y: 0 }
const ZOOM_MAXIMO = 14
const DURACAO = 1200

// Carrega o desenho dos países uma vez só
let paisesEmCache: Promise<Pais[]> | null = null
function carregarPaises() {
  paisesEmCache ??= fetch(mundoUrl)
    .then((r) => r.json())
    .then((topo: Topology) => {
      const colecao = feature(topo, topo.objects.countries as GeometryCollection)
      // Tira a Antártida pra sobrar mais espaço
      return colecao.features.filter((p) => p.id !== '010') as Pais[]
    })
  return paisesEmCache
}

const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export default function MapaMundi({ pontos, areaLivre }: Props) {
  const caixaRef = useRef<HTMLDivElement>(null)
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 })
  const [paises, setPaises] = useState<Pais[]>([])
  const [visao, setVisao] = useState<Visao>(VISAO_INICIAL)
  const visaoRef = useRef(visao)
  useEffect(() => {
    visaoRef.current = visao
  }, [visao])

  useEffect(() => {
    carregarPaises().then(setPaises)
  }, [])

  // Acompanha o tamanho da tela
  useEffect(() => {
    const caixa = caixaRef.current
    if (!caixa) return
    const observador = new ResizeObserver(([e]) => {
      setTamanho({ w: e.contentRect.width, h: e.contentRect.height })
    })
    observador.observe(caixa)
    return () => observador.disconnect()
  }, [])

  // Projeção do mundo inteiro cabendo na tela
  const projecao = useMemo(() => {
    const { w, h } = tamanho
    const cantos: GeoPermissibleObjects = {
      type: 'MultiPoint',
      coordinates: [
        [-168, -56],
        [180, 78],
      ],
    }
    return geoMercator().fitSize([Math.max(w, 1), Math.max(h, 1)], cantos)
  }, [tamanho])

  const desenhos = useMemo(() => {
    const caminho = geoPath(projecao)
    return paises.map((p) => ({ id: String(p.id), d: caminho(p) ?? '', pais: p }))
  }, [paises, projecao])

  // Países que têm algum destino ficam acesos
  const acesos = useMemo(
    () =>
      desenhos.filter((d) => pontos.some((p) => geoContains(d.pais, [p.longitude, p.latitude]))),
    [desenhos, pontos],
  )

  const projetados = useMemo(
    () =>
      pontos
        .map((p) => projecao([p.longitude, p.latitude]))
        .filter((xy): xy is [number, number] => xy !== null),
    [pontos, projecao],
  )

  // Calcula pra onde a câmera deve ir e anima até lá
  useEffect(() => {
    const { w, h } = tamanho
    if (!w || !h) return
    const livre = areaLivre ?? { esquerda: 0, topo: 0, direita: 0, baixo: 0 }
    const larguraLivre = w - livre.esquerda - livre.direita
    const alturaLivre = h - livre.topo - livre.baixo
    const centroLivre = [livre.esquerda + larguraLivre / 2, livre.topo + alturaLivre / 2]

    let alvo: Visao = VISAO_INICIAL
    if (projetados.length > 0) {
      const xs = projetados.map((p) => p[0])
      const ys = projetados.map((p) => p[1])
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
      const k = Math.min(
        ZOOM_MAXIMO,
        Math.max(1, Math.min((larguraLivre * 0.6) / Math.max(x1 - x0, 1), (alturaLivre * 0.6) / Math.max(y1 - y0, 1))),
      )
      alvo = { k, x: centroLivre[0] - k * ((x0 + x1) / 2), y: centroLivre[1] - k * ((y0 + y1) / 2) }
    }

    // Quem prefere sem animação vai direto pro destino (duração zero)
    const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duracao = semAnimacao ? 0 : DURACAO
    const inicio = visaoRef.current
    let quadro = 0
    const t0 = performance.now()
    const passo = (agora: number) => {
      const t = duracao === 0 ? 1 : suave(Math.min(1, (agora - t0) / duracao))
      setVisao({
        k: inicio.k + (alvo.k - inicio.k) * t,
        x: inicio.x + (alvo.x - inicio.x) * t,
        y: inicio.y + (alvo.y - inicio.y) * t,
      })
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [projetados, tamanho, areaLivre])

  // Posição de cada destino na tela
  const naTela = projetados.map(([x, y]) => [visao.k * x + visao.x, visao.k * y + visao.y] as const)

  // Rotas curvas entre um destino e o próximo
  const rotas = naTela.slice(1).map((b, i) => {
    const a = naTela[i]
    const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    const curva = 0.25
    return `M${a[0]},${a[1]} Q${mx - dy * curva},${my + dx * curva - Math.hypot(dx, dy) * 0.15} ${b[0]},${b[1]}`
  })

  return (
    <div ref={caixaRef} className="mapa" aria-hidden="true">
      <svg width={tamanho.w} height={tamanho.h}>
        <g transform={`translate(${visao.x},${visao.y}) scale(${visao.k})`}>
          {desenhos.map((d) => (
            <path key={d.id} d={d.d} className="mapa-pais" vectorEffect="non-scaling-stroke" />
          ))}
          {acesos.map((d) => (
            <path key={d.id} d={d.d} className="mapa-pais aceso" vectorEffect="non-scaling-stroke" />
          ))}
        </g>

        {rotas.map((d, i) => (
          <path key={i} d={d} className="mapa-rota" />
        ))}

        {naTela.map(([x, y], i) => (
          <g key={`${pontos[i].nome}-${i}`} transform={`translate(${x},${y})`} className="mapa-pino">
            <circle r="18" className="mapa-pino-onda" />
            <circle r="7" className="mapa-pino-centro" />
            {/* Nomes alternam em cima/embaixo pra cidades perto não se sobreporem */}
            <text x="14" y={i % 2 === 0 ? -12 : 24} className="mapa-pino-nome">
              {i + 1}. {pontos[i].nome}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
