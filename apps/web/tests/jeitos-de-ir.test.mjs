// Testes do "achar o jeito de ir" (spec 122c). Rodar: node --test apps/web/tests/jeitos-de-ir.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { meioDaPerna, saidaDoItinerario, frequenciaEstimada, precoEstimado, montarJeitos, naoDaTempo } = await import(
  new URL('../../../packages/core/src/jeitos-de-ir.ts', import.meta.url)
)

const perna = (mode, de, para, ini, fim, extra = {}) => ({ mode, from: { name: de }, to: { name: para }, startTime: ini, endTime: fim, ...extra })

test('meio de cada perna do Transitous', () => {
  assert.equal(meioDaPerna('HIGHSPEED_RAIL'), 'trem')
  assert.equal(meioDaPerna('COACH'), 'onibus')
  assert.equal(meioDaPerna('FERRY'), 'barco')
  assert.equal(meioDaPerna('SUBWAY'), 'metro')
  assert.equal(meioDaPerna('WALK'), null)
})

test('itinerário vira saída: meio da perna mais longa, trocas e onde troca', () => {
  const it = {
    startTime: '2026-11-18T04:35:00Z', endTime: '2026-11-18T08:45:00Z', duration: 15000,
    legs: [
      perna('WALK', 'Casa', 'Como S. Giovanni', '2026-11-18T04:35:00Z', '2026-11-18T04:41:00Z'),
      perna('REGIONAL_RAIL', 'Como S. Giovanni', 'Milano P. Garibaldi', '2026-11-18T04:41:00Z', '2026-11-18T05:40:00Z', { routeShortName: 'R17', agencyName: 'Trenord' }),
      perna('SUBWAY', 'Garibaldi', 'Centrale', '2026-11-18T05:50:00Z', '2026-11-18T05:56:00Z', { routeShortName: '2', agencyName: 'ATM' }),
      perna('HIGHSPEED_RAIL', 'Milano Centrale', 'Venezia S. Lucia', '2026-11-18T06:20:00Z', '2026-11-18T08:45:00Z', { displayName: 'FR 9711', agencyName: 'Trenitalia' }),
    ],
  }
  const s = saidaDoItinerario(it)
  assert.equal(s.meio, 'trem')
  assert.equal(s.trocas, 2)
  assert.deepEqual(s.trocaEm, ['Garibaldi', 'Milano Centrale'])
  assert.equal(s.sai, '2026-11-18T04:41:00Z')
  assert.equal(s.minutos, 250)
  assert.deepEqual(s.linhas, ['R17 · Trenord', '2 · ATM', 'FR 9711 · Trenitalia'])
})

test('frequência: mediana dos intervalos; com menos de 3 saídas, não sabe', () => {
  const h = (x) => ({ sai: `2026-11-18T${x}:00Z` })
  assert.equal(frequenciaEstimada([h('06:06'), h('07:06'), h('08:06'), h('09:06')]), 60)
  assert.equal(frequenciaEstimada([h('06:06'), h('07:06')]), null)
})

test('preço estimado de carro e táxi pela distância', () => {
  assert.deepEqual(precoEstimado('carro', 284, 'EUR'), { valor: 60, moeda: 'EUR', estimativa: true })
  assert.deepEqual(precoEstimado('taxi', 10, 'EUR'), { valor: 24, moeda: 'EUR', estimativa: true })
  assert.equal(precoEstimado('carro', 100, 'XYZ').moeda, 'EUR')
})

test('cartões por meio com selos; a pé só quando é perto', () => {
  const s = (meio, sai, min) => ({ meio, sai, chega: sai, minutos: min, trocas: 1, trocaEm: [], linhas: [] })
  const jeitos = montarJeitos([s('trem', '2026-11-18T20:11:00Z', 240), s('onibus', '2026-11-18T21:11:00Z', 437), s('trem', '2026-11-18T21:11:00Z', 250)], { km: 284, minutos: 190 }, 220, 'EUR')
  assert.deepEqual(jeitos.map((j) => j.meio), ['trem', 'onibus', 'carro', 'taxi'])
  assert.equal(jeitos[0].saidas.length, 2)
  assert.ok(jeitos.find((j) => j.meio === 'carro').selos.includes('mais-rapido'))
  assert.ok(jeitos.find((j) => j.meio === 'carro').selos.includes('mais-barato'))
  const perto = montarJeitos([], { km: 1.2, minutos: 4 }, 1, 'EUR')
  assert.deepEqual(perto.map((j) => j.meio), ['carro', 'taxi', 'a_pe'])
  assert.ok(perto.find((j) => j.meio === 'a_pe').selos.includes('mais-barato'))
})

test('não dá tempo: sai antes de o grupo ficar livre', () => {
  assert.equal(naoDaTempo({ sai: '2026-11-18T19:40:00Z' }, '2026-11-18T20:00:00Z'), true)
  assert.equal(naoDaTempo({ sai: '2026-11-18T20:10:00Z' }, '2026-11-18T20:00:00Z'), false)
  assert.equal(naoDaTempo({ sai: '2026-11-18T20:10:00Z' }, null), false)
})
