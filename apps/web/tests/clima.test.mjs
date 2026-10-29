// Testes da parte pura do clima (sem internet). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { janelaDeClima, interpretarTempo } = await import(new URL('../../../packages/core/src/clima.ts', import.meta.url))

const HOJE = '2026-10-29' // limite da previsão = hoje + 15 = 2026-11-13

test('viagem toda dentro dos próximos 16 dias: só previsão', () => {
  const j = janelaDeClima('2026-11-01', '2026-11-05', HOJE)
  assert.equal(j.dias.length, 5)
  assert.deepEqual(j.previsao, { inicio: '2026-11-01', fim: '2026-11-05' })
  assert.equal(j.estimativa, null)
})

test('dias que já passaram são ignorados', () => {
  const j = janelaDeClima('2026-10-20', '2026-11-02', HOJE)
  assert.equal(j.dias[0], '2026-10-29') // começa em hoje, não na chegada antiga
  assert.equal(j.dias.at(-1), '2026-11-02')
  assert.equal(j.dias.length, 5)
})

test('viagem longe: tudo vira estimativa pelo ano passado', () => {
  const j = janelaDeClima('2027-06-01', '2027-06-03', HOJE)
  assert.equal(j.previsao, null)
  assert.deepEqual(j.estimativa, { inicio: '2027-06-01', fim: '2027-06-03' })
})

test('viagem em cima do limite: parte previsão, parte estimativa', () => {
  const j = janelaDeClima('2026-11-10', '2026-11-20', HOJE)
  assert.deepEqual(j.previsao, { inicio: '2026-11-10', fim: '2026-11-13' })
  assert.deepEqual(j.estimativa, { inicio: '2026-11-14', fim: '2026-11-20' })
})

test('viagem toda no passado, ou sem datas: janela vazia', () => {
  assert.equal(janelaDeClima('2026-01-01', '2026-01-05', HOJE).dias.length, 0)
  assert.equal(janelaDeClima('', '', HOJE).dias.length, 0)
})

test('código de tempo vira rótulo e emoji', () => {
  assert.equal(interpretarTempo(0).emoji, '☀️')
  assert.equal(interpretarTempo(2).emoji, '⛅')
  assert.equal(interpretarTempo(61).rotulo, 'Chuva')
  assert.equal(interpretarTempo(95).rotulo, 'Trovoada')
})
