import { geoContains, geoNaturalEarth1, geoPath } from 'd3-geo'
import type { MapaDaGalera } from '@together/core'
import { carregarPaises } from '../mapa/paises'

// "Postar mapa" (spec 118b): PNG 1080×1920 com o mapa aceso e os números, no canvas do navegador
export async function mapaEmImagem(m: MapaDaGalera): Promise<Blob | null> {
  const css = getComputedStyle(document.documentElement)
  const cor = (nome: string, reserva: string) => css.getPropertyValue(nome).trim() || reserva
  const fundo = cor('--couro', '#7b542f')
  const ouro = cor('--laranja', '#e3a04a')
  const claro = cor('--creme', '#f5e9d6')
  const titulo = css.getPropertyValue('--fonte-titulo').trim() || 'serif'
  const texto = "'Plus Jakarta Sans Variable', system-ui, sans-serif"
  const [paises] = await Promise.all([carregarPaises(), document.fonts?.ready])

  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1920
  const g = c.getContext('2d')
  if (!g) return null
  const meio = c.width / 2
  g.fillStyle = fundo
  g.fillRect(0, 0, c.width, c.height)

  g.textAlign = 'center'
  g.fillStyle = ouro
  g.font = `700 36px ${texto}`
  g.fillText('O MAPA DA NOSSA GALERA', meio, 300)
  g.fillStyle = claro
  g.font = `600 110px ${titulo}`
  g.fillText(`${m.lugares} ${m.lugares === 1 ? 'lugar' : 'lugares'}`, meio, 440)

  // Mapa
  g.save()
  g.translate(40, 560)
  const projecao = geoNaturalEarth1().fitSize([1000, 520], { type: 'FeatureCollection', features: paises })
  const caminho = geoPath(projecao, g)
  for (const p of paises) {
    g.beginPath()
    caminho(p)
    g.fillStyle = m.pontos.some((x) => geoContains(p, [x.longitude, x.latitude])) ? ouro : '#6a4626'
    g.fill()
  }
  for (const p of m.pontos) {
    const xy = projecao([p.longitude, p.latitude])
    if (!xy) continue
    g.beginPath()
    g.arc(xy[0], xy[1], 9, 0, Math.PI * 2)
    g.fillStyle = claro
    g.fill()
  }
  g.restore()

  // Números
  const itens: [number, string][] = [
    [m.viagens, m.viagens === 1 ? 'viagem' : 'viagens'],
    [m.diasJuntos, 'dias juntos'],
    [m.km, 'km'],
  ]
  itens.forEach(([n, rotulo], i) => {
    const x = 200 + i * 340
    g.fillStyle = claro
    g.font = `600 84px ${titulo}`
    g.fillText(n.toLocaleString('pt-BR'), x, 1330)
    g.fillStyle = ouro
    g.font = `600 34px ${texto}`
    g.fillText(rotulo, x, 1385)
  })

  g.fillStyle = ouro
  g.font = `700 34px ${texto}`
  g.fillText('FEITO COM NORTI', meio, 1780)
  return new Promise((ok) => c.toBlob((b) => ok(b), 'image/png'))
}
