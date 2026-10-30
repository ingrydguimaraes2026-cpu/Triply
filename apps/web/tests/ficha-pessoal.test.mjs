// Testes da ficha da pessoa (spec 050). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { aniversariosNaViagem, restricoesDoGrupo } = await import(new URL('../../../packages/core/src/ficha-pessoal.ts', import.meta.url))

test('aniversário durante a viagem, inclusive virando o ano', () => {
  const fichas = [
    { usuario_id: 'a', aniversario: '1990-06-05' },
    { usuario_id: 'b', aniversario: '1988-01-02' },
    { usuario_id: 'c', aniversario: null },
    { usuario_id: 'd', aniversario: '1995-07-30' },
  ]
  assert.deepEqual(aniversariosNaViagem(fichas, '2027-06-01', '2027-06-20'), [{ usuarioId: 'a', dia: '2027-06-05' }])
  assert.deepEqual(aniversariosNaViagem(fichas, '2026-12-28', '2027-01-05'), [{ usuarioId: 'b', dia: '2027-01-02' }])
  assert.deepEqual(aniversariosNaViagem(fichas, null, null), [])
})

test('restrições do grupo pro restaurante', () => {
  const nomes = { a: 'Ana', b: 'Léo' }
  assert.deepEqual(
    restricoesDoGrupo(
      [
        { usuario_id: 'a', restricoes: 'sem glúten', alergias: null },
        { usuario_id: 'b', restricoes: null, alergias: 'amendoim' },
        { usuario_id: 'c', restricoes: null, alergias: null },
      ],
      (id) => nomes[id],
    ),
    ['Ana: sem glúten', 'Léo: alergia a amendoim'],
  )
})
