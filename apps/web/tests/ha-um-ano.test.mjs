// Testes do "há 1 ano" (spec 118d). Rodar: node --test apps/web/tests/ha-um-ano.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const H = await import(new URL('../../../packages/core/src/ha-um-ano.ts', import.meta.url))

const CARIMBOS = [
  { viagem_id: 'v1', nome: 'Florianópolis', data: '2025-11-03' },
  { viagem_id: 'v1', nome: 'Garopaba', data: '2025-11-03' },
  { viagem_id: 'v1', nome: 'Imbituba', data: '2025-11-05' },
  { viagem_id: 'v2', nome: 'Lisboa', data: '2023-11-03' },
  { viagem_id: 'v3', nome: 'Rio', data: '2026-11-03' }, // este ano: não é lembrança
  { viagem_id: 'a1', nome: 'Paris', data: '2019-07-01' }, // viagem antiga (só o mês)
]
const VIAGENS = [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }, { id: 'a1', tipo: 'antiga' }]

test('critério da spec: carimbo de 03/11/2025 lembra em 03/11/2026', () => {
  const ls = H.lembrancasDeHoje(CARIMBOS, VIAGENS, '2026-11-03')
  assert.equal(ls.length, 2)
  assert.deepEqual(ls[0], { viagemId: 'v1', data: '2025-11-03', anos: 1, lugares: ['Florianópolis', 'Garopaba'], soOMes: false })
  assert.equal(ls[1].viagemId, 'v2')
  assert.equal(ls[1].anos, 3)
  assert.equal(H.textoDaLembranca(ls[0]).titulo, 'Há 1 ano vocês estavam em Florianópolis e Garopaba')
  assert.equal(H.textoDaLembranca(ls[0]).detalhe, '3 de novembro de 2025')
  assert.equal(H.textoDaLembranca(ls[1], true).titulo, 'Há 3 anos você estava em Lisboa')
})

test('dia sem aniversário: nada', () => {
  assert.deepEqual(H.lembrancasDeHoje(CARIMBOS, VIAGENS, '2026-11-04'), [])
})

test('viagem antiga lembra no dia 1 do mês e fala só o mês', () => {
  const [l] = H.lembrancasDeHoje(CARIMBOS, VIAGENS, '2026-07-01')
  assert.equal(l.soOMes, true)
  assert.equal(l.anos, 7)
  assert.deepEqual(H.textoDaLembranca(l), { titulo: 'Há 7 anos vocês estavam em Paris', detalhe: 'Em julho de 2019' })
})

test('29 de fevereiro comemora em 28/02 quando o ano não é bissexto', () => {
  assert.equal(H.fazAniversario('2024-02-29', '2025-02-28'), true)
  assert.equal(H.fazAniversario('2024-02-29', '2028-02-28'), false)
  assert.equal(H.fazAniversario('2024-02-29', '2028-02-29'), true)
  assert.equal(H.fazAniversario('2026-11-03', '2026-11-03'), false)
})

test('juntar lugares', () => {
  assert.equal(H.juntarLugares(['A']), 'A')
  assert.equal(H.juntarLugares(['A', 'B']), 'A e B')
  assert.equal(H.juntarLugares(['A', 'B', 'C', 'D']), 'A, B e mais 2')
})

test('fotos da lembrança: as do dia, mais curtidas primeiro; sem fotos do dia, as 3 mais curtidas', () => {
  const dia = (iso) => iso.slice(0, 10)
  const posts = [
    { id: 'p1', criado_em: '2025-11-03T10:00:00Z', curtidas: [1] },
    { id: 'p2', criado_em: '2025-11-03T18:00:00Z', curtidas: [1, 2, 3] },
    { id: 'p3', criado_em: '2025-11-04T10:00:00Z', curtidas: [1, 2, 3, 4] },
    { id: 'p4', criado_em: '2025-11-05T10:00:00Z', curtidas: [] },
  ]
  assert.deepEqual(H.fotosDaLembranca(posts, '2025-11-03', dia).map((p) => p.id), ['p2', 'p1'])
  assert.deepEqual(H.fotosDaLembranca(posts, '2025-11-09', dia).map((p) => p.id), ['p3', 'p2', 'p1'])
})
