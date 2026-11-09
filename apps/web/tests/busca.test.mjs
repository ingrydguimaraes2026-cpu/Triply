// Testes da busca na viagem (spec 053). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { buscarNaViagem } = await import(new URL('../../../packages/core/src/busca.ts', import.meta.url))

const ITENS = [
  { tipo: 'lugar', id: 'l1', titulo: 'Le Safari', detalhe: 'Restaurante em Nice', caminho: '/l1' },
  { tipo: 'gasto', id: 'g1', titulo: 'Jantar no Safari', detalhe: null, caminho: '/g1' },
  { tipo: 'hospedagem', id: 'h1', titulo: 'Casa da Ana', detalhe: 'Reserva HMXYZ123', caminho: '/h1' },
  { tipo: 'destino', id: 'd1', titulo: 'Mônaco', detalhe: 'Mônaco', caminho: '/d1' },
]

test('acha sem acento, por título e por detalhe (código de reserva)', () => {
  assert.deepEqual(buscarNaViagem(ITENS, 'monaco').map((i) => i.id), ['d1'])
  assert.deepEqual(buscarNaViagem(ITENS, 'hmxyz').map((i) => i.id), ['h1'])
})

test('título vale mais que detalhe; todas as palavras precisam aparecer', () => {
  const itens = [...ITENS, { tipo: 'evento', id: 'e1', titulo: 'Passeio', detalhe: 'perto do Safari', caminho: '/e1' }]
  assert.deepEqual(buscarNaViagem(itens, 'safari').map((i) => i.id), ['g1', 'l1', 'e1'])
  assert.deepEqual(buscarNaViagem(ITENS, 'safari nice').map((i) => i.id), ['l1'])
})

test('termo curto demais não busca', () => {
  assert.deepEqual(buscarNaViagem(ITENS, 'a'), [])
  assert.deepEqual(buscarNaViagem(ITENS, '   '), [])
})
