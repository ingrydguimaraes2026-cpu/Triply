// Testes das regras da spec 016 (lugares de cada destino), sem banco. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { montarLugares, lugaresSoltos, contarPorTipo, ordenarLugares, linkNoMapa, tipoDeLugar } = await import(
  new URL('../src/features/lugares/regras.ts', import.meta.url)
)

// Parte do roteiro da Eurotrip (reunião de 22/10/2026)
const NICE = { id: 'nice', nome: 'Nice', pais: 'França', chegada: '2027-06-04', saida: '2027-06-07' }
const MONACO_SAB = { id: 'mc-sab', nome: 'Mónaco', pais: 'Mónaco', chegada: '2027-06-05', saida: '2027-06-05' }
const MONACO_DOM = { id: 'mc-dom', nome: 'Mónaco', pais: 'Mónaco', chegada: '2027-06-06', saida: '2027-06-06' }
const MILAO = { id: 'milao', nome: 'Milão', pais: 'Itália', chegada: '2027-06-07', saida: '2027-06-07' }
const ROMA = { id: 'roma', nome: 'Roma', pais: 'Itália', chegada: null, saida: null }

let n = 0
const lugar = (destinoId, tipo, nome, extra = {}) => ({
  id: `l${++n}`, destinoId, tipo, nome, link: null, horario: null, preco: null, moeda: 'EUR', observacao: null, criadoPor: 'eu', ...extra,
})

test('cada destino recebe os seus lugares, na ordem do roteiro; Mônaco repetido não mistura sábado e domingo', () => {
  const lugares = [
    lugar('mc-sab', 'passeio', 'Cassino de Monte Carlo'),
    lugar('mc-dom', 'outro', 'Entrada do GP'),
    lugar('milao', 'guarda_volumes', 'Guarda-volumes da Milano Centrale'),
    lugar('mc-sab', 'comida', 'Steak n Shake'),
  ]
  const itens = montarLugares([NICE, MONACO_SAB, MONACO_DOM, MILAO, ROMA], lugares)
  assert.deepEqual(itens.map((i) => [i.destino.id, i.lugares.map((l) => l.nome)]), [
    ['nice', []],
    ['mc-sab', ['Cassino de Monte Carlo', 'Steak n Shake']],
    ['mc-dom', ['Entrada do GP']],
    ['milao', ['Guarda-volumes da Milano Centrale']],
    ['roma', []],
  ])
  assert.deepEqual(itens.map((i) => i.indice), [0, 1, 2, 3, 4])
})

test('dia de passagem (chega e sai no mesmo dia) é marcado; estadia e destino sem datas não', () => {
  const itens = montarLugares([NICE, MILAO, ROMA], [])
  assert.deepEqual(itens.map((i) => [i.destino.nome, i.passagem]), [['Nice', false], ['Milão', true], ['Roma', false]])
})

test('sabe se o destino já tem guarda-volumes (pra parar de sugerir)', () => {
  const sem = montarLugares([MILAO], [lugar('milao', 'passeio', 'Duomo')])[0]
  const com = montarLugares([MILAO], [lugar('milao', 'guarda_volumes', 'Milano Centrale')])[0]
  assert.equal(sem.temGuardaVolumes, false)
  assert.equal(com.temGuardaVolumes, true)
})

test('ordem dentro do destino: passeio, comida, guarda-volumes, outro; empate pela ordem em que foram anotados', () => {
  const lista = [lugar('x', 'outro', 'O'), lugar('x', 'guarda_volumes', 'G'), lugar('x', 'passeio', 'P1'), lugar('x', 'comida', 'C'), lugar('x', 'passeio', 'P2')]
  assert.deepEqual(ordenarLugares(lista).map((l) => l.nome), ['P1', 'P2', 'C', 'G', 'O'])
})

test('lugares soltos: destino saiu do roteiro ou ficou vazio', () => {
  const lugares = [lugar('nice', 'passeio', 'Promenade'), lugar('apagado', 'passeio', 'Sumiu'), lugar(null, 'outro', 'Sem destino')]
  assert.deepEqual(lugaresSoltos([NICE], lugares).map((l) => l.nome), ['Sumiu', 'Sem destino'])
})

test('contagem por tipo pros filtros', () => {
  const lugares = [lugar('x', 'passeio', 'A'), lugar('x', 'passeio', 'B'), lugar('x', 'guarda_volumes', 'C')]
  assert.deepEqual(contarPorTipo(lugares), { passeio: 2, comida: 0, guarda_volumes: 1, outro: 0 })
})

test('link do mapa busca o nome com a cidade (sem repetir o país)', () => {
  const url = new URL(linkNoMapa({ nome: 'Galeria Vittorio Emanuele' }, MILAO))
  assert.equal(url.hostname, 'www.google.com')
  assert.equal(url.searchParams.get('query'), 'Galeria Vittorio Emanuele, Milão, Itália')
  assert.equal(new URL(linkNoMapa({ nome: 'Cassino' }, { nome: 'Mónaco', pais: 'Mónaco' })).searchParams.get('query'), 'Cassino, Mónaco')
  assert.equal(new URL(linkNoMapa({ nome: 'Sem cidade' }, null)).searchParams.get('query'), 'Sem cidade')
})

test('tipo desconhecido vira "outro" (não quebra a tela)', () => {
  assert.equal(tipoDeLugar('passeio').nome, 'Passeio')
  assert.equal(tipoDeLugar('balada').chave, 'outro')
})
