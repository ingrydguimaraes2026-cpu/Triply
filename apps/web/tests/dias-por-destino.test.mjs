// Testes dos vários destinos (spec 115, etapa 7): dividir os dias e sugerir a ordem. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { dividirDias, ordemMaisPerto } = await import(new URL('../../../packages/core/src/explorar.ts', import.meta.url))

test('divide igual quando os pesos são iguais', () => {
  assert.deepEqual(dividirDias(6, [1, 1, 1]), [2, 2, 2])
})

test('a soma sempre bate com o total e ninguém fica com zero', () => {
  for (const [total, pesos] of [[7, [1, 1, 1]], [10, [2, 1, 1]], [2, [1, 1, 1]], [5, [3, 1]]]) {
    const r = dividirDias(total, pesos)
    assert.equal(r.reduce((s, x) => s + x, 0), Math.max(total, pesos.length))
    assert.ok(r.every((x) => x >= 1))
  }
})

test('quem pesa mais ganha mais dias', () => {
  const [pais, cidade] = dividirDias(9, [2, 1])
  assert.ok(pais > cidade)
})

const paris = { latitude: 48.86, longitude: 2.35 }
const roma = { latitude: 41.9, longitude: 12.5 }
const nice = { latitude: 43.7, longitude: 7.27 }
const milao = { latitude: 45.46, longitude: 9.19 }

test('sugere a ordem que anda menos (Paris → Roma → Nice vira Paris → Nice → Roma)', () => {
  const r = ordemMaisPerto([paris, roma, nice])
  assert.deepEqual(r?.ordem, [0, 2, 1])
  assert.ok(r.economiaKm > 100)
})

test('não sugere nada quando a ordem já é boa, tem poucos destinos ou falta ponto', () => {
  assert.equal(ordemMaisPerto([paris, nice, milao, roma]), null)
  assert.equal(ordemMaisPerto([paris, roma]), null)
  assert.equal(ordemMaisPerto([paris, null, roma]), null)
})
