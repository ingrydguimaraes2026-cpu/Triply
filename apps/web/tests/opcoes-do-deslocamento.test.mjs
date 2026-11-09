// Testes das opções de um deslocamento (spec 122c). Rodar: node --test apps/web/tests/opcoes-do-deslocamento.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { compararOpcoes, folgaDaOpcao, livreNoDia } = await import(new URL('../../../packages/core/src/opcoes-do-deslocamento.ts', import.meta.url))

const local = (dia, hora) => new Date(`${dia}T${hora}:00`).toISOString()
const t = (id, sai, chega, extra = {}) => ({ id, partida: local('2027-06-09', sai), chegada: chega ? local('2027-06-09', chega) : null, de_texto: 'Tirano', ...extra })

test('folga conta da chegada anterior (fora do grupo) até a saída', () => {
  const antes = t('a', '06:10', '09:30', { de_texto: 'Tirano' })
  const opcao = t('o1', '10:00', '10:40', { grupo_opcoes: 'g' })
  assert.deepEqual(folgaDaOpcao(opcao, [antes, opcao]), { minutos: 30, de: 'Tirano' })
  assert.equal(folgaDaOpcao(t('x', '05:00', '05:30', { grupo_opcoes: 'g' }), [antes]), null)
})

test('selos só com 2 ou mais dados; escolhida só com uma marcada e outra não', () => {
  const antes = t('a', '06:10', '09:30')
  const o1 = t('o1', '09:45', '11:00', { grupo_opcoes: 'g', preco: 20, escolhida: false })
  const o2 = t('o2', '10:30', '11:15', { grupo_opcoes: 'g', preco: 30, escolhida: true })
  const linhas = compararOpcoes([o2, o1], [antes, o1, o2])
  assert.deepEqual(linhas.map((l) => l.opcao.id), ['o1', 'o2'])
  assert.deepEqual(linhas[0].selos, ['Mais barato'])
  assert.deepEqual(linhas[1].selos, ['Mais folga', 'Mais rápido'])
  assert.equal(linhas[0].folgaCurta, true) // 15 min < 30
  assert.equal(linhas[1].escolhida, true)
  assert.equal(compararOpcoes([o1], [antes, o1])[0].selos.length, 0)
})

test('livre no dia: última chegada, sem contar o próprio grupo', () => {
  const a = t('a', '06:10', '09:30', { de_texto: 'Tirano' })
  const b = t('b', '10:00', '12:00', { grupo_opcoes: 'g' })
  assert.deepEqual(livreNoDia([a, b], '2027-06-09', null, 'g'), { quando: a.chegada, de: 'Tirano' })
  assert.equal(livreNoDia([a], '2027-06-10', null, null), null)
})
