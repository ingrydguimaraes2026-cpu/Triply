// Testes da prévia do link (spec 072). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { lerPrevia } = await import(new URL('../../../packages/core/src/previa.ts', import.meta.url))

test('lê Open Graph nas duas ordens de atributo e decodifica', () => {
  const html = `<html><head>
    <meta property="og:title" content="Casa com vista &amp; jardim">
    <meta content="https://img.exemplo.com/a.jpg" property="og:image" />
    <meta name="description" content="3 quartos, 6 hóspedes">
    <meta property="og:site_name" content="Airbnb">
  </head></html>`
  assert.deepEqual(lerPrevia(html, 'https://www.airbnb.com/rooms/1'), {
    titulo: 'Casa com vista & jardim',
    imagem: 'https://img.exemplo.com/a.jpg',
    descricao: '3 quartos, 6 hóspedes',
    site: 'Airbnb',
  })
})

test('sem og: usa o <title>; imagem relativa vira absoluta; http é descartado', () => {
  const r = lerPrevia('<title>Hotel Nice</title><meta property="og:image" content="/foto.jpg">', 'https://hotel.fr/quarto')
  assert.equal(r.titulo, 'Hotel Nice')
  assert.equal(r.imagem, 'https://hotel.fr/foto.jpg')
  assert.equal(lerPrevia('<meta property="og:image" content="http://x.com/a.jpg">', 'https://x.com').imagem, null)
})

test('097: rede do link e lugar do post', async () => {
  const { redeDoLink, lugarDoPost } = await import(new URL('../../../packages/core/src/previa.ts', import.meta.url))
  assert.equal(redeDoLink('https://www.instagram.com/reel/abc/'), 'instagram')
  assert.equal(redeDoLink('https://vm.tiktok.com/xyz'), 'tiktok')
  assert.equal(redeDoLink('https://youtu.be/123'), 'youtube')
  assert.equal(redeDoLink('https://booking.com/x'), null)
  const post = lugarDoPost(
    { titulo: 'Ana Viaja (@anaviaja) on Instagram: "melhor croissant"', descricao: 'Melhor croissant da vida 🥐\n📍 Café de Flore, Paris.\n#paris #cafe' },
    'instagram',
  )
  assert.deepEqual(post, { nome: 'Café de Flore, Paris', observacao: 'Visto no Instagram de @anaviaja' })
  assert.deepEqual(lugarDoPost({ titulo: null, descricao: 'sem pino' }, 'tiktok'), { nome: null, observacao: 'Visto no TikTok' })
})
