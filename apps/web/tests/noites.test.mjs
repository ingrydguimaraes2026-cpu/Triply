// Testes da hospedagem por noite (spec 123). Rodar: node --test apps/web/tests/noites.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { noitesDaViagem, fatosDaOpcao, minutosAPe, textoDasNoites } = await import(new URL('../../../packages/core/src/noites.ts', import.meta.url))

const local = (dia, hora) => new Date(`${dia}T${hora}:00`).toISOString()
const destino = (id, nome, chegada, saida) => ({ id, nome, pais: 'Itália', chegada, saida })
const opcao = (id, destinoId, extra = {}) => ({
  id, destinoId, nome: id, link: null, precoTotal: 20000, moeda: 'EUR', checkin: null, checkout: null, observacao: null,
  escolhida: false, criadoPor: 'u1', votos: [], ...extra,
})
const trajeto = (id, de, para, dia, sai, chegaDia, chega, extra = {}) => ({
  id, origem_id: null, destino_id: null, meio: 'onibus', observacao: null, de_texto: de, para_texto: para,
  partida: local(dia, sai), chegada: local(chegaDia, chega), ...extra,
})

const destinos = [
  destino('nice', 'Nice', '2027-06-04', '2027-06-07'),
  destino('monaco', 'Mônaco', '2027-06-05', '2027-06-05'),
  destino('tirano', 'Tirano', '2027-06-07', '2027-06-09'),
  destino('veneza', 'Veneza', '2027-06-09', '2027-06-10'),
]

test('agrupa por cidade, bate-e-volta vira passagem e conta as noites', () => {
  const opcoes = [
    opcao('apê', 'nice', { escolhida: true, reserva: 'paga', precoTotal: 54000 }),
    opcao('hotel', 'tirano', { escolhida: true, precoTotal: 24800 }),
    opcao('studio', 'veneza'),
  ]
  const r = noitesDaViagem(destinos, opcoes, [], 4)
  assert.deepEqual(r.cidades.map((c) => [c.destino.nome, c.estado, c.noites]), [
    ['Nice', 'reservada', 3], ['Tirano', 'escolhida', 2], ['Veneza', 'comparando', 1],
  ])
  assert.deepEqual(r.passagens.map((p) => [p.destino.nome, p.dormemEm]), [['Mônaco', 'Nice']])
  assert.equal(r.reservadas, 3)
  assert.equal(r.praReservar, 2)
  assert.equal(r.semCama, 1)
  assert.equal(r.total.EUR, 78800)
  assert.equal(r.porPessoa.EUR, 19700)
  assert.equal(r.pago.EUR, 54000)
  assert.equal(textoDasNoites(r.cidades[0]), '3 noites · sex 4 a dom 6')
})

test('chegada de madrugada contra o check-in, e a distância a pé da estação', () => {
  const trajetos = [trajeto('t1', 'Como', 'Veneza', '2027-06-09', '22:20', '2027-06-10', '01:10', { estacao_chegada: 'Santa Lucia', para_lat: 45.4413, para_lon: 12.3208 })]
  const r = noitesDaViagem(destinos, [], trajetos, 4)
  const veneza = r.cidades.find((c) => c.destino.id === 'veneza')
  assert.equal(veneza.chegada.hora, '01:10')
  assert.equal(veneza.chegada.diaSeguinte, true)
  assert.equal(veneza.chegada.lugar, 'Santa Lucia')

  const perto = fatosDaOpcao(opcao('a', 'veneza', { horaCheckinLimite: '02:00', lat: 45.4441, lon: 12.3226 }), veneza, 4)
  assert.equal(perto.checkin.nivel, 'ok')
  assert.ok(perto.minutos >= 3 && perto.minutos <= 7, `minutos: ${perto.minutos}`)
  assert.equal(perto.porPessoa, 5000)

  const fecha = fatosDaOpcao(opcao('b', 'veneza', { horaCheckinLimite: '00:00' }), veneza, 4)
  assert.equal(fecha.checkin.nivel, 'ruim')
  assert.equal(fecha.minutos, null)

  const self = fatosDaOpcao(opcao('c', 'veneza', { selfCheckin: true }), veneza, 4)
  assert.equal(self.checkin.nivel, 'ok')
})

test('minutos a pé: 1 km em linha reta dá uns 16 min', () => {
  const m = minutosAPe({ lat: 45.0, lon: 12.0 }, { lat: 45.009, lon: 12.0 })
  assert.ok(m >= 15 && m <= 17, `minutos: ${m}`)
})

test('malas no dia do check-out quando o próximo trecho é tarde', () => {
  const trajetos = [
    trajeto('t1', 'Tirano', 'Como', '2027-06-09', '06:10', '2027-06-09', '09:30'),
    trajeto('t2', 'Como', 'Veneza', '2027-06-09', '22:20', '2027-06-10', '01:10'),
  ]
  const r = noitesDaViagem(destinos, [], trajetos, 4)
  const tirano = r.cidades.find((c) => c.destino.id === 'tirano')
  assert.deepEqual(tirano.malas, { ate: '22:20', lugar: 'Como' })
})
