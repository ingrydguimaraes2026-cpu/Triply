// Testes da ficha do país (spec 047). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { fichaDoPais, precisaAdaptador, avisoDeVoltagem, prazoDoEsim } = await import(new URL('../../../packages/core/src/ficha-do-pais.ts', import.meta.url))

test('ficha conhecida, desconhecida e mão inglesa', () => {
  assert.equal(fichaDoPais('fr').idioma, 'Francês')
  assert.equal(fichaDoPais('ZZ'), null)
  assert.equal(fichaDoPais(null), null)
  assert.equal(fichaDoPais('GB').maoInglesa, true)
  assert.equal(fichaDoPais('IT').roamingUE, true)
})

test('adaptador pro plugue brasileiro', () => {
  assert.equal(precisaAdaptador(fichaDoPais('FR')), 'so_tres_pinos')
  assert.equal(precisaAdaptador(fichaDoPais('GB')), 'sim')
  assert.equal(precisaAdaptador(fichaDoPais('US')), 'sim')
  assert.equal(precisaAdaptador(fichaDoPais('ZA')), 'nao')
})

test('voltagem e prazo do eSIM', () => {
  assert.match(avisoDeVoltagem(120), /secador/)
  assert.match(avisoDeVoltagem(230), /bivolt/)
  assert.equal(prazoDoEsim('2027-06-01'), '2027-05-29')
  assert.equal(prazoDoEsim(null), null)
})
