// Testes do "montar os dias pelos votos" (spec 096). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { montarDiasPelosVotos } = await import(new URL('../../../packages/core/src/montar-dias.ts', import.meta.url))

const L = (id, tipo, votos, prioridades, lat, lng) => ({ id, nome: id, tipo, votos, prioridades, latitude: lat, longitude: lng })

test('096: não abre mão primeiro, depois votos; perto fica junto; comida no meio', () => {
  const lugares = [
    L('Museu A', 'passeio', 1, 1, 43.7, 7.26), // prioridade: começa o dia 1
    L('Castelo', 'passeio', 3, 0, 43.73, 7.42), // mais votado: começa o dia 2
    L('Igreja perto do Museu', 'passeio', 0, 0, 43.701, 7.261),
    L('Jardim perto do Castelo', 'passeio', 0, 0, 43.731, 7.421),
    L('Pizzaria', 'comida', 2, 0, 43.7, 7.26),
    L('Guarda-volumes', 'guarda_volumes', 5, 0, 43.7, 7.26),
  ]
  const { dias, sobraram } = montarDiasPelosVotos(['2026-11-20', '2026-11-21'], lugares)
  assert.deepEqual(
    dias.map((d) => [d.dia, d.itens.map((i) => `${i.hora} ${i.nome}`)]),
    [
      ['2026-11-20', ['10:00 Museu A', '13:00 Pizzaria', '15:00 Igreja perto do Museu']],
      ['2026-11-21', ['10:00 Castelo', '15:00 Jardim perto do Castelo']],
    ],
  )
  assert.deepEqual(sobraram, [])
})

test('096: sem coordenada vai pro dia mais vazio; o que não cabe sobra', () => {
  const lugares = ['a', 'b', 'c', 'd', 'e'].map((n, i) => L(n, 'passeio', 5 - i, 0, null, null))
  const { dias, sobraram } = montarDiasPelosVotos(['d1', 'd2'], lugares, 2)
  assert.deepEqual(dias.map((d) => d.itens.map((i) => i.nome)), [['a', 'c'], ['b', 'd']])
  assert.deepEqual(sobraram, ['e'])
  assert.deepEqual(montarDiasPelosVotos([], lugares).sobraram.length, 5)
})
