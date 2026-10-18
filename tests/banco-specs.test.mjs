// Testes das migrations das specs 001, 002, 004, 005, 007 e 008 num PostgreSQL descartável (PGlite).
// Nada toca o Supabase real. Rodar: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const PASTA = join(import.meta.dirname, '../supabase/migrations')
const MIGRATIONS = [
  readFileSync(join(import.meta.dirname, 'supabase-falso.sql'), 'utf8'),
  ...readdirSync(PASTA)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(PASTA, f), 'utf8')),
]

const ADM = '00000000-0000-0000-0000-00000000000a'
const MEMBRO = '00000000-0000-0000-0000-00000000000b'
const ESTRANHO = '00000000-0000-0000-0000-00000000000c'
const V = '11111111-1111-1111-1111-111111111111'
const NICE = 'aaaaaaaa-0000-0000-0000-000000000001'
const MONACO = 'aaaaaaaa-0000-0000-0000-000000000002'

async function novoBanco() {
  const db = new PGlite({ extensions: { pgcrypto } })
  for (const sql of MIGRATIONS) await db.exec(sql)
  await db.exec(`
    grant all on storage.objects to authenticated;
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ADM}', 'adm@teste', '{"name":"Victor"}'),
      ('${MEMBRO}', 'membro@teste', '{"name":"Ingryd"}'),
      ('${ESTRANHO}', 'estranho@teste', '{"name":"Estranho"}');
    insert into public.viagens (id, nome, criado_por) values ('${V}', 'Riviera', '${ADM}');
    insert into public.comboio_membros (viagem_id, usuario_id, papel) values ('${V}', '${MEMBRO}', 'membro');
    insert into public.destinos (id, viagem_id, nome, ordem, latitude, longitude) values
      ('${NICE}', '${V}', 'Nice', 0, 43.7, 7.26), ('${MONACO}', '${V}', 'Mônaco', 1, 43.73, 7.42);
  `)
  return db
}

// Roda SQL como uma pessoa logada, igual ao site
async function como(db, quem, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${quem ? 'authenticated' : 'anon'}`)
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [quem ?? ''])
    return (await tx.query(sql, params)).rows
  })
}

const salvarGasto = (db, quem, gasto, divisoes = []) =>
  como(db, quem, 'select public.salvar_gasto($1::uuid, $2::jsonb, $3::jsonb) as id', [
    V,
    JSON.stringify(gasto),
    JSON.stringify(divisoes),
  ]).then((r) => r[0].id)

const cafe = { descricao: 'Café', valor: '12.00', moeda: 'EUR', categoria: 'alimentacao', pago_por: MEMBRO }
const metade = [
  { usuario_id: ADM, valor: '6.00' },
  { usuario_id: MEMBRO, valor: '6.00' },
]

// ---------------- 002: salvar_gasto ----------------
test('002: lança gasto dividido e grava as divisões', async () => {
  const db = await novoBanco()
  const id = await salvarGasto(db, ADM, cafe, metade)
  const div = await db.query('select usuario_id, valor from public.gasto_divisoes where gasto_id = $1 order by usuario_id', [id])
  assert.deepEqual(div.rows.map((d) => Number(d.valor)), [6, 6])
  const g = (await db.query('select pago_por, criado_por from public.gastos where id = $1', [id])).rows[0]
  assert.equal(g.pago_por, MEMBRO)
  assert.equal(g.criado_por, ADM)
})

test('002: divisão que não soma o total é recusada e nada é salvo', async () => {
  const db = await novoBanco()
  await assert.rejects(salvarGasto(db, ADM, cafe, [{ usuario_id: ADM, valor: '5.00' }]), /não bate/)
  assert.equal((await db.query('select count(*)::int as n from public.gastos')).rows[0].n, 0)
})

test('002: gasto pessoal só quem lançou vê, e não tem divisão', async () => {
  const db = await novoBanco()
  const id = await salvarGasto(db, MEMBRO, { ...cafe, pessoal: true, pago_por: ADM }, metade)
  const g = (await db.query('select pago_por from public.gastos where id = $1', [id])).rows[0]
  assert.equal(g.pago_por, MEMBRO, 'pessoal é sempre pago por quem lançou')
  assert.equal((await db.query('select count(*)::int as n from public.gasto_divisoes')).rows[0].n, 0)
  assert.equal((await como(db, ADM, 'select id from public.gastos')).length, 0)
  assert.equal((await como(db, MEMBRO, 'select id from public.gastos')).length, 1)
})

test('002: editar troca valor e divisões; mandar o mesmo id de novo não duplica', async () => {
  const db = await novoBanco()
  const id = await salvarGasto(db, ADM, cafe, metade)
  await salvarGasto(db, ADM, { ...cafe, id, valor: '20.00' }, [
    { usuario_id: ADM, valor: '15.00' },
    { usuario_id: MEMBRO, valor: '5.00' },
  ])
  await salvarGasto(db, ADM, { ...cafe, id, valor: '20.00' }, [
    { usuario_id: ADM, valor: '15.00' },
    { usuario_id: MEMBRO, valor: '5.00' },
  ])
  assert.equal((await db.query('select count(*)::int as n from public.gastos')).rows[0].n, 1)
  const soma = (await db.query('select sum(valor)::numeric as s from public.gasto_divisoes')).rows[0].s
  assert.equal(Number(soma), 20)
})

test('002: outra pessoa não edita o gasto de quem lançou', async () => {
  const db = await novoBanco()
  const id = await salvarGasto(db, ADM, cafe, metade)
  await assert.rejects(salvarGasto(db, MEMBRO, { ...cafe, id, valor: '1.00' }, [{ usuario_id: MEMBRO, valor: '1.00' }]), /Só quem lançou/)
  assert.equal(Number((await db.query('select valor from public.gastos')).rows[0].valor), 12)
})

test('002: quem não está no comboio não lança, nem divide com estranho', async () => {
  const db = await novoBanco()
  await assert.rejects(salvarGasto(db, ESTRANHO, cafe, metade), /comboio/)
  await assert.rejects(
    salvarGasto(db, ADM, cafe, [
      { usuario_id: ADM, valor: '6.00' },
      { usuario_id: ESTRANHO, valor: '6.00' },
    ]),
    /comboio/,
  )
})

test('009: gasto rascunho fica marcado', async () => {
  const db = await novoBanco()
  const id = await salvarGasto(db, ADM, { ...cafe, rascunho: true, pago_por: ADM }, metade)
  assert.equal((await db.query('select rascunho from public.gastos where id = $1', [id])).rows[0].rascunho, true)
})

// ---------------- 001: datas no salvar_roteiro ----------------
const roteiro = (db, quem, itens) =>
  como(db, quem, 'select nome, chegada::text, saida::text from public.salvar_roteiro($1::uuid, $2::jsonb, $3::uuid[])', [
    V,
    JSON.stringify(itens),
    [],
  ])

test('001: o ADM grava chegada e saída', async () => {
  const db = await novoBanco()
  const r = await roteiro(db, ADM, [
    { id: NICE, nome: 'Nice', chegada: '2026-11-12', saida: '2026-11-15' },
    { id: MONACO, nome: 'Mônaco' },
  ])
  assert.deepEqual(r[0], { nome: 'Nice', chegada: '2026-11-12', saida: '2026-11-15' })
  assert.deepEqual(r[1], { nome: 'Mônaco', chegada: null, saida: null })
})

test('001: sem mandar as datas, elas não são tocadas', async () => {
  const db = await novoBanco()
  await roteiro(db, ADM, [{ id: NICE, nome: 'Nice', chegada: '2026-11-12', saida: '2026-11-15' }, { id: MONACO, nome: 'Mônaco' }])
  const r = await roteiro(db, ADM, [{ id: MONACO, nome: 'Mônaco' }, { id: NICE, nome: 'Nice' }])
  assert.equal(r[1].chegada, '2026-11-12')
})

test('001: saída antes da chegada é recusada', async () => {
  const db = await novoBanco()
  await assert.rejects(
    roteiro(db, ADM, [{ id: NICE, nome: 'Nice', chegada: '2026-11-15', saida: '2026-11-12' }, { id: MONACO, nome: 'Mônaco' }]),
    /antes da chegada/,
  )
})

test('001: destino novo já entra com data', async () => {
  const db = await novoBanco()
  const r = await roteiro(db, ADM, [
    { id: NICE, nome: 'Nice' },
    { id: MONACO, nome: 'Mônaco' },
    { id: null, nome: 'Milão', pais: 'Itália', latitude: 45.46, longitude: 9.19, chegada: '2026-11-16', saida: '2026-11-18' },
  ])
  assert.equal(r[2].saida, '2026-11-18')
})

// ---------------- 004: link da reserva ----------------
test('004: link da reserva aceita só http(s)', async () => {
  const db = await novoBanco()
  await como(db, ADM, `insert into public.trajetos (viagem_id, origem_id, destino_id, link_reserva) values ($1, $2, $3, 'https://sncf.com/x')`, [V, NICE, MONACO])
  await assert.rejects(
    como(db, ADM, `insert into public.trajetos (viagem_id, link_reserva) values ($1, 'javascript:alert(1)')`, [V]),
  )
})

// ---------------- 005: limite de 5 fotos por destino ----------------
test('005: a sexta foto do mesmo destino é recusada', async () => {
  const db = await novoBanco()
  for (let i = 0; i < 5; i++) {
    await como(db, MEMBRO, `insert into public.fotos (viagem_id, destino_id, caminho) values ($1, $2, $3)`, [V, NICE, `${V}/${i}.webp`])
  }
  await assert.rejects(
    como(db, ADM, `insert into public.fotos (viagem_id, destino_id, caminho) values ($1, $2, $3)`, [V, NICE, `${V}/6.webp`]),
    /5 fotos/,
  )
  // Outro destino continua livre
  await como(db, ADM, `insert into public.fotos (viagem_id, destino_id, caminho) values ($1, $2, $3)`, [V, MONACO, `${V}/m.webp`])
})

// ---------------- 007: sempre um ADM ----------------
test('007: o último ADM não pode sair nem virar membro', async () => {
  const db = await novoBanco()
  await assert.rejects(como(db, ADM, `delete from public.comboio_membros where viagem_id = $1 and usuario_id = $2`, [V, ADM]), /ADM/)
  await assert.rejects(
    como(db, ADM, `update public.comboio_membros set papel = 'membro' where viagem_id = $1 and usuario_id = $2`, [V, ADM]),
    /ADM/,
  )
})

test('007: com outro ADM, dá pra sair', async () => {
  const db = await novoBanco()
  await como(db, ADM, `update public.comboio_membros set papel = 'adm' where viagem_id = $1 and usuario_id = $2`, [V, MEMBRO])
  await como(db, ADM, `delete from public.comboio_membros where viagem_id = $1 and usuario_id = $2`, [V, ADM])
  const r = await db.query('select usuario_id, papel from public.comboio_membros')
  assert.deepEqual(r.rows, [{ usuario_id: MEMBRO, papel: 'adm' }])
})

test('007: membro sai sem problema; ADM remove membro', async () => {
  const db = await novoBanco()
  await como(db, MEMBRO, `delete from public.comboio_membros where viagem_id = $1 and usuario_id = $2`, [V, MEMBRO])
  assert.equal((await db.query('select count(*)::int as n from public.comboio_membros')).rows[0].n, 1)
})

test('007: apagar a viagem continua funcionando', async () => {
  const db = await novoBanco()
  await como(db, ADM, `delete from public.viagens where id = $1`, [V])
  assert.equal((await db.query('select count(*)::int as n from public.comboio_membros')).rows[0].n, 0)
})

test('007: quem saiu continua com o nome visível nos gastos', async () => {
  const db = await novoBanco()
  await salvarGasto(db, MEMBRO, cafe, metade)
  await como(db, MEMBRO, `delete from public.comboio_membros where viagem_id = $1 and usuario_id = $2`, [V, MEMBRO])
  const nomes = (await como(db, ADM, 'select nome from public.perfis order by nome')).map((p) => p.nome)
  assert.deepEqual(nomes, ['Ingryd', 'Victor'])
  // Estranho continua sem ver ninguém além dele
  assert.deepEqual((await como(db, ESTRANHO, 'select nome from public.perfis')).map((p) => p.nome), ['Estranho'])
})

// ---------------- 008: bucket de avatares ----------------
test('008: cada um envia avatar só na própria pasta', async () => {
  const db = await novoBanco()
  await como(db, ADM, `insert into storage.objects (bucket_id, name, owner_id) values ('avatares', $1, $2)`, [`${ADM}/foto.webp`, ADM])
  await assert.rejects(
    como(db, ADM, `insert into storage.objects (bucket_id, name, owner_id) values ('avatares', $1, $2)`, [`${MEMBRO}/foto.webp`, ADM]),
  )
})
