// Testes do detector de furos (spec 092). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { encontrarFuros } = await import(new URL('../../../packages/core/src/furos.ts', import.meta.url))

const NICE = { id: 'n', nome: 'Nice', chegada: '2026-11-20', saida: '2026-11-22' }
const MONACO = { id: 'm', nome: 'Mônaco', chegada: '2026-11-22', saida: '2026-11-23' }
const ida = { id: 't1', origem_id: 'n', destino_id: 'm', partida: '2026-11-22T12:00:00', chegada: '2026-11-22T12:30:00' }
const casas = [
  { destinoId: 'n', nome: 'Apê', checkin: '2026-11-20', checkout: '2026-11-22' },
  { destinoId: 'm', nome: 'Hotel', checkin: '2026-11-22', checkout: '2026-11-23' },
]

test('092: plano redondo não tem furo', () => {
  assert.deepEqual(encontrarFuros({ destinos: [NICE, MONACO], trajetos: [ida], escolhidas: casas }), [])
})

test('092: noite sem cama, sem transporte e destino sem datas', () => {
  const furos = encontrarFuros({ destinos: [NICE, MONACO, { id: 'g', nome: 'Gênova', chegada: null, saida: null }], trajetos: [], escolhidas: [] })
  assert.deepEqual(
    furos.map((f) => f.texto),
    [
      'Nice: 2 noites sem hospedagem escolhida',
      'Mônaco: 1 noite sem hospedagem escolhida',
      'Gênova ainda sem datas',
      'Falta o transporte Nice → Mônaco',
      'Falta o transporte Mônaco → Gênova',
    ],
  )
  assert.equal(furos[0].aba, 'hospedagem')
})

test('092: hospedagem que não cobre as noites e saída antes do check-out', () => {
  const furos = encontrarFuros({
    destinos: [NICE, MONACO],
    trajetos: [{ ...ida, partida: '2026-11-21T09:00:00', chegada: '2026-11-21T09:30:00' }],
    escolhidas: [{ ...casas[0], checkin: '2026-11-21' }, { ...casas[1], checkout: '2026-11-22' }],
  })
  assert.deepEqual(
    furos.map((f) => f.texto),
    [
      'Nice: chega 20/11, mas o check-in em Apê é 21/11 (1 noite sem cama)',
      'Mônaco: o check-out em Hotel é 22/11, mas vocês ficam até 23/11 (1 noite sem cama)',
      'Vocês saem de Nice dia 21/11, mas o check-out é 22/11',
    ],
  )
})

test('092: trajetos que se atropelam e buraco entre destinos', () => {
  const volta = { id: 't2', origem_id: 'm', destino_id: 'n', partida: '2026-11-22T12:10:00', chegada: '2026-11-22T13:00:00' }
  const furos = encontrarFuros({ destinos: [NICE, { ...MONACO, chegada: '2026-11-24', saida: '2026-11-25' }], trajetos: [ida, volta], escolhidas: [casas[0], { ...casas[1], checkin: '2026-11-24', checkout: '2026-11-25' }] })
  assert.deepEqual(furos.map((f) => f.chave), ['atropela-t1-t2', 'buraco-n-m', 'sai-antes-m'])
  assert.equal(furos[1].texto, 'Entre Nice e Mônaco: 2 noites sem destino')
})
