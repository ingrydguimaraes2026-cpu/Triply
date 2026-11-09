// Testes dos relatórios do Financeiro (spec 082). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { relatorio } = await import(new URL('../../../packages/core/src/relatorios.ts', import.meta.url))

test('por dia, por pessoa (pagou x consumiu), custo por pessoa por dia e dia mais caro', () => {
  const r = relatorio(
    [
      { data: '2026-11-10', valor: 9000, pago_por: 'a', divisoes: [{ usuarioId: 'a', valor: 4500 }, { usuarioId: 'b', valor: 4500 }] },
      { data: '2026-11-11', valor: 3000, pago_por: 'b', divisoes: [{ usuarioId: 'b', valor: 3000 }] },
      { data: '2026-11-10', valor: 1000, pago_por: 'b', divisoes: [{ usuarioId: 'a', valor: 500 }, { usuarioId: 'b', valor: 500 }] },
    ],
    2,
  )
  assert.equal(r.total, 13000)
  assert.deepEqual(r.porDia, [
    { dia: '2026-11-10', valor: 10000 },
    { dia: '2026-11-11', valor: 3000 },
  ])
  assert.deepEqual(r.porPessoa, [
    { usuarioId: 'b', pagou: 4000, consumiu: 8000 },
    { usuarioId: 'a', pagou: 9000, consumiu: 5000 },
  ])
  assert.equal(r.porPessoaPorDia, 3250)
  assert.equal(r.diaMaisCaro, '2026-11-10')
})

test('sem gastos', () => {
  const r = relatorio([], 3)
  assert.equal(r.total, 0)
  assert.equal(r.diaMaisCaro, null)
  assert.equal(r.porPessoaPorDia, 0)
})
