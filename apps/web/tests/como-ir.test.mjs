// Testes da spec 121 (etapa 1): saia às, dividir o transfer, aeroportos e links. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { acharAeroporto, aeroportoDaCidade } = await import(new URL('../../../packages/core/src/aeroportos.ts', import.meta.url))
const { horaDeSair, chegadasPerto, transferDividido, linksDoTrecho, trechosSemTrajeto, ehInternacional } = await import(
  new URL('../../../packages/core/src/como-ir.ts', import.meta.url)
)

const destinos = [
  { id: 'lis', nome: 'Lisboa', pais: 'Portugal' },
  { id: 'rom', nome: 'Roma', pais: 'Itália' },
  { id: 'flo', nome: 'Florença', pais: 'Italia' },
]
const min = (a, b) => (new Date(a).getTime() - new Date(b).getTime()) / 60000

test('aeroportos: acha por código, nome e cidade, sem confundir', () => {
  assert.equal(acharAeroporto('Aeroporto de Roma (FCO)').codigo, 'FCO')
  assert.equal(acharAeroporto('fiumicino').codigo, 'FCO')
  assert.equal(acharAeroporto('Orly').codigo, 'ORY')
  assert.equal(acharAeroporto('Lisboa'), null) // "LIS" só como palavra inteira
  assert.equal(acharAeroporto('London Gatwick'), null) // cidade não vira aeroporto
  assert.equal(aeroportoDaCidade('Roma').codigo, 'FCO')
  assert.equal(aeroportoDaCidade('São Paulo').codigo, 'GRU')
  assert.equal(aeroportoDaCidade('Paris').codigo, 'CDG') // o principal
  assert.equal(aeroportoDaCidade('Cidade Nenhuma'), null)
})

test('saia às: voo internacional 09:00 de Lisboa → 3 h + 20 min de corrida antes', () => {
  const t = { id: 'a', meio: 'aviao', origem_id: 'lis', destino_id: 'rom', partida: '2027-06-04T09:00:00Z', chegada: null }
  const r = horaDeSair(t, destinos, null)
  assert.equal(r.antecedencia, 180)
  assert.equal(r.ateOEmbarque, 20)
  assert.equal(r.deOndeVeio, 'tabela')
  assert.equal(min(t.partida, r.instante), 200)
})

test('saia às: trem sem tabela pede o tempo; com 30 min escolhidos → 1 h antes', () => {
  const t = { id: 'b', meio: 'trem', origem_id: 'rom', destino_id: 'flo', partida: '2027-06-06T14:10:00Z', chegada: null }
  assert.equal(horaDeSair(t, destinos, null), null)
  const r = horaDeSair(t, destinos, 30)
  assert.equal(min(t.partida, r.instante), 60)
  assert.equal(r.deOndeVeio, 'escolhido')
  assert.equal(ehInternacional(t, destinos), false) // "Itália" e "Italia" são o mesmo país
})

test('saia às: voo à 01:00 vira a noite anterior; carro e sem partida não mostram', () => {
  const t = { id: 'c', meio: 'aviao', origem_id: 'rom', destino_id: 'lis', partida: '2027-06-08T01:00:00Z', chegada: null }
  assert.equal(horaDeSair(t, destinos, null).instante, '2027-06-07T21:20:00.000Z') // 3 h + 40 min de táxi
  assert.equal(horaDeSair({ ...t, meio: 'carro' }, destinos, 30), null)
  assert.equal(horaDeSair({ ...t, partida: null }, destinos, 30), null)
})

test('dividir o transfer: mesma chegada em até 90 min, outras pessoas', () => {
  const ana = { id: 'ana', meio: 'aviao', origem_id: 'lis', destino_id: 'rom', partida: null, chegada: '2027-06-04T10:20:00Z', passageiros: ['u1'] }
  const bia = { id: 'bia', meio: 'aviao', origem_id: null, destino_id: 'rom', partida: null, chegada: '2027-06-04T11:00:00Z', estacao_chegada: 'FCO', passageiros: ['u2'] }
  const longe = { ...bia, id: 'tarde', chegada: '2027-06-04T13:00:00Z', passageiros: ['u3'] }
  const outroAero = { ...bia, id: 'ciampino', estacao_chegada: 'Orly', passageiros: ['u4'] }
  const todos = { ...bia, id: 'todos', passageiros: [] }
  const perto = chegadasPerto(ana, [ana, bia, longe, outroAero, todos], destinos)
  assert.deepEqual(perto, [{ trajetoId: 'bia', pessoas: ['u2'], minutos: 40 }])
  assert.deepEqual(chegadasPerto(todos, [ana, bia], destinos), []) // comboio inteiro já vai junto
  assert.deepEqual(transferDividido(acharAeroporto('FCO'), 2), { preco: 2750, moeda: 'EUR' })
})

test('links do trecho e trechos sem trajeto', () => {
  const l = linksDoTrecho('Roma', 'Florença', '2027-06-06')
  assert.deepEqual(l.map((x) => x.chave), ['mapa', 'rome2rio', 'voo', 'carro'])
  assert.ok(l[0].url.includes('travelmode=transit') && l[0].url.includes('destination=Floren%C3%A7a'))
  assert.ok(l[2].url.includes('2027-06-06'))
  const faltam = trechosSemTrajeto(destinos, [{ origem_id: 'lis', destino_id: 'rom' }])
  assert.deepEqual(faltam.map((t) => `${t.de.id}-${t.para.id}`), ['rom-flo'])
})
