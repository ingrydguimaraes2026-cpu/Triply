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
