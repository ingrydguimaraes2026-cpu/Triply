// Testes da montagem da agenda do dia (spec 029). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { diasDoPeriodo, destinoDoDia, montarAgendaDoDia, horaNoFuso } = await import(
  new URL('../../../packages/core/src/agenda.ts', import.meta.url)
)

const destinos = [
  { id: 'nice', nome: 'Nice', chegada: '2026-11-18', saida: '2026-11-20' },
  { id: 'roma', nome: 'Roma', chegada: '2026-11-20', saida: '2026-11-23' },
]

// Horário "local" montado no fuso do aparelho, pra o teste valer em qualquer fuso
const local = (dia, hora) => new Date(`${dia}T${hora}:00`).toISOString()

const evento = (extra) => ({
  id: 'e1',
  viagem_id: 'v',
  dia: '2026-11-20',
  hora: null,
  titulo: 'Jantar',
  local: null,
  observacao: null,
  criado_por: 'u',
  criado_em: '2026-10-29T00:00:00Z',
  ...extra,
})

test('dias do período: do início ao fim, inclusive; sem fim é um dia só', () => {
  assert.deepEqual(diasDoPeriodo('2026-11-18', '2026-11-20'), ['2026-11-18', '2026-11-19', '2026-11-20'])
  assert.deepEqual(diasDoPeriodo('2026-11-18', null), ['2026-11-18'])
  assert.deepEqual(diasDoPeriodo(null, null), [])
  // Atravessa o fim do mês
  assert.deepEqual(diasDoPeriodo('2026-11-30', '2026-12-01'), ['2026-11-30', '2026-12-01'])
})

test('destino do dia: no dia de troca vale o novo destino', () => {
  assert.equal(destinoDoDia('2026-11-19', destinos)?.nome, 'Nice')
  assert.equal(destinoDoDia('2026-11-20', destinos)?.nome, 'Roma')
  assert.equal(destinoDoDia('2026-12-01', destinos), undefined)
})

test('agenda do dia: saída, depois por hora, eventos sem hora e chegada no fim', () => {
  const trajetos = [
    { id: 't1', origem_id: 'nice', destino_id: 'roma', meio: 'trem', partida: local('2026-11-20', '09:15'), chegada: local('2026-11-20', '15:40'), observacao: null },
    { id: 't2', origem_id: 'nice', destino_id: 'roma', meio: 'trem', partida: local('2026-11-21', '09:15'), chegada: null, observacao: null },
  ]
  const eventos = [
    evento({ id: 'jantar', titulo: 'Jantar', hora: '20:00:00', local: 'Trastevere' }),
    evento({ id: 'cafe', titulo: 'Café', hora: '07:30:00' }),
    evento({ id: 'livre', titulo: 'Comprar chip' }),
    evento({ id: 'outro-dia', titulo: 'Coliseu', dia: '2026-11-21', hora: '10:00:00' }),
  ]
  const itens = montarAgendaDoDia('2026-11-20', { destinos, trajetos, eventos })
  assert.deepEqual(
    itens.map((i) => i.titulo),
    ['Saída de Nice', 'Café', 'Nice → Roma', 'Jantar', 'Comprar chip', 'Chegada em Roma'],
  )
  const trem = itens.find((i) => i.tipo === 'trajeto')
  assert.equal(trem.hora, '09:15')
  assert.equal(trem.detalhe, 'chega 15:40')
  assert.equal(itens.find((i) => i.titulo === 'Jantar').detalhe, 'Trastevere')
  assert.equal(itens.find((i) => i.titulo === 'Jantar').hora, '20:00')
})

test('agenda do dia: dia sem nada fica vazio', () => {
  assert.deepEqual(montarAgendaDoDia('2026-11-22', { destinos, trajetos: [], eventos: [] }), [])
})

test('hora no fuso: HH:MM com zero à esquerda', () => {
  assert.equal(horaNoFuso(local('2026-11-20', '07:05')), '07:05')
})
