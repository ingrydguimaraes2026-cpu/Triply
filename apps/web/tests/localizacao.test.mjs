// Testes da localização ao vivo (spec 107). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { comboioPorPerto } = await import(new URL('../../../packages/core/src/ferramentas.ts', import.meta.url))

const agora = new Date('2026-11-20T12:00:00Z')
const P = (id, lat, lng, atras, resta) => ({
  usuario_id: id,
  latitude: lat,
  longitude: lng,
  atualizado_em: new Date(agora.getTime() - atras * 60000).toISOString(),
  ate: new Date(agora.getTime() + resta * 60000).toISOString(),
})

test('107: mais perto primeiro; vencido some; minutos', () => {
  const lista = comboioPorPerto([P('longe', 43.75, 7.3, 1, 60), P('perto', 43.7005, 7.2605, 3, 30), P('venceu', 43.7, 7.26, 0, -1)], { latitude: 43.7, longitude: 7.26 }, agora)
  assert.deepEqual(lista.map((x) => x.usuarioId), ['perto', 'longe'])
  assert.ok(lista[0].metros < 100)
  assert.equal(lista[0].minutosAtras, 3)
  assert.equal(lista[0].restamMinutos, 30)
})

test('107: sem a minha posição, a atualização mais nova primeiro', () => {
  const lista = comboioPorPerto([P('a', 1, 1, 5, 10), P('b', 2, 2, 1, 10)], null, agora)
  assert.deepEqual(lista.map((x) => [x.usuarioId, x.metros]), [['b', null], ['a', null]])
})
