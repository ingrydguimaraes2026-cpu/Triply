import type { CartaoDaRetrospectiva } from '@together/core'

// Desenha um cartão da retrospectiva em PNG 1080×1920 (tamanho de story), sem biblioteca:
// canvas do próprio navegador. Cores lidas das variáveis do global.css.
export async function cartaoEmImagem(cartao: CartaoDaRetrospectiva, nomeDaViagem: string): Promise<Blob | null> {
  const css = getComputedStyle(document.documentElement)
  const cor = (nome: string, reserva: string) => css.getPropertyValue(nome).trim() || reserva
  const fundo = cor('--couro', '#7b542f')
  const destaque = cor('--laranja', '#ff9d00')
  const claro = cor('--creme', '#fff6e5')
  const titulo = css.getPropertyValue('--fonte-titulo').trim() || 'serif'
  const texto = "'Plus Jakarta Sans Variable', system-ui, sans-serif"
  await document.fonts?.ready

  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1920
  const g = c.getContext('2d')
  if (!g) return null

  g.fillStyle = fundo
  g.fillRect(0, 0, c.width, c.height)
  // Faixa de cor embaixo
  g.fillStyle = destaque
  g.fillRect(0, c.height - 24, c.width, 24)

  g.textAlign = 'center'
  g.fillStyle = claro
  g.font = `600 44px ${texto}`
  g.fillText(nomeDaViagem.toUpperCase(), c.width / 2, 260, 960)

  // Número grande (encolhe se não couber)
  let tamanho = 260
  g.font = `700 ${tamanho}px ${titulo}`
  while (g.measureText(cartao.numero).width > 960 && tamanho > 80) {
    tamanho -= 10
    g.font = `700 ${tamanho}px ${titulo}`
  }
  g.fillStyle = destaque
  g.fillText(cartao.numero, c.width / 2, 920)

  g.fillStyle = claro
  g.font = `600 72px ${texto}`
  g.fillText(cartao.titulo, c.width / 2, 1040, 960)

  // Legenda em até 3 linhas
  g.font = `400 44px ${texto}`
  const linhas: string[] = []
  let atual = ''
  for (const p of cartao.legenda.split(' ')) {
    const teste = atual ? `${atual} ${p}` : p
    if (g.measureText(teste).width > 900 && atual) {
      linhas.push(atual)
      atual = p
    } else atual = teste
  }
  if (atual) linhas.push(atual)
  linhas.slice(0, 3).forEach((l, i) => g.fillText(l, c.width / 2, 1160 + i * 60, 960))

  g.font = `700 48px ${titulo}`
  g.fillText('Together', c.width / 2, c.height - 120)

  return new Promise((resolver) => c.toBlob(resolver, 'image/png'))
}
