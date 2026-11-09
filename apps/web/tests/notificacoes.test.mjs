// Testes do texto e da contagem da central de notificações (spec 031). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { descreverAtividade, contarNovas } = await import(new URL('../../../packages/core/src/notificacoes.ts', import.meta.url))

const V = '11111111-1111-1111-1111-111111111111'

test('descrever: gasto abre no Financeiro com foco no item', () => {
  const d = descreverAtividade({ tipo: 'gasto', titulo: 'Jantar', alvo_id: 'g1', viagem_id: V })
  assert.equal(d.verbo, 'lançou o gasto')
  assert.equal(d.titulo, 'Jantar')
  assert.equal(d.caminho, `/viagem/${V}/financeiro?foco=g1`)
})

test('descrever: comentário em lugar abre o lugar; hospedagem abre a aba sem foco', () => {
  assert.equal(descreverAtividade({ tipo: 'comentario_lugar', titulo: 'vale?', alvo_id: 'l1', viagem_id: V }).caminho, `/viagem/${V}/lugares?foco=l1`)
  assert.equal(descreverAtividade({ tipo: 'hospedagem', titulo: 'Casa', alvo_id: 'h1', viagem_id: V }).caminho, `/viagem/${V}/hospedagem`)
  // Aviso fica na Overview
  assert.equal(descreverAtividade({ tipo: 'aviso', titulo: 'Oi', alvo_id: 'a1', viagem_id: V }).caminho, `/viagem/${V}`)
})

test('descrever: membro novo não tem título; tipo desconhecido não quebra', () => {
  assert.equal(descreverAtividade({ tipo: 'membro', titulo: null, alvo_id: 'u', viagem_id: V }).titulo, null)
  assert.equal(descreverAtividade({ tipo: 'novidade-futura', titulo: 'x', alvo_id: null, viagem_id: V }).verbo, 'mexeu na viagem')
})

test('contar novas: só depois do visto e de outras pessoas', () => {
  const lista = [
    { autor: 'eu', criado_em: '2026-10-29T10:00:00Z' },
    { autor: 'ela', criado_em: '2026-10-29T09:00:00Z' },
    { autor: 'ela', criado_em: '2026-10-29T11:00:00Z' },
    { autor: null, criado_em: '2026-10-29T12:00:00Z' }, // autor saiu do app: conta
  ]
  assert.equal(contarNovas(lista, '2026-10-29T09:30:00Z', 'eu'), 2)
  assert.equal(contarNovas(lista, null, 'eu'), 3) // nunca abriu o sino
  assert.equal(contarNovas(lista, '2026-10-29T12:00:00Z', 'eu'), 0)
})
