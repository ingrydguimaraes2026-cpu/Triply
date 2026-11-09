// País e moeda do destino no core (usados pela web e pelo app). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { codigoDoPais, moedaDoPais } = await import(new URL('../../../packages/core/src/paises.ts', import.meta.url))

test('059: acha o país com e sem acento, em vários idiomas', () => {
  assert.equal(codigoDoPais('Mónaco'), 'MC')
  assert.equal(codigoDoPais('Mônaco'), 'MC')
  assert.equal(codigoDoPais('Italia'), 'IT')
  assert.equal(codigoDoPais('Itália'), 'IT')
  assert.equal(codigoDoPais('EUA'), 'US')
  assert.equal(codigoDoPais('Holanda'), 'NL')
  assert.equal(codigoDoPais('Lugar Nenhum'), null)
  assert.equal(codigoDoPais(null), null)
})

test('059: sem Intl.DisplayNames (celular) ainda acha os destinos comuns', async () => {
  const original = Intl.DisplayNames
  Intl.DisplayNames = undefined
  try {
    const { codigoDoPais: semIntl } = await import(new URL('../../../packages/core/src/paises.ts?sem-intl', import.meta.url))
    assert.equal(semIntl('França'), 'FR')
    assert.equal(semIntl('Suíça'), 'CH')
    assert.equal(semIntl('Reino Unido'), 'GB')
  } finally {
    Intl.DisplayNames = original
  }
})

test('059: moeda pelo país', () => {
  assert.equal(moedaDoPais('IT'), 'EUR')
  assert.equal(moedaDoPais('CH'), 'CHF')
  assert.equal(moedaDoPais('GB'), 'GBP')
})
