// Testes das regras de ordem do roteiro (src/features/destinos/ordem.ts). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
const { mover, aplicarOrdem, datasForaDeOrdem } = await import(new URL('../src/features/destinos/ordem.ts', import.meta.url))
const L = [{ chave: 'a' }, { chave: 'b' }, { chave: 'c' }]
const ch = (l) => l.map((x) => x.chave).join('')
test('mover para cima e para baixo', () => {
  assert.equal(ch(mover(L, 1, -1)), 'bac')
  assert.equal(ch(mover(L, 1, 1)), 'acb')
  assert.equal(ch(L), 'abc', 'não muda a lista original')
})
test('mover nas pontas não faz nada', () => {
  assert.equal(mover(L, 0, -1), L)
  assert.equal(mover(L, 2, 1), L)
})
test('aplicarOrdem com os mesmos itens', () => assert.equal(ch(aplicarOrdem(L, ['c', 'a', 'b'])), 'cab'))
test('aplicarOrdem recusa sugestão incompleta, com item a mais ou repetido', () => {
  assert.equal(aplicarOrdem(L, ['c', 'a']), L)
  assert.equal(aplicarOrdem(L, ['c', 'a', 'b', 'x']), L)
  assert.equal(aplicarOrdem(L, ['a', 'a', 'b']), L)
  assert.equal(aplicarOrdem(L, ['a', 'b', 'x']), L)
})
test('datasForaDeOrdem', () => {
  assert.equal(datasForaDeOrdem([{ chegada: '2026-11-01' }, { chegada: null }, { chegada: '2026-11-05' }]), false)
  assert.equal(datasForaDeOrdem([{ chegada: '2026-11-05' }, { chegada: '2026-11-01' }]), true)
  assert.equal(datasForaDeOrdem([{}, {}]), false)
})

test('sugerir ordem: vizinho mais perto a partir do primeiro (spec 076)', async () => {
  const { sugerirOrdem } = await import(new URL('../src/features/destinos/ordem.ts', import.meta.url))
  const roma = { chave: 'roma', latitude: 41.9, longitude: 12.5 }
  const milao = { chave: 'milao', latitude: 45.46, longitude: 9.19 }
  const florenca = { chave: 'florenca', latitude: 43.77, longitude: 11.25 }
  const veneza = { chave: 'veneza', latitude: 45.44, longitude: 12.33 }
  // Roma → Milão → Florença → Veneza dá zigue-zague; o melhor é Roma → Florença → Milão → Veneza (ou parecido)
  const s = sugerirOrdem([roma, milao, florenca, veneza])
  assert.equal(s.chavesNaOrdem[0], 'roma')
  assert.equal(s.chavesNaOrdem[1], 'florenca')
  assert.ok(s.economiaKm >= 30)
  assert.match(s.fonte, /linha reta/)
  // Já está boa: não sugere
  assert.equal(sugerirOrdem([roma, florenca, milao]), null)
  // Sem coordenada fica no fim
  const comVazio = sugerirOrdem([roma, milao, florenca, veneza, { chave: 'x', latitude: null, longitude: null }])
  assert.equal(comVazio.chavesNaOrdem.at(-1), 'x')
})
