// Testes da situação e do preço dos trajetos (spec 035). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { resumoDosTrajetos, nomeDaSituacao } = await import(new URL('../../../packages/core/src/transportes.ts', import.meta.url))

test('resumo: conta comprados e soma o que falta pagar por moeda (em centavos)', () => {
  const r = resumoDosTrajetos([
    { situacao: 'comprado', preco: 80, moeda: 'EUR' },
    { situacao: 'reservado', preco: 45.5, moeda: 'EUR' },
    { situacao: 'sugestao', preco: 30.1, moeda: 'EUR' },
    { situacao: 'sugestao', preco: 2000, moeda: 'BRL' },
    { situacao: 'sugestao', preco: null, moeda: null },
  ])
  assert.equal(r.comprados, 1)
  assert.equal(r.total, 5)
  assert.deepEqual(r.aPagar, [
    { moeda: 'BRL', valor: 200000 },
    { moeda: 'EUR', valor: 7560 },
  ])
  assert.equal(r.semPreco, 1)
})

test('resumo vazio e nome da situação', () => {
  assert.deepEqual(resumoDosTrajetos([]), { comprados: 0, total: 0, aPagar: [], semPreco: 0 })
  assert.equal(nomeDaSituacao('reservado'), 'Reservado')
  assert.equal(nomeDaSituacao('qualquer'), 'Sugestão')
})

test('prontidão: média das partes que existem e o que falta', async () => {
  const { prontidao } = await import(new URL('../../../packages/core/src/transportes.ts', import.meta.url))
  assert.deepEqual(
    prontidao([
      { nome: 'documentos', feitas: 3, total: 4 },
      { nome: 'hospedagem', feitas: 2, total: 2 },
      { nome: 'trajetos', feitas: 0, total: 0 },
    ]),
    { porcento: 88, faltando: ['documentos'] },
  )
  assert.equal(prontidao([{ nome: 'x', feitas: 0, total: 0 }]), null)
})
