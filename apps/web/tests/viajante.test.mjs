// Testes do mapa de onde já fui e estatísticas (spec 102). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { estatisticasDoViajante } = await import(new URL('../../../packages/core/src/viajante.ts', import.meta.url))

const viagens = [
  { id: 'a', nome: 'Riviera', data_inicio: '2025-11-20', data_fim: '2025-11-23' },
  { id: 'b', nome: 'Portugal', data_inicio: '2026-10-28', data_fim: '2026-11-05' }, // em andamento
  { id: 'c', nome: 'Japão', data_inicio: '2027-04-01', data_fim: '2027-04-10' }, // futura
  { id: 'd', nome: 'Sem data', data_inicio: null, data_fim: null },
]
const D = (viagem_id, nome, codigo, latitude, longitude, ordem) => ({ viagem_id, nome, codigo, latitude, longitude, ordem })
const destinos = [
  D('a', 'São Paulo', 'BR', -23.55, -46.63, 0),
  D('a', 'Nice', 'FR', 43.7, 7.26, 1),
  D('a', 'Mônaco', 'MC', 43.73, 7.42, 2),
  D('b', 'Lisboa', 'PT', 38.72, -9.14, 0),
  D('b', 'Nice', 'FR', 43.7, 7.26, 1),
  D('c', 'Tóquio', 'JP', 35.68, 139.69, 0),
]

test('102: só viagens que já começaram; casa não conta; cidade repetida conta uma vez', () => {
  const e = estatisticasDoViajante(viagens, destinos, '2026-10-30')
  assert.equal(e.viagens, 2)
  assert.deepEqual(e.paises, ['FR', 'MC', 'PT'])
  assert.equal(e.cidades, 3)
  assert.equal(e.dias, 4 + 3) // Riviera inteira + Portugal até hoje
  assert.deepEqual(e.pontos.map((p) => p.nome).sort(), ['Lisboa', 'Mônaco', 'Nice'])
  // km: SP→Nice (~9.400) + Nice→Mônaco (~13) + Lisboa→Nice (~1.330)
  assert.ok(e.km > 10600 && e.km < 10900, `km = ${e.km}`)
})

test('102: sem viagem feita, tudo zero', () => {
  const e = estatisticasDoViajante(viagens, destinos, '2020-01-01')
  assert.deepEqual([e.viagens, e.paises.length, e.cidades, e.dias, e.km], [0, 0, 0, 0, 0])
})
