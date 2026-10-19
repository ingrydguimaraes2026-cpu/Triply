// Testes do boletim do câmbio e da meta opcional (spec 013), sem internet. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { decidir, nivelDoCambio, boletim } = await import(new URL('../supabase/functions/avisos-cambio/regras.ts', import.meta.url))

test('meta: avisa uma vez quando cruza pra baixo', () => {
  // 5,60 comercial → 5,796 com IOF
  assert.equal(decidir({ meta: 5.8, abaixo: false }, 5.6).acao, 'avisar')
  assert.equal(decidir({ meta: 5.8, abaixo: true }, 5.6).acao, 'nada') // já avisou
  assert.equal(decidir({ meta: 5.7, abaixo: false }, 5.6).acao, 'nada') // ainda acima
})

test('meta: só rearma quando sobe com folga acima da meta', () => {
  assert.equal(decidir({ meta: 5.8, abaixo: true }, 5.61).acao, 'nada') // 5,806: oscilando em cima da meta
  assert.equal(decidir({ meta: 5.8, abaixo: true }, 5.7).acao, 'rearmar') // 5,90
})

test('barato, médio ou caro em relação aos 90 dias', () => {
  const historico = [6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7]
  assert.equal(nivelDoCambio(historico, 6.05), 'barato')
  assert.equal(nivelDoCambio(historico, 6.35), 'medio')
  assert.equal(nivelDoCambio(historico, 6.65), 'caro')
  assert.equal(nivelDoCambio([], 6.3), null)
})

test('boletim: caiu e está barato', () => {
  const b = boletim({ moeda: 'EUR', comIOF: 6.12, anterior: 6.2, nivel: 'barato', metaBatida: null })
  assert.equal(b.titulo, '💶 Euro hoje: R$ 6,12 com IOF')
  assert.match(b.corpo, /^▼ Caiu R\$ 0,08 desde o último aviso\. Está barato/)
})

test('boletim: subiu, igual, primeiro e meta batida', () => {
  assert.match(boletim({ moeda: 'EUR', comIOF: 6.25, anterior: 6.2, nivel: 'medio', metaBatida: null }).corpo, /▲ Subiu R\$ 0,05.*na média/)
  assert.match(boletim({ moeda: 'EUR', comIOF: 6.2, anterior: 6.202, nivel: null, metaBatida: null }).corpo, /^Igual ao último aviso\.$/)
  assert.match(boletim({ moeda: 'USD', comIOF: 5.5, anterior: null, nivel: 'caro', metaBatida: null }).corpo, /^Primeiro boletim\. Está caro/)
  assert.match(boletim({ moeda: 'EUR', comIOF: 5.79, anterior: 5.9, nivel: 'barato', metaBatida: 5.8 }).corpo, /^🎯 Bateu sua meta de R\$ 5,80\. ▼ Caiu/)
})
