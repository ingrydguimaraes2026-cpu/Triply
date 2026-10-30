// Testes das menções @nome (spec 043). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { acharMencoes, partesComMencoes, sugerirMencoes, completarMencao } = await import(new URL('../../../packages/core/src/mencoes.ts', import.meta.url))

const P = [
  { id: 'i', nome: 'Ingryd Guimarães' },
  { id: 'v', nome: 'Victor' },
  { id: 'a', nome: 'Ana' },
  { id: 'ap', nome: 'Ana Paula' },
]

test('acha menções por primeiro nome, nome inteiro, sem acento e sem maiúscula', () => {
  assert.deepEqual(acharMencoes('@ingryd e @VICTOR, vocês pagam?', P).sort(), ['i', 'v'])
  assert.deepEqual(acharMencoes('fala @Ana Paula', P), ['ap'])
  assert.deepEqual(acharMencoes('fala @Ana!', P), ['a'])
  // e-mail não é menção; nome colado em outra palavra também não
  assert.deepEqual(acharMencoes('manda pra victor@gmail.com', P), [])
  assert.deepEqual(acharMencoes('@Victoria chegou', P), [])
})

test('partes pra pintar na tela', () => {
  assert.deepEqual(partesComMencoes('oi @Victor, tudo?', P), [{ texto: 'oi ' }, { texto: '@Victor', pessoaId: 'v' }, { texto: ', tudo?' }])
  assert.deepEqual(partesComMencoes('sem menção', P), [{ texto: 'sem menção' }])
})

test('sugestões enquanto digita e completar', () => {
  assert.deepEqual(sugerirMencoes('quem paga @an', P).pessoas.map((p) => p.id), ['a', 'ap'])
  assert.equal(sugerirMencoes('quem paga', P), null)
  assert.equal(sugerirMencoes('email@an', P), null)
  assert.equal(completarMencao('quem paga @in', P[0]), 'quem paga @Ingryd ')
})
