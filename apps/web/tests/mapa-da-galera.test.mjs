// Testes do mapa da galera (spec 118b). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { mapaDaGalera } = await import(new URL('../../../packages/core/src/mapa-da-galera.ts', import.meta.url))

const FLORIPA = { latitude: -27.5954, longitude: -48.548 }
const GAROPABA = { latitude: -28.0275, longitude: -48.6192 }
const LISBOA = { latitude: 38.7223, longitude: -9.1393 }
const VIAGENS = [
  { id: 'v1', data_inicio: '2026-12-28', data_fim: '2027-01-05' }, // 9 dias
  { id: 'v2', data_inicio: '2026-06-01', data_fim: '2026-06-03' }, // 3 dias
  { id: 'v3', data_inicio: '2026-09-01', data_fim: '2026-09-02' }, // sem carimbo
]
const CARIMBOS = [
  { viagem_id: 'v1', nome: 'Florianópolis', ...FLORIPA, data: '2026-12-28', liberado_por: 'ana' },
  { viagem_id: 'v1', nome: 'Garopaba', ...GAROPABA, data: '2027-01-02', liberado_por: 'eu' },
  { viagem_id: 'v2', nome: 'Lisboa', ...LISBOA, data: '2026-06-01', liberado_por: 'ana' },
  { viagem_id: 'v2', nome: 'Florianopolis', ...FLORIPA, data: '2026-06-03', liberado_por: 'beto' },
]

test('todos: um ponto por lugar (mesmo nome sem acento conta 1), viagens e dias só das carimbadas', () => {
  const m = mapaDaGalera(CARIMBOS, VIAGENS, 'eu', 'todos', '2026-11-08')
  assert.equal(m.pontos.length, 3)
  assert.equal(m.lugares, 3)
  assert.equal(m.viagens, 2)
  assert.equal(m.diasJuntos, 12)
})

test('km: de carimbo em carimbo dentro de cada viagem', () => {
  const m = mapaDaGalera(CARIMBOS, VIAGENS, 'eu', 'todos', '2026-11-08')
  // Floripa→Garopaba (~48) + Lisboa→Floripa (~8.300)
  assert.ok(m.km > 8000 && m.km < 8600, `deu ${m.km}`)
})

test('meus: só o que eu carimbei', () => {
  const m = mapaDaGalera(CARIMBOS, VIAGENS, 'eu', 'meus', '2026-11-08')
  assert.deepEqual(m.pontos.map((p) => p.nome), ['Garopaba'])
  assert.equal(m.viagens, 1)
  assert.equal(m.km, 0)
})

test('pódio: quem carimbou mais no ano, até 3, sem quem tem zero', () => {
  const m = mapaDaGalera(CARIMBOS, VIAGENS, 'eu', 'meus', '2026-11-08')
  assert.deepEqual(m.podio, [
    { pessoaId: 'ana', carimbos: 2 },
    { pessoaId: 'beto', carimbos: 1 },
  ])
  assert.deepEqual(mapaDaGalera(CARIMBOS, VIAGENS, 'eu', 'todos', '2027-03-01').podio, [{ pessoaId: 'eu', carimbos: 1 }])
})

test('sem carimbo: tudo zerado', () => {
  const m = mapaDaGalera([], VIAGENS, 'eu', 'todos', '2026-11-08')
  assert.deepEqual([m.pontos.length, m.lugares, m.viagens, m.diasJuntos, m.km, m.podio.length], [0, 0, 0, 0, 0, 0])
})
