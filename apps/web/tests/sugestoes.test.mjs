// Testes das sugestões de lugares (spec 094, agora pelo catálogo do Explorar). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { sugestoesDoCatalogo } = await import(new URL('../../../packages/core/src/ferramentas.ts', import.meta.url))

const lugar = (id, nome, fama, extra = {}) => ({ id, nome, tipoNome: 'Museu', fama, latitude: 43.7, longitude: 7.26, linkWikipedia: null, ...extra })

test('094: mais famosos primeiro, sem repetidos nem já salvos', () => {
  const lista = sugestoesDoCatalogo(
    [
      lugar('1', 'Musée Matisse', 40),
      lugar('2', 'Colina do Castelo', 90, { tipoNome: 'Mirante', linkWikipedia: 'https://fr.wikipedia.org/wiki/Colline_du_Ch%C3%A2teau' }),
      lugar('3', 'Musee Matisse', 30),
      lugar('4', 'Castelo', 99),
    ],
    43.7,
    7.26,
    ['castelo'],
  )
  assert.deepEqual(lista.map((s) => s.nome), ['Colina do Castelo', 'Musée Matisse'])
  assert.equal(lista[0].tipo, 'Mirante')
  assert.equal(lista[0].wikipedia, 'https://fr.wikipedia.org/wiki/Colline_du_Ch%C3%A2teau')
  assert.equal(lista[0].metros, 0)
})

test('094: no máximo 12 sugestões', () => {
  const muitos = Array.from({ length: 20 }, (_, i) => lugar(String(i), `Lugar ${i}`, i))
  const lista = sugestoesDoCatalogo(muitos, 43.7, 7.26, [])
  assert.equal(lista.length, 12)
  assert.equal(lista[0].nome, 'Lugar 19')
})
