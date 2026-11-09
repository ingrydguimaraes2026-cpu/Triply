// Testes da leitura do orçamento combinado (spec 045). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { leituraDaFaixa } = await import(new URL('../../../packages/core/src/orcamento-combinado.ts', import.meta.url))

test('esperando, faixa comum e sem acordo', () => {
  assert.deepEqual(leituraDaFaixa({ responderam: 1, pessoas: 4, minimo: null, maximo: null }), { tipo: 'esperando', faltam: 3 })
  assert.deepEqual(leituraDaFaixa({ responderam: 4, pessoas: 4, minimo: 600000, maximo: 900000 }), { tipo: 'comum', faltam: 0 })
  assert.deepEqual(leituraDaFaixa({ responderam: 3, pessoas: 4, minimo: 900000, maximo: 600000 }), { tipo: 'sem_acordo', faltam: 1 })
})
