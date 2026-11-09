// Testes do zip simples (spec 099). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { montarZip, crc32, nomeDaFotoNoZip } = await import(new URL('../../../packages/core/src/zip.ts', import.meta.url))

test('099: crc32 conhecido', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926)
})

test('099: o zip abre e devolve os arquivos iguais', (t) => {
  const pasta = mkdtempSync(join(tmpdir(), 'zip-'))
  const foto = new Uint8Array(5000).map((_, i) => (i * 7) % 256)
  const zip = montarZip([
    { nome: nomeDaFotoNoZip('2026-11-20', 'Mônaco', 3), bytes: foto },
    { nome: 'leia.txt', bytes: new TextEncoder().encode('oi') },
  ])
  const arquivo = join(pasta, 'fotos.zip')
  writeFileSync(arquivo, zip)
  try {
    execFileSync('unzip', ['-o', '-q', arquivo, '-d', pasta])
  } catch {
    t.skip('sem unzip nesta máquina')
    return
  }
  assert.deepEqual(new Uint8Array(readFileSync(join(pasta, '2026-11-20_Mônaco_03.jpg'))), foto)
  assert.equal(readFileSync(join(pasta, 'leia.txt'), 'utf8'), 'oi')
})

test('099: nome da foto sem caractere proibido', () => {
  assert.equal(nomeDaFotoNoZip('2026-11-20', 'A/B: C', 12), '2026-11-20_AB C_12.jpg')
  assert.equal(nomeDaFotoNoZip('2026-11-20', null, 1), '2026-11-20_viagem_01.jpg')
})
