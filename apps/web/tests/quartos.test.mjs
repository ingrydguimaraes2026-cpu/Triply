// Testes do quem dorme onde (spec 068). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { sortearQuartos, semQuarto } = await import(new URL('../../../packages/core/src/quartos.ts', import.meta.url))

test('sorteio respeita as vagas e diz quem sobrou', () => {
  const sempreZero = () => 0
  const r = sortearQuartos([{ id: 'q1', vagas: 2 }, { id: 'q2', vagas: 1 }], ['a', 'b', 'c', 'd'], sempreZero)
  assert.equal(r.distribuicao.q1.length, 2)
  assert.equal(r.distribuicao.q2.length, 1)
  assert.equal(r.sobrou.length, 1)
  assert.deepEqual([...r.distribuicao.q1, ...r.distribuicao.q2, ...r.sobrou].sort(), ['a', 'b', 'c', 'd'])
})

test('quem está sem quarto', () => {
  assert.deepEqual(semQuarto([{ ocupantes: ['a'] }, { ocupantes: ['c'] }], ['a', 'b', 'c']), ['b'])
})
