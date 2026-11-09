// Testes dos avisos do dia (spec 122b). Rodar: node --test apps/web/tests/avisos-do-dia.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { montarAgendaDoDia } = await import(new URL('../../../packages/core/src/agenda.ts', import.meta.url))
const { avisosDoDia, linkDoGuardaVolumes } = await import(new URL('../../../packages/core/src/avisos-do-dia.ts', import.meta.url))

const local = (dia, hora) => new Date(`${dia}T${hora}:00`).toISOString()
const DIA = '2027-06-09'
let n = 0
const desl = (de, para, sai, chega, extra = {}) => ({
  id: `t${++n}`, origem_id: null, destino_id: null, de_texto: de, para_texto: para, meio: 'trem', observacao: null,
  partida: local(DIA, sai), chegada: chega ? (chega.includes('T') ? chega : local(DIA, chega)) : null, ...extra,
})
const montar = (trajetos, eventos = []) => montarAgendaDoDia(DIA, { destinos: [], trajetos, eventos })

test('folga curta entre dois deslocamentos (com malas, 45 min)', () => {
  const itens = montar([desl('Bellagio', 'Como', '20:00', '21:00'), desl('Como', 'Veneza', '21:36', null, { ultimo_do_dia: true })])
  const casas = [{ nome: 'Casa em Tirano', checkin: '2027-06-07', checkout: DIA }]
  const [a] = avisosDoDia(DIA, itens, casas)
  assert.equal(a.nivel, 'ruim')
  assert.equal(a.titulo, 'Folga curta: 36 min')
  assert.match(a.texto, /com as malas/)
  assert.match(a.texto, /último do dia/)
  assert.equal(a.depoisDe, itens[0].chave)
})

test('folga boa aparece discreta; folga longa não aparece', () => {
  const boa = avisosDoDia(DIA, montar([desl('A', 'B', '20:00', '21:00'), desl('B', 'C', '22:20', null)]), [])
  assert.equal(boa[0].nivel, 'folga')
  assert.equal(boa[0].titulo, '1h20 de folga até o próximo')
  const longa = avisosDoDia(DIA, montar([desl('A', 'B', '06:10', '09:30'), desl('B', 'C', '17:55', null)]), [])
  assert.equal(longa.length, 0)
})

test('horários que se cruzam', () => {
  const [a] = avisosDoDia(DIA, montar([desl('A', 'B', '10:00', '11:00'), desl('B', 'C', '10:45', null)]), [])
  assert.equal(a.titulo, 'Os horários se cruzam')
})

test('com um evento no meio, não calcula folga entre os deslocamentos', () => {
  const evento = { id: 'e', viagem_id: 'v', dia: DIA, hora: '10:30:00', titulo: 'Café', local: null, observacao: null, criado_por: 'x', criado_em: '' }
  const avisos = avisosDoDia(DIA, montar([desl('A', 'B', '10:00', '10:20'), desl('B', 'C', '10:40', null)], [evento]), [])
  assert.equal(avisos.length, 0)
})

test('chega depois do limite do check-in (madrugada do dia seguinte)', () => {
  const itens = montar([desl('Como', 'Veneza', '22:20', local('2027-06-10', '03:10'))])
  const casas = [{ nome: 'Airbnb em Veneza', checkin: DIA, checkout: '2027-06-10', horaCheckin: '15:00', horaCheckinLimite: '00:00', contatoAnfitriao: '+39 123' }]
  const [a] = avisosDoDia(DIA, itens, casas)
  assert.equal(a.chave, 'checkin')
  assert.equal(a.nivel, 'ruim')
  assert.match(a.titulo, /Chegam às 03:10, check-in até 00:00/)
  assert.equal(a.acao.tipo, 'anfitriao')
  assert.equal(a.acao.contato, '+39 123')
  assert.match(a.acao.texto, /chega às 03:10/)
})

test('chega antes do limite: sem aviso; chega antes do check-in abrir: dica', () => {
  const casa = { nome: 'Hotel', checkin: DIA, checkout: '2027-06-11', horaCheckin: '15:00', horaCheckinLimite: '23:00' }
  assert.equal(avisosDoDia(DIA, montar([desl('A', 'B', '18:00', '20:00')]), [casa]).length, 0)
  const [d] = avisosDoDia(DIA, montar([desl('A', 'B', '06:00', '09:30')]), [casa])
  assert.equal(d.nivel, 'dica')
  assert.equal(d.titulo, 'Chegam às 09:30, check-in só às 15:00')
})

test('malas no dia: check-out de manhã, passeio e trem à noite', () => {
  const itens = montar([desl('Tirano', 'Como', '06:10', '09:30'), desl('Varenna', 'Bellagio', '17:55', '18:10', { meio: 'barco' }), desl('Como', 'Veneza', '22:20', null)])
  const casas = [{ nome: 'Casa em Tirano', checkin: '2027-06-07', checkout: DIA }]
  const malas = avisosDoDia(DIA, itens, casas).find((a) => a.chave === 'malas')
  assert.equal(malas.titulo, 'Malas até as 22:20')
  assert.equal(malas.depoisDe, itens[0].chave)
  assert.deepEqual(malas.acao, { tipo: 'guarda-volumes', lugar: 'Como' })
  assert.match(linkDoGuardaVolumes('Como'), /luggage%20storage%20Como/)
})

test('sem check-out no dia, sem aviso de malas', () => {
  const itens = montar([desl('A', 'B', '06:10', '09:30'), desl('B', 'C', '22:20', null)])
  assert.equal(avisosDoDia(DIA, itens, []).find((a) => a.chave === 'malas'), undefined)
})
