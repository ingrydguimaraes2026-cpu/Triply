// Testes dos feriados nas datas (spec 095). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { urlDosFeriados, consultasDeFeriados, feriadosNaViagem } = await import(new URL('../../../packages/core/src/feriados.ts', import.meta.url))

const destinos = [
  { nome: 'Nice', codigo: 'FR', chegada: '2026-10-30', saida: '2026-11-02' },
  { nome: 'Mônaco', codigo: 'mc', chegada: '2026-12-31', saida: '2027-01-02' },
  { nome: 'Sem data', codigo: 'IT', chegada: null, saida: null },
]

test('095: busca cada país e ano da viagem', () => {
  assert.equal(urlDosFeriados(2026, 'fr'), 'https://date.nager.at/api/v3/PublicHolidays/2026/FR')
  assert.deepEqual(consultasDeFeriados(destinos), [
    { ano: 2026, codigo: 'FR' },
    { ano: 2026, codigo: 'MC' },
    { ano: 2027, codigo: 'MC' },
  ])
})

test('095: só os feriados enquanto o comboio está no país', () => {
  const api = [
    { date: '2026-11-01', localName: 'Toussaint', name: "All Saints' Day", countryCode: 'FR', global: true, counties: null },
    { date: '2026-11-11', localName: 'Armistice', name: 'Armistice Day', countryCode: 'FR', global: true, counties: null },
    { date: '2027-01-01', localName: "Jour de l'an", name: "New Year's Day", countryCode: 'MC', global: true, counties: null },
    { date: '2026-11-01', localName: 'Ognissanti', name: "All Saints' Day", countryCode: 'IT', global: true, counties: null },
    { date: '2026-11-02', localName: 'Local', name: 'Regional Day', countryCode: 'FR', global: false, counties: ['FR-PAC'] },
  ]
  const lista = feriadosNaViagem(api, destinos)
  assert.deepEqual(lista.map((f) => [f.data, f.nomeLocal, f.destino, f.regional]), [
    ['2026-11-01', 'Toussaint', 'Nice', false],
    ['2026-11-02', 'Local', 'Nice', true],
    ['2027-01-01', "Jour de l'an", 'Mônaco', false],
  ])
})
