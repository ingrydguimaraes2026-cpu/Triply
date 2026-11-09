// Testes da validade do passaporte e nacionalidade (spec 038). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { situacaoDoPassaporte, temPassaporteEuropeu } = await import(new URL('../../../packages/core/src/passaporte.ts', import.meta.url))

test('passaporte: ok, renovar (menos de 6 meses depois da volta), vencido e sem data', () => {
  assert.equal(situacaoDoPassaporte('2028-01-01', '2027-06-20', '2026-10-30').nivel, 'ok')
  assert.equal(situacaoDoPassaporte('2027-12-19', '2027-06-20', '2026-10-30').nivel, 'renovar')
  assert.equal(situacaoDoPassaporte('2027-12-20', '2027-06-20', '2026-10-30').nivel, 'ok')
  assert.equal(situacaoDoPassaporte('2026-01-01', '2027-06-20', '2026-10-30').nivel, 'vencido')
  assert.equal(situacaoDoPassaporte(null, '2027-06-20', '2026-10-30').nivel, 'sem_data')
  assert.match(situacaoDoPassaporte('2027-09-01', '2027-06-20', '2026-10-30').texto, /01\/09\/2027/)
})

test('passaporte: sem data de volta usa hoje', () => {
  assert.equal(situacaoDoPassaporte('2027-03-01', null, '2026-10-30').nivel, 'renovar')
})

test('passaporte europeu', () => {
  assert.equal(temPassaporteEuropeu(['BR', 'IT']), true)
  assert.equal(temPassaporteEuropeu(['BR']), false)
  assert.equal(temPassaporteEuropeu(['GB']), false)
})
