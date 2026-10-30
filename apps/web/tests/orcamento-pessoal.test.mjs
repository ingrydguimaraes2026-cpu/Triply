// Testes do meu orçamento pessoal (spec 056). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { situacaoDoMeuOrcamento } = await import(new URL('../../../packages/core/src/orcamento-pessoal.ts', import.meta.url))

test('durante a viagem: quanto sobra por dia (contando hoje)', () => {
  const s = situacaoDoMeuOrcamento(100000, 40000, '2026-11-01', '2026-11-10', '2026-11-07')
  assert.deepEqual(s, { porcento: 40, restante: 60000, porDia: 15000, diasRestantes: 4, nivel: 'ok' })
})

test('antes da viagem conta todos os dias; 80% vira atenção; passou estoura', () => {
  assert.equal(situacaoDoMeuOrcamento(100000, 0, '2026-11-01', '2026-11-10', '2026-10-20').diasRestantes, 10)
  assert.equal(situacaoDoMeuOrcamento(100000, 85000, null, null, '2026-10-20').nivel, 'atencao')
  const estourou = situacaoDoMeuOrcamento(100000, 120000, '2026-11-01', '2026-11-10', '2026-11-05')
  assert.equal(estourou.nivel, 'estourou')
  assert.equal(estourou.porDia, null)
  // Depois da viagem não tem "por dia"
  assert.equal(situacaoDoMeuOrcamento(100000, 50000, '2026-11-01', '2026-11-10', '2026-11-20').diasRestantes, null)
})
