// Testes de acessibilidade e modo simples (spec 090). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { abasVisiveis, lerPreferencias } = await import(new URL('../../../packages/core/src/acessibilidade.ts', import.meta.url))

test('090: modo simples deixa só as abas essenciais', () => {
  const abas = [{ para: '' }, { para: 'hoje' }, { para: 'agenda' }, { para: 'hospedagem' }, { para: 'financeiro' }, { para: 'fotos' }, { para: 'comboio' }]
  assert.deepEqual(abasVisiveis(abas, true).map((a) => a.para), ['', 'hoje', 'financeiro', 'fotos', 'comboio'])
  assert.equal(abasVisiveis(abas, false).length, 7)
})

test('090: preferências guardadas: só valores conhecidos', () => {
  assert.deepEqual(lerPreferencias(null), { fonte: 'normal', contraste: false, simples: false, escuro: false })
  assert.deepEqual(lerPreferencias('{"fonte":"maior","contraste":true,"simples":true,"escuro":true}'), { fonte: 'maior', contraste: true, simples: true, escuro: true })
  assert.deepEqual(lerPreferencias('{"fonte":"gigante","contraste":"sim"}'), { fonte: 'normal', contraste: false, simples: false, escuro: false })
  assert.deepEqual(lerPreferencias('lixo'), { fonte: 'normal', contraste: false, simples: false, escuro: false })
})
