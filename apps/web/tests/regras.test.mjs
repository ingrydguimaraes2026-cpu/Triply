// Testes das regras puras das specs 001 a 005 (sem banco). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const importar = (arq) => import(new URL(`../src/features/${arq}`, import.meta.url))
const { lerValor, paraBanco, deBanco, formatarDinheiro } = await import(new URL('../../../packages/core/src/dinheiro.ts', import.meta.url))
const { dividirIgual, conferirDivisao, calcularAcertos, totalPorMoeda } = await importar('financeiro/acertos.ts')
const { cotacaoMedia, comparacaoComHoje, converter, montarTaxas } = await importar('cambio/cotacao.ts')
const { contarNoites, avisosDasDatas, periodoDosDestinos, destinoDeHoje } = await importar('destinos/datas.ts')
const { avisosDoTrajeto, proximoTrajeto, proximoDeslocamento } = await importar('transportes/avisos.ts')

// ---------- Dinheiro ----------
test('lerValor entende o jeito brasileiro e o com ponto', () => {
  assert.equal(lerValor('12'), 1200)
  assert.equal(lerValor('12,5'), 1250)
  assert.equal(lerValor('1.234,56'), 123456)
  assert.equal(lerValor('12.50'), 1250)
  assert.equal(lerValor('3.060'), 306000)
  assert.equal(lerValor('€ 7,90'), 790)
  assert.equal(lerValor('abc'), null)
  assert.equal(lerValor('1,234'), null)
  assert.equal(lerValor(''), null)
})

test('paraBanco e deBanco não perdem centavo', () => {
  assert.equal(paraBanco(1205), '12.05')
  assert.equal(paraBanco(7), '0.07')
  assert.equal(deBanco('0.29'), 29)
  assert.equal(deBanco(19.99), 1999)
})

test('formatarDinheiro em português', () => {
  assert.match(formatarDinheiro(2350, 'EUR'), /23,50/)
  assert.match(formatarDinheiro(123456, 'BRL'), /R\$\s?1\.234,56/)
})

// ---------- Divisão e acertos (spec 002) ----------
test('dividir igual: sobra fica com quem pagou', () => {
  const d = dividirIgual(1000, ['a', 'b', 'c'], 'b')
  assert.deepEqual(d.map((x) => x.valor), [333, 334, 333])
  assert.equal(conferirDivisao(1000, d).fecha, true)
})

test('dividir igual: pagador fora da divisão, sobra 1 centavo pra cada', () => {
  const d = dividirIgual(1000, ['a', 'b', 'c'], 'x')
  assert.deepEqual(d.map((x) => x.valor), [334, 333, 333])
})

test('conferirDivisao avisa quanto falta', () => {
  const r = conferirDivisao(1200, [{ usuarioId: 'a', valor: 500 }, { usuarioId: 'b', valor: 500 }])
  assert.equal(r.fecha, false)
  assert.equal(r.falta, 200)
})

const cafe = { pagoPor: 'ingryd', moeda: 'EUR', valor: 1200, pessoal: false, divisoes: dividirIgual(1200, ['victor', 'ingryd'], 'ingryd') }

test('critério: café € 12 pago pela Ingryd entre 2 → Victor deve € 6', () => {
  assert.deepEqual(calcularAcertos([cafe]), [{ de: 'victor', para: 'ingryd', valor: 600, moeda: 'EUR' }])
})

test('acertos: dívidas cruzadas se compensam', () => {
  const jantar = { pagoPor: 'victor', moeda: 'EUR', valor: 1200, pessoal: false, divisoes: dividirIgual(1200, ['victor', 'ingryd'], 'victor') }
  assert.deepEqual(calcularAcertos([cafe, jantar]), [])
})

test('acertos: cada moeda separada e pessoal não entra', () => {
  const real = { pagoPor: 'victor', moeda: 'BRL', valor: 3000, pessoal: false, divisoes: dividirIgual(3000, ['victor', 'ingryd'], 'victor') }
  const pessoal = { pagoPor: 'ingryd', moeda: 'EUR', valor: 9999, pessoal: true, divisoes: [] }
  const r = calcularAcertos([cafe, real, pessoal])
  assert.deepEqual(r, [
    { de: 'victor', para: 'ingryd', valor: 600, moeda: 'EUR' },
    { de: 'ingryd', para: 'victor', valor: 1500, moeda: 'BRL' },
  ])
})

test('acertos: 3 pessoas, poucos pagamentos', () => {
  const hotel = { pagoPor: 'a', moeda: 'EUR', valor: 30000, pessoal: false, divisoes: dividirIgual(30000, ['a', 'b', 'c'], 'a') }
  const r = calcularAcertos([hotel])
  assert.equal(r.length, 2)
  assert.ok(r.every((x) => x.para === 'a' && x.valor === 10000))
})

test('total separado por moeda', () => {
  assert.deepEqual(totalPorMoeda([{ moeda: 'EUR', valor: 32000 }, { moeda: 'BRL', valor: 15000 }, { moeda: 'EUR', valor: 100 }]), {
    EUR: 32100,
    BRL: 15000,
  })
})

// ---------- Câmbio (spec 003) ----------
test('critério: R$ 3.060 → € 500 dá cotação 6,12', () => {
  assert.equal(cotacaoMedia([{ moedaOrigem: 'BRL', moedaDestino: 'EUR', valorOrigem: 3060, valorDestino: 500 }]), 6.12)
})

test('critério: duas compras (6,00 e 6,24) dão a média ponderada', () => {
  const m = cotacaoMedia([
    { moedaOrigem: 'BRL', moedaDestino: 'EUR', valorOrigem: 600, valorDestino: 100 },
    { moedaOrigem: 'BRL', moedaDestino: 'EUR', valorOrigem: 1872, valorDestino: 300 },
  ])
  assert.equal(m, 2472 / 400) // 6,18, não a média simples 6,12
})

test('comparação com hoje: 6,12 contra 6,30 = 2,9% mais barato', () => {
  assert.equal(comparacaoComHoje(6.12, 6.3).toFixed(1), '2.9')
})

test('converter usa a média do comboio e cai pra cotação de hoje', () => {
  const taxas = montarTaxas([{ moedaOrigem: 'BRL', moedaDestino: 'EUR', valorOrigem: 612, valorDestino: 100 }], 'EUR', { BRL: 6.3, CHF: 0.95 })
  assert.equal(converter(61200, 'BRL', 'EUR', taxas), 10000)
  assert.equal(converter(9500, 'CHF', 'EUR', taxas), 10000)
  assert.equal(converter(1000, 'JPY', 'EUR', taxas), null)
  assert.equal(converter(1000, 'EUR', 'EUR', taxas), 1000)
})

// ---------- Datas (spec 001) ----------
test('critério: chegada 12, saída 15 = 3 noites', () => {
  assert.equal(contarNoites('2026-11-12', '2026-11-15'), 3)
  assert.equal(contarNoites('2026-11-12', null), null)
  assert.equal(contarNoites('2026-10-31', '2026-11-02'), 2)
})

test('avisos das datas', () => {
  const avisos = avisosDasDatas(
    [
      { nome: 'Nice', chegada: '2026-11-12', saida: '2026-11-15' },
      { nome: 'Mônaco', chegada: '2026-11-14', saida: '2026-11-16' },
      { nome: 'Milão', chegada: '2026-11-19', saida: '2026-11-18' },
      { nome: 'Zurique', chegada: '2026-11-20', saida: '2026-11-25' },
    ],
    '2026-11-12',
    '2026-11-22',
  )
  const textos = avisos.map((a) => a.texto)
  assert.ok(textos.includes('Milão: a saída está antes da chegada.'))
  assert.equal(avisos.find((a) => a.texto.startsWith('Milão: a saída')).tipo, 'bloqueia')
  assert.ok(textos.includes('Zurique: data fora do período da viagem.'))
  assert.ok(textos.includes('Nice e Mônaco se sobrepõem.'))
  assert.ok(textos.includes('3 dias sem destino entre Mônaco e Zurique.'))
})

test('sair e chegar no mesmo dia não é sobreposição', () => {
  const avisos = avisosDasDatas(
    [
      { nome: 'Nice', chegada: '2026-11-12', saida: '2026-11-15' },
      { nome: 'Milão', chegada: '2026-11-15', saida: '2026-11-17' },
    ],
    null,
    null,
  )
  assert.deepEqual(avisos, [])
})

test('período e destino de hoje', () => {
  const itens = [
    { nome: 'Nice', chegada: '2026-11-12', saida: '2026-11-15' },
    { nome: 'Milão', chegada: '2026-11-15', saida: '2026-11-17' },
    { nome: 'Sem data' },
  ]
  assert.deepEqual(periodoDosDestinos(itens), { inicio: '2026-11-12', fim: '2026-11-17' })
  assert.equal(destinoDeHoje(itens, '2026-11-13'), 0)
  assert.equal(destinoDeHoje(itens, '2026-11-16'), 1)
  assert.equal(destinoDeHoje(itens, '2026-12-01'), -1)
})

test('bate-e-volta dentro da estadia de uma base não é sobreposição (Nice → Mônaco → Nice)', () => {
  const roteiro = [
    { nome: 'Nice', chegada: '2027-06-04', saida: '2027-06-07' },
    { nome: 'Mônaco', chegada: '2027-06-06', saida: '2027-06-06' },
    { nome: 'Milão', chegada: '2027-06-07', saida: '2027-06-08' },
  ]
  assert.deepEqual(avisosDasDatas(roteiro, '2027-06-04', '2027-06-20'), [])
  // No dia da corrida o destaque é Mônaco; nos outros dias, Nice
  assert.equal(destinoDeHoje(roteiro, '2027-06-06'), 1)
  assert.equal(destinoDeHoje(roteiro, '2027-06-05'), 0)
})

test('cidade repetida com o passeio entre as duas estadias continua sem aviso', () => {
  const roteiro = [
    { nome: 'Nice', chegada: '2027-06-04', saida: '2027-06-06' },
    { nome: 'Mônaco', chegada: '2027-06-06', saida: '2027-06-06' },
    { nome: 'Nice', chegada: '2027-06-06', saida: '2027-06-07' },
  ]
  assert.deepEqual(avisosDasDatas(roteiro, null, null), [])
})

test('passeio não esconde problemas de verdade: estadias sobrepostas e buracos continuam avisando', () => {
  const sobrepostas = avisosDasDatas(
    [
      { nome: 'Nice', chegada: '2027-06-04', saida: '2027-06-07' },
      { nome: 'Mônaco', chegada: '2027-06-05', saida: '2027-06-05' },
      { nome: 'Milão', chegada: '2027-06-06', saida: '2027-06-08' },
    ],
    null,
    null,
  ).map((a) => a.texto)
  assert.ok(sobrepostas.includes('Nice e Milão se sobrepõem.'))

  // Dia de passagem fora de qualquer estadia continua contando pro "buraco"
  const buraco = avisosDasDatas(
    [
      { nome: 'Nice', chegada: '2027-06-04', saida: '2027-06-05' },
      { nome: 'Milão', chegada: '2027-06-07', saida: '2027-06-07' },
    ],
    null,
    null,
  ).map((a) => a.texto)
  assert.ok(buraco.includes('1 dia sem destino entre Nice e Milão.'))
})

// ---------- Transportes (spec 004) ----------
const destinos = [
  { id: 'nice', nome: 'Nice', chegada: '2026-11-12', saida: '2026-11-14' },
  { id: 'monaco', nome: 'Mônaco', chegada: '2026-11-14', saida: '2026-11-14' },
]

test('trajeto sem destino avisa em vez de quebrar', () => {
  const t = { id: '1', origem_id: 'nice', destino_id: null, partida: null, chegada: null, bate_e_volta: false }
  assert.match(avisosDoTrajeto(t, destinos)[0], /sem destino/)
})

test('bate-e-volta avisa da diária, e é exato quando a volta passa da saída', () => {
  const ida = { id: 'i', origem_id: 'nice', destino_id: 'monaco', partida: '2026-11-14T09:10:00', chegada: '2026-11-14T09:35:00', bate_e_volta: true }
  const volta = { id: 'v', origem_id: 'monaco', destino_id: 'nice', partida: '2026-11-14T20:00:00', chegada: '2026-11-14T20:25:00', bate_e_volta: true }
  assert.match(avisosDoTrajeto(ida, destinos, [ida, volta]).join(), /voltam pra Nice no mesmo dia/)
  const voltaTarde = { ...volta, partida: '2026-11-15T09:00:00', chegada: '2026-11-15T09:30:00' }
  assert.match(avisosDoTrajeto(ida, destinos, [ida, voltaTarde]).join(), /saída de Nice é dia 14, mas a volta do bate-e-volta é dia 15/)
})

test('partida antes de chegar na origem avisa', () => {
  const t = { id: '1', origem_id: 'nice', destino_id: 'monaco', partida: '2026-11-10T09:00:00', chegada: null, bate_e_volta: false }
  assert.match(avisosDoTrajeto(t, destinos).join(), /antes da chegada de vocês lá/)
})

test('próximo trajeto é o de partida mais próxima no futuro', () => {
  const agora = new Date('2026-11-13T12:00:00')
  const lista = [
    { id: 'passado', partida: '2026-11-12T10:00:00' },
    { id: 'depois', partida: '2026-11-16T10:00:00' },
    { id: 'proximo', partida: '2026-11-14T09:10:00' },
    { id: 'sem', partida: null },
  ]
  assert.equal(proximoTrajeto(lista, agora).id, 'proximo')
  assert.equal(proximoTrajeto([], agora), null)
})

test('próximo deslocamento: sem nenhum horário, é o primeiro da ordem do roteiro (com Nice repetida)', () => {
  // Paris → Nice → Mônaco → Nice → Milão: cada Nice tem um id próprio
  const ordem = ['paris', 'nice1', 'monaco', 'nice2', 'milao']
  const t = (id, origem_id, destino_id, partida = null) => ({ id, origem_id, destino_id, partida })
  const lista = [t('nice2-milao', 'nice2', 'milao'), t('monaco-nice2', 'monaco', 'nice2'), t('nice1-monaco', 'nice1', 'monaco'), t('paris-nice1', 'paris', 'nice1')]
  const agora = new Date('2026-10-20T12:00:00')
  assert.equal(proximoDeslocamento(lista, ordem, agora).id, 'paris-nice1')
  // A volta Mônaco → Nice (2ª Nice) vem antes de Nice → Milão
  const semOsDoisPrimeiros = lista.filter((x) => !['paris-nice1', 'nice1-monaco'].includes(x.id))
  assert.equal(proximoDeslocamento(semOsDoisPrimeiros, ordem, agora).id, 'monaco-nice2')
})

test('próximo deslocamento: com horário no futuro, ele vence; horário que já passou não conta', () => {
  const ordem = ['a', 'b', 'c']
  const agora = new Date('2027-06-05T12:00:00')
  const lista = [
    { id: 'passou', origem_id: 'a', destino_id: 'b', partida: '2027-06-04T09:00:00' },
    { id: 'sem-hora', origem_id: 'a', destino_id: 'b', partida: null },
    { id: 'marcado', origem_id: 'b', destino_id: 'c', partida: '2027-06-07T09:00:00' },
  ]
  assert.equal(proximoDeslocamento(lista, ordem, agora).id, 'marcado')
  // Só o que já passou → nenhum
  assert.equal(proximoDeslocamento([lista[0]], ordem, agora), null)
  // Origem que não está no roteiro (destino apagado) vai pro fim, mas não some
  assert.equal(proximoDeslocamento([{ id: 'orfao', origem_id: null, destino_id: 'c', partida: null }], ordem, agora).id, 'orfao')
})
