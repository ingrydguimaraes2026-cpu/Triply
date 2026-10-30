// Testes da situação e do preço dos trajetos (spec 035). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { resumoDosTrajetos, nomeDaSituacao } = await import(new URL('../../../packages/core/src/transportes.ts', import.meta.url))

test('resumo: conta comprados e soma o que falta pagar por moeda (em centavos)', () => {
  const r = resumoDosTrajetos([
    { situacao: 'comprado', preco: 80, moeda: 'EUR' },
    { situacao: 'reservado', preco: 45.5, moeda: 'EUR' },
    { situacao: 'sugestao', preco: 30.1, moeda: 'EUR' },
    { situacao: 'sugestao', preco: 2000, moeda: 'BRL' },
    { situacao: 'sugestao', preco: null, moeda: null },
  ])
  assert.equal(r.comprados, 1)
  assert.equal(r.total, 5)
  assert.deepEqual(r.aPagar, [
    { moeda: 'BRL', valor: 200000 },
    { moeda: 'EUR', valor: 7560 },
  ])
  assert.equal(r.semPreco, 1)
})

test('resumo vazio e nome da situação', () => {
  assert.deepEqual(resumoDosTrajetos([]), { comprados: 0, total: 0, aPagar: [], semPreco: 0 })
  assert.equal(nomeDaSituacao('reservado'), 'Reservado')
  assert.equal(nomeDaSituacao('qualquer'), 'Sugestão')
})

test('prontidão: média das partes que existem e o que falta', async () => {
  const { prontidao } = await import(new URL('../../../packages/core/src/transportes.ts', import.meta.url))
  assert.deepEqual(
    prontidao([
      { nome: 'documentos', feitas: 3, total: 4 },
      { nome: 'hospedagem', feitas: 2, total: 2 },
      { nome: 'trajetos', feitas: 0, total: 0 },
    ]),
    { porcento: 88, faltando: ['documentos'] },
  )
  assert.equal(prontidao([{ nome: 'x', feitas: 0, total: 0 }]), null)
})

test('carro: km estimados, combustível e rodízio (spec 073)', async () => {
  const { kmEstimados, combustivelEstimado, rodizio } = await import(new URL('../../../packages/core/src/transportes.ts', import.meta.url))
  const nice = { latitude: 43.7, longitude: 7.26 }
  const monaco = { latitude: 43.73, longitude: 7.42 }
  const km = kmEstimados(nice, monaco)
  assert.ok(km >= 15 && km <= 20, String(km))
  assert.equal(kmEstimados(nice, { latitude: null, longitude: null }), null)
  // 120 km a 12 km/l com litro a € 1,90 = € 19,00
  assert.equal(combustivelEstimado(120, 12, 190), 1900)
  assert.deepEqual(rodizio([{ motorista_id: 'a', km: 100 }, { motorista_id: 'b', km: 50 }, { motorista_id: 'a', km: 20 }, { motorista_id: null, km: 10 }]), [
    { motoristaId: 'a', km: 120, trechos: 2 },
    { motoristaId: 'b', km: 50, trechos: 1 },
  ])
})

test('conexões: leitura segura do JSON, tempo e conexão curta (spec 074)', async () => {
  const { lerEscalas, conexoes, textoDaConexao } = await import(new URL('../../../packages/core/src/transportes.ts', import.meta.url))
  const escalas = lerEscalas([{ local: 'Frankfurt', chegada: '2027-06-01T10:00:00Z', partida: '2027-06-01T10:45:00Z' }, { nada: 1 }, 'x'])
  assert.deepEqual(escalas, [{ local: 'Frankfurt', chegada: '2027-06-01T10:00:00Z', partida: '2027-06-01T10:45:00Z' }])
  assert.deepEqual(conexoes(escalas, 'aviao'), [{ local: 'Frankfurt', minutos: 45, curta: true }])
  assert.equal(conexoes(escalas, 'trem')[0].curta, false)
  assert.deepEqual(lerEscalas(null), [])
  assert.equal(textoDaConexao(70), '1 h 10')
  assert.equal(textoDaConexao(45), '45 min')
})
