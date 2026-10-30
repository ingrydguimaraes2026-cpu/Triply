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
