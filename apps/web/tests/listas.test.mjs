// Testes das listas do comboio (spec 048). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { resumoDaLista, ordenarItens, descricaoDasCompras } = await import(new URL('../../../packages/core/src/listas.ts', import.meta.url))

test('resumo: feitos, total e sem dono (pendentes)', () => {
  assert.deepEqual(resumoDaLista([{ feito: true, quem_id: null }, { feito: false, quem_id: 'a' }, { feito: false, quem_id: null }]), { feitos: 1, total: 3, semDono: 1 })
})

test('ordem: pendentes antes, por criação', () => {
  const itens = [
    { id: 1, feito: true, criado_em: '1' },
    { id: 2, feito: false, criado_em: '3' },
    { id: 3, feito: false, criado_em: '2' },
  ]
  assert.deepEqual(ordenarItens(itens).map((i) => i.id), [3, 2, 1])
})

test('descrição das compras pro gasto', () => {
  assert.equal(descricaoDasCompras([{ texto: 'Água', quantidade: '2' }, { texto: 'Pão', quantidade: null }]), 'Compras: Água (2), Pão')
})
