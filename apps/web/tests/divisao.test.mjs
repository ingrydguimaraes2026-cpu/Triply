// Testes da divisão por pesos e por item (spec 081). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { dividirPorPesos, dividirPorItens } = await import(new URL('../../../packages/core/src/divisao.ts', import.meta.url))
const soma = (partes) => partes.reduce((s, p) => s + p.valor, 0)

test('pesos: casal 2, criança 0,5; sobra pra quem pagou; soma fecha', () => {
  const r = dividirPorPesos(10000, [
    { usuarioId: 'casal', peso: 2 },
    { usuarioId: 'solteiro', peso: 1 },
    { usuarioId: 'crianca', peso: 0.5 },
  ], 'solteiro')
  assert.equal(soma(r), 10000)
  assert.equal(r.find((p) => p.usuarioId === 'casal').valor, 5714)
  assert.equal(r.find((p) => p.usuarioId === 'crianca').valor, 1428)
  assert.equal(r.find((p) => p.usuarioId === 'solteiro').valor, 2858)
  // Peso zero fica de fora
  assert.deepEqual(dividirPorPesos(100, [{ usuarioId: 'a', peso: 0 }], 'a'), [])
})

test('itens: cada um paga o que comeu; serviço dividido entre todos', () => {
  const r = dividirPorItens(
    11000,
    [
      { valor: 4000, pessoas: ['ana'] },
      { valor: 3000, pessoas: ['leo'] },
      { valor: 3000, pessoas: ['ana', 'leo'] },
    ],
    ['ana', 'leo'],
    'ana',
  )
  assert.equal(r.semDono, 1000)
  assert.deepEqual(r.partes, [
    { usuarioId: 'ana', valor: 6000 },
    { usuarioId: 'leo', valor: 5000 },
  ])
  assert.equal(soma(r.partes), 11000)
})

test('itens: soma dos itens passou do total', () => {
  assert.equal(dividirPorItens(1000, [{ valor: 2000, pessoas: ['a'] }], ['a'], 'a').passou, true)
})
