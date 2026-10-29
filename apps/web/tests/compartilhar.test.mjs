// Testes da montagem de link e texto de compartilhar. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { linkDoItem, textoDoItem } = await import(new URL('../../../packages/core/src/compartilhar.ts', import.meta.url))

const V = '11111111-1111-1111-1111-111111111111'

test('link abre na aba certa de cada tipo', () => {
  assert.equal(linkDoItem('https://app', V, { tipo: 'gasto', id: 'g1' }), `https://app/viagem/${V}/financeiro?foco=g1`)
  assert.equal(linkDoItem('https://app', V, { tipo: 'lugar', id: 'l1' }), `https://app/viagem/${V}/lugares?foco=l1`)
  // enquete e ponto ficam na Overview (sem sub-aba)
  assert.equal(linkDoItem('https://app', V, { tipo: 'enquete', id: 'e1' }), `https://app/viagem/${V}?foco=e1`)
  assert.equal(linkDoItem('https://app', V, { tipo: 'ponto', id: 'p1' }), `https://app/viagem/${V}?foco=p1`)
})

test('tira a barra do fim da base e escapa o id', () => {
  assert.equal(linkDoItem('http://localhost:5173/', V, { tipo: 'gasto', id: 'a b' }), `http://localhost:5173/viagem/${V}/financeiro?foco=a%20b`)
})

test('texto usa o título quando tem, senão o rótulo do tipo', () => {
  assert.match(textoDoItem({ tipo: 'lugar', id: 'l1', titulo: 'Torre Eiffel' }, 'http://x'), /"Torre Eiffel"/)
  assert.match(textoDoItem({ tipo: 'enquete', id: 'e1' }, 'http://x'), /a enquete/)
  assert.match(textoDoItem({ tipo: 'ponto', id: 'p1' }, 'http://x', 'Riviera'), /da viagem Riviera/)
  assert.match(textoDoItem({ tipo: 'gasto', id: 'g1' }, 'http://x'), /http:\/\/x$/)
})
