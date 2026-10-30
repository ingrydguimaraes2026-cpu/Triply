// Testes da retrospectiva (spec 105). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { cartoesDaRetrospectiva } = await import(new URL('../../../packages/core/src/retrospectiva.ts', import.meta.url))

const base = {
  nome: 'Riviera',
  dias: 9,
  km: 1342.4,
  cidades: ['Nice', 'Mônaco', 'Gênova'],
  paises: ['França', 'Mônaco', 'Itália'],
  gastoTotal: 300000,
  dinheiro: (c) => `€ ${(c / 100).toFixed(2)}`,
  pessoas: 4,
  posts: 12,
  fotos: 57,
  curtidas: 1,
  lugaresVisitados: 8,
}

test('105: cartões com os números da viagem', () => {
  const c = cartoesDaRetrospectiva(base)
  assert.deepEqual(c.map((x) => x.chave), ['dias', 'cidades', 'km', 'gasto', 'fotos', 'lugares'])
  assert.deepEqual(c[3], { chave: 'gasto', numero: '€ 750.00', titulo: 'por pessoa', legenda: '€ 3000.00 no total do comboio (4 pessoas)' })
  assert.equal(c[1].legenda, 'Nice → Mônaco → Gênova')
  assert.equal(c[2].legenda, 'passando por França, Mônaco, Itália')
  assert.equal(c[4].legenda, '12 posts · 1 curtida')
})

test('105: sem dado, sem cartão', () => {
  const c = cartoesDaRetrospectiva({ ...base, km: 3, gastoTotal: null, fotos: 0, lugaresVisitados: 0, cidades: ['Nice'] })
  assert.deepEqual(c.map((x) => x.chave), ['dias', 'cidades'])
  assert.equal(c[1].titulo, 'cidade')
})
