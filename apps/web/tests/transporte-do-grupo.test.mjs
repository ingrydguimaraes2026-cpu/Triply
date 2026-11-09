// Testes do transporte v2 (spec 121). Rodar: node --test apps/web/tests/transporte-do-grupo.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const T = await import(new URL('../../../packages/core/src/transporte-do-grupo.ts', import.meta.url))

const MEMBROS = [{ id: 'ana', nome: 'Ana' }, { id: 'paulo', nome: 'Paulo' }, { id: 'bia', nome: 'Bia' }]
const DESTINOS = [{ id: 'floripa', nome: 'Florianópolis' }, { id: 'garopaba', nome: 'Garopaba' }]

test('tipo provável: de fora pra dentro chega, de dentro pra fora sai, entre destinos é trecho', () => {
  assert.equal(T.tipoProvavel({ origemId: null, destinoId: 'floripa' }), 'chegada')
  assert.equal(T.tipoProvavel({ origemId: 'garopaba', destinoId: null }), 'saida')
  assert.equal(T.tipoProvavel({ origemId: 'floripa', destinoId: 'garopaba' }), 'trecho')
  assert.equal(T.tipoProvavel({ origemId: null, destinoId: null }), 'chegada')
})

test('chegadas por pessoa: passageiros marcados ou, sem ninguém, quem lançou; a mais cedo e a saída mais tarde', () => {
  const trajetos = [
    { id: 'v1', tipo: 'chegada', meio: 'aviao', partida: '2026-12-28T09:10:00Z', origem_id: null, destino_id: 'floripa', criado_por: 'ana', passageiros: [] },
    { id: 'v2', tipo: 'chegada', meio: 'onibus', partida: '2026-12-28T06:00:00Z', origem_id: null, destino_id: 'floripa', criado_por: 'ana', passageiros: ['paulo', 'bia'] },
    { id: 'v3', tipo: 'saida', meio: 'aviao', partida: '2027-01-04T18:00:00Z', origem_id: 'garopaba', destino_id: null, criado_por: 'ana', passageiros: [] },
    { id: 't1', tipo: 'trecho', meio: 'carro', partida: '2027-01-01T10:00:00Z', origem_id: 'floripa', destino_id: 'garopaba', criado_por: 'ana', passageiros: [] },
  ]
  const linhas = T.chegadasPorPessoa(trajetos, MEMBROS)
  assert.equal(linhas[0].chegada.id, 'v1')
  assert.equal(linhas[0].saida.id, 'v3')
  assert.equal(linhas[1].chegada.id, 'v2')
  assert.equal(linhas[1].saida, null)
  assert.equal(linhas[2].chegada.id, 'v2')
})

test('trechos do grupo: um por par de destinos; o que não encaixa vai pra outros', () => {
  const trajetos = [
    { id: 't1', tipo: 'trecho', meio: 'carro', partida: null, origem_id: 'floripa', destino_id: 'garopaba' },
    { id: 't2', meio: 'trem', partida: null, origem_id: 'garopaba', destino_id: 'floripa' }, // antigo, sem tipo = trecho
    { id: 'c1', tipo: 'chegada', meio: 'aviao', partida: null, origem_id: null, destino_id: 'floripa' },
  ]
  const { trechos, outros } = T.trechosDoGrupo(trajetos, DESTINOS)
  assert.equal(trechos.length, 1)
  assert.deepEqual(trechos[0].trajetos.map((t) => t.id), ['t1'])
  assert.deepEqual(outros.map((t) => t.id), ['t2'])
})

test('como chegar: transporte público e a pé pelo Google Maps, com coordenada ou endereço', () => {
  const [pub, pe] = T.linksComoChegar({ nome: 'Casa', latitude: -27.6, longitude: -48.5 })
  assert.match(pub.url, /destination=-27\.6%2C-48\.5&travelmode=transit$/)
  assert.match(pe.url, /travelmode=walking$/)
  const [porEndereco] = T.linksComoChegar({ nome: 'Casa', endereco: 'Rua A, 1' })
  assert.match(porEndereco.url, /destination=Rua%20A%2C%201&/)
  assert.match(T.linkDoCaminho('Roma Termini', 'Firenze'), /origin=Roma%20Termini&destination=Firenze&travelmode=transit/)
})

test('linha codificada: exemplo do Google (precisão 5)', () => {
  const pts = T.decodificarLinha('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5)
  assert.deepEqual(pts, [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]])
})

test('caminho da resposta do Transitous: paradas do trem com horário e nome da linha', () => {
  const resposta = { itineraries: [{ legs: [
    { mode: 'WALK', from: { name: 'START', lat: 0, lon: 0 }, to: { name: 'ROMA TERMINI', lat: 41.9, lon: 12.5 } },
    { mode: 'HIGHSPEED_RAIL', displayName: 'FR 9520', agencyName: 'TRENITALIA',
      from: { name: 'ROMA TERMINI', lat: 41.9, lon: 12.5, departure: '2026-11-12T08:10:00Z' },
      to: { name: 'FIRENZE S. M. NOVELLA', lat: 43.77, lon: 11.25, arrival: '2026-11-12T09:45:00Z' },
      intermediateStops: [{ name: 'ROMA TIBURTINA', lat: 41.91, lon: 12.53, arrival: '2026-11-12T08:17:00Z', departure: '2026-11-12T08:19:00Z' }],
      legGeometry: { points: '_p~iF~ps|U_ulLnnqC', precision: 5 } },
  ] }] }
  const c = T.caminhoDaResposta(resposta, '2026-11-08T12:00:00Z')
  assert.deepEqual(c.linhas, ['FR 9520 · TRENITALIA'])
  assert.deepEqual(c.paradas.map((p) => p.nome), ['ROMA TERMINI', 'ROMA TIBURTINA', 'FIRENZE S. M. NOVELLA'])
  assert.equal(c.paradas[0].sai, '2026-11-12T08:10:00Z')
  assert.equal(c.paradas[2].chega, '2026-11-12T09:45:00Z')
  assert.equal(c.linha.length, 2)
  assert.equal(T.caminhoDaResposta({ itineraries: [] }, 'x'), null)
  assert.equal(T.lerCaminho(c), c)
  assert.equal(T.lerCaminho({ fonte: 'outra' }), null)
})
