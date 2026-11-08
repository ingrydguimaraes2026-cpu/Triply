// Testes do carimbo de lugar (spec 118a). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { distanciaEntreKm, dentroDaViagem, destinosPerto, carimbosPelaLocalizacao, dataDoCarimbo, tipoDoLugar, carimbosDaViagem, dataDaArte } = await import(
  new URL('../../../packages/core/src/carimbos.ts', import.meta.url)
)

const FLORIPA = { id: 'f', nome: 'Florianópolis', latitude: -27.5954, longitude: -48.548, chegada: '2026-12-28', saida: '2027-01-02' }
const GAROPABA = { id: 'g', nome: 'Garopaba', latitude: -28.0275, longitude: -48.6192, chegada: '2027-01-02', saida: '2027-01-05' }
const SEM_GPS = { id: 's', nome: 'Lugar sem mapa', latitude: null, longitude: null, chegada: null, saida: null }
const VIAGEM = { data_inicio: '2026-12-28', data_fim: '2027-01-05' }
const LAGOA = { latitude: -27.6, longitude: -48.47 } // Lagoa da Conceição, ~8 km do centro

test('distância: Floripa até Garopaba fica perto de 48 km', () => {
  const km = distanciaEntreKm(FLORIPA, GAROPABA)
  assert.ok(km > 45 && km < 52, `deu ${km}`)
})

test('dentro da viagem: só entre a ida e a volta, e sem datas não vale', () => {
  assert.equal(dentroDaViagem('2026-12-31', VIAGEM), true)
  assert.equal(dentroDaViagem('2026-12-27', VIAGEM), false)
  assert.equal(dentroDaViagem('2027-01-06', VIAGEM), false)
  assert.equal(dentroDaViagem('2026-12-31', { data_inicio: null, data_fim: null }), false)
})

test('perto: a até 15 km do destino, ignora quem já tem carimbo e quem não tem mapa', () => {
  assert.deepEqual(destinosPerto([FLORIPA, GAROPABA, SEM_GPS], [], LAGOA).map((d) => d.id), ['f'])
  assert.deepEqual(destinosPerto([FLORIPA, GAROPABA], [{ destino_id: 'f' }], LAGOA), [])
})

test('pela localização: perto mas fora das datas não carimba', () => {
  assert.deepEqual(carimbosPelaLocalizacao([FLORIPA], [], LAGOA, '2026-12-30', VIAGEM).map((d) => d.id), ['f'])
  assert.deepEqual(carimbosPelaLocalizacao([FLORIPA], [], LAGOA, '2026-11-08', VIAGEM), [])
})

test('data do carimbo: prova usa hoje; memória usa a chegada no destino', () => {
  assert.equal(dataDoCarimbo('localizacao', FLORIPA, VIAGEM, '2026-12-30'), '2026-12-30')
  assert.equal(dataDoCarimbo('memoria', GAROPABA, VIAGEM, '2027-02-01'), '2027-01-02')
  assert.equal(dataDoCarimbo('memoria', SEM_GPS, VIAGEM, '2027-02-01'), '2026-12-28')
})

test('tipo do lugar pelo nome', () => {
  assert.equal(tipoDoLugar('Praia do Rosa'), 'praia')
  assert.equal(tipoDoLugar('Ilha Grande'), 'praia')
  assert.equal(tipoDoLugar('Campos do Jordão'), 'serra')
  assert.equal(tipoDoLugar('Lisboa'), 'cidade')
})

test('carimbos da viagem: um por destino, na ordem, aceso ou apagado', () => {
  const c = { id: 'c1', destino_id: 'g', nome: 'Garopaba', como: 'foto' }
  const lista = carimbosDaViagem([FLORIPA, GAROPABA], [c])
  assert.deepEqual(lista.map((x) => [x.destino.id, x.carimbo?.id ?? null]), [['f', null], ['g', 'c1']])
})

test('data da arte', () => {
  assert.equal(dataDaArte('2026-12-31'), '31 dez 2026')
})
