import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const { TABELAS_AO_VIVO, oQueRecarregar, filtroDaTabela } = await import(new URL('../../../packages/core/src/tempo-real.ts', import.meta.url))

test('085: viagem, destinos e comboio recarregam a moldura; o resto só a própria aba', () => {
  assert.equal(oQueRecarregar('destinos'), 'viagem')
  assert.equal(oQueRecarregar('comboio_membros'), 'viagem')
  assert.equal(oQueRecarregar('gastos'), 'gastos')
  assert.equal(oQueRecarregar('trajetos'), 'trajetos')
  assert.equal(oQueRecarregar('carteiras'), null) // não é transmitida
})

test('085: filtro só da viagem aberta', () => {
  assert.equal(filtroDaTabela('viagens', 'abc'), 'id=eq.abc')
  assert.equal(filtroDaTabela('gastos', 'abc'), 'viagem_id=eq.abc')
})

test('085: a lista do site é a mesma da migration', () => {
  const sql = readFileSync(new URL('../../../supabase/migrations/20261031100000_tempo_real.sql', import.meta.url), 'utf8')
  const lista = sql.match(/foreach t in array array\[(.*?)\]/)[1].match(/'([a-z_]+)'/g).map((s) => s.slice(1, -1))
  // Tabelas que entraram depois, em migration própria (spec 115 v2: roteiros)
  const roteiros = readFileSync(new URL('../../../supabase/migrations/20261102180000_roteiros.sql', import.meta.url), 'utf8')
  const depois = [...roteiros.matchAll(/add table public\.([a-z_]+)/g)].map((m) => m[1])
  assert.deepEqual([...lista, ...depois].sort(), [...TABELAS_AO_VIVO].sort())
})
