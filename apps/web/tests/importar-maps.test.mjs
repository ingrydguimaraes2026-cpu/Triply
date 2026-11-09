// Testes do importar lista do Google Maps (spec 079). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { lerListaDoGoogle } = await import(new URL('../../../packages/core/src/importar-maps.ts', import.meta.url))

test('lê o CSV do Takeout com aspas, vírgula no nome, nota com Enter e repetidos', () => {
  const csv = [
    '﻿Title,Note,URL,Comment',
    'Le Safari,Peixe bom,https://www.google.com/maps/place/Le+Safari,',
    '"Musée Matisse, Nice","Fecha às terças',
    'chegar cedo",https://www.google.com/maps/place/Matisse,ótimo',
    'Le Safari,,https://x,',
    ',sem título,,',
    'Praia,,http://inseguro,',
  ].join('\r\n')
  assert.deepEqual(lerListaDoGoogle(csv), [
    { nome: 'Le Safari', observacao: 'Peixe bom', link: 'https://www.google.com/maps/place/Le+Safari' },
    { nome: 'Musée Matisse, Nice', observacao: 'Fecha às terças\nchegar cedo · ótimo', link: 'https://www.google.com/maps/place/Matisse' },
    { nome: 'Praia', observacao: null, link: null },
  ])
})

test('arquivo sem coluna de título não importa nada', () => {
  assert.deepEqual(lerListaDoGoogle('a,b\n1,2'), [])
  assert.deepEqual(lerListaDoGoogle(''), [])
})
