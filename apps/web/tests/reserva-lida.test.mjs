// Testes da reserva que entra sem digitar (spec 120b). Rodar: node --test apps/web/tests/reserva-lida.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const R = await import(new URL('../../../packages/core/src/reserva-lida.ts', import.meta.url))
const HOJE = '2026-11-08'

const AIRBNB = `Sua reserva está confirmada!
Sua estadia em Casa da Lagoa com vista
Check-in: sáb., 28 de dez. de 2026 a partir de 15:00
Checkout: qui., 2 de jan. de 2027 até 11:00
Endereço: Servidão dos Pescadores, 120 - Lagoa da Conceição, Florianópolis, SC
Código de confirmação: HMXY4K2Q9A
Hóspede: Paulo Souza`

const VOO = `LATAM - Cartão de embarque
Voo LA 3456
De São Paulo (GRU) para Florianópolis (FLN)
28/12/2026 partida 09:10 chegada 10:25
Localizador: XKJ7PL
Passageiro: ANA CLARA LIMA`

const INGRESSO = `Sympla - Seu ingresso chegou
Evento: Réveillon na Praia Mole
31 dez 2026, 21h
Local: Praia Mole, Florianópolis
Pedido nº 88231190`

test('Airbnb colado: casa, check-in e check-out com hora, endereço, código e hóspede', () => {
  const r = R.lerTextoDaReserva(AIRBNB, HOJE)
  assert.equal(r.tipo, 'casa')
  assert.equal(r.titulo, 'Casa da Lagoa com vista')
  assert.equal(r.data, '2026-12-28')
  assert.equal(r.dataFim, '2027-01-02')
  assert.equal(r.hora, '15:00')
  assert.equal(r.horaFim, '11:00')
  assert.match(r.endereco, /^Servidão dos Pescadores, 120/)
  assert.equal(r.codigo, 'HMXY4K2Q9A')
  assert.equal(r.pessoa, 'Paulo Souza')
  assert.deepEqual(R.oQueFalta(r), [])
})

test('voo colado: número do voo, trecho, data, horários, localizador e passageiro', () => {
  const r = R.lerTextoDaReserva(VOO, HOJE)
  assert.equal(r.tipo, 'voo')
  assert.equal(r.titulo, 'LA 3456')
  assert.equal(r.origem, 'São Paulo')
  assert.equal(r.destino, 'Florianópolis')
  assert.equal(r.data, '2026-12-28')
  assert.equal(r.hora, '09:10')
  assert.equal(r.horaFim, '10:25')
  assert.equal(r.codigo, 'XKJ7PL')
  assert.equal(r.endereco, null)
  assert.equal(R.ondeVaiAReserva(r.tipo), 'trajeto')
})

test('ingresso colado: vira item da agenda com dia, hora "21h" e local', () => {
  const r = R.lerTextoDaReserva(INGRESSO, HOJE)
  assert.equal(r.tipo, 'ingresso')
  assert.equal(r.titulo, 'Réveillon na Praia Mole')
  assert.equal(r.data, '2026-12-31')
  assert.equal(r.hora, '21:00')
  assert.equal(r.endereco, 'Praia Mole, Florianópolis')
  assert.equal(R.ondeVaiAReserva(r.tipo), 'agenda')
  assert.deepEqual(R.eventoDaReserva(r), { dia: '2026-12-31', hora: '21:00', titulo: 'Réveillon na Praia Mole', local: 'Praia Mole, Florianópolis', observacao: null })
})

test('datas sem ano: a próxima vez que o dia acontece', () => {
  assert.deepEqual(R.datasDoTexto('ida 15/01 volta 20/01', HOJE), ['2027-01-15', '2027-01-20'])
  assert.deepEqual(R.datasDoTexto('dia 20/11', HOJE), ['2026-11-20'])
  assert.deepEqual(R.datasDoTexto('Dec 28, 2026 and 2027-01-02', HOJE), ['2026-12-28', '2027-01-02'])
  assert.deepEqual(R.datasDoTexto('31/02/2027', HOJE), [])
})

test('texto sem nada de reserva: rascunho vazio pede o tipo', () => {
  const r = R.lerTextoDaReserva('oi gente, bora?', HOJE)
  assert.equal(r.tipo, null)
  assert.deepEqual(R.oQueFalta(r), ['o tipo da reserva'])
})

test('normalizar a resposta da IA: só passa o que tem formato certo', () => {
  const r = R.normalizarRascunho({ tipo: 'nave', data: '2026-13-01', hora: '9:05', dataFim: '2026-12-01', titulo: '  Pousada   Sol ', codigo: 42 })
  assert.equal(r.tipo, null)
  assert.equal(r.data, null)
  assert.equal(r.hora, '09:05')
  assert.equal(r.dataFim, '2026-12-01')
  assert.equal(r.titulo, 'Pousada Sol')
  assert.equal(r.codigo, null)
  const volta = R.normalizarRascunho({ data: '2026-12-10', dataFim: '2026-12-01' })
  assert.equal(volta.dataFim, null) // check-out antes do check-in não vale
})

test('juntar: a IA manda, as regras completam os buracos', () => {
  const ia = { ...R.rascunhoVazio(), tipo: 'casa', titulo: 'Casa da Lagoa' }
  const regras = { ...R.rascunhoVazio(), tipo: 'voo', titulo: 'X', codigo: 'ABC123' }
  const j = R.juntarRascunhos(ia, regras)
  assert.equal(j.tipo, 'casa')
  assert.equal(j.titulo, 'Casa da Lagoa')
  assert.equal(j.codigo, 'ABC123')
})

const DESTINOS = [
  { id: 'floripa', nome: 'Florianópolis', chegada: '2026-12-28', saida: '2027-01-01' },
  { id: 'garopaba', nome: 'Garopaba', chegada: '2027-01-01', saida: '2027-01-05' },
]

test('pra onde vai: voo pelo nome da cidade, casa pelo endereço ou pela data', () => {
  const voo = R.lerTextoDaReserva(VOO, HOJE)
  assert.deepEqual(R.destinosDaReserva(voo, DESTINOS), { origemId: null, destinoId: 'floripa' })
  const casa = R.lerTextoDaReserva(AIRBNB, HOJE)
  assert.deepEqual(R.destinosDaReserva(casa, DESTINOS), { origemId: null, destinoId: 'floripa' })
  const semCidade = { ...R.rascunhoVazio(), tipo: 'casa', data: '2027-01-03' }
  assert.equal(R.destinosDaReserva(semCidade, DESTINOS).destinoId, 'garopaba')
})

test('de quem é: o primeiro nome que bate com uma pessoa só do comboio', () => {
  const membros = [
    { id: 'a', nome: 'Ana Clara' },
    { id: 'p', nome: 'Paulo Souza' },
    { id: 'p2', nome: 'Pedro' },
  ]
  assert.equal(R.pessoaDaReserva('ANA CLARA LIMA', membros), 'a')
  assert.equal(R.pessoaDaReserva('Paulo Souza', membros), 'p')
  assert.equal(R.pessoaDaReserva('Maria', membros), null)
  assert.equal(R.pessoaDaReserva(null, membros), null)
})

test('casa vira hospedagem com check-in, check-out e o código na observação', () => {
  const casa = R.lerTextoDaReserva(AIRBNB, HOJE)
  const h = R.hospedagemDaReserva(casa, 'floripa')
  assert.equal(h.nome, 'Casa da Lagoa com vista')
  assert.equal(h.checkin, '2026-12-28')
  assert.equal(h.checkout, '2027-01-02')
  assert.equal(h.hora_checkin, '15:00')
  assert.equal(h.observacao, 'Código da reserva: HMXY4K2Q9A')
})

test('voo vira trajeto de avião, comprado, com o número e o código', () => {
  const voo = R.lerTextoDaReserva(VOO, HOJE)
  const t = R.trajetoDaReserva(voo, { origemId: null, destinoId: 'floripa' })
  assert.equal(t.meio, 'aviao')
  assert.equal(t.situacao, 'comprado')
  assert.equal(t.observacao, 'LA 3456 · Código da reserva: XKJ7PL')
  assert.ok(t.partida && t.chegada && t.partida < t.chegada)
})

test('base64 igual ao do Node', () => {
  for (const s of ['', 'a', 'ab', 'abc', 'Norti reserva!']) {
    assert.equal(R.paraBase64(new TextEncoder().encode(s)), Buffer.from(s).toString('base64'))
  }
})

test('campo de data do formulário: vai e volta', () => {
  assert.equal(R.dataParaCampo('2026-12-28'), '28/12/2026')
  assert.equal(R.dataParaCampo(null), '')
  assert.equal(R.dataDoCampo('28/12/2026'), '2026-12-28')
  assert.equal(R.dataDoCampo(' 2/1/2027 '), '2027-01-02')
  assert.equal(R.dataDoCampo('31/02/2027'), null)
  assert.equal(R.dataDoCampo('amanhã'), null)
})
