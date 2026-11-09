// Testes da web leve do convite (spec 018, FILA 0.8). Rodar: node --test tests/convite-leve.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { caminhoDoConvite, diasDaViagem, rotuloDoDia, cidadesDoDia, vitrineDoPassaporte, hospedagensPraVotar, votosQueFaltam, fraseDosVotos } = await import(
  new URL('../../../packages/core/src/convite-leve.ts', import.meta.url)
)

test('0.8: o link do convite é /v/<código>', () => {
  assert.equal(caminhoDoConvite('abc123'), '/v/abc123')
})

test('0.8: dias da viagem, virando o ano', () => {
  assert.deepEqual(diasDaViagem('2025-12-30', '2026-01-02'), ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'])
  assert.deepEqual(diasDaViagem('2026-03-01', null), ['2026-03-01'])
  assert.deepEqual(diasDaViagem(null, '2026-03-01'), [])
  assert.equal(diasDaViagem('2026-01-01', '2026-12-31').length, 31)
})

test('0.8: rótulo do dia', () => {
  assert.equal(rotuloDoDia('2025-12-28', 0), 'Dia 1 · dom, 28 dez')
  assert.equal(rotuloDoDia('2026-01-02', 5), 'Dia 6 · sex, 2 jan')
})

test('0.8: cidade do dia, com troca de cidade', () => {
  const destinos = [
    { nome: 'Florianópolis', chegada: '2025-12-28', saida: '2025-12-31' },
    { nome: 'Garopaba', chegada: '2025-12-31', saida: '2026-01-02' },
  ]
  assert.equal(cidadesDoDia('2025-12-29', destinos), 'Florianópolis')
  assert.equal(cidadesDoDia('2025-12-31', destinos), 'Florianópolis → Garopaba')
  assert.equal(cidadesDoDia('2026-01-05', destinos), '')
})

test('0.8: vitrine do passaporte, acesos primeiro', () => {
  const v = vitrineDoPassaporte([
    { nome: 'Garopaba', tipo: 'praia', data: null },
    { nome: 'Florianópolis', tipo: 'cidade', data: '2025-12-28' },
    { nome: 'Imbituba', tipo: 'cidade', data: null },
  ])
  assert.deepEqual(v.lugares.map((l) => l.nome), ['Florianópolis', 'Garopaba', 'Imbituba'])
  assert.equal(v.acesos, 1)
  assert.equal(v.frase, '1 de 3 lugares carimbados.')
  assert.equal(vitrineDoPassaporte([]).frase, 'Cada lugar da viagem vira um carimbo no passaporte da galera.')
  assert.equal(vitrineDoPassaporte([{ nome: 'A', tipo: 'cidade', data: null }]).frase, '1 lugar esperando o carimbo da galera.')
  assert.equal(vitrineDoPassaporte([{ nome: 'A', tipo: 'cidade', data: '2026-01-01' }, { nome: 'B', tipo: 'cidade', data: '2026-01-02' }]).frase, 'Os 2 lugares da viagem já estão carimbados.')
})

const destinos = [
  { id: 'd1', nome: 'Florianópolis' },
  { id: 'd2', nome: 'Garopaba' },
  { id: 'd3', nome: 'Imbituba' },
]
const opcoes = [
  { id: 'h1', destinoId: 'd1', nome: 'Casa da Lagoa', escolhida: false, votos: ['ana'] },
  { id: 'h2', destinoId: 'd1', nome: 'Apê Centro', escolhida: false, votos: ['ana', 'bia'] },
  { id: 'h3', destinoId: 'd2', nome: 'Pousada', escolhida: true, votos: [] },
  { id: 'h4', destinoId: null, nome: 'Sem destino', escolhida: false, votos: [] },
]

test('0.8: hospedagens pra votar por destino; escolhida não vota', () => {
  const h = hospedagensPraVotar(opcoes, destinos, 'eu')
  assert.deepEqual(h.map((x) => x.destino), ['Florianópolis', 'Garopaba', 'Outras opções'])
  assert.deepEqual(h[0].opcoes.map((o) => o.id), ['h2', 'h1'])
  assert.equal(h[1].escolhida?.id, 'h3')
  assert.deepEqual(h[1].opcoes, [])
  assert.equal(h[0].meuVoto, false)
  assert.equal(hospedagensPraVotar(opcoes, destinos, 'bia')[0].meuVoto, true)
})

test('0.8: quantos votos faltam e a frase', () => {
  const h = hospedagensPraVotar(opcoes, destinos, 'ana')
  const enquetes = [
    { id: 'e1', fechada: false, opcoes: [{ id: 'o1', votos: [] }, { id: 'o2', votos: ['bia'] }] },
    { id: 'e2', fechada: false, opcoes: [{ id: 'o3', votos: ['ana'] }] },
    { id: 'e3', fechada: true, opcoes: [{ id: 'o4', votos: [] }] },
  ]
  // Florianópolis: ana já votou; Outras opções: falta; e1: falta
  assert.equal(votosQueFaltam(h, enquetes, 'ana'), 2)
  assert.equal(fraseDosVotos(2), 'Falta seu voto em 2 coisas.')
  assert.equal(fraseDosVotos(1), 'Falta seu voto em 1 coisa.')
  assert.equal(fraseDosVotos(0), 'Seus votos estão em dia.')
})
