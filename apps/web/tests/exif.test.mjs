// Testes do GPS da foto (spec 108). Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { gpsDoJpeg } = await import(new URL('../../../packages/core/src/exif.ts', import.meta.url))

// Monta um JPEG mínimo com EXIF (big endian "MM") e GPS: 43°42'0" N, 7°15'36" E
function jpegComGps({ sul = false, oeste = false } = {}) {
  const tiff = []
  const u16 = (n) => tiff.push((n >> 8) & 255, n & 255)
  const u32 = (n) => tiff.push((n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255)
  // Cabeçalho TIFF
  tiff.push(0x4d, 0x4d); u16(42); u32(8)
  // IFD0 em 8: 1 entrada (ponteiro do GPS) → GPS IFD em 26
  u16(1); u16(0x8825); u16(4); u32(1); u32(26); u32(0)
  // GPS IFD em 26: 4 entradas → racionais começam em 26 + 2 + 4*12 + 4 = 80
  u16(4)
  u16(1); u16(2); u32(2); tiff.push(sul ? 83 : 78, 0, 0, 0) // LatitudeRef
  u16(2); u16(5); u32(3); u32(80) // Latitude
  u16(3); u16(2); u32(2); tiff.push(oeste ? 87 : 69, 0, 0, 0) // LongitudeRef
  u16(4); u16(5); u32(3); u32(104) // Longitude
  u32(0)
  for (const [n, d] of [[43, 1], [42, 1], [0, 1], [7, 1], [15, 1], [36, 1]]) { u32(n); u32(d) }
  const exif = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
  const tam = exif.length + 2
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, (tam >> 8) & 255, tam & 255, ...exif, 0xff, 0xda, 0, 2, 0xff, 0xd9])
}

test('108: lê o GPS do EXIF', () => {
  assert.deepEqual(gpsDoJpeg(jpegComGps()), { latitude: 43.7, longitude: 7.26 })
  assert.deepEqual(gpsDoJpeg(jpegComGps({ sul: true, oeste: true })), { latitude: -43.7, longitude: -7.26 })
})

test('108: sem EXIF, não é JPEG ou quebrado: null', () => {
  assert.equal(gpsDoJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2])), null)
  assert.equal(gpsDoJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), null)
  const quebrado = jpegComGps().slice(0, 40)
  assert.equal(gpsDoJpeg(quebrado), null)
})
