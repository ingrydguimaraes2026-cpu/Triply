// Testes do parser de e-mails da carteira (spec 015), sem internet. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { normalizarValor, moedaDeSimbolo, provedorDoRemetente, interpretarEmail } = await import(
  new URL('../../../supabase/functions/ler-carteiras/parser.ts', import.meta.url)
)

test('normalizarValor: formato pt/eu (1.234,56)', () => {
  assert.equal(normalizarValor('1.234,56'), 1234.56)
  assert.equal(normalizarValor('20,00'), 20)
  assert.equal(normalizarValor('€ 19,90'), 19.9)
  assert.equal(normalizarValor('1 234,56'), 1234.56)
})

test('normalizarValor: formato en (1,234.56)', () => {
  assert.equal(normalizarValor('1,234.56'), 1234.56)
  assert.equal(normalizarValor('$1,000'), 1000)
  assert.equal(normalizarValor('19.90'), 19.9)
})

test('normalizarValor: casos simples e inválidos', () => {
  assert.equal(normalizarValor('20'), 20)
  assert.equal(normalizarValor(''), null)
  assert.equal(normalizarValor('grátis'), null)
})

test('moedaDeSimbolo: símbolo e nome viram ISO', () => {
  assert.equal(moedaDeSimbolo('€'), 'EUR')
  assert.equal(moedaDeSimbolo('EUR'), 'EUR')
  assert.equal(moedaDeSimbolo('euros'), 'EUR')
  assert.equal(moedaDeSimbolo('R$'), 'BRL')
  assert.equal(moedaDeSimbolo('£'), 'GBP')
  assert.equal(moedaDeSimbolo('iene'), null)
})

test('provedorDoRemetente: reconhece Wise e Nomad', () => {
  assert.equal(provedorDoRemetente('no-reply@wise.com'), 'wise')
  assert.equal(provedorDoRemetente('Wise <noreply@transferwise.com>'), 'wise')
  assert.equal(provedorDoRemetente('contato@nomadglobal.com'), 'nomad')
  assert.equal(provedorDoRemetente('newsletter@booking.com'), null)
})

test('interpretarEmail: ignora remetente desconhecido', () => {
  assert.equal(interpretarEmail('x@booking.com', 'oferta', 'corpo'), null)
})

test('interpretarEmail: Wise, entrada (e-mail real de "adicionou")', () => {
  const corpo = 'Você adicionou 20 EUR à sua conta.\n\nE está pronto para ser usado.\n\nWise Brasil Corretora de Câmbio Ltda., CNPJ nº 36.588.217/0001-01.'
  const t = interpretarEmail('Wise <noreply@wise.com>', 'Dinheiro adicionado', corpo)
  assert.deepEqual(t, { tipo: 'entrada', valor: 20, moeda: 'EUR', descricao: 'Entrada (Wise)', data: null, provedor: 'wise' })
})

test('interpretarEmail: Wise, gasto (padrão provisório)', () => {
  const t = interpretarEmail('noreply@wise.com', '', 'Você gastou 15,50 EUR em uma compra.')
  assert.equal(t?.tipo, 'gasto')
  assert.equal(t?.valor, 15.5)
  assert.equal(t?.moeda, 'EUR')
})

test('interpretarEmail: Wise, e-mail que não é transação devolve null', () => {
  assert.equal(interpretarEmail('noreply@wise.com', 'Veja as novidades da Wise', 'Conheça nossos novos recursos.'), null)
})

test('interpretarEmail: ignora valor em dólar (só euro conta)', () => {
  assert.equal(interpretarEmail('noreply@wise.com', '', 'Você adicionou US$ 99,83 à sua conta.'), null)
})

test('interpretarEmail: com dólar e euro juntos, pega o euro', () => {
  const t = interpretarEmail('noreply@wise.com', '', 'Você adicionou US$ 99,83 (€ 90,00) à sua conta.')
  assert.equal(t?.valor, 90)
  assert.equal(t?.moeda, 'EUR')
})

// Nomad: mesmo padrão em português (provisório até ter e-mail real).
test('interpretarEmail: Nomad, gasto', () => {
  const t = interpretarEmail('no-reply@nomadglobal.com', 'Compra aprovada', 'Você gastou 20 EUR em uma compra.')
  assert.deepEqual(t, { tipo: 'gasto', valor: 20, moeda: 'EUR', descricao: 'Gasto (Nomad)', data: null, provedor: 'nomad' })
})

test('interpretarEmail: Nomad, entrada', () => {
  const t = interpretarEmail('contato@nomadglobal.com', '', 'Você adicionou 100 EUR à sua conta.')
  assert.equal(t?.tipo, 'entrada')
  assert.equal(t?.valor, 100)
  assert.equal(t?.provedor, 'nomad')
})
