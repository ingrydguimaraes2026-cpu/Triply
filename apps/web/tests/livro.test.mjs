// Testes do livro da viagem (spec 106). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { paginasDoLivro } = await import(new URL('../../../packages/core/src/livro.ts', import.meta.url))

test('106: uma página por dia com alguma coisa, em ordem', () => {
  const paginas = paginasDoLivro(
    [{ dia: '2026-11-21', t: 'Jantar' }],
    [{ dia: '2026-11-20', t: 'Chegamos' }, { dia: '2026-11-21', t: 'Choveu' }],
    [{ dia: '2026-11-22', url: 'x' }],
  )
  assert.deepEqual(paginas.map((p) => [p.dia, p.agenda.length, p.diario.length, p.fotos.length]), [
    ['2026-11-20', 0, 1, 0],
    ['2026-11-21', 1, 1, 0],
    ['2026-11-22', 0, 0, 1],
  ])
  assert.deepEqual(paginasDoLivro([], [], []), [])
})
