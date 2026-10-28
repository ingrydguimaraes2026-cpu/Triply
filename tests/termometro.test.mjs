// Testes do termômetro do câmbio, sem internet. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { analisar, percentil, ultimosDias, comIOF, taxaDoApp, custoEmReais, custoDaCompra, bateuMeta, pontosDoGrafico } = await import(
  new URL('../src/features/cambio/termometro.ts', import.meta.url)
)

// 100 dias, de 5,50 subindo 0,01 por dia (até 6,49)
const serie = Array.from({ length: 100 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 6, 10 + i)).toISOString().slice(0, 10)
  return { data: d, valor: 5.5 + i * 0.01 }
})
const HOJE = serie[99].data

test('percentil e recorte de dias', () => {
  assert.equal(percentil([1, 2, 3, 4], 0.5), 0)
  assert.equal(percentil([1, 2, 3, 4], 5), 1)
  assert.equal(percentil([], 3), 0.5)
  assert.equal(ultimosDias(serie, 30, HOJE).length, 30)
  assert.equal(ultimosDias(serie, 90, HOJE)[0].valor.toFixed(2), '5.60')
})

test('barato, médio e caro em relação aos 90 dias', () => {
  assert.equal(analisar(serie, 5.6, HOJE).nivel, 'barato')
  assert.equal(analisar(serie, 6.05, HOJE).nivel, 'medio')
  assert.equal(analisar(serie, 6.45, HOJE).nivel, 'caro')
  const a = analisar(serie, 6.05, HOJE)
  assert.equal(a.min90.toFixed(2), '5.60')
  assert.equal(a.max90.toFixed(2), '6.49')
  assert.ok(Math.abs(a.vsMedia) < 0.1) // 6,05 é a média
  assert.equal(analisar([], 6, HOJE), null)
})

test('IOF, taxa do app, custo e meta', () => {
  assert.equal(comIOF(6).toFixed(2), '6.21')
  // viu 6,27 na Nomad com comercial 6,00: 6,21 é o piso, então ~0,97% é do app
  assert.equal(taxaDoApp(6.27, 6).toFixed(2), '0.97')
  assert.equal(custoEmReais(100000, 6.21), 621000) // €1.000 → R$ 6.210,00
  assert.equal(bateuMeta(6.25, 6), true)
  assert.equal(bateuMeta(6.1, 6), false)
  assert.equal(bateuMeta(null, 6), false)
})

test('pontos do gráfico ocupam a caixa toda', () => {
  const p = pontosDoGrafico(serie, 300, 100)
  assert.equal(p[0].x, 0)
  assert.equal(p[99].x, 300)
  assert.equal(p[0].y, 100) // menor valor embaixo
  assert.equal(p[99].y, 0) // maior em cima
  assert.deepEqual(pontosDoGrafico([], 10, 10), [])
})

// Números lidos nos apps durante a reunião de 19/10/2026 (comercial R$ 5,65; € 25)
test('custo da compra: Nomad (comercial + IOF 3,5% + taxa do app ≈ 2% = R$ 149,24)', () => {
  const c = custoDaCompra(2500, 5.65, 149.24 / 25)
  assert.equal(c.comercial, 14125) // R$ 141,25
  assert.equal(c.iof, 494) // R$ 4,94
  assert.equal(c.final, 14924) // R$ 149,24, o total que o app mostrou
  assert.equal(c.taxaApp, 305) // o resto: R$ 3,05
  assert.equal(c.comercial + c.iof + c.taxaApp, c.final)
  // A Nomad mostrou "taxa de conversão de 2%": a conta reconstrói isso a partir do total
  assert.ok(Math.abs(c.taxaAppPct - 2) < 0.15, `taxa do app ≈ 2% (deu ${c.taxaAppPct})`)
})

test('custo da compra: Wise sai mais barata com o mesmo comercial (R$ 147,19)', () => {
  const wise = custoDaCompra(2500, 5.65, 147.19 / 25)
  const nomad = custoDaCompra(2500, 5.65, 149.24 / 25)
  assert.equal(wise.final, 14719)
  assert.ok(wise.taxaApp < nomad.taxaApp)
  assert.ok(Math.abs(wise.taxaAppPct - 0.6) < 0.1, `taxa da Wise ≈ 0,6% (deu ${wise.taxaAppPct})`)
})

test('custo da compra sem a cotação do app: mostra o piso (comercial + IOF) e não inventa taxa', () => {
  const c = custoDaCompra(200000, 5.65, null) // € 2.000
  assert.equal(c.taxaApp, null)
  assert.equal(c.taxaAppPct, null)
  assert.equal(c.final, c.comercial + c.iof)
  assert.equal(c.comercial, 1130000) // R$ 11.300,00
})

test('custo da compra: cotação abaixo do piso dá taxa negativa (o app provavelmente não somou o IOF)', () => {
  const c = custoDaCompra(10000, 5.65, 5.7)
  assert.ok(c.taxaApp < 0)
  assert.equal(c.comercial + c.iof + c.taxaApp, c.final)
})
