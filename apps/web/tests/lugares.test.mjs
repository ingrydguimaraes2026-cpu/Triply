// Testes das migrations de 23/10/2026 (spec 016: lugares; spec 011: horário de check-in/out)
// num PostgreSQL descartável (PGlite). Nada toca o Supabase real. Rodar: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const PASTA = join(import.meta.dirname, '../../../supabase/migrations')
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
const OUTRA = '22222222-2222-2222-2222-222222222222'
const MILAO = 'aaaaaaaa-0000-0000-0000-000000000001'
const COMO = 'aaaaaaaa-0000-0000-0000-000000000002'
const ROMA_OUTRA = 'bbbbbbbb-0000-0000-0000-000000000001'

async function novoBanco() {
  const db = new PGlite({ extensions: { pgcrypto } })
  for (const sql of MIGRATIONS) await db.exec(sql)
  await db.exec(`
    insert into auth.users (id, email) values ('${ADM}', 'adm@teste'), ('${MEMBRO}', 'membro@teste'), ('${ESTRANHO}', 'estranho@teste');
    insert into public.viagens (id, nome, criado_por) values ('${V}', 'Eurotrip', '${ADM}'), ('${OUTRA}', 'Outra', '${ESTRANHO}');
    insert into public.comboio_membros (viagem_id, usuario_id, papel) values ('${V}', '${MEMBRO}', 'membro');
    insert into public.destinos (id, viagem_id, nome, ordem) values
      ('${MILAO}', '${V}', 'Milão', 0), ('${COMO}', '${V}', 'Como', 1), ('${ROMA_OUTRA}', '${OUTRA}', 'Roma', 0);
  `)
  return db
}

// Roda SQL como uma pessoa logada (ou sem login), igual ao site
async function como(db, quem, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${quem ? 'authenticated' : 'anon'}`)
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [quem ?? ''])
    return (await tx.query(sql, params)).rows
  })
}

const INSERIR = `insert into public.lugares (viagem_id, destino_id, tipo, nome, link, horario, preco, moeda, observacao)
  values ($1, $2, $3, $4, $5, $6, $7, 'EUR', $8) returning id`
const guardaVolumes = [V, MILAO, 'guarda_volumes', 'Guarda-volumes da Milano Centrale', 'https://www.milanocentrale.it/', '6h às 23h', '6.00', 'Por mala, até 4 horas']
const touro = [V, MILAO, 'passeio', 'Galeria Vittorio Emanuele: girar no touro', null, null, null, 'Calcanhar direito, 3 voltas']
const total = async (db) => (await db.query('select count(*)::int as n from public.lugares')).rows[0].n

// ---------------- Quem pode o quê ----------------
test('016: membro do comboio adiciona lugar e todo o comboio vê', async () => {
  const db = await novoBanco()
  const [{ id }] = await como(db, MEMBRO, INSERIR, guardaVolumes)
  const vistoPeloAdm = await como(db, ADM, 'select tipo, nome, horario, preco::text, criado_por from public.lugares where id = $1', [id])
  assert.deepEqual(vistoPeloAdm, [{ tipo: 'guarda_volumes', nome: 'Guarda-volumes da Milano Centrale', horario: '6h às 23h', preco: '6.00', criado_por: MEMBRO }])
})

test('016: quem não é do comboio não vê nem adiciona; visitante sem login também não', async () => {
  const db = await novoBanco()
  await como(db, MEMBRO, INSERIR, guardaVolumes)
  assert.equal((await como(db, ESTRANHO, 'select id from public.lugares')).length, 0)
  // Com destino, quem é de fora nem enxerga o destino: o gatilho já recusa (TR422)
  await assert.rejects(como(db, ESTRANHO, INSERIR, guardaVolumes), (e) => e.code === 'TR422')
  // Sem destino, quem barra é a regra de acesso (RLS)
  await assert.rejects(como(db, ESTRANHO, INSERIR, [V, null, 'outro', 'Tentativa', null, null, null, null]), /row-level security/)
  // Visitante sem login: as regras só liberam linhas pra quem está logado (lista vazia, igual às outras tabelas)
  assert.equal((await como(db, null, 'select id from public.lugares')).length, 0)
  await assert.rejects(como(db, null, INSERIR, [V, null, 'outro', 'Tentativa', null, null, null, null]))
  assert.equal(await total(db), 1)
})

test('016: autor edita e apaga o próprio; membro não mexe no lugar de outra pessoa', async () => {
  const db = await novoBanco()
  const [{ id: doAdm }] = await como(db, ADM, INSERIR, touro)
  const [{ id: doMembro }] = await como(db, MEMBRO, INSERIR, guardaVolumes)
  // Membro tenta mudar e apagar o do ADM: nada acontece
  assert.equal((await como(db, MEMBRO, `update public.lugares set nome = 'mudei' where id = $1 returning id`, [doAdm])).length, 0)
  assert.equal((await como(db, MEMBRO, 'delete from public.lugares where id = $1 returning id', [doAdm])).length, 0)
  // Membro muda o próprio
  assert.equal((await como(db, MEMBRO, `update public.lugares set horario = '24h' where id = $1 returning id`, [doMembro])).length, 1)
  assert.equal((await db.query('select nome from public.lugares where id = $1', [doAdm])).rows[0].nome, touro[3])
})

test('016: ADM edita e apaga o lugar de qualquer pessoa do comboio', async () => {
  const db = await novoBanco()
  const [{ id }] = await como(db, MEMBRO, INSERIR, guardaVolumes)
  assert.equal((await como(db, ADM, `update public.lugares set preco = 7 where id = $1 returning id`, [id])).length, 1)
  assert.equal((await como(db, ADM, 'delete from public.lugares where id = $1 returning id', [id])).length, 1)
  assert.equal(await total(db), 0)
})

// ---------------- Validações ----------------
test('016: destino de outra viagem é recusado (TR422)', async () => {
  const db = await novoBanco()
  await assert.rejects(como(db, MEMBRO, INSERIR, [V, ROMA_OUTRA, 'passeio', 'Coliseu', null, null, null, null]), (e) => e.code === 'TR422')
  assert.equal(await total(db), 0)
})

test('016: tipo, nome e link inválidos são recusados', async () => {
  const db = await novoBanco()
  await assert.rejects(como(db, MEMBRO, INSERIR, [V, MILAO, 'balada', 'X', null, null, null, null]), /check constraint/)
  await assert.rejects(como(db, MEMBRO, INSERIR, [V, MILAO, 'passeio', '   ', null, null, null, null]), /check constraint/)
  await assert.rejects(como(db, MEMBRO, INSERIR, [V, MILAO, 'passeio', 'Duomo', 'http://inseguro.com', null, null, null]), /check constraint/)
  await assert.rejects(como(db, MEMBRO, INSERIR, [V, MILAO, 'comida', 'Café', null, null, '-1', null]), /check constraint/)
  assert.equal(await total(db), 0)
})

test('016: não dá pra trocar a viagem nem o autor de um lugar', async () => {
  const db = await novoBanco()
  const [{ id }] = await como(db, ADM, INSERIR, touro)
  await assert.rejects(como(db, ADM, 'update public.lugares set criado_por = $2 where id = $1', [id, MEMBRO]), /autor/)
  await assert.rejects(como(db, ADM, 'update public.lugares set viagem_id = $2, destino_id = null where id = $1', [id, OUTRA]))
})

test('016: tirar o destino do roteiro não apaga os lugares (ficam sem destino)', async () => {
  const db = await novoBanco()
  await como(db, MEMBRO, INSERIR, guardaVolumes)
  await db.query('delete from public.destinos where id = $1', [MILAO])
  assert.deepEqual((await db.query('select destino_id from public.lugares')).rows, [{ destino_id: null }])
})

test('016: apagar a viagem apaga os lugares dela', async () => {
  const db = await novoBanco()
  await como(db, MEMBRO, INSERIR, guardaVolumes)
  await db.query('delete from public.viagens where id = $1', [V])
  assert.equal(await total(db), 0)
})

// ---------------- 011: horário de check-in e check-out ----------------
test('011: hospedagem guarda horário de check-in e check-out (opcionais)', async () => {
  const db = await novoBanco()
  const [{ id }] = await como(
    db,
    MEMBRO,
    `insert into public.hospedagens (viagem_id, destino_id, nome, checkin, checkout, hora_checkin, hora_checkout)
     values ($1, $2, 'Apê perto da estação', '2027-06-07', '2027-06-09', '22:00', '09:00') returning id`,
    [V, COMO],
  )
  const [h] = (await db.query('select hora_checkin::text, hora_checkout::text from public.hospedagens where id = $1', [id])).rows
  assert.deepEqual(h, { hora_checkin: '22:00:00', hora_checkout: '09:00:00' })
  // Sem horário continua valendo (opções antigas)
  await como(db, MEMBRO, `insert into public.hospedagens (viagem_id, destino_id, nome) values ($1, $2, 'Sem horário')`, [V, COMO])
  // Horário inválido é recusado pelo tipo
  await assert.rejects(como(db, MEMBRO, `insert into public.hospedagens (viagem_id, nome, hora_checkin) values ($1, 'X', '25:00')`, [V]))
})
