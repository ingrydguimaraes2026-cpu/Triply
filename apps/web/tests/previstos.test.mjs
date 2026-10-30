// Testes dos pagamentos previstos (spec 057). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { repetirPorDia, situacaoDoPrevisto, totalAPagar } = await import(new URL('../../../packages/core/src/previstos.ts', import.meta.url))

test('repetir por dia: uma linha por dia com (n/total)', () => {
  const base = { descricao: 'Estacionamento', valor: 2000, moeda: 'EUR', categoria: 'transporte', venceEm: null, quemPaga: null }
  const r = repetirPorDia(base, '2026-11-30', '2026-12-02')
  assert.deepEqual(r.map((p) => [p.venceEm, p.descricao]), [
    ['2026-11-30', 'Estacionamento (1/3)'],
    ['2026-12-01', 'Estacionamento (2/3)'],
    ['2026-12-02', 'Estacionamento (3/3)'],
  ])
})

test('situação e total a pagar', () => {
  const hoje = '2026-11-10'
  assert.equal(situacaoDoPrevisto({ vence_em: '2026-11-01', pago_em: null }, hoje), 'atrasado')
  assert.equal(situacaoDoPrevisto({ vence_em: hoje, pago_em: null }, hoje), 'hoje')
  assert.equal(situacaoDoPrevisto({ vence_em: '2026-11-15', pago_em: null }, hoje), 'em_breve')
  assert.equal(situacaoDoPrevisto({ vence_em: '2026-12-15', pago_em: null }, hoje), 'depois')
  assert.equal(situacaoDoPrevisto({ vence_em: '2026-11-01', pago_em: 'x' }, hoje), 'pago')
  assert.deepEqual(totalAPagar([{ valor: 100, moeda: 'EUR', pago_em: null }, { valor: 50, moeda: 'EUR', pago_em: 'x' }, { valor: 7, moeda: 'BRL', pago_em: null }]), { EUR: 100, BRL: 7 })
})
