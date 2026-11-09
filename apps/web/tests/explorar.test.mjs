// Testes das regras do Explorar (spec 114), sem rede e sem banco. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const E = await import(new URL('../../../packages/core/src/explorar.ts', import.meta.url))
const { montarDiasPelosVotos } = await import(new URL('../../../packages/core/src/montar-dias.ts', import.meta.url))
const { CIDADES_DA_PRE_CARGA } = await import(new URL('../../../packages/core/src/explorar-cidades.ts', import.meta.url))

const L = (id, extra = {}) => ({
  id, wikidata: null, nome: id, bairro: null, tipo: 'museu', estilos: ['cultura'], fama: 10, latitude: 48.86, longitude: 2.34,
  porQue: null, sobre: null, tempoMin: 60, gratis: null, melhorHora: null, fotoUrl: 'https://x/f.jpg', fotoAutor: null,
  fotoLicenca: null, fotoPagina: null, linkWikipedia: null, ...extra,
})

test('114: tamanho da pilha = vagas × 2,5, entre 15 e 40 (Decisão 4)', () => {
  assert.equal(E.tamanhoDaPilha(4, 3), 30)
  assert.equal(E.tamanhoDaPilha(2, 2), 15)
  assert.equal(E.tamanhoDaPilha(1, 2), 15)
  assert.equal(E.tamanhoDaPilha(10, 4), 40)
  assert.equal(E.porDiaDoRitmo('tranquilo'), 2)
  assert.equal(E.porDiaDoRitmo('intenso'), 4)
})

test('114: pilha põe o estilo escolhido primeiro, depois a fama; tira o que já é da viagem', () => {
  const lugares = [
    L('Ponte', { tipo: 'ponte', estilos: ['romantica'], fama: 5 }),
    L('Museu famoso', { fama: 90 }),
    L('Mirante', { tipo: 'mirante', estilos: ['romantica'], fama: 20 }),
    L('Torre', { wikidata: 'Q243', estilos: ['romantica'], fama: 99 }),
    L('Louvre', { fama: 80 }),
  ]
  const pilha = E.montarPilha(lugares, {
    estilos: ['romantica'], orcamento: 'medio', tamanho: 10,
    jaNaViagem: [{ wikidata: 'Q243', nome: 'Torre Eiffel' }, { wikidata: null, nome: 'louvre' }],
  })
  assert.deepEqual(pilha.map((l) => l.nome), ['Mirante', 'Ponte', 'Museu famoso'])
})

test('114: "grátis e barato" empurra os pagos pro fim; sem foto vai pro fim do grupo; respeita o tamanho', () => {
  const lugares = [L('Pago', { gratis: false, fama: 99 }), L('Grátis', { gratis: true, fama: 1 }), L('Sem foto', { fama: 50, fotoUrl: null }), L('Com foto', { fama: 40 })]
  assert.deepEqual(E.montarPilha(lugares, { estilos: [], orcamento: 'barato', tamanho: 3 }).map((l) => l.nome), ['Com foto', 'Grátis', 'Sem foto'])
})

test('114: deslizar, desfazer e o limite de 3 "não abro mão" (somando os que já tenho)', () => {
  let e = E.comecarDeslize(['a', 'b', 'c', 'd', 'e'])
  e = E.decidir(e, 'nao_abro_mao')
  e = E.decidir(e, 'quero')
  e = E.decidir(e, 'nao_abro_mao', 1) // tinha 1 antigo: agora são 2 aqui... 1 aqui + 1 antigo = 2 < 3, pode
  assert.equal(e.posicao, 3)
  assert.equal(E.podeNaoAbrirMao(e, 1), false) // 2 aqui + 1 antigo = 3
  const travado = E.decidir(e, 'nao_abro_mao', 1)
  assert.equal(travado, e) // não andou
  e = E.decidir(e, 'passo', 1)
  assert.deepEqual(E.contarEscolhas(e.escolhas), { quero: 1, naoAbroMao: 2, passo: 1 })
  e = E.desfazer(e)
  assert.equal(e.posicao, 3)
  assert.equal(e.escolhas.d, undefined)
  assert.equal(E.acabou(e), false)
  e = E.desfazer(E.desfazer(E.desfazer(E.desfazer(e))))
  assert.equal(e.posicao, 0)
  assert.deepEqual(e.escolhas, {})
})

test('114: trecho a pé até 2,5 km; depois transporte; região espalhada > 60 km', () => {
  const louvre = { latitude: 48.8606, longitude: 2.3376 }
  const chapelle = { latitude: 48.8554, longitude: 2.345 }
  assert.match(E.trecho(louvre, chapelle), /^\d+ min a pé$/)
  assert.equal(E.trecho(louvre, { latitude: 48.8049, longitude: 2.1204 }), 'de transporte') // Versalhes, ~17 km
  const florenca = { latitude: 43.7696, longitude: 11.2558 }
  const siena = { latitude: 43.3188, longitude: 11.3308 }
  const pisa = { latitude: 43.7228, longitude: 10.4017 }
  assert.equal(E.regiaoEspalhada([florenca, siena]), false) // ~50 km
  assert.equal(E.regiaoEspalhada([florenca, siena, pisa]), true) // Siena–Pisa ~ 95 km
})

test('114: cidade x região e o raio de busca (Decisão 3)', () => {
  assert.equal(E.ehRegiao('state'), true)
  assert.equal(E.ehRegiao('city'), false)
  assert.equal(E.raioDeBusca('city', [48.81, 48.9, 2.22, 2.47]), 4)
  const toscana = [42.24, 44.47, 9.69, 12.37] // caixa da Toscana: diagonal ~ 330 km → 80 (teto)
  assert.equal(E.raioDeBusca('state', toscana), 80)
  assert.equal(E.raioDeBusca('island', [-3.88, -3.82, -32.47, -32.38]), 15) // Noronha: piso 15
  assert.equal(E.chaveDaCidade('São Paulo', 'BR'), 'sao paulo|br')
})

test('114: crédito da foto (Decisão 6)', () => {
  assert.equal(E.creditoDaFoto('Benh LIEU SONG', 'CC BY-SA 3.0'), 'Foto: Benh LIEU SONG · CC BY-SA 3.0')
  assert.equal(E.creditoDaFoto(null, 'Public domain'), 'Foto: Wikimedia Commons')
  assert.equal(E.creditoDaFoto('<a href="x">Fulano</a>', 'CC BY 4.0'), 'Foto: Fulano · CC BY 4.0')
  assert.ok(E.creditoDaFoto('x'.repeat(80), 'CC BY 2.0').includes('…'))
  assert.equal(E.tempoLegivel(45), '45 min')
  assert.equal(E.tempoLegivel(90), '1h30')
  assert.equal(E.tempoLegivel(400), 'Dia todo')
  assert.equal(E.precoLegivel(true), 'Grátis')
})

test('114: ritmo muda os horários do dia (2, 3 e 4 por dia)', () => {
  const lugares = ['a', 'b', 'c', 'd'].map((n, i) => ({ id: n, nome: n, tipo: 'passeio', votos: 4 - i, prioridades: 0, latitude: 48.86, longitude: 2.34 + i * 0.001 }))
  const quatro = montarDiasPelosVotos(['d1'], lugares, 4)
  assert.deepEqual(quatro.dias[0].itens.map((i) => i.hora), ['09:30', '11:30', '15:00', '17:30'])
  const dois = montarDiasPelosVotos(['d1', 'd2'], lugares, 2)
  assert.deepEqual(dois.dias.map((d) => d.itens.map((i) => i.hora)), [['10:00', '15:00'], ['10:00', '15:00']])
})

test('114: lista da pré-carga tem 100 cidades, sem repetir', () => {
  assert.equal(CIDADES_DA_PRE_CARGA.length, 100)
  assert.equal(new Set(CIDADES_DA_PRE_CARGA.map((c) => E.chaveDaCidade(c.nome, c.pais))).size, 100)
  for (const tipo of Object.values(E.CLASSES_WIKIDATA)) assert.ok(E.INFO_DO_TIPO[tipo], tipo)
})

test('115: pula aeroporto/ponto de partida no Explorar', async () => {
  const { ehPontoDePartida, destinosParaExplorar } = await import(new URL('../../../packages/core/src/explorar-cidades.ts', import.meta.url))
  for (const n of ['Galeão', 'Aeroporto de Guarulhos', 'GRU Airport', 'Santos Dumont', 'Rodoviária do Tietê']) assert.equal(ehPontoDePartida(n), true, n)
  for (const n of ['Rio de Janeiro', 'Gramado', 'Paris', 'Belo Horizonte', 'Porto Alegre']) assert.equal(ehPontoDePartida(n), false, n)
  assert.deepEqual(destinosParaExplorar([{ nome: 'Galeão' }, { nome: 'Lisboa' }]).map((d) => d.nome), ['Lisboa'])
  assert.deepEqual(destinosParaExplorar([{ nome: 'Galeão' }]).map((d) => d.nome), ['Galeão'])
})
