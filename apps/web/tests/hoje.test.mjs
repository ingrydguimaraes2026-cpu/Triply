// Testes da tela Hoje (spec 058). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { agoraEProximo, faltaPara } = await import(new URL('../../../packages/core/src/hoje.ts', import.meta.url))

const ITENS = [
  { hora: '', titulo: 'Saída de Nice' },
  { hora: '09:10', titulo: 'Trem' },
  { hora: '13:00', titulo: 'Almoço' },
  { hora: '20:00', titulo: 'Jantar' },
]

test('agora e próximo', () => {
  assert.deepEqual(agoraEProximo(ITENS, '08:00'), { agora: null, proximo: ITENS[1] })
  assert.deepEqual(agoraEProximo(ITENS, '09:30'), { agora: ITENS[1], proximo: ITENS[2] })
  // Mais de 2 h depois do começo: não é mais "agora"
  assert.deepEqual(agoraEProximo(ITENS, '16:00'), { agora: null, proximo: ITENS[3] })
  assert.deepEqual(agoraEProximo(ITENS, '21:00'), { agora: ITENS[3], proximo: null })
})

test('falta pra', () => {
  assert.equal(faltaPara('09:10', '08:45'), 'em 25 min')
  assert.equal(faltaPara('11:00', '08:50'), 'em 2 h 10 min')
  assert.equal(faltaPara('10:00', '08:00'), 'em 2 h')
  assert.equal(faltaPara('08:00', '09:00'), 'agora')
})

test('dia de passagem e de mudança', async () => {
  const { diaDePassagem } = await import(new URL('../../../packages/core/src/hoje.ts', import.meta.url))
  const MILAO = { id: 'm', nome: 'Milão', chegada: '2026-11-10', saida: '2026-11-10' }
  const ROMA = { id: 'r', nome: 'Roma', chegada: '2026-11-10', saida: '2026-11-14' }
  const dia = (s) => s.slice(0, 10)
  const hora = (s) => s.slice(11, 16)
  const trajetos = [{ origem_id: 'm', destino_id: 'r', partida: '2026-11-10T15:40:00' }]
  assert.deepEqual(diaDePassagem('2026-11-10', MILAO, trajetos, [MILAO, ROMA], dia, hora), { tipo: 'passagem', saida: { hora: '15:40', para: 'Roma' } })
  assert.deepEqual(diaDePassagem('2026-11-14', ROMA, [], [MILAO, ROMA], dia, hora), { tipo: 'mudanca', saida: null })
  assert.equal(diaDePassagem('2026-11-12', ROMA, [], [MILAO, ROMA], dia, hora), null)
  assert.equal(diaDePassagem('2026-11-12', undefined, [], [], dia, hora), null)
})

test('compromissos apertados: conflito com trajeto e folga curta (spec 077)', async () => {
  const { compromissosApertados } = await import(new URL('../../../packages/core/src/hoje.ts', import.meta.url))
  const r = compromissosApertados([
    { chave: 'trem', hora: '09:15', titulo: 'Nice → Roma', fim: '15:40' },
    { chave: 'almoco', hora: '13:00', titulo: 'Almoço' },
    { chave: 'museu', hora: '13:20', titulo: 'Museu' },
    { chave: 'jantar', hora: '20:00', titulo: 'Jantar' },
    { chave: 'livre', hora: '', titulo: 'Comprar chip' },
  ])
  assert.deepEqual(r.almoco, { tipo: 'conflito', com: 'Nice → Roma', minutos: -160 })
  assert.deepEqual(r.museu, { tipo: 'apertado', com: 'Almoço', minutos: 20 })
  assert.equal(r.jantar, undefined)
})

test('volta pra base no bate-e-volta (spec 080)', async () => {
  const { voltaPraBase, linkUltimoTrem } = await import(new URL('../../../packages/core/src/hoje.ts', import.meta.url))
  const dia = (s) => s.slice(0, 10)
  const ida = { origem_id: 'nice', destino_id: 'monaco', partida: '2026-11-10T09:00:00', bate_e_volta: true }
  const volta = { origem_id: 'monaco', destino_id: 'nice', partida: '2026-11-10T18:40:00', bate_e_volta: true }
  assert.deepEqual(voltaPraBase('2026-11-10', [ida, volta], dia), { ida, volta })
  const semHora = { ...volta, partida: null }
  assert.equal(voltaPraBase('2026-11-10', [ida, semHora], dia).volta, semHora)
  assert.equal(voltaPraBase('2026-11-11', [ida, volta], dia), null)
  assert.match(linkUltimoTrem('Mônaco', 'Nice'), /%C3%BAltimo%20trem%20M%C3%B4naco%20para%20Nice/)
})
