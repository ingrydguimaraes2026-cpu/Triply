// Testes dos números e links de emergência (spec 037). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { numerosDeEmergencia, linkHospitalPerto, linkConsuladoDoBrasil } = await import(new URL('../../../packages/core/src/emergencia.ts', import.meta.url))

test('Europa: 112; Reino Unido: 999 e 112; EUA: 911', () => {
  assert.deepEqual(numerosDeEmergencia('FR').numeros.map((n) => n.numero), ['112'])
  assert.deepEqual(numerosDeEmergencia('mc').numeros.map((n) => n.numero), ['112'])
  assert.deepEqual(numerosDeEmergencia('GB').numeros.map((n) => n.numero), ['999', '112'])
  assert.deepEqual(numerosDeEmergencia('US').numeros.map((n) => n.numero), ['911'])
  assert.equal(numerosDeEmergencia('JP').conferido, true)
})

test('país desconhecido ou sem país: 112 e aviso de conferir', () => {
  for (const pais of ['ZZ', null]) {
    const r = numerosDeEmergencia(pais)
    assert.equal(r.conferido, false)
    assert.equal(r.numeros[0].numero, '112')
  }
})

test('links: hospital pelo mapa e consulado pela busca', () => {
  assert.equal(linkHospitalPerto({ nome: 'Nice', latitude: 43.7, longitude: 7.26 }), 'https://www.google.com/maps/search/hospital/@43.7,7.26,14z')
  assert.match(linkHospitalPerto({ nome: 'Nice', latitude: null, longitude: null }), /search\/hospital%20Nice$/)
  assert.match(linkConsuladoDoBrasil('Nice', 'França'), /consulado%20do%20Brasil%20Nice%20Fran/)
})
