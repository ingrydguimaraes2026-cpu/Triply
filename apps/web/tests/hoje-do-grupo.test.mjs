// Testes do "Hoje" com as reservas do grupo (spec 120a). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { quemChegaESaiHoje, planoDoDia, indiceDoDia, arquivoDeCada, viagemAcontecendo } = await import(
  new URL('../../../packages/core/src/hoje-do-grupo.ts', import.meta.url)
)

const dia = (s) => s.slice(0, 10)
const hora = (s) => s.slice(11, 16)
const LISBOA = { id: 'l', nome: 'Lisboa', chegada: '2026-12-01', saida: '2026-12-04' }
const PORTO = { id: 'p', nome: 'Porto', chegada: '2026-12-04', saida: '2026-12-06' }
const SP = { id: 's', nome: 'São Paulo', chegada: null, saida: null }
const MEMBROS = [
  { id: 'a', nome: 'Ana' },
  { id: 'b', nome: 'Bia' },
  { id: 'c', nome: 'Caio' },
]

test('quem chega e quem sai hoje', () => {
  const trajetos = [
    // Ana chega de voo, sai e chega no mesmo dia → "chega", na hora da chegada
    { id: 't1', origem_id: 's', destino_id: 'l', meio: 'aviao', partida: '2026-12-01T01:00', chegada: '2026-12-01T15:30', link_reserva: null, passageiros: ['a'] },
    // Voo noturno: saiu ontem, chega hoje → "chega"
    { id: 't2', origem_id: 's', destino_id: 'l', meio: 'aviao', partida: '2026-11-30T22:00', chegada: '2026-12-01T11:00', link_reserva: 'https://x', passageiros: ['b', 'c'] },
    // Sai hoje e chega amanhã → "sai"
    { id: 't3', origem_id: 'l', destino_id: 's', meio: 'aviao', partida: '2026-12-01T23:50', chegada: '2026-12-02T08:00', link_reserva: null, passageiros: [] },
    // Outro dia: fora
    { id: 't4', origem_id: 'l', destino_id: 'p', meio: 'trem', partida: '2026-12-04T10:00', chegada: '2026-12-04T13:00', link_reserva: null },
  ]
  const m = quemChegaESaiHoje('2026-12-01', trajetos, [LISBOA, PORTO, SP], MEMBROS, dia, hora)
  assert.deepEqual(
    m.map((x) => [x.trajetoId, x.tipo, x.hora, x.pessoas]),
    [
      ['t2', 'chega', '11:00', ['Bia', 'Caio']],
      ['t1', 'chega', '15:30', ['Ana']],
      ['t3', 'sai', '23:50', []],
    ],
  )
  assert.equal(m[0].de, 'São Paulo')
  assert.equal(m[0].para, 'Lisboa')
  assert.equal(m[0].linkReserva, 'https://x')
  assert.equal(m[0].saiAs, '22:00')
})

test('todo mundo marcado = o comboio inteiro', () => {
  const t = [{ id: 't', origem_id: 'l', destino_id: 'p', meio: 'trem', partida: '2026-12-04T10:00', chegada: null, link_reserva: null, passageiros: ['a', 'b', 'c'] }]
  const [m] = quemChegaESaiHoje('2026-12-04', t, [LISBOA, PORTO], MEMBROS, dia, hora)
  assert.equal(m.tipo, 'sai')
  assert.deepEqual(m.pessoas, [])
  assert.equal(m.chegaAs, null)
})

test('índice do dia no roteiro', () => {
  assert.equal(indiceDoDia('2026-12-01', '2026-12-01'), 0)
  assert.equal(indiceDoDia('2026-12-01', '2026-12-03'), 2)
  // Virada de mês e de horário de verão não atrapalham
  assert.equal(indiceDoDia('2026-10-24', '2026-11-02'), 9)
})

test('plano do dia junta roteiro e agenda', () => {
  const lugares = [
    { id: 'x', nome: 'Torre de Belém', endereco: 'Belém', latitude: 1, longitude: 2, visitado_em: null },
    { id: 'y', nome: 'Alfama', endereco: null, latitude: null, longitude: null, visitado_em: '2026-12-02T10:00:00Z' },
    { id: 'z', nome: 'LX Factory', endereco: null, latitude: null, longitude: null, visitado_em: null },
  ]
  const roteiros = [{ destino_id: 'l', dias: [['z'], ['x', 'y']] }]
  const eventos = [
    { id: 'e1', dia: '2026-12-02', hora: '20:00:00', titulo: 'Jantar', local: 'Tasca', observacao: null },
    // Mesmo nome do lugar do roteiro: vira um item só, com hora
    { id: 'e2', dia: '2026-12-02', hora: '10:00:00', titulo: 'torre de belém', local: null, observacao: null },
    { id: 'e3', dia: '2026-12-02', hora: null, titulo: 'Comprar chip', local: null, observacao: null },
    { id: 'e4', dia: '2026-12-03', hora: '09:00:00', titulo: 'Outro dia', local: null, observacao: null },
  ]
  const p = planoDoDia('2026-12-02', { destinos: [LISBOA, PORTO], eventos, roteiros, lugares })
  assert.deepEqual(
    p.map((i) => [i.chave, i.hora, i.titulo, i.lugarId, i.visitado]),
    [
      ['ee2', '10:00', 'Torre de Belém', 'x', false],
      ['ee1', '20:00', 'Jantar', null, false],
      ['ly', '', 'Alfama', 'y', true],
      ['ee3', '', 'Comprar chip', null, false],
    ],
  )
  assert.equal(p[0].alvo.latitude, 1)
  assert.equal(p[1].alvo.nome, 'Tasca')
  // Dia de troca: vale o roteiro dos dois destinos (último dia de Lisboa e 1º do Porto)
  const troca = planoDoDia('2026-12-04', { destinos: [LISBOA, PORTO], eventos: [], roteiros: [{ destino_id: 'l', dias: [[], [], [], ['z']] }, { destino_id: 'p', dias: [['x']] }], lugares })
  assert.deepEqual(troca.map((i) => i.lugarId), ['z', 'x'])
  // Fora da viagem: vazio
  assert.deepEqual(planoDoDia('2026-12-10', { destinos: [LISBOA], eventos: [], roteiros, lugares }), [])
})

test('arquivo do cofre de cada trajeto, casa e agenda', () => {
  const arquivos = [
    { id: 1, trajeto_id: 't', hospedagem_id: null, criado_em: '2026-11-01' },
    { id: 2, trajeto_id: 't', hospedagem_id: null, criado_em: '2026-11-05' },
    { id: 3, trajeto_id: null, hospedagem_id: 'h', criado_em: '2026-11-09' },
  ]
  const m = arquivoDeCada(arquivos, 'trajeto_id')
  assert.equal(m.get('t').id, 2)
  assert.equal(m.size, 1)
  assert.equal(arquivoDeCada(arquivos, 'hospedagem_id').get('h').id, 3)
  assert.equal(arquivoDeCada(arquivos, 'evento_id').size, 0)
})

test('quem vai buscar só aparece em quem chega', () => {
  const t = [
    { id: 'c', origem_id: 's', destino_id: 'l', meio: 'aviao', partida: null, chegada: '2026-12-01T11:00', link_reserva: null, quem_busca_id: 'a', passageiros: ['b'] },
    { id: 's', origem_id: 'l', destino_id: 's', meio: 'aviao', partida: '2026-12-01T20:00', chegada: null, link_reserva: null, quem_busca_id: 'a' },
  ]
  const [chega, sai] = quemChegaESaiHoje('2026-12-01', t, [LISBOA, SP], MEMBROS, dia, hora)
  assert.equal(chega.quemBusca, 'Ana')
  assert.equal(sai.quemBusca, null)
})

test('viagem acontecendo hoje', () => {
  const v = [
    { id: 'antiga', dataInicio: '2026-01-01', dataFim: '2026-01-10' },
    { id: 'longa', dataInicio: '2026-11-20', dataFim: '2026-12-20' },
    { id: 'rolê', dataInicio: '2026-12-01', dataFim: null },
    { id: 'sem data', dataInicio: null, dataFim: null },
  ]
  assert.equal(viagemAcontecendo(v, '2026-12-01').id, 'rolê')
  assert.equal(viagemAcontecendo(v, '2026-12-02').id, 'longa')
  assert.equal(viagemAcontecendo(v, '2027-01-01'), null)
})
