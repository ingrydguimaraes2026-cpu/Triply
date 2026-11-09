// Testes das frases úteis (spec 104). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { idiomaDoPais, frasesDoIdioma, linkDeTraducaoPelaCamera } = await import(new URL('../../../packages/core/src/frases.ts', import.meta.url))

test('104: idioma pelo país; português não precisa', () => {
  assert.equal(idiomaDoPais('fr'), 'fr')
  assert.equal(idiomaDoPais('MC'), 'fr')
  assert.equal(idiomaDoPais('AR'), 'es')
  assert.equal(idiomaDoPais('JP'), 'en')
  assert.equal(idiomaDoPais('PT'), null)
  assert.equal(idiomaDoPais(null), null)
})

test('104: todas as línguas têm todas as frases', () => {
  for (const idioma of ['en', 'es', 'fr', 'it', 'de']) {
    const lista = frasesDoIdioma(idioma)
    assert.equal(lista.length, 14)
    assert.ok(lista.every((f) => f.pt && f.texto))
  }
  assert.equal(frasesDoIdioma('fr')[5].pt, 'Não falo francês')
  assert.match(linkDeTraducaoPelaCamera('it'), /sl=it&tl=pt&op=images/)
})
