// Testes da fila de marcações sem internet (spec 086). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { juntarNaFila, ordemDeEnvio, tirarDaFila, comPendentes } = await import(new URL('../../../packages/core/src/fila-offline.ts', import.meta.url))

test('086: marcar e desmarcar o mesmo item vira uma mudança só (vale a última)', () => {
  let fila = []
  fila = juntarNaFila(fila, { tabela: 'mala_itens', id: 'a', campos: { feito: true }, quando: 1 })
  fila = juntarNaFila(fila, { tabela: 'tarefas', id: 'a', campos: { feita: true }, quando: 2 })
  fila = juntarNaFila(fila, { tabela: 'mala_itens', id: 'a', campos: { feito: false }, quando: 3 })
  assert.equal(fila.length, 2)
  assert.deepEqual(fila[0], { tabela: 'mala_itens', id: 'a', campos: { feito: false }, quando: 3 })
})

test('086: campos diferentes do mesmo item se somam', () => {
  let fila = juntarNaFila([], { tabela: 'itens_lista', id: 'x', campos: { feito: true }, quando: 1 })
  fila = juntarNaFila(fila, { tabela: 'itens_lista', id: 'x', campos: { quem_id: 'u1' }, quando: 2 })
  assert.deepEqual(fila[0].campos, { feito: true, quem_id: 'u1' })
})

test('086: envia na ordem em que a pessoa fez e tira da fila', () => {
  const fila = [
    { tabela: 'tarefas', id: 'b', campos: { feita: true }, quando: 5 },
    { tabela: 'tarefas', id: 'c', campos: { feita: true }, quando: 2 },
  ]
  assert.deepEqual(ordemDeEnvio(fila).map((m) => m.id), ['c', 'b'])
  assert.deepEqual(tirarDaFila(fila, { tabela: 'tarefas', id: 'b' }).map((m) => m.id), ['c'])
})

test('086: a tela mostra as marcações pendentes por cima do que veio do banco', () => {
  const itens = [{ id: 'a', feito: false }, { id: 'b', feito: false }]
  const fila = [{ tabela: 'mala_itens', id: 'b', campos: { feito: true }, quando: 1 }]
  assert.deepEqual(comPendentes(itens, fila, 'mala_itens'), [{ id: 'a', feito: false }, { id: 'b', feito: true }])
  assert.deepEqual(comPendentes(itens, fila, 'tarefas'), itens)
})

test('086: item criado sem internet aparece até o banco ter ele (sem repetir)', async () => {
  const { comCriacoesPendentes } = await import(new URL('../../../packages/core/src/fila-offline.ts', import.meta.url))
  const criacoes = [
    { tabela: 'itens_lista', linha: { id: 'novo', viagem_id: 'v', texto: 'Água' }, quando: 1 },
    { tabela: 'itens_lista', linha: { id: 'ja', viagem_id: 'v', texto: 'Pão' }, quando: 2 },
    { tabela: 'itens_lista', linha: { id: 'outra', viagem_id: 'x', texto: 'Leite' }, quando: 3 },
  ]
  const lista = comCriacoesPendentes([{ id: 'ja', texto: 'Pão' }], criacoes, 'itens_lista', 'v')
  assert.deepEqual(lista.map((i) => i.id), ['ja', 'novo'])
})
