// Testes da mala individual (spec 069). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { modeloDeMala, progressoDaMala } = await import(new URL('../../../packages/core/src/mala.ts', import.meta.url))

test('modelo escala com os dias (até 7) e muda pelo clima', () => {
  const frio = modeloDeMala('frio', 4)
  assert.equal(frio.find((i) => i.texto === 'Meias').quantidade, 5)
  assert.ok(frio.some((i) => i.texto === 'Casaco pesado'))
  assert.ok(!frio.some((i) => i.texto === 'Protetor solar'))
  const longa = modeloDeMala('calor', 20)
  assert.equal(longa.find((i) => i.texto === 'Camisetas').quantidade, 7)
  assert.ok(longa.some((i) => i.texto === 'Protetor solar'))
})

test('progresso', () => {
  assert.deepEqual(progressoDaMala([{ feito: true }, { feito: false }]), { feitos: 1, total: 2 })
})
