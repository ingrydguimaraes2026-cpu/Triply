// Testes das ferramentas do dia (spec 059). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const f = await import(new URL('../../../packages/core/src/ferramentas.ts', import.meta.url))

test('conversor em reais, com e sem IOF', () => {
  // € 10,00 a R$ 6,00 = R$ 60,00; com IOF 3,5% = R$ 62,10
  assert.equal(f.emReais(1000, 6, false), 6000)
  assert.equal(f.emReais(1000, 6), 6210)
})

test('gorjeta sugerida e conta dividida', () => {
  assert.equal(f.gorjetaSugerida('US'), 18)
  assert.equal(f.gorjetaSugerida('jp'), 0)
  assert.equal(f.gorjetaSugerida('ZZ'), 10)
  assert.deepEqual(f.contaComGorjeta(10000, 10, 3), { gorjeta: 1000, total: 11000, porPessoa: 3666, sobra: 2 })
  assert.equal(f.contaComGorjeta(10000, 0, 0).porPessoa, 10000)
})

test('banheiros: grátis primeiro, por distância; sem coordenada fica de fora', () => {
  const lat = 43.7
  const lng = 7.26
  const r = f.banheirosDaResposta(
    {
      elements: [
        { id: 1, lat: 43.701, lon: 7.26, tags: { fee: 'yes' } },
        { id: 2, lat: 43.705, lon: 7.26, tags: { fee: 'no', wheelchair: 'yes' } },
        { id: 3, lat: 43.7005, lon: 7.26, tags: {} },
        { id: 4, center: { lat: 43.7002, lon: 7.26 }, tags: { fee: 'no', name: 'Gare' } },
        { id: 5, tags: { fee: 'no' } },
      ],
    },
    lat,
    lng,
  )
  assert.deepEqual(r.map((b) => b.id), [4, 2, 3, 1])
  assert.equal(r[0].nome, 'Gare')
  assert.equal(r[1].acessivel, true)
  assert.ok(r[0].metros > 10 && r[0].metros < 40)
})

test('links de restaurante e guarda-volumes', () => {
  assert.match(f.linksDeRestaurante('Nice', 43.7, 7.26)[0].url, /maps\/search\/restaurantes\/@43\.7,7\.26/)
  assert.match(f.linksDeRestaurante('Nice', null, null)[1].url, /TheFork%20Nice/)
  assert.equal(f.linksDeGuardaVolumes('Roma').length, 3)
  assert.match(f.consultaDeBanheiros(43.7, 7.26), /^https:\/\/overpass-api\.de\/api\/interpreter\?data=/)
})
