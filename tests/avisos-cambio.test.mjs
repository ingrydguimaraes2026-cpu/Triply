// Testes de quando avisar (spec 013), sem internet. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { decidir, mensagem } = await import(new URL('../supabase/functions/avisos-cambio/regras.ts', import.meta.url))

test('avisa uma vez quando cruza a meta pra baixo', () => {
  // 5,60 comercial → 5,796 com IOF
  assert.equal(decidir({ meta: 5.8, abaixo: false }, 5.6).acao, 'avisar')
  assert.equal(decidir({ meta: 5.8, abaixo: true }, 5.6).acao, 'nada') // já avisou
  assert.equal(decidir({ meta: 5.7, abaixo: false }, 5.6).acao, 'nada') // ainda acima
})

test('só rearma quando sobe com folga acima da meta', () => {
  assert.equal(decidir({ meta: 5.8, abaixo: true }, 5.61).acao, 'nada') // 5,806: oscilando em cima da meta
  assert.equal(decidir({ meta: 5.8, abaixo: true }, 5.7).acao, 'rearmar') // 5,90
})

test('texto da notificação', () => {
  const m = mensagem('EUR', 5.796, 5.8, 'Riviera')
  assert.equal(m.titulo, '💶 EUR bateu sua meta')
  assert.match(m.corpo, /R\$ 5,80 com IOF \(sua meta: R\$ 5,80\).*Riviera/)
})
