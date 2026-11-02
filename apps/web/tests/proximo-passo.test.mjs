// Testes do cartão "Próximo passo" (spec 115, etapa 2). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { proximoPasso } = await import(new URL('../../../packages/core/src/proximo-passo.ts', import.meta.url))

const base = {
  hoje: '2026-11-02',
  dataInicio: null,
  dataFim: null,
  destinos: [
    { id: 'a', nome: 'Paris' },
    { id: 'b', nome: 'Roma' },
  ],
  lugaresPorDestino: { a: 5, b: 3 },
  pessoas: 3,
  euSouAdm: true,
  semHospedagem: null,
  trechoSemTransporte: null,
}

test('115: destino sem lugares pede pra escolher, no primeiro que falta', () => {
  const p = proximoPasso({ ...base, lugaresPorDestino: { a: 5 } })
  assert.equal(p.chave, 'escolher')
  assert.equal(p.link, 'explorar?destino=b')
  assert.match(p.titulo, /Roma/)
})

test('115: sozinho na viagem pede pra chamar a galera', () => {
  assert.equal(proximoPasso({ ...base, pessoas: 1 }).chave, 'convidar')
})

test('115: sem datas só o ADM vê o pedido de datas', () => {
  assert.equal(proximoPasso(base).chave, 'datas')
  assert.equal(proximoPasso({ ...base, euSouAdm: false }), null)
})

test('115: depois das datas vem hospedagem e depois transporte', () => {
  const comDatas = { ...base, dataInicio: '2027-06-01', dataFim: '2027-06-10' }
  assert.equal(proximoPasso({ ...comDatas, semHospedagem: { nome: 'Paris' }, trechoSemTransporte: { de: 'Paris', para: 'Roma' } }).chave, 'hospedagem')
  assert.equal(proximoPasso({ ...comDatas, trechoSemTransporte: { de: 'Paris', para: 'Roma' } }).titulo, 'Como vocês vão de Paris pra Roma?')
  assert.equal(proximoPasso(comDatas), null)
})

test('115: durante e depois da viagem mudam o cartão, e sem destino não tem cartão', () => {
  assert.equal(proximoPasso({ ...base, dataInicio: '2026-11-01', dataFim: '2026-11-05' }).chave, 'durante')
  assert.equal(proximoPasso({ ...base, dataInicio: '2026-10-01', dataFim: '2026-10-05' }).chave, 'depois')
  assert.equal(proximoPasso({ ...base, destinos: [] }), null)
})
