// Testes do texto dos lembretes no celular (spec 032). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { textoDoLembrete, faltaQuanto } = await import(new URL('../../../packages/core/src/lembretes.ts', import.meta.url))

const V = '11111111-1111-1111-1111-111111111111'
const AGORA = new Date('2026-11-10T08:00:00Z')

test('falta quanto: minutos, horas e "agora"', () => {
  assert.equal(faltaQuanto('2026-11-10T08:45:00Z', AGORA), 'em 45 min')
  assert.equal(faltaQuanto('2026-11-10T09:00:00Z', AGORA), 'em 1 h')
  assert.equal(faltaQuanto('2026-11-10T09:10:00Z', AGORA), 'em 1 h 10 min')
  assert.equal(faltaQuanto('2026-11-10T08:00:30Z', AGORA), 'agora')
})

test('trajeto: emoji do meio, rota no corpo e abre Transportes', () => {
  const a = textoDoLembrete({ tipo: 'trajeto', alvo_id: 't1', viagem_id: V, titulo: 'Nice → Mônaco', horario: '2026-11-10T08:50:00Z', meio: 'trem' }, AGORA)
  assert.equal(a.titulo, '🚆 Saída em 50 min')
  assert.match(a.corpo, /^Nice → Mônaco\./)
  assert.equal(a.url, `/viagem/${V}/transportes`)
  assert.equal(a.tag, 'lembrete-trajeto-t1')
})

test('trajeto com meio desconhecido usa a mala', () => {
  const a = textoDoLembrete({ tipo: 'trajeto', alvo_id: 't1', viagem_id: V, titulo: null, horario: '2026-11-10T09:00:00Z', meio: 'outro' }, AGORA)
  assert.equal(a.titulo, '🧳 Saída em 1 h')
  assert.match(a.corpo, /^o trajeto\./)
})

test('ponto de encontro: local no corpo e abre a Overview com foco', () => {
  const a = textoDoLembrete({ tipo: 'ponto', alvo_id: 'p1', viagem_id: V, titulo: 'Recepção do hotel', horario: '2026-11-10T08:15:00Z', meio: null }, AGORA)
  assert.equal(a.titulo, '📍 Encontro em 15 min')
  assert.equal(a.corpo, 'Recepção do hotel. Não se atrase!')
  assert.equal(a.url, `/viagem/${V}?foco=p1`)
})

test('cancelamento: texto com a data do prazo e abre Hospedagem', () => {
  const a = textoDoLembrete({ tipo: 'cancelamento', alvo_id: 'h1', viagem_id: V, titulo: 'Casa da Ana', horario: '2026-11-12T00:00:00+00:00', meio: null }, AGORA)
  assert.equal(a.titulo, '⏳ Cancelamento grátis acabando')
  assert.equal(a.corpo, 'Casa da Ana: dá pra cancelar sem pagar só até 12/11. Ainda vão ficar?')
  assert.equal(a.url, `/viagem/${V}/hospedagem`)
})

test('prazo de cancelamento: tranquilo, perto, hoje e passou', async () => {
  const { prazoDeCancelamento } = await import(new URL('../../../packages/core/src/lembretes.ts', import.meta.url))
  assert.deepEqual(prazoDeCancelamento('2026-11-20', '2026-11-10'), { dias: 10, nivel: 'tranquilo' })
  assert.deepEqual(prazoDeCancelamento('2026-11-12', '2026-11-10'), { dias: 2, nivel: 'perto' })
  assert.deepEqual(prazoDeCancelamento('2026-11-10', '2026-11-10'), { dias: 0, nivel: 'hoje' })
  assert.equal(prazoDeCancelamento('2026-11-01', '2026-11-10').nivel, 'passou')
  assert.equal(prazoDeCancelamento(null, '2026-11-10'), null)
})
