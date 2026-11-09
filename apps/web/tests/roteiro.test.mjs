// Testes do roteiro do destino (spec 115 v2): arrumar e mover lugares entre os dias. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { lerDiasDoRoteiro, arrumarRoteiro, moverPraDia, moverNaOrdem } = await import(new URL('../../../packages/core/src/roteiro.ts', import.meta.url))

test('lê o JSON do banco sem quebrar com lixo', () => {
  assert.deepEqual(lerDiasDoRoteiro([['a', 1, 'b'], 'x', []]), [['a', 'b'], [], []])
  assert.deepEqual(lerDiasDoRoteiro(null), [])
})

test('curtido novo vai pro "Sem dia" e quem saiu do grupo some', () => {
  const r = arrumarRoteiro([['a', 'x'], ['b']], ['a', 'b', 'c'], 2)
  assert.deepEqual(r.dias, [['a'], ['b']])
  assert.deepEqual(r.semDia, ['c'])
})

test('dia a mais é cortado e os lugares dele vão pro "Sem dia"; dia que falta vem vazio', () => {
  assert.deepEqual(arrumarRoteiro([['a'], ['b']], ['a', 'b'], 1), { dias: [['a']], semDia: ['b'] })
  assert.deepEqual(arrumarRoteiro([['a']], ['a'], 3).dias, [['a'], [], []])
})

test('mover pra outro dia, pro "Sem dia" e na ordem', () => {
  const dias = [['a', 'b'], ['c']]
  assert.deepEqual(moverPraDia(dias, 'a', 1), [['b'], ['c', 'a']])
  assert.deepEqual(moverPraDia(dias, 'a', null), [['b'], ['c']])
  assert.deepEqual(moverNaOrdem(dias, 'b', -1), [['b', 'a'], ['c']])
  assert.deepEqual(moverNaOrdem(dias, 'a', -1), dias)
})
