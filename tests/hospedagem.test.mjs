// Testes da spec 011 (hospedagem), sem banco. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const {
  linksDeBusca,
  detectarSite,
  sugerirNome,
  linkValido,
  contasDaOpcao,
  noitesDaOpcao,
  montarHospedagem,
  resumoDaHospedagem,
  ordenarOpcoes,
} = await import(new URL('../src/features/hospedagem/regras.ts', import.meta.url))

const NICE = { id: 'nice', nome: 'Nice', pais: 'França', chegada: '2027-06-01', saida: '2027-06-03' }
const MONACO = { id: 'mc', nome: 'Mônaco', pais: 'Mônaco', chegada: '2027-06-03', saida: '2027-06-03' }
const GALEAO = { id: 'gig', nome: 'Galeão', pais: 'Brasil', chegada: null, saida: null }
const ROMA = { id: 'roma', nome: 'Roma', pais: 'Itália', chegada: null, saida: null }

const opcao = (extra = {}) => ({
  id: 'o1',
  destinoId: 'nice',
  nome: 'Apê no Vieux Nice',
  link: 'https://www.airbnb.com.br/rooms/1',
  precoTotal: 48000,
  moeda: 'EUR',
  checkin: null,
  checkout: null,
  observacao: null,
  escolhida: false,
  criadoPor: 'a',
  votos: [],
  ...extra,
})

test('links de busca levam cidade, datas e pessoas', () => {
  const [airbnb, booking, maps] = linksDeBusca(NICE, 4)
  const a = new URL(airbnb.url)
  assert.equal(a.pathname, '/s/Nice%2C%20Fran%C3%A7a/homes')
  assert.equal(a.searchParams.get('checkin'), '2027-06-01')
  assert.equal(a.searchParams.get('checkout'), '2027-06-03')
  assert.equal(a.searchParams.get('adults'), '4')
  const b = new URL(booking.url).searchParams
  assert.equal(b.get('ss'), 'Nice, França')
  assert.equal(b.get('group_adults'), '4')
  assert.equal(b.get('checkout'), '2027-06-03')
  assert.equal(new URL(maps.url).searchParams.get('query'), 'hospedagem em Nice, França')
})

test('sem datas (ou bate-e-volta), a busca abre só com a cidade', () => {
  for (const d of [ROMA, MONACO]) {
    const [airbnb, booking] = linksDeBusca(d, 2)
    assert.equal(new URL(airbnb.url).searchParams.get('checkin'), null)
    assert.equal(new URL(booking.url).searchParams.get('checkout'), null)
  }
  // país igual ao nome não repete
  assert.equal(new URL(linksDeBusca(MONACO, 2)[1].url).searchParams.get('ss'), 'Mônaco')
})

test('reconhece o site do link', () => {
  assert.deepEqual(detectarSite('https://www.airbnb.com.br/rooms/123'), { chave: 'airbnb', nome: 'Airbnb' })
  assert.equal(detectarSite('https://www.booking.com/hotel/fr/negresco.pt-br.html').chave, 'booking')
  assert.equal(detectarSite('https://maps.app.goo.gl/abc').chave, 'google')
  assert.deepEqual(detectarSite('https://hotelzinho.fr/quarto'), { chave: 'outro', nome: 'hotelzinho.fr' })
  assert.equal(detectarSite('não é link'), null)
  assert.equal(detectarSite(null), null)
  assert.equal(detectarSite('https://booking.com.golpe.ru/x').chave, 'outro')
})

test('link só https; nome sugerido do Booking', () => {
  assert.equal(linkValido('https://airbnb.com/rooms/1'), true)
  assert.equal(linkValido('http://airbnb.com/rooms/1'), false)
  assert.equal(linkValido('javascript:alert(1)'), false)
  assert.equal(sugerirNome('https://www.booking.com/hotel/fr/le-negresco.pt-br.html?aid=1'), 'Le Negresco')
  assert.equal(sugerirNome('https://www.airbnb.com.br/rooms/1'), null)
})

test('€480 em 2 noites pra 4 pessoas: €120 por pessoa, €240 por noite', () => {
  const noites = noitesDaOpcao(opcao(), NICE)
  assert.equal(noites, 2)
  assert.deepEqual(contasDaOpcao(48000, 4, noites), { porPessoa: 12000, porNoite: 24000 })
  assert.deepEqual(contasDaOpcao(null, 4, 2), { porPessoa: null, porNoite: null })
  assert.equal(contasDaOpcao(10000, 3, 0).porNoite, null)
  // datas próprias da opção valem mais que as do destino
  assert.equal(noitesDaOpcao(opcao({ checkin: '2027-06-01', checkout: '2027-06-04' }), NICE), 3)
})

test('ordena: escolhida, mais votos, mais barata', () => {
  const lista = ordenarOpcoes([
    opcao({ id: 'cara', nome: 'Cara', precoTotal: 90000, votos: ['a'] }),
    opcao({ id: 'barata', nome: 'Barata', precoTotal: 30000, votos: ['a'] }),
    opcao({ id: 'votada', nome: 'Votada', votos: ['a', 'b'] }),
    opcao({ id: 'escolhida', nome: 'Escolhida', escolhida: true }),
  ])
  assert.deepEqual(lista.map((o) => o.id), ['escolhida', 'votada', 'barata', 'cara'])
})

test('situação de cada destino', () => {
  const itens = montarHospedagem([GALEAO, NICE, MONACO, ROMA, GALEAO], [opcao()])
  assert.deepEqual(itens.map((i) => i.situacao), ['casa', 'precisa', 'bate-e-volta', 'sem-datas', 'casa'])
  assert.equal(itens[1].opcoes.length, 1)
  const resumo = resumoDaHospedagem(itens, 4)
  assert.equal(resumo.total, 2) // Nice e Roma
  assert.equal(resumo.resolvidos, 0)
})

test('escolhida resolve o destino, soma no resumo e avisa datas diferentes', () => {
  const itens = montarHospedagem([NICE], [opcao({ escolhida: true, checkout: '2027-06-02' })])
  assert.equal(itens[0].situacao, 'resolvido')
  assert.equal(itens[0].avisos.length, 1)
  assert.match(itens[0].avisos[0], /termina dia 2\/06, mas vocês saem de Nice dia 3\/06/)
  const r = resumoDaHospedagem(itens, 4)
  assert.deepEqual(r.totais, { EUR: 48000 })
  assert.deepEqual(r.porPessoa, { EUR: 12000 })
  assert.equal(r.resolvidos, 1)
})

test('mapa do Google busca o tipo de lugar na cidade', async () => {
  const { linkDoMapa } = await import(new URL('../src/features/hospedagem/regras.ts', import.meta.url))
  const m = linkDoMapa(NICE, 'hostel')
  assert.equal(new URL(m.embed).searchParams.get('q'), 'hostels em Nice, França')
  assert.equal(new URL(m.embed).searchParams.get('output'), 'embed')
  assert.equal(new URL(m.abrir).searchParams.get('query'), 'hostels em Nice, França')
  assert.equal(new URL(linkDoMapa(NICE).embed).searchParams.get('q'), 'hotéis em Nice, França')
})
