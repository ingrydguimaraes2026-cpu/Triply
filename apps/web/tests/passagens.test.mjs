// Testes de Passagens da viagem (spec 122d). Rodar: node --test apps/web/tests/passagens.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { passagensDaViagem } = await import(new URL('../../../packages/core/src/passagens.ts', import.meta.url))

const local = (dia, hora) => new Date(`${dia}T${hora}:00`).toISOString()
let n = 0
const t = (de, para, dia, sai, chega, extra = {}) => ({
  id: `t${++n}`, origem_id: null, destino_id: null, de_texto: de, para_texto: para, meio: 'trem', observacao: null,
  partida: local(dia, sai), chegada: chega ? local(dia, chega) : null, ...extra,
})

test('separa pra decidir, pra comprar e compradas; soma por moeda', () => {
  const trajetos = [
    t('Nice', 'Milão', '2027-06-07', '09:00', '13:00', { situacao: 'decidido', preco: 38, moeda: 'EUR' }),
    t('Tirano', 'Como', '2027-06-09', '06:10', '09:30', { situacao: 'comprado', preco: 12, moeda: 'EUR' }),
    t('Como', 'Lenno', '2027-06-09', '10:00', '10:40', { situacao: 'decidido', meio: 'barco', observacao: 'Compra no cais' }),
    t('Veneza', 'Roma', '2027-06-10', '09:25', '13:32'),
  ]
  const p = passagensDaViagem(trajetos, [], [])
  assert.deepEqual(p.decidir.map((i) => i.titulo), ['Veneza → Roma'])
  assert.deepEqual(p.comprar.map((i) => i.titulo), ['Nice → Milão', 'Como → Lenno'])
  assert.equal(p.comprar[1].naHora, true)
  assert.deepEqual(p.compradas.map((i) => i.titulo), ['Tirano → Como'])
  assert.deepEqual(p.total, { EUR: 50 })
  assert.deepEqual(p.pago, { EUR: 12 })
})

test('opções do mesmo deslocamento contam uma vez, como "comparando"', () => {
  const trajetos = [
    t('Como', 'Veneza', '2027-06-09', '21:36', null, { grupo_opcoes: 'g', escolhida: false, preco: 42, moeda: 'EUR' }),
    t('Como', 'Veneza', '2027-06-09', '22:20', null, { grupo_opcoes: 'g', escolhida: false, meio: 'onibus', preco: 29, moeda: 'EUR' }),
  ]
  const p = passagensDaViagem(trajetos, [], [])
  assert.equal(p.decidir.length, 1)
  assert.equal(p.decidir[0].situacao, 'comparando')
  assert.equal(p.decidir[0].opcoes, 2)
  assert.deepEqual(p.total, { EUR: 42 })
})

test('avisos vermelhos da viagem toda, com o dia e o deslocamento', () => {
  const trajetos = [t('Bellagio', 'Como', '2027-06-09', '20:00', '21:00'), t('Como', 'Veneza', '2027-06-09', '21:15', null)]
  const p = passagensDaViagem(trajetos, [], [])
  assert.equal(p.avisos.length, 1)
  assert.equal(p.avisos[0].dia, '2027-06-09')
  assert.equal(p.avisos[0].trajetoId, trajetos[0].id)
  assert.match(p.avisos[0].titulo, /Folga curta/)
})
