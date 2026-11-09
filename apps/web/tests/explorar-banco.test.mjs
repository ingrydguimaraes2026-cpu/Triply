// Testes da migration do Explorar (spec 114) num PostgreSQL descartável (PGlite). Nada toca o Supabase real.
// Rodar: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const PASTA = join(import.meta.dirname, '../../../supabase/migrations')
const MIGRATIONS = [
  readFileSync(join(import.meta.dirname, 'supabase-falso.sql'), 'utf8'),
  ...readdirSync(PASTA).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(PASTA, f), 'utf8')),
]

const ADM = '00000000-0000-0000-0000-00000000000a'
const MEMBRO = '00000000-0000-0000-0000-00000000000b'
const ESTRANHO = '00000000-0000-0000-0000-00000000000c'
const V = '11111111-1111-1111-1111-111111111111'
const PARIS = 'aaaaaaaa-0000-0000-0000-000000000001'
const CIDADE = 'cccccccc-0000-0000-0000-000000000001'
const lugarCat = (n) => `dddddddd-0000-0000-0000-00000000000${n}`

async function novoBanco() {
  const db = new PGlite({ extensions: { pgcrypto } })
  for (const sql of MIGRATIONS) await db.exec(sql)
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ADM}', 'adm@teste', '{"name":"Victor"}'),
      ('${MEMBRO}', 'membro@teste', '{"name":"Ingryd"}'),
      ('${ESTRANHO}', 'estranho@teste', '{"name":"Estranho"}');
    insert into public.viagens (id, nome, criado_por) values ('${V}', 'Eurotrip', '${ADM}');
    insert into public.comboio_membros (viagem_id, usuario_id, papel) values ('${V}', '${MEMBRO}', 'membro');
    insert into public.destinos (id, viagem_id, nome, ordem, latitude, longitude) values ('${PARIS}', '${V}', 'Paris', 0, 48.85, 2.35);
    insert into public.catalogo_cidades (id, chave, nome, pais, latitude, longitude, situacao) values ('${CIDADE}', 'paris|fr', 'Paris', 'FR', 48.85, 2.35, 'pronta');
    insert into public.catalogo_lugares (id, cidade_id, wikidata, nome, tipo, fama, latitude, longitude, por_que, link_wikipedia) values
      ('${lugarCat(1)}', '${CIDADE}', 'Q243', 'Torre Eiffel', 'monumento', 90, 48.858, 2.294, 'O cartão-postal.', 'https://pt.wikipedia.org/wiki/Torre_Eiffel'),
      ('${lugarCat(2)}', '${CIDADE}', 'Q19675', 'Museu do Louvre', 'museu', 80, 48.861, 2.336, null, null),
      ('${lugarCat(3)}', '${CIDADE}', 'Q2981', 'Notre-Dame', 'igreja', 70, 48.853, 2.35, null, null),
      ('${lugarCat(4)}', '${CIDADE}', 'Q1052', 'Sainte-Chapelle', 'igreja', 40, 48.855, 2.345, null, null),
      ('${lugarCat(5)}', '${CIDADE}', 'Q44', 'Sacré-Cœur', 'igreja', 50, 48.886, 2.343, null, null);
  `)
  return db
}

async function como(db, quem, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${quem ? 'authenticated' : 'anon'}`)
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [quem ?? ''])
    return (await tx.query(sql, params)).rows
  })
}

const escolher = (db, quem, n, escolha) =>
  como(db, quem, 'insert into public.explorar_escolhas (viagem_id, destino_id, catalogo_lugar_id, escolha) values ($1, $2, $3, $4)', [V, PARIS, lugarCat(n), escolha])

test('114: catálogo — logado lê; ninguém escreve pelo site; anônimo não lê', async () => {
  const db = await novoBanco()
  assert.equal((await como(db, ESTRANHO, 'select * from public.catalogo_lugares')).length, 5)
  await assert.rejects(como(db, ADM, `insert into public.catalogo_cidades (chave, nome, latitude, longitude) values ('roma|it', 'Roma', 41.9, 12.5)`))
  await assert.rejects(como(db, ADM, `insert into public.catalogo_lugares (cidade_id, nome, tipo, latitude, longitude) values ('${CIDADE}', 'Falso', 'museu', 1, 1)`))
  // Sem política de editar/apagar: o RLS faz a tentativa não pegar nenhuma linha
  assert.equal((await como(db, ADM, 'update public.catalogo_lugares set fama = 0 returning id')).length, 0)
  assert.equal((await como(db, ADM, 'delete from public.catalogo_cidades returning id')).length, 0)
  assert.equal((await db.query('select count(*)::int as n from public.catalogo_lugares where fama = 0')).rows[0].n, 0)
  // Pedidos: ninguém do site vê; anônimo não vê o catálogo
  await db.exec(`insert into public.catalogo_pedidos (usuario_id, cidade_id) values ('${ADM}', '${CIDADE}')`)
  assert.equal((await como(db, ADM, 'select * from public.catalogo_pedidos')).length, 0)
  assert.equal((await como(db, null, 'select * from public.catalogo_lugares').catch(() => [])).length, 0)
})

test('114: escolhas — cada um vê só as suas; estranho não escolhe; destino tem que ser da viagem', async () => {
  const db = await novoBanco()
  await escolher(db, MEMBRO, 1, 'quero')
  await escolher(db, ADM, 2, 'passo')
  assert.deepEqual((await como(db, MEMBRO, 'select escolha from public.explorar_escolhas')).map((r) => r.escolha), ['quero'])
  assert.deepEqual((await como(db, ADM, 'select escolha from public.explorar_escolhas')).map((r) => r.escolha), ['passo'])
  await assert.rejects(escolher(db, ESTRANHO, 3, 'quero'))
  await assert.rejects(como(db, MEMBRO, `update public.explorar_escolhas set escolha = 'quero' where usuario_id = '${ADM}' returning 1`).then((r) => assert.equal(r.length, 1)))
  // Mudar de ideia (upsert) e desfazer
  await como(db, MEMBRO, `update public.explorar_escolhas set escolha = 'passo' where catalogo_lugar_id = $1`, [lugarCat(1)])
  await como(db, MEMBRO, 'delete from public.explorar_escolhas where catalogo_lugar_id = $1', [lugarCat(1)])
  assert.equal((await como(db, MEMBRO, 'select * from public.explorar_escolhas')).length, 0)
})

test('114: no máximo 3 "não abro mão" por destino, somando as prioridades que já existem (Decisão 1)', async () => {
  const db = await novoBanco()
  // Uma prioridade antiga, num lugar que não veio do Explorar
  const [{ id }] = await como(db, MEMBRO, `insert into public.lugares (viagem_id, destino_id, nome) values ($1, $2, 'Café de Flore') returning id`, [V, PARIS])
  await como(db, MEMBRO, 'insert into public.lugar_prioridades (lugar_id) values ($1)', [id])
  await escolher(db, MEMBRO, 1, 'nao_abro_mao')
  await escolher(db, MEMBRO, 2, 'nao_abro_mao')
  await assert.rejects(escolher(db, MEMBRO, 3, 'nao_abro_mao'), /3/)
  await escolher(db, MEMBRO, 3, 'quero') // "quero" continua liberado
  await escolher(db, ADM, 3, 'nao_abro_mao') // o limite é de cada pessoa
})

test('114: montar — escolhas viram lugares, curtidas e prioridades, sem duplicar; passo não entra', async () => {
  const db = await novoBanco()
  // A Ingryd já tinha anotado o Louvre à mão
  await como(db, MEMBRO, `insert into public.lugares (viagem_id, destino_id, nome) values ($1, $2, 'museu do louvre')`, [V, PARIS])
  await escolher(db, MEMBRO, 1, 'nao_abro_mao')
  await escolher(db, MEMBRO, 2, 'quero')
  await escolher(db, MEMBRO, 3, 'passo')
  const ids = await como(db, MEMBRO, 'select * from public.explorar_criar_lugares($1)', [PARIS])
  assert.equal(ids.length, 2)
  const lugares = await como(db, MEMBRO, 'select nome, wikidata, latitude, link from public.lugares')
  assert.deepEqual(lugares.map((l) => l.nome).sort((a, b) => a.localeCompare(b)), ['museu do louvre', 'Torre Eiffel']) // Louvre não duplicou; Notre-Dame (passo) não entrou
  const torre = lugares.find((l) => l.nome === 'Torre Eiffel')
  assert.equal(torre.wikidata, 'Q243')
  assert.equal(torre.link, 'https://pt.wikipedia.org/wiki/Torre_Eiffel')
  assert.equal((await como(db, MEMBRO, 'select * from public.lugar_votos')).length, 2)
  assert.equal((await como(db, MEMBRO, 'select * from public.lugar_prioridades')).length, 1)
  // Rodar de novo não duplica nada
  await como(db, MEMBRO, 'select * from public.explorar_criar_lugares($1)', [PARIS])
  assert.equal((await como(db, MEMBRO, 'select * from public.lugares')).length, 2)
  assert.equal((await como(db, MEMBRO, 'select * from public.lugar_votos')).length, 2)
  // A prioridade que veio do Explorar não conta duas vezes: ainda dá pra marcar mais 2
  await escolher(db, MEMBRO, 4, 'nao_abro_mao')
  await escolher(db, MEMBRO, 5, 'nao_abro_mao')
  // Estranho não monta
  await assert.rejects(como(db, ESTRANHO, 'select * from public.explorar_criar_lugares($1)', [PARIS]))
})
