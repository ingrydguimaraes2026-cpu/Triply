// Testes do resultado da enquete / decisão (spec 044). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { resultadoDaEnquete } = await import(new URL('../../../packages/core/src/decisoes.ts', import.meta.url))

test('vencedora, empate e sem votos', () => {
  assert.deepEqual(resultadoDaEnquete([{ texto: 'Pizza', votos: ['a', 'b'] }, { texto: 'Sushi', votos: ['c'] }]), { vencedoras: ['Pizza'], votos: 2, empate: false })
  assert.deepEqual(resultadoDaEnquete([{ texto: 'Pizza', votos: ['a'] }, { texto: 'Sushi', votos: ['c'] }]), { vencedoras: ['Pizza', 'Sushi'], votos: 1, empate: true })
  assert.equal(resultadoDaEnquete([{ texto: 'Pizza', votos: [] }]), null)
})
