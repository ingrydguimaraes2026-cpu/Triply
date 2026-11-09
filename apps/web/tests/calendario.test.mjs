// Testes do calendário .ics da viagem (spec 036). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { gerarIcs, nomeDoArquivoIcs } = await import(new URL('../../../packages/core/src/calendario.ts', import.meta.url))
const AGORA = new Date('2026-10-30T03:00:00Z')

test('ics: cabeçalho, evento com hora UTC, hora local e dia inteiro', () => {
  const ics = gerarIcs(
    'Riviera',
    [
      { uid: 't1', titulo: 'Trem Nice → Mônaco', inicio: '2026-11-10T08:30:00Z', fim: '2026-11-10T09:00:00Z' },
      { uid: 'e1', titulo: 'Jantar', inicio: '2026-11-10T20:00', local: 'Le Safari, Nice' },
      { uid: 'd1', titulo: 'Em Nice', inicio: '2026-11-08', fim: '2026-11-10' },
    ],
    AGORA,
  )
  assert.match(ics, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/)
  assert.match(ics, /X-WR-CALNAME:Riviera\r\n/)
  assert.match(ics, /UID:t1@together\r\nDTSTAMP:20261030T030000Z\r\nDTSTART:20261110T083000Z\r\nDTEND:20261110T090000Z\r\n/)
  // Hora local, sem fuso; vírgula escapada no local
  assert.match(ics, /DTSTART:20261110T200000\r\n/)
  assert.match(ics, /LOCATION:Le Safari\\, Nice\r\n/)
  // Dia inteiro: fim exclusivo (dia seguinte ao último)
  assert.match(ics, /DTSTART;VALUE=DATE:20261108\r\nDTEND;VALUE=DATE:20261111\r\n/)
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
})

test('ics: linhas compridas dobram em 75 bytes; quebra de linha vira \\n', () => {
  const ics = gerarIcs('X', [{ uid: 'a', titulo: 'Á'.repeat(60), inicio: '2026-11-10', descricao: 'linha 1\nlinha 2' }], AGORA)
  for (const linha of ics.split('\r\n')) assert.ok(new TextEncoder().encode(linha).length <= 75, linha)
  assert.match(ics, /DESCRIPTION:linha 1\\nlinha 2/)
})

test('nome do arquivo sem acento nem espaço', () => {
  assert.equal(nomeDoArquivoIcs('Riviera Francesa 2026!'), 'riviera-francesa-2026.ics')
  assert.equal(nomeDoArquivoIcs('Côte d’Azur'), 'cote-d-azur.ics')
  assert.equal(nomeDoArquivoIcs('***'), 'viagem.ics')
})
