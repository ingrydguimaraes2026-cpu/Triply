// Testes do "Cheguei bem" (spec 051). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { chegadasRecentes } = await import(new URL('../../../packages/core/src/chegadas.ts', import.meta.url))

test('só a última de cada pessoa nas últimas 24 h', () => {
  const agora = new Date('2026-11-10T20:00:00Z')
  const r = chegadasRecentes(
    [
      { usuario_id: 'a', criado_em: '2026-11-10T10:00:00Z' },
      { usuario_id: 'a', criado_em: '2026-11-10T18:00:00Z' },
      { usuario_id: 'b', criado_em: '2026-11-09T10:00:00Z' },
      { usuario_id: 'c', criado_em: '2026-11-10T19:00:00Z' },
    ],
    agora,
  )
  assert.deepEqual(r.map((c) => [c.usuario_id, c.criado_em]), [
    ['c', '2026-11-10T19:00:00Z'],
    ['a', '2026-11-10T18:00:00Z'],
  ])
})
