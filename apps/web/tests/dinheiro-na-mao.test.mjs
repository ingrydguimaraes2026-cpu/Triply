// Testes do dinheiro na mão (spec 083). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { dinheiroNaMao } = await import(new URL('../../../packages/core/src/dinheiro-na-mao.ts', import.meta.url))

test('compras em espécie menos gastos pagos em dinheiro, só os meus', () => {
  const r = dinheiroNaMao(
    [
      { usuario_id: 'eu', moeda_destino: 'EUR', valorDestino: 20000, especie: true },
      { usuario_id: 'eu', moeda_destino: 'EUR', valorDestino: 50000, especie: false },
      { usuario_id: 'outro', moeda_destino: 'EUR', valorDestino: 10000, especie: true },
    ],
    [
      { pago_por: 'eu', moeda: 'EUR', valor: 4500, meio_pagamento: 'especie' },
      { pago_por: 'eu', moeda: 'EUR', valor: 9999, meio_pagamento: 'cartao' },
      { pago_por: 'outro', moeda: 'EUR', valor: 100, meio_pagamento: 'especie' },
    ],
    'eu',
  )
  assert.deepEqual(r, [{ moeda: 'EUR', valor: 15500 }])
})
