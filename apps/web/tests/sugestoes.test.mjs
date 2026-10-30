// Testes das sugestões de lugares (spec 094). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { consultaDeSugestoes, sugestoesDaResposta } = await import(new URL('../../../packages/core/src/ferramentas.ts', import.meta.url))

test('094: consulta pede atrações conhecidas perto do destino', () => {
  const url = decodeURIComponent(consultaDeSugestoes(43.7, 7.26))
  assert.match(url, /around:5000,43.7,7.26/)
  assert.match(url, /\["wikidata"\]/)
})

test('094: com Wikipédia primeiro, sem repetidos nem já salvos', () => {
  const resposta = {
    elements: [
      { id: 1, lat: 43.71, lon: 7.26, tags: { name: 'Musée Matisse', tourism: 'museum', wikidata: 'Q1' } },
      { id: 2, lat: 43.695, lon: 7.28, tags: { name: 'Colline du Château', 'name:pt': 'Colina do Castelo', tourism: 'viewpoint', wikidata: 'Q2', wikipedia: 'fr:Colline du Château' } },
      { id: 3, lat: 43.7, lon: 7.27, tags: { name: 'Musee Matisse', tourism: 'museum', wikidata: 'Q1' } },
      { id: 4, lat: 43.69, lon: 7.25, tags: { name: 'Castelo', historic: 'castle', wikidata: 'Q4' } },
      { id: 5, center: { lat: 43.7, lon: 7.26 }, tags: { tourism: 'attraction', wikidata: 'Q5' } },
    ],
  }
  const lista = sugestoesDaResposta(resposta, 43.7, 7.26, ['castelo'])
  assert.deepEqual(lista.map((s) => s.nome), ['Colina do Castelo', 'Musée Matisse'])
  assert.equal(lista[0].tipo, 'mirante')
  assert.equal(lista[0].wikipedia, 'https://fr.wikipedia.org/wiki/Colline_du_Ch%C3%A2teau')
  assert.equal(lista[1].tipo, 'museu')
})
