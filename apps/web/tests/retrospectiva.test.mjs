// Testes da retrospectiva (spec 105). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { cartoesDaRetrospectiva } = await import(new URL('../../../packages/core/src/retrospectiva.ts', import.meta.url))

const base = {
  nome: 'Riviera',
  dias: 9,
  km: 1342.4,
  cidades: ['Nice', 'Mônaco', 'Gênova'],
  paises: ['França', 'Mônaco', 'Itália'],
  gastoTotal: 300000,
  dinheiro: (c) => `€ ${(c / 100).toFixed(2)}`,
  pessoas: 4,
  posts: 12,
  fotos: 57,
  curtidas: 1,
  lugaresVisitados: 8,
}

test('105: cartões com os números da viagem', () => {
  const c = cartoesDaRetrospectiva(base)
  assert.deepEqual(c.map((x) => x.chave), ['dias', 'cidades', 'km', 'gasto', 'fotos', 'lugares'])
  assert.deepEqual(c[3], { chave: 'gasto', numero: '€ 750.00', titulo: 'por pessoa', legenda: '€ 3000.00 no total do comboio (4 pessoas)' })
  assert.equal(c[1].legenda, 'Nice → Mônaco → Gênova')
  assert.equal(c[2].legenda, 'passando por França, Mônaco, Itália')
  assert.equal(c[4].legenda, '12 posts · 1 curtida')
})

test('105: sem dado, sem cartão', () => {
  const c = cartoesDaRetrospectiva({ ...base, km: 3, gastoTotal: null, fotos: 0, lugaresVisitados: 0, cidades: ['Nice'] })
  assert.deepEqual(c.map((x) => x.chave), ['dias', 'cidades'])
  assert.equal(c[1].titulo, 'cidade')
})

// ---- Spec 118c: retrospectiva que monta sozinha ----
const { molduraDaViagem, domingoDePascoa, legendaDaRetrospectiva, cartaoDosCarimbos, retrospectivaPronta } = await import(
  new URL('../../../packages/core/src/retrospectiva.ts', import.meta.url)
)
const { htmlDoLivro } = await import(new URL('../../../packages/core/src/pdf-da-viagem.ts', import.meta.url))
const { carimbosDaCapa } = await import(new URL('../../../packages/core/src/carimbos.ts', import.meta.url))

test('118c: Páscoa certa (base do Carnaval e dos feriados móveis)', () => {
  assert.equal(domingoDePascoa(2026), '2026-04-05')
  assert.equal(domingoDePascoa(2027), '2027-03-28')
  assert.equal(domingoDePascoa(2024), '2024-03-31')
})

test('118c: moldura por data', () => {
  assert.equal(molduraDaViagem('2026-12-28', '2027-01-05').chave, 'reveillon')
  assert.equal(molduraDaViagem('2026-12-28', '2027-01-05').titulo, 'Réveillon 2027')
  // Carnaval 2027: terça 09/02 (sábado 06/02 a quarta de Cinzas 10/02)
  assert.equal(molduraDaViagem('2027-02-05', '2027-02-07').titulo, 'Carnaval 2027')
  assert.equal(molduraDaViagem('2027-02-11', '2027-02-14').chave, 'padrao') // depois das Cinzas
  assert.equal(molduraDaViagem('2027-06-22', '2027-06-25').titulo, 'São João 2027')
  // Tiradentes 2027 cai numa quarta; viagem de sábado a quarta pega fim de semana
  assert.equal(molduraDaViagem('2027-04-17', '2027-04-21').titulo, 'Feriado de Tiradentes')
  // Passa pelo feriado mas sem fim de semana (só 2 dias): padrão
  assert.equal(molduraDaViagem('2027-04-20', '2027-04-21').chave, 'padrao')
  assert.equal(molduraDaViagem('2027-03-10', '2027-03-14').chave, 'padrao')
  assert.equal(molduraDaViagem(null, null).chave, 'padrao')
  // Réveillon ganha de Natal
  assert.equal(molduraDaViagem('2026-12-24', '2026-12-31').chave, 'reveillon')
  assert.equal(molduraDaViagem('2026-12-24', '2026-12-27').titulo, 'Feriado de Natal')
})

test('118c: legenda pronta', () => {
  const reveillon = molduraDaViagem('2026-12-28', '2027-01-05')
  assert.equal(
    legendaDaRetrospectiva({ nome: 'Fim de ano', lugares: ['Florianópolis', 'Garopaba'], moldura: reveillon, dias: 9, pessoas: 4, carimbados: 2 }),
    'Réveillon 2027 em Florianópolis e Garopaba: 9 dias, 4 pessoas e 2 carimbos no passaporte da galera. Bora a próxima?',
  )
  const padrao = molduraDaViagem(null, null)
  assert.equal(legendaDaRetrospectiva({ nome: 'Rolê', lugares: [], moldura: padrao, dias: 1, pessoas: 1, carimbados: 0 }), 'Rolê: 1 dia. Bora a próxima?')
  assert.equal(
    legendaDaRetrospectiva({ nome: 'Europa', lugares: ['Paris', 'Nice', 'Roma', 'Milão'], moldura: padrao, dias: 0, pessoas: 3, carimbados: 1 }),
    'Paris, Nice e mais 2 lugares: 3 pessoas e 1 carimbo no passaporte da galera. Bora a próxima?',
  )
})

test('118c: cartão dos carimbos e "pronta"', () => {
  assert.equal(cartaoDosCarimbos([]), null)
  assert.deepEqual(cartaoDosCarimbos(['Floripa']), { chave: 'carimbos', numero: '1', titulo: 'lugar carimbado', legenda: 'Floripa' })
  assert.equal(retrospectivaPronta('2027-01-05', '2027-01-06'), true)
  assert.equal(retrospectivaPronta('2027-01-05', '2027-01-05'), false)
  assert.equal(retrospectivaPronta(null, '2027-01-06'), false)
})

test('118c: carimbos na capa do caderno', () => {
  const capa = carimbosDaCapa([
    { nome: 'Garopaba', data: '2027-01-02', como: 'memoria' },
    { nome: 'Florianópolis', data: '2026-12-28', como: 'localizacao' },
  ])
  assert.deepEqual(capa, [
    { nome: 'Florianópolis', data: '28 dez 2026', memoria: false },
    { nome: 'Garopaba', data: '2 jan 2027', memoria: true },
  ])
  const html = htmlDoLivro({ nome: 'Fim de ano', periodo: '', rota: '', comboio: '', carimbos: capa, paginas: [], geradoEm: '06/01/2027' })
  assert.match(html, /class="carimbos"/)
  assert.match(html, /class="carimbo memoria"><strong style="font-size:[\d.]+px">Garopaba<\/strong><span>2 jan 2027<\/span>/)
  assert.doesNotMatch(htmlDoLivro({ nome: 'X', periodo: '', rota: '', comboio: '', paginas: [], geradoEm: '' }), /class="carimbos"/)
})

test('118c: mapa percorrido', async () => {
  const { trajetoDaViagem, areaDoTrajeto } = await import(new URL('../../../packages/core/src/retrospectiva.ts', import.meta.url))
  const pontos = trajetoDaViagem([
    { nome: 'Florianópolis', latitude: -27.6, longitude: -48.5 },
    { nome: 'Sem mapa', latitude: null, longitude: null },
    { nome: 'Garopaba', latitude: -28.0, longitude: -48.6 },
  ])
  assert.deepEqual(pontos.map((p) => p.nome), ['Florianópolis', 'Garopaba'])
  const a = areaDoTrajeto(pontos)
  // Viagem curtinha: pelo menos 3 graus de largura e altura, centrada no meio
  assert.ok(a.norte - a.sul >= 3 - 1e-9 && a.leste - a.oeste >= 3 - 1e-9)
  assert.ok(Math.abs((a.norte + a.sul) / 2 - -27.8) < 1e-9)
  assert.equal(areaDoTrajeto([]), null)
  // Viagem longa: a área cobre todos os pontos com borda
  const europa = areaDoTrajeto([{ nome: 'Lisboa', latitude: 38.7, longitude: -9.1 }, { nome: 'Roma', latitude: 41.9, longitude: 12.5 }])
  assert.ok(europa.oeste < -9.1 && europa.leste > 12.5)
})

test('118c: cartão dos carimbos entra logo depois dos dias', () => {
  const c = cartoesDaRetrospectiva({ ...base, carimbados: ['Nice', 'Gênova'] })
  assert.deepEqual(c.slice(0, 3).map((x) => x.chave), ['dias', 'carimbos', 'cidades'])
  assert.equal(c[1].legenda, 'Nice · Gênova')
})
