// Testes das datas em comum (spec 065). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { janelasEmComum } = await import(new URL('../../../packages/core/src/datas-em-comum.ts', import.meta.url))

const d = (usuario_id, ...dias) => dias.map((dia) => ({ usuario_id, dia }))

test('janela em que todos podem, a melhor primeiro', () => {
  const disps = [
    ...d('a', '2027-06-01', '2027-06-02', '2027-06-03', '2027-06-10', '2027-06-11'),
    ...d('b', '2027-06-02', '2027-06-03', '2027-06-04', '2027-06-10', '2027-06-11'),
    ...d('c', '2027-06-02', '2027-06-03', '2027-06-10'),
  ]
  assert.deepEqual(janelasEmComum(disps, 3), [{ inicio: '2027-06-02', fim: '2027-06-03', dias: 2, pessoas: 3 }])
  // Com 2 pessoas: a janela longa de 01 a 04 e a de 10 a 11
  assert.deepEqual(
    janelasEmComum(disps, 2).map((j) => [j.inicio, j.fim, j.pessoas]),
    [
      ['2027-06-02', '2027-06-03', 3],
      ['2027-06-10', '2027-06-11', 2],
    ],
  )
})

test('vira o mês e ignora janela curta', () => {
  const disps = [...d('a', '2027-06-30', '2027-07-01'), ...d('b', '2027-06-30', '2027-07-01', '2027-07-05')]
  assert.deepEqual(janelasEmComum(disps, 2), [{ inicio: '2027-06-30', fim: '2027-07-01', dias: 2, pessoas: 2 }])
  assert.deepEqual(janelasEmComum(disps, 2, 3), [])
})
