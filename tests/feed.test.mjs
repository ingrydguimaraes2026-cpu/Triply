// Testes das regras do feed de fotos (spec 014), sem internet. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { tempoAtras, textoDasCurtidas, alternarCurtida, podeApagarComentario } = await import(
  new URL('../src/features/feed/regras.ts', import.meta.url)
)

test('há quanto tempo foi postado', () => {
  const agora = new Date('2026-10-18T20:00:00')
  assert.equal(tempoAtras('2026-10-18T19:59:30', agora), 'agora')
  assert.equal(tempoAtras('2026-10-18T19:55:00', agora), '5 min')
  assert.equal(tempoAtras('2026-10-18T17:00:00', agora), '3 h')
  assert.equal(tempoAtras('2026-10-16T20:00:00', agora), '2 d')
  assert.equal(tempoAtras('2026-10-02T10:00:00', agora), '2 out')
  assert.equal(tempoAtras('2025-12-25T10:00:00', agora), '25 dez 2025')
})

test('texto das curtidas', () => {
  const nomes = { a: 'Victor', b: 'Ingryd', c: 'Ana' }
  const nomeDe = (id) => nomes[id]
  assert.equal(textoDasCurtidas([], 'a', nomeDe), null)
  assert.equal(textoDasCurtidas(['a'], 'a', nomeDe), 'Curtido por você')
  assert.equal(textoDasCurtidas(['b'], 'a', nomeDe), 'Curtido por Ingryd')
  assert.equal(textoDasCurtidas(['b', 'a', 'c'], 'a', nomeDe), 'Curtido por você e mais 2')
  assert.equal(textoDasCurtidas(['c', 'b'], 'a', nomeDe), 'Curtido por Ana e mais 1')
})

test('curtir e descurtir', () => {
  assert.deepEqual(alternarCurtida(['b'], 'a'), ['b', 'a'])
  assert.deepEqual(alternarCurtida(['b', 'a'], 'a'), ['b'])
})

test('quem apaga comentário', () => {
  assert.equal(podeApagarComentario('eu', 'outro', 'eu', false), true) // o meu
  assert.equal(podeApagarComentario('outro', 'eu', 'eu', false), true) // no meu post
  assert.equal(podeApagarComentario('outro', 'outro', 'eu', true), true) // ADM
  assert.equal(podeApagarComentario('outro', 'outro', 'eu', false), false)
})
