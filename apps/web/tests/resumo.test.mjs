// Testes do resumo da noite (spec 042). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { resumoDeAmanha, fusoAproximado, horaLocal } = await import(new URL('../../../packages/core/src/resumo.ts', import.meta.url))

const NICE = { id: 'n', nome: 'Nice', chegada: '2026-11-08', saida: '2026-11-11', longitude: 7.26 }
const ROMA = { id: 'r', nome: 'Roma', chegada: '2026-11-11', saida: '2026-11-14', longitude: 12.5 }

test('fuso aproximado pela longitude e hora local', () => {
  assert.equal(fusoAproximado(7.26), 0)
  assert.equal(fusoAproximado(12.5), 1)
  assert.equal(fusoAproximado(-43.2), -3)
  assert.equal(fusoAproximado(null), 0)
  assert.deepEqual(horaLocal('2026-11-10T23:30:00Z', 1), { dia: '2026-11-11', hora: '00:30', h: 0 })
})

test('resumo com trajeto, encontro e evento, em ordem de hora', () => {
  const r = resumoDeAmanha('2026-11-11', 1, {
    destinos: [NICE, ROMA],
    trajetos: [{ origem_id: 'n', destino_id: 'r', meio: 'trem', partida: '2026-11-11T08:10:00Z' }],
    pontos: [{ local: 'Recepção', quando: '2026-11-11T07:30:00Z' }],
    eventos: [{ dia: '2026-11-11', hora: '20:00:00', titulo: 'Jantar' }],
  })
  assert.equal(r.titulo, '🌙 Amanhã em Roma · começa 08:30')
  assert.equal(r.corpo, '08:30 Encontro: Recepção · 09:10 Trem Nice → Roma · 20:00 Jantar · Chegada em Roma')
})

test('sem nada marcado: não manda', () => {
  assert.equal(resumoDeAmanha('2026-11-09', 0, { destinos: [NICE], trajetos: [], pontos: [], eventos: [] }), null)
})
