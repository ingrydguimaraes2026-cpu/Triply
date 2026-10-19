// Testes da rota e dos passeios (Transportes), sem banco. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { trechosDaRota, linkDoMapaRota, linksDoTrecho, agruparPasseios, modoDoMeio } = await import(
  new URL('../src/features/transportes/rota.ts', import.meta.url)
)

const PARIS = { id: 'p', nome: 'Paris', pais: 'França' }
const NICE = { id: 'n', nome: 'Nice', pais: 'França' }
const MONACO = { id: 'm', nome: 'Mônaco', pais: 'Mônaco' }
const dia = (h) => h.slice(0, 10)

test('trechos ligam destinos seguidos', () => {
  const t = trechosDaRota([PARIS, NICE, MONACO])
  assert.deepEqual(t.map(({ de, para }) => `${de.nome}>${para.nome}`), ['Paris>Nice', 'Nice>Mônaco'])
  assert.deepEqual(trechosDaRota([PARIS]), [])
})

test('mapa da rota passa por todas as paradas', () => {
  const m = linkDoMapaRota([PARIS, NICE, MONACO])
  const e = new URL(m.embed).searchParams
  assert.equal(e.get('saddr'), 'Paris, França')
  assert.equal(e.get('daddr'), 'Nice, França to:Mônaco')
  assert.equal(e.get('dirflg'), 'r')
  const a = new URL(m.abrir).searchParams
  assert.equal(a.get('waypoints'), 'Nice, França')
  assert.equal(a.get('destination'), 'Mônaco')
  assert.equal(a.get('travelmode'), 'transit')
  assert.equal(new URL(linkDoMapaRota([PARIS, NICE], 'carro').embed).searchParams.get('dirflg'), 'd')
  assert.equal(new URL(linkDoMapaRota([NICE]).embed).searchParams.get('q'), 'Nice, França')
  assert.equal(linkDoMapaRota([]), null)
})

test('links do trecho: Rome2Rio e Google Maps', () => {
  const [r2r, maps] = linksDoTrecho(NICE, MONACO)
  assert.equal(r2r.url, 'https://www.rome2rio.com/map/Nice-Fran%C3%A7a/M%C3%B4naco')
  assert.equal(new URL(maps.url).searchParams.get('origin'), 'Nice, França')
})

test('meio vira modo do mapa', () => {
  assert.equal(modoDoMeio('trem'), 'transporte')
  assert.equal(modoDoMeio('onibus'), 'transporte')
  assert.equal(modoDoMeio('carro'), 'carro')
  assert.equal(modoDoMeio('a_pe'), 'a_pe')
})

test('bate-e-volta vira passeio com ida e volta', () => {
  const t = (id, o, d, partida, bev = true) => ({ id, origem_id: o, destino_id: d, meio: 'trem', partida, bate_e_volta: bev })
  const passeios = agruparPasseios(
    [
      t('volta', 'm', 'n', '2027-06-03T18:00:00Z'),
      t('ida', 'n', 'm', '2027-06-03T09:00:00Z'),
      t('normal', 'p', 'n', '2027-06-01T08:00:00Z', false),
      t('sozinha', 'n', 'x', '2027-06-04T09:00:00Z'),
      t('volta-outro-dia', 'x', 'n', '2027-06-05T18:00:00Z'),
    ],
    dia,
  )
  assert.deepEqual(passeios.map((p) => [p.ida.id, p.volta?.id ?? null]), [
    ['ida', 'volta'],
    ['sozinha', null],
    ['volta-outro-dia', null],
  ])
})
