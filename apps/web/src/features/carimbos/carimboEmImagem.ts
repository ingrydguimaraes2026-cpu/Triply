import { dataDaArte, iconeDoTipo, svgDoIcone, type Carimbo } from '@together/core'

// "Postar carimbo" (spec 118a): PNG 1080×1920 (story) desenhado no canvas do navegador.
// Cores lidas das variáveis do global.css.
export async function carimboEmImagem(carimbo: Carimbo, nomeDaViagem: string): Promise<Blob | null> {
  const css = getComputedStyle(document.documentElement)
  const cor = (nome: string, reserva: string) => css.getPropertyValue(nome).trim() || reserva
  const fundo = cor('--couro', '#7b542f')
  const ouro = cor('--laranja', '#e3a04a')
  const claro = cor('--creme', '#f5e9d6')
  const titulo = css.getPropertyValue('--fonte-titulo').trim() || 'serif'
  const texto = "'Plus Jakarta Sans Variable', system-ui, sans-serif"
  await document.fonts?.ready

  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1920
  const g = c.getContext('2d')
  if (!g) return null
  const meio = c.width / 2

  g.fillStyle = fundo
  g.fillRect(0, 0, c.width, c.height)

  g.textAlign = 'center'
  g.fillStyle = claro
  g.font = `600 40px ${texto}`
  g.fillText(nomeDaViagem.toUpperCase(), meio, 300, 960)

  // O carimbo: aro duplo, levemente girado
  const cy = 900
  g.save()
  g.translate(meio, cy)
  g.rotate((-6 * Math.PI) / 180)
  g.strokeStyle = ouro
  g.setLineDash(carimbo.como === 'memoria' ? [26, 14] : [])
  g.lineWidth = 14
  g.beginPath()
  g.arc(0, 0, 330, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 5
  g.beginPath()
  g.arc(0, 0, 295, 0, Math.PI * 2)
  g.stroke()
  g.setLineDash([])

  const icone = await imagemDoSvg(svgDoIcone(iconeDoTipo(carimbo.tipo), { cor: ouro }))
  if (icone) g.drawImage(icone, -70, -230, 140, 140)

  g.fillStyle = claro
  g.font = `600 ${carimbo.nome.length > 14 ? 64 : 86}px ${titulo}`
  g.fillText(carimbo.nome, 0, 30, 520)
  g.fillStyle = ouro
  g.font = `700 44px ${texto}`
  g.fillText(dataDaArte(carimbo.data).toUpperCase(), 0, 120, 520)
  g.restore()

  g.fillStyle = claro
  g.font = `500 42px ${texto}`
  g.fillText(carimbo.como === 'memoria' ? 'A gente esteve aqui.' : 'Carimbado pela galera.', meio, 1420, 960)

  g.fillStyle = ouro
  g.font = `700 34px ${texto}`
  g.fillText('FEITO COM NORTI', meio, 1780)

  return new Promise((ok) => c.toBlob((b) => ok(b), 'image/png'))
}

function imagemDoSvg(svg: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = () => ok(null)
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}
