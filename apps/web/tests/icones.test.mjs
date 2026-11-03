// Regra dos ícones (docs/design/ICONES.md): nada de emoji nem de lucide nas telas. Rodar: npm test
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const raiz = new URL('../../../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')
const PASTAS = ['apps/web/src', 'apps/mobile/app', 'apps/mobile/src', 'packages/core/src']
// previa.ts lê o "📍" que vem nos posts do Instagram: é entrada, não tela
const PODE_TER_EMOJI = new Set(['previa.ts', 'FormLugar.tsx'])
const EMOJI = /\p{Extended_Pictographic}/u
const SETAS_E_SINAIS = /[→←↔↑↓•·✓©®™]/gu

function arquivos(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome)
    if (nome === 'node_modules') return []
    if (statSync(caminho).isDirectory()) return arquivos(caminho)
    return /\.(tsx?|mjs)$/.test(nome) ? [caminho] : []
  })
}

const todos = PASTAS.flatMap((p) => arquivos(join(raiz, p)))

test('ninguém importa lucide direto', () => {
  const errados = todos.filter((f) => /from ['"]lucide-react/.test(readFileSync(f, 'utf8')))
  assert.deepEqual(errados, [])
})

test('nenhum emoji no código das telas', () => {
  const errados = []
  for (const f of todos) {
    if ([...PODE_TER_EMOJI].some((n) => f.endsWith(n))) continue
    readFileSync(f, 'utf8').split('\n').forEach((linha, i) => {
      if (EMOJI.test(linha.replace(SETAS_E_SINAIS, ''))) errados.push(`${f}:${i + 1}`)
    })
  }
  assert.deepEqual(errados, [])
})
