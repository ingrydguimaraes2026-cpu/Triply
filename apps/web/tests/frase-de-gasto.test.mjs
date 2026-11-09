// Testes do gasto por frase (spec 093). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { lerFraseDeGasto } = await import(new URL('../../../packages/core/src/frase-de-gasto.ts', import.meta.url))

const ctx = { meuId: 'eu', pessoas: [{ id: 'eu', nome: 'Victor Uribe' }, { id: 'in', nome: 'Ingryd Guimarães' }] }

test('093: frase simples', () => {
  assert.deepEqual(lerFraseDeGasto('café 12 euros', ctx), { valor: 1200, moeda: 'EUR', descricao: 'Café', categoria: 'alimentacao', pagoPor: null, pessoal: false })
})

test('093: quem pagou, vírgula e acento', () => {
  const g = lerFraseDeGasto('Jantar no restaurante 45,50 a Ingryd pagou', ctx)
  assert.equal(g.valor, 4550)
  assert.equal(g.pagoPor, 'in')
  assert.equal(g.descricao, 'Jantar restaurante')
  assert.equal(g.categoria, 'alimentacao')
  assert.equal(lerFraseDeGasto('uber 18 paguei', ctx).pagoPor, 'eu')
  assert.equal(lerFraseDeGasto('táxi 30 pago pela ingryd', ctx).pagoPor, 'in')
})

test('093: pessoal, milhar e moeda por símbolo', () => {
  const g = lerFraseDeGasto('hotel 1.234,56 R$ só eu', ctx)
  assert.deepEqual([g.valor, g.moeda, g.pessoal, g.categoria, g.descricao], [123456, 'BRL', true, 'hospedagem', 'Hotel'])
  assert.equal(lerFraseDeGasto('ingresso museu 22.5', ctx).valor, 2250)
  assert.equal(lerFraseDeGasto('ingresso museu 22.5', ctx).categoria, 'passeios')
})

test('093: sem número, sem categoria', () => {
  const g = lerFraseDeGasto('coisa estranha', ctx)
  assert.equal(g.valor, null)
  assert.equal(g.categoria, null)
  assert.equal(g.descricao, 'Coisa estranha')
})
