// Testes das regras de ordem do roteiro (src/features/destinos/ordem.ts). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { join } from 'node:path'
const { mover, aplicarOrdem, datasForaDeOrdem } = await import(join(import.meta.dirname, '../src/features/destinos/ordem.ts'))
const L = [{ chave: 'a' }, { chave: 'b' }, { chave: 'c' }]
const ch = (l) => l.map((x) => x.chave).join('')
test('mover para cima e para baixo', () => {
  assert.equal(ch(mover(L, 1, -1)), 'bac')
  assert.equal(ch(mover(L, 1, 1)), 'acb')
  assert.equal(ch(L), 'abc', 'não muda a lista original')
})
test('mover nas pontas não faz nada', () => {
  assert.equal(mover(L, 0, -1), L)
  assert.equal(mover(L, 2, 1), L)
})
test('aplicarOrdem com os mesmos itens', () => assert.equal(ch(aplicarOrdem(L, ['c', 'a', 'b'])), 'cab'))
test('aplicarOrdem recusa sugestão incompleta, com item a mais ou repetido', () => {
  assert.equal(aplicarOrdem(L, ['c', 'a']), L)
  assert.equal(aplicarOrdem(L, ['c', 'a', 'b', 'x']), L)
  assert.equal(aplicarOrdem(L, ['a', 'a', 'b']), L)
  assert.equal(aplicarOrdem(L, ['a', 'b', 'x']), L)
})
test('datasForaDeOrdem', () => {
  assert.equal(datasForaDeOrdem([{ chegada: '2026-11-01' }, { chegada: null }, { chegada: '2026-11-05' }]), false)
  assert.equal(datasForaDeOrdem([{ chegada: '2026-11-05' }, { chegada: '2026-11-01' }]), true)
  assert.equal(datasForaDeOrdem([{}, {}]), false)
})
