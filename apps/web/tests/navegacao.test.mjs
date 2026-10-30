// Testes dos links de navegação e corrida (spec 040). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { linksDeNavegacao, linksDeCorrida, textoDoAlvo } = await import(new URL('../../../packages/core/src/navegacao.ts', import.meta.url))

test('texto do alvo: endereço ou "nome, cidade"', () => {
  assert.equal(textoDoAlvo({ nome: 'Casa', endereco: ' Rue X 1, Nice ' }), 'Rue X 1, Nice')
  assert.equal(textoDoAlvo({ nome: 'Le Safari', cidade: 'Nice' }), 'Le Safari, Nice')
})

test('navegação com coordenadas usa o ponto', () => {
  const links = Object.fromEntries(linksDeNavegacao({ nome: 'Praça', latitude: 43.7, longitude: 7.26 }).map((l) => [l.chave, l.url]))
  assert.equal(links.google, 'https://www.google.com/maps/dir/?api=1&destination=43.7%2C7.26')
  assert.equal(links.waze, 'https://waze.com/ul?ll=43.7%2C7.26&navigate=yes')
  assert.equal(links.apple, 'https://maps.apple.com/?daddr=43.7%2C7.26')
  assert.match(links.citymapper, /endcoord=43\.7%2C7\.26&endname=Pra%C3%A7a/)
})

test('navegação sem coordenadas usa o texto', () => {
  const links = Object.fromEntries(linksDeNavegacao({ nome: 'Le Safari', cidade: 'Nice' }).map((l) => [l.chave, l.url]))
  assert.equal(links.google, 'https://www.google.com/maps/dir/?api=1&destination=Le%20Safari%2C%20Nice')
  assert.equal(links.waze, 'https://waze.com/ul?q=Le%20Safari%2C%20Nice&navigate=yes')
})

test('corrida: Uber com destino; Bolt e Free Now sem', () => {
  const [uber, bolt, freenow] = linksDeCorrida({ nome: 'Hotel', endereco: 'Rue X 1, Nice', latitude: 43.7, longitude: 7.26 })
  const u = new URL(uber.url)
  assert.equal(u.searchParams.get('dropoff[latitude]'), '43.7')
  assert.equal(u.searchParams.get('dropoff[formatted_address]'), 'Rue X 1, Nice')
  assert.equal(uber.preenche, true)
  assert.equal(bolt.preenche, false)
  assert.equal(freenow.preenche, false)
})

test('103: texto pra indicar lugares, recomendados primeiro', async () => {
  const { textoParaIndicar } = await import(new URL('../../../packages/core/src/navegacao.ts', import.meta.url))
  const texto = textoParaIndicar('Nice', [
    { nome: 'Castelo', tipo: 'passeio', votos: 3, visitado: false },
    { nome: 'Pizzaria', tipo: 'comida', votos: 1, visitado: true, latitude: 43.7, longitude: 7.26, observacao: 'peça a de trufa' },
    { nome: 'Guarda-volumes X', tipo: 'guarda_volumes', votos: 0, visitado: false },
  ])
  assert.equal(
    texto,
    [
      'Minhas dicas em Nice:',
      '',
      '🍽️ Pizzaria ✓ fomos e recomendo (peça a de trufa)',
      'https://www.google.com/maps/search/?api=1&query=43.7,7.26',
      '',
      '📍 Castelo',
      'https://www.google.com/maps/search/?api=1&query=Castelo%20Nice',
      '',
      'Montado no Together',
    ].join('\n'),
  )
})
