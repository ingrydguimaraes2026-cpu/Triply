// Testes das viagens antigas e rolês (spec 118f). Rodar: node --test apps/web/tests/viagens-antigas.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { conferirViagemAntiga, dataDaViagemAntiga, mesEAno, tipoDoLugarDoRole, mesEAnoDaFoto } = await import(new URL('../../../packages/core/src/viagens-antigas.ts', import.meta.url))
const { mapaDaGalera } = await import(new URL('../../../packages/core/src/mapa-da-galera.ts', import.meta.url))

const HOJE = '2026-11-08'

test('viagem antiga: mês e ano no passado valem; futuro, mês inválido e antes de 1950 não', () => {
  assert.equal(conferirViagemAntiga(7, 2019, HOJE), null)
  assert.equal(conferirViagemAntiga(11, 2026, HOJE), null) // o mês de hoje vale
  assert.match(conferirViagemAntiga(12, 2026, HOJE), /ainda não chegou/)
  assert.match(conferirViagemAntiga(1, 2027, HOJE), /ainda não chegou/)
  assert.match(conferirViagemAntiga(0, 2019, HOJE), /mês/)
  assert.match(conferirViagemAntiga(13, 2019, HOJE), /mês/)
  assert.match(conferirViagemAntiga(5, 1949, HOJE), /1950/)
})

test('viagem antiga guarda o dia 1 do mês e mostra "julho de 2019"', () => {
  assert.equal(dataDaViagemAntiga(7, 2019), '2019-07-01')
  assert.equal(dataDaViagemAntiga(12, 2024), '2024-12-01')
  assert.equal(mesEAno('2019-07-01'), 'julho de 2019')
})

test('rolê: show e praia mandam no tipo; bate-volta adivinha pelo nome', () => {
  assert.equal(tipoDoLugarDoRole('show', 'São Paulo'), 'show')
  assert.equal(tipoDoLugarDoRole('praia', 'Garopaba'), 'praia')
  assert.equal(tipoDoLugarDoRole('bate-volta', 'Campos do Jordão'), 'serra')
  assert.equal(tipoDoLugarDoRole('bate-volta', 'Ilha do Mel'), 'praia')
  assert.equal(tipoDoLugarDoRole('bate-volta', 'Curitiba'), 'cidade')
})

test('data da foto (EXIF ou ISO) vira mês e ano; lixo vira null', () => {
  assert.deepEqual(mesEAnoDaFoto('2019:07:14 10:22:01'), { mes: 7, ano: 2019 })
  assert.deepEqual(mesEAnoDaFoto('2021-03-02T10:00:00Z'), { mes: 3, ano: 2021 })
  assert.equal(mesEAnoDaFoto(null), null)
  assert.equal(mesEAnoDaFoto('0000:00:00 00:00:00'), null)
  assert.equal(mesEAnoDaFoto('ontem'), null)
})

test('mapa da galera: rolê conta à parte; viagem antiga acende e não inventa dias juntos', () => {
  const viagens = [
    { id: 'v1', data_inicio: '2026-06-01', data_fim: '2026-06-03', tipo: 'viagem' }, // 3 dias
    { id: 'r1', data_inicio: '2026-10-12', data_fim: '2026-10-12', tipo: 'role' }, // 1 dia
    { id: 'a1', data_inicio: '2019-07-01', data_fim: '2019-07-01', tipo: 'antiga' }, // não conta dias
  ]
  const carimbos = [
    { viagem_id: 'v1', nome: 'Lisboa', latitude: 38.72, longitude: -9.14, data: '2026-06-01', liberado_por: 'eu' },
    { viagem_id: 'r1', nome: 'Garopaba', latitude: -28.03, longitude: -48.62, data: '2026-10-12', liberado_por: 'ana' },
    { viagem_id: 'a1', nome: 'Paris', latitude: 48.86, longitude: 2.35, data: '2019-07-01', liberado_por: 'eu' },
  ]
  const m = mapaDaGalera(carimbos, viagens, 'eu', 'todos', HOJE)
  assert.equal(m.lugares, 3)
  assert.equal(m.pontos.length, 3)
  assert.equal(m.viagens, 2)
  assert.equal(m.roles, 1)
  assert.equal(m.diasJuntos, 4)
  // Disputa do ano: o carimbo de 2019 não entra
  assert.deepEqual(m.podio, [
    { pessoaId: 'ana', carimbos: 1 },
    { pessoaId: 'eu', carimbos: 1 },
  ])
})

test('mapa da galera: viagem sem tipo (antes da 118f) conta como viagem', () => {
  const m = mapaDaGalera(
    [{ viagem_id: 'v', nome: 'Rio', latitude: -22.9, longitude: -43.2, data: '2026-01-02', liberado_por: 'eu' }],
    [{ id: 'v', data_inicio: '2026-01-01', data_fim: '2026-01-02' }],
    'eu',
    'todos',
    HOJE,
  )
  assert.equal(m.viagens, 1)
  assert.equal(m.roles, 0)
  assert.equal(m.diasJuntos, 2)
})

test('foto antiga: GPS e data do EXIF (Android e iPhone)', async () => {
  const { pontoDoExif, mesEAnoDoExif } = await import(new URL('../../../packages/core/src/viagens-antigas.ts', import.meta.url))
  const android = { GPSLatitude: 48.8584, GPSLatitudeRef: 'N', GPSLongitude: 2.2945, GPSLongitudeRef: 'E', DateTimeOriginal: '2019:07:14 10:22:01' }
  assert.deepEqual(pontoDoExif(android), { latitude: 48.8584, longitude: 2.2945 })
  assert.deepEqual(mesEAnoDoExif(android), { mes: 7, ano: 2019 })
  const iphone = { '{GPS}': { Latitude: 27.59, LatitudeRef: 'S', Longitude: 48.54, LongitudeRef: 'W' }, '{Exif}': { DateTimeOriginal: '2022:12:31 23:50:00' } }
  assert.deepEqual(pontoDoExif(iphone), { latitude: -27.59, longitude: -48.54 })
  assert.deepEqual(mesEAnoDoExif(iphone), { mes: 12, ano: 2022 })
  assert.equal(pontoDoExif({ GPSLatitude: 0, GPSLongitude: 0 }), null)
  assert.equal(pontoDoExif(null), null)
  assert.equal(mesEAnoDoExif({}), null)
})
