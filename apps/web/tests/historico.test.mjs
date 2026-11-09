// Testes do histórico e lixeira (spec 087). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { fraseDoHistorico, diasNaLixeira, podeRestaurar } = await import(new URL('../../../packages/core/src/historico.ts', import.meta.url))

const apagado = { id: 'h', tabela: 'gastos', linha_id: 'g', acao: 'apagou', autor: 'eu', titulo: 'Café', restaurado_em: null, criado_em: '2026-10-01T12:00:00Z' }

test('087: frase do histórico', () => {
  assert.equal(fraseDoHistorico(apagado, 'Victor'), 'Victor apagou o gasto “Café”')
  assert.equal(fraseDoHistorico({ ...apagado, tabela: 'trajetos', acao: 'editou', titulo: null }, 'Ingryd'), 'Ingryd editou o trajeto')
})

test('087: lixeira de 30 dias', () => {
  assert.equal(diasNaLixeira(apagado, new Date('2026-10-02T12:00:00Z')), 29)
  assert.equal(diasNaLixeira(apagado, new Date('2026-11-05T12:00:00Z')), 0)
})

test('087: quem pode restaurar', () => {
  const dia2 = new Date('2026-10-02T12:00:00Z')
  assert.equal(podeRestaurar(apagado, 'eu', false, dia2), true)
  assert.equal(podeRestaurar(apagado, 'outro', false, dia2), false)
  assert.equal(podeRestaurar(apagado, 'outro', true, dia2), true)
  assert.equal(podeRestaurar({ ...apagado, restaurado_em: '2026-10-02' }, 'eu', true, dia2), false)
  assert.equal(podeRestaurar({ ...apagado, acao: 'editou' }, 'eu', true, dia2), false)
  assert.equal(podeRestaurar(apagado, 'eu', true, new Date('2026-11-05T12:00:00Z')), false)
})
