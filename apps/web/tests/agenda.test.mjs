// Testes da montagem da agenda do dia (spec 029). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { diasDoPeriodo, destinoDoDia, montarAgendaDoDia, horaNoFuso, opcoesNoDia, resumoDoDia, duracaoCurta } = await import(
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
  assert.equal(trem.detalhe, 'Trem · 6h25 · chega 15:40')
  assert.equal(itens.find((i) => i.titulo === 'Jantar').detalhe, 'Trastevere')
  assert.equal(itens.find((i) => i.titulo === 'Jantar').hora, '20:00')
})

test('agenda do dia: dia sem nada fica vazio', () => {
  assert.deepEqual(montarAgendaDoDia('2026-11-22', { destinos, trajetos: [], eventos: [] }), [])
})

test('hora no fuso: HH:MM com zero à esquerda', () => {
  assert.equal(horaNoFuso(local('2026-11-20', '07:05')), '07:05')
})

test('088: roteiro pra imprimir pula os dias vazios e diz onde o comboio está', async () => {
  const { roteiroDiaADia } = await import(new URL('../../../packages/core/src/agenda.ts', import.meta.url))
  const destinos = [
    { id: 'n', nome: 'Nice', chegada: '2026-11-20', saida: '2026-11-22' },
    { id: 'm', nome: 'Mônaco', chegada: '2026-11-22', saida: '2026-11-23' },
  ]
  const eventos = [{ id: 'e', dia: '2026-11-21', hora: '20:00:00', titulo: 'Jantar', local: null, observacao: null }]
  const dias = roteiroDiaADia('2026-11-20', '2026-11-23', { destinos, trajetos: [], eventos })
  assert.deepEqual(dias.map((d) => d.dia), ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'])
  assert.equal(dias[1].onde.nome, 'Nice')
  assert.equal(dias[1].itens[0].titulo, 'Jantar')
  assert.equal(dias[2].onde.nome, 'Mônaco')
  assert.deepEqual(roteiroDiaADia('2026-11-24', '2026-11-25', { destinos, trajetos: [], eventos }), [])
})

// ---------- Spec 122a: deslocamentos no dia ----------
test('122a: deslocamento de qualquer lugar pra qualquer lugar usa o texto livre', () => {
  const trajetos = [
    { id: 'b', origem_id: null, destino_id: null, de_texto: 'Varenna', para_texto: 'Bellagio', meio: 'barco', partida: local('2026-11-19', '17:55'), chegada: local('2026-11-19', '18:10'), observacao: null, situacao: 'decidido', preco: 5, moeda: 'EUR' },
  ]
  const [item] = montarAgendaDoDia('2026-11-19', { destinos, trajetos, eventos: [] })
  assert.equal(item.titulo, 'Varenna → Bellagio')
  assert.equal(item.detalhe, 'Barco · 15 min · chega 18:10 · €5')
  assert.equal(item.situacao, 'decidido')
})

test('122a: chegada no dia seguinte, trocas e último do dia aparecem no detalhe', () => {
  const trajetos = [
    { id: 'v', origem_id: null, destino_id: null, de_texto: 'Como', para_texto: 'Veneza', meio: 'onibus', partida: local('2026-11-19', '22:20'), chegada: local('2026-11-20', '03:10'), observacao: null, trocas: 1, ultimo_do_dia: true },
  ]
  const [item] = montarAgendaDoDia('2026-11-19', { destinos, trajetos, eventos: [] })
  assert.equal(item.detalhe, 'Ônibus · 4h50 · chega 03:10 do dia seguinte · 1 troca · último do dia')
  assert.equal(item.situacao, 'sugestao')
})

test('122a: opções do mesmo deslocamento viram um passo só', () => {
  const base = { origem_id: null, destino_id: null, de_texto: 'Como', para_texto: 'Veneza', chegada: null, observacao: null, grupo_opcoes: 'g1' }
  const semEscolha = [
    { ...base, id: 'trem', meio: 'trem', partida: local('2026-11-19', '21:36'), escolhida: false },
    { ...base, id: 'bus', meio: 'onibus', partida: local('2026-11-19', '22:20'), escolhida: false },
  ]
  const [comparando] = montarAgendaDoDia('2026-11-19', { destinos, trajetos: semEscolha, eventos: [] })
  assert.equal(comparando.situacao, 'comparando')
  assert.equal(comparando.opcoes, 2)
  assert.equal(comparando.trajetoId, 'trem')

  const comEscolha = [{ ...semEscolha[0] }, { ...semEscolha[1], escolhida: true, situacao: 'comprado' }]
  const itens = montarAgendaDoDia('2026-11-19', { destinos, trajetos: comEscolha, eventos: [] })
  assert.equal(itens.length, 1)
  assert.equal(itens[0].trajetoId, 'bus')
  assert.equal(itens[0].situacao, 'comprado')
  assert.equal(opcoesNoDia(comEscolha).length, 1)
})

test('122a: resumo do dia e duração curta', () => {
  const t = (id, situacao) => ({ id, origem_id: null, destino_id: null, de_texto: 'A', para_texto: 'B', meio: 'trem', partida: local('2026-11-19', '10:00'), chegada: null, observacao: null, situacao })
  const itens = montarAgendaDoDia('2026-11-19', { destinos, trajetos: [t('1', 'comprado'), t('2', 'comprado'), t('3', 'decidido'), t('4', 'sugestao')], eventos: [] })
  assert.deepEqual(resumoDoDia(itens), { comprados: 2, prontos: 1, pendentes: 1 })
  assert.equal(duracaoCurta(45), '45 min')
  assert.equal(duracaoCurta(120), '2h')
  assert.equal(duracaoCurta(200), '3h20')
})
