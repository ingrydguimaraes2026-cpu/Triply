// Testes do álbum por dia e melhores fotos (spec 098). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { albumPorDia, melhoresPosts } = await import(new URL('../../../packages/core/src/album.ts', import.meta.url))

const P = (id, criado_em, destino_id, curtidas = 0, comentarios = 0) => ({ id, criado_em, destino_id, curtidas: Array(curtidas).fill('x'), comentarios: Array(comentarios).fill('c') })
const destinos = [
  { id: 'n', nome: 'Nice', chegada: '2026-11-20', saida: '2026-11-22' },
  { id: 'm', nome: 'Mônaco', chegada: '2026-11-22', saida: '2026-11-23' },
]

test('098: álbum por dia, na ordem da viagem, com o destino', () => {
  const posts = [P('c', '2026-11-22T15:00:00', 'm'), P('a', '2026-11-20T10:00:00', null), P('b', '2026-11-20T18:00:00', null), P('d', '2026-11-25T10:00:00', null)]
  assert.deepEqual(
    albumPorDia(posts, destinos).map((g) => [g.dia, g.destino, g.posts.map((p) => p.id)]),
    [
      ['2026-11-20', 'Nice', ['a', 'b']],
      ['2026-11-22', 'Mônaco', ['c']],
      ['2026-11-25', null, ['d']],
    ],
  )
})

test('098: melhores fotos por curtida, comentário e data', () => {
  const posts = [P('a', '2026-11-20T10:00:00', null, 2, 0), P('b', '2026-11-21T10:00:00', null, 2, 3), P('c', '2026-11-22T10:00:00', null, 0, 9), P('d', '2026-11-23T10:00:00', null, 2, 0), P('e', '2026-11-23T11:00:00', null, 5, 0)]
  assert.deepEqual(melhoresPosts(posts).map((p) => p.id), ['e', 'b', 'd', 'a'])
  assert.equal(melhoresPosts(posts, 2).length, 2)
})

test('100: texto de quem está na foto', async () => {
  const { textoDosMarcados } = await import(new URL('../../../packages/core/src/album.ts', import.meta.url))
  const nomes = { a: 'Ingryd Guimarães', b: 'Victor', c: 'Ana', d: 'Bia' }
  const de = (id) => nomes[id]
  assert.equal(textoDosMarcados([], de), '')
  assert.equal(textoDosMarcados(['a'], de), 'com Ingryd')
  assert.equal(textoDosMarcados(['a', 'b'], de), 'com Ingryd e Victor')
  assert.equal(textoDosMarcados(['a', 'b', 'c'], de), 'com Ingryd, Victor e Ana')
  assert.equal(textoDosMarcados(['a', 'b', 'c', 'd'], de), 'com Ingryd, Victor e mais 2')
})
