// Testes do exportar gastos (spec 052). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { gastosEmCsv, gastosParaSplitwise } = await import(new URL('../../../packages/core/src/exportar.ts', import.meta.url))

const PESSOAS = [
  { id: 'v', nome: 'Victor' },
  { id: 'i', nome: 'Ingryd' },
]
const GASTOS = [
  { data: '2026-11-10', descricao: 'Jantar; vinho', categoria: 'alimentacao', valor: 9000, moeda: 'EUR', pago_por: 'v', pessoal: false, divisoes: [{ usuarioId: 'v', valor: 4500 }, { usuarioId: 'i', valor: 4500 }] },
  { data: '2026-11-09', descricao: '=SOMA(A1)', categoria: 'comprinhas', valor: 1250, moeda: 'EUR', pago_por: 'i', pessoal: true, divisoes: [] },
]

test('CSV em português: BOM, ";", vírgula decimal, ordem por data, proteção contra fórmula', () => {
  const csv = gastosEmCsv(GASTOS, PESSOAS, (c) => ({ alimentacao: 'Alimentação', comprinhas: 'Comprinhas' })[c])
  assert.ok(csv.startsWith('﻿Data;Descrição;Categoria;Valor;Moeda;Pago por;Tipo;Parte de Victor;Parte de Ingryd\r\n'))
  const [, primeira, segunda] = csv.slice(1).trim().split('\r\n')
  assert.equal(primeira, "09/11/2026;'=SOMA(A1);Comprinhas;12,50;EUR;Ingryd;Pessoal;;")
  assert.equal(segunda, '10/11/2026;"Jantar; vinho";Alimentação;90,00;EUR;Victor;Comboio;45,00;45,00')
})

test('Splitwise: só comboio, saldo de cada um no gasto', () => {
  const csv = gastosParaSplitwise(GASTOS, PESSOAS)
  assert.equal(csv, 'Date,Description,Category,Cost,Currency,Victor,Ingryd\r\n2026-11-10,Jantar; vinho,alimentacao,90.00,EUR,45.00,-45.00\r\n')
})
