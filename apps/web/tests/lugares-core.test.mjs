// Testes dos lugares no core (usados pelo app mobile). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { agruparLugares, lugarNoMapa } = await import(new URL('../../../packages/core/src/lugares.ts', import.meta.url))

const lugar = (id, destino_id, votos = []) => ({ id, destino_id, nome: id, votos, prioridades: [] })
const destinos = [
  { id: 'nice', nome: 'Nice' },
  { id: 'roma', nome: 'Roma' },
]

test('agrupa por destino na ordem do roteiro, mais votados primeiro', () => {
  const grupos = agruparLugares(destinos, [
    lugar('coliseu', 'roma', ['a']),
    lugar('praia', 'nice'),
    lugar('castelo', 'nice', ['a', 'b']),
    lugar('vaticano', 'roma', ['a']),
  ])
  assert.deepEqual(grupos.map((g) => g.titulo), ['Nice', 'Roma'])
  assert.deepEqual(grupos[0].lugares.map((l) => l.id), ['castelo', 'praia'])
  // empate de votos: fica a ordem em que foram anotados
  assert.deepEqual(grupos[1].lugares.map((l) => l.id), ['coliseu', 'vaticano'])
})

test('destino sem lugar some; lugar sem destino ou de destino apagado vai pra "Outros"', () => {
  const grupos = agruparLugares(destinos, [lugar('farmacia', null), lugar('museu', 'paris-apagado'), lugar('praia', 'nice')])
  assert.deepEqual(grupos.map((g) => g.titulo), ['Nice', 'Outros'])
  assert.deepEqual(grupos[1].lugares.map((l) => l.id), ['farmacia', 'museu'])
  assert.deepEqual(agruparLugares(destinos, []), [])
})

test('link do mapa busca "nome, cidade"', () => {
  assert.equal(lugarNoMapa('Coliseu', 'Roma'), 'https://www.google.com/maps/search/?api=1&query=Coliseu%2C%20Roma')
  assert.equal(lugarNoMapa('Coliseu'), 'https://www.google.com/maps/search/?api=1&query=Coliseu')
})
