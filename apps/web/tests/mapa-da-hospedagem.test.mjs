// Testes do mapa da hospedagem (spec 124). Rodar: node --test apps/web/tests/mapa-da-hospedagem.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { mapaDaHospedagem, pontoPrincipal, enquadrarNoMapa, textoDosMinutos } = await import(new URL('../../../packages/core/src/mapa-da-hospedagem.ts', import.meta.url))
const { lerPontoDaPagina } = await import(new URL('../../../packages/core/src/previa.ts', import.meta.url))

// Roma da Eurotrip (dados reais de 09/11)
const opcao = (id, lat, lon, precoTotal, extra = {}) => ({
  id, destinoId: 'roma', nome: id, link: null, precoTotal, moeda: 'BRL', checkin: null, checkout: null, observacao: null,
  escolhida: false, criadoPor: 'u1', votos: [], lat, lon, ...extra,
})
const cidade = {
  destino: { id: 'roma', nome: 'Roma', pais: 'Itália', chegada: '2027-06-10', saida: '2027-06-13' },
  chegada: { hora: '23:00', diaSeguinte: false, instante: null, lugar: 'Roma Termini', lat: 41.901, lon: 12.5016 },
  opcoes: [
    opcao('lorenzo', 41.89754, 12.50082, 216700, { escolhida: true, nota: 4.8 }),
    opcao('duplo', 41.89587, 12.50117, 201700),
    opcao('coliseu', 41.887, 12.49804, 181700),
    opcao('chilling', null, null, 55500),
  ],
}
const lugares = [
  { id: 'trevi', nome: 'Fontana di Trevi', tipo: 'passeio', latitude: 41.9009, longitude: 12.4833, votos: 0 },
  { id: 'coliseu', nome: 'Coliseu', tipo: 'passeio', latitude: 41.8902, longitude: 12.4922, votos: 0 },
  { id: 'malas', nome: 'Guarda-volumes', tipo: 'guarda_volumes', latitude: 41.9, longitude: 12.5, votos: 9 },
  { id: 'vespa', nome: 'Vespa', tipo: 'outro', latitude: null, longitude: null, votos: 3 },
]

test('ponto principal: mais votado; empatando, o mais perto do meio das opções; sem guarda-volumes', () => {
  assert.equal(pontoPrincipal(lugares, cidade.opcoes.filter((o) => o.lat).map((o) => ({ lat: o.lat, lon: o.lon }))), 'coliseu')
  assert.equal(pontoPrincipal([{ ...lugares[0], votos: 2 }, lugares[1]], []), 'trevi')
  assert.equal(pontoPrincipal([lugares[2], lugares[3]], []), null)
})

test('pinos numerados na ordem, minutos da chegada e até o ponto, opção sem lugar à parte', () => {
  const m = mapaDaHospedagem(cidade, lugares, 2)
  assert.deepEqual(m.pinos.map((p) => [p.numero, p.opcao.id]), [[1, 'lorenzo'], [2, 'duplo'], [3, 'coliseu']])
  assert.deepEqual(m.semLugar.map((o) => o.id), ['chilling'])
  assert.equal(m.chegada.nome, 'Roma Termini')
  assert.equal(m.ponto.nome, 'Coliseu')
  const [lorenzo, , coliseu] = m.pinos
  assert.ok(lorenzo.daChegada >= 5 && lorenzo.daChegada <= 7, `lorenzo da Termini: ${lorenzo.daChegada}`)
  assert.ok(coliseu.atePonto <= 10, `coliseu até o Coliseu: ${coliseu.atePonto}`)
  assert.match(lorenzo.rotulo, /^R\$\s?1\.084 · 4,8$/)
  assert.match(textoDosMinutos(lorenzo, m), /min de Roma Termini · \d+ min até Coliseu/)
  // trocar o ponto refaz os minutos
  const trevi = mapaDaHospedagem(cidade, lugares, 2, 'trevi')
  assert.equal(trevi.ponto.nome, 'Fontana di Trevi')
  assert.notEqual(trevi.pinos[2].atePonto, coliseu.atePonto)
})

test('enquadrar: todos os pontos cabem no quadro', () => {
  const m = mapaDaHospedagem(cidade, lugares, 2)
  const pontos = [...m.pinos, m.chegada, m.ponto]
  for (const [largura, altura] of [[320, 240], [900, 420]]) {
    const e = enquadrarNoMapa(pontos, largura, altura)
    assert.ok(e.zoom >= 13 && e.zoom <= 17, `zoom ${e.zoom}`)
    for (const p of pontos) {
      const [x, y] = e.xy(p)
      assert.ok(x >= 0 && x <= largura && y >= 0 && y <= altura, `${x},${y} fora de ${largura}x${altura}`)
    }
    assert.ok(e.azulejos.length > 0 && e.azulejos[0].url.startsWith('https://tile.openstreetmap.org/'))
  }
  assert.equal(enquadrarNoMapa([], 300, 200), null)
})

test('lugar da página: Airbnb, JSON-LD de hotel, Booking e Google Maps', () => {
  assert.deepEqual(lerPontoDaPagina('..."latitude":41.89754,"longitude":12.50082,...', 'https://www.airbnb.com.br/rooms/1'), { lat: 41.89754, lon: 12.50082 })
  assert.deepEqual(lerPontoDaPagina('"geo":{"@type":"GeoCoordinates","latitude":41.896132,"longitude":12.4982488}', 'https://hotel.it'), { lat: 41.896132, lon: 12.4982488 })
  assert.deepEqual(lerPontoDaPagina('<a data-atlas-latlng="41.9001,12.5011">', 'https://www.booking.com/hotel/it/x.html'), { lat: 41.9001, lon: 12.5011 })
  assert.deepEqual(lerPontoDaPagina('', 'https://www.google.com/maps/place/X/@41.8902,12.4922,17z'), { lat: 41.8902, lon: 12.4922 })
  assert.equal(lerPontoDaPagina('<html>nada</html>', 'https://hotel.it'), null)
})
