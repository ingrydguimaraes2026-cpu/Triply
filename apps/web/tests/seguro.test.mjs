// Testes do seguro viagem (spec 039). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { semSeguro, telefoneParaLigar, cobreAViagem } = await import(new URL('../../../packages/core/src/seguro.ts', import.meta.url))

test('quem está sem seguro', () => {
  const membros = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  assert.deepEqual(semSeguro([{ cobertos: ['a'] }, { cobertos: ['c'] }], membros), [{ id: 'b' }])
  assert.deepEqual(semSeguro([], membros), membros)
})

test('telefone pro link de ligar', () => {
  assert.equal(telefoneParaLigar('+55 (11) 4000-0000'), '+551140000000')
  assert.equal(telefoneParaLigar('0800 123 4567'), '08001234567')
})

test('cobre a viagem inteira?', () => {
  assert.equal(cobreAViagem({ valido_de: '2027-06-01', valido_ate: '2027-06-20' }, '2027-06-01', '2027-06-20'), true)
  assert.equal(cobreAViagem({ valido_de: '2027-06-02', valido_ate: '2027-06-20' }, '2027-06-01', '2027-06-20'), false)
  assert.equal(cobreAViagem({ valido_de: null, valido_ate: '2027-06-20' }, '2027-06-01', '2027-06-20'), null)
})
