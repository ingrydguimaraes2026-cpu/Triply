// Testes das migrations das specs 001, 002, 004, 007, 008 e 011 a 014 e 018 num PostgreSQL descartável (PGlite).
// Nada toca o Supabase real. Rodar: npm test
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

// ---------------- 014: feed de fotos (posts, curtidas, comentários) ----------------
const novoPost = async (db, quem, destino = NICE) =>
  (await como(db, quem, 'insert into public.posts (viagem_id, destino_id) values ($1, $2) returning id', [V, destino]))[0].id
const fotoNoPost = (db, quem, post, i) =>
  como(db, quem, 'insert into public.fotos (viagem_id, destino_id, post_id, caminho, ordem) values ($1, $2, $3, $4, $5)', [V, NICE, post, `${V}/${post}/${i}.webp`, i])

test('014: sem limite por lugar; no máximo 10 fotos por post', async () => {
  const db = await novoBanco()
  for (let n = 0; n < 6; n++) await fotoNoPost(db, MEMBRO, await novoPost(db, MEMBRO), 0) // 6 posts em Nice: pode
  const post = await novoPost(db, ADM)
  for (let i = 0; i < 10; i++) await fotoNoPost(db, ADM, post, i)
  await assert.rejects(fotoNoPost(db, ADM, post, 9), /10 fotos/)
})

test('014: foto só entra no post de quem está postando; lugar tem que ser da viagem', async () => {
  const db = await novoBanco()
  const doMembro = await novoPost(db, MEMBRO)
  await assert.rejects(fotoNoPost(db, ADM, doMembro, 0), /row-level security/)
  // De fora: o gatilho nem enxerga o lugar (RLS), então pode cair em qualquer uma das duas mensagens
  await assert.rejects(novoPost(db, ESTRANHO), /row-level security|não é desta viagem/)
  await db.exec(`insert into public.viagens (id, nome, criado_por) values ('22222222-2222-2222-2222-222222222222', 'Outra', '${ADM}');
    insert into public.destinos (id, viagem_id, nome, ordem, latitude, longitude) values ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Roma', 0, 41.9, 12.5)`)
  await assert.rejects(novoPost(db, ADM, 'bbbbbbbb-0000-0000-0000-000000000001'), /lugar não é desta viagem/)
})

test('014: curtidas e comentários só do comboio; quem apaga o quê', async () => {
  const db = await novoBanco()
  const post = await novoPost(db, ADM)
  await como(db, MEMBRO, 'insert into public.curtidas (post_id) values ($1)', [post])
  await assert.rejects(como(db, MEMBRO, 'insert into public.curtidas (post_id) values ($1)', [post]), /duplicate|unique/) // 1 por pessoa
  await assert.rejects(como(db, ESTRANHO, 'insert into public.curtidas (post_id) values ($1)', [post]), /row-level security/)
  assert.equal((await como(db, ADM, 'select * from public.curtidas')).length, 1)
  assert.equal((await como(db, ESTRANHO, 'select * from public.posts')).length, 0)

  const [{ id: comentario }] = await como(db, MEMBRO, "insert into public.comentarios (post_id, texto) values ($1, 'Que lindo!') returning id", [post])
  await assert.rejects(como(db, MEMBRO, "insert into public.comentarios (post_id, texto) values ($1, '   ')", [post]), /check/)
  await assert.rejects(como(db, ESTRANHO, "insert into public.comentarios (post_id, texto) values ($1, 'oi')", [post]), /row-level security/)
  assert.equal((await como(db, ESTRANHO, 'select * from public.comentarios')).length, 0)
  // O dono do post (ADM) apaga o comentário do membro
  assert.equal((await como(db, ADM, 'delete from public.comentarios where id = $1 returning id', [comentario])).length, 1)

  // Membro não apaga post do ADM; ADM apaga post do membro; apagar o post leva curtidas junto
  assert.equal((await como(db, MEMBRO, 'delete from public.posts where id = $1 returning id', [post])).length, 0)
  const doMembro = await novoPost(db, MEMBRO)
  await como(db, MEMBRO, 'insert into public.curtidas (post_id) values ($1)', [doMembro])
  assert.equal((await como(db, ADM, 'delete from public.posts where id = $1 returning id', [doMembro])).length, 1)
  assert.equal((await db.query('select * from public.curtidas where post_id = $1', [doMembro])).rows.length, 0)
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

// ---------------- 010: documentos_status ----------------
const marcar = (db, quem, usuario, status = 'resolvido') =>
  como(
    db,
    quem,
    `insert into public.documentos_status (viagem_id, usuario_id, item, status) values ($1, $2, 'passaporte', $3)
     on conflict (viagem_id, usuario_id, item) do update set status = excluded.status, atualizado_em = now()`,
    [V, usuario, status],
  )

test('010: cada um marca o próprio status e o comboio vê', async () => {
  const db = await novoBanco()
  await marcar(db, MEMBRO, MEMBRO)
  await marcar(db, MEMBRO, MEMBRO, 'pendente') // desmarcar = voltar pra pendente
  const vistos = await como(db, ADM, 'select usuario_id, status from public.documentos_status')
  assert.deepEqual(vistos, [{ usuario_id: MEMBRO, status: 'pendente' }])
})

test('010: ninguém marca o status de outra pessoa', async () => {
  const db = await novoBanco()
  await assert.rejects(marcar(db, ADM, MEMBRO), /row-level security/)
  await marcar(db, MEMBRO, MEMBRO)
  const mudou = await como(db, ADM, `update public.documentos_status set status = 'nao_preciso' returning *`)
  assert.equal(mudou.length, 0)
})

test('010: quem está fora do comboio não vê nem marca', async () => {
  const db = await novoBanco()
  await marcar(db, MEMBRO, MEMBRO)
  assert.equal((await como(db, ESTRANHO, 'select * from public.documentos_status')).length, 0)
  await assert.rejects(marcar(db, ESTRANHO, ESTRANHO), /row-level security/)
})

test('010: status inválido é recusado', async () => {
  const db = await novoBanco()
  await assert.rejects(marcar(db, MEMBRO, MEMBRO, 'talvez'), /check/)
})

// ---------------- 011: hospedagens ----------------
const novaOpcao = (db, quem, extra = {}) =>
  como(
    db,
    quem,
    `insert into public.hospedagens (viagem_id, destino_id, nome, link, preco_total, moeda)
     values ($1, $2, $3, $4, $5, 'EUR') returning id`,
    [V, extra.destino ?? NICE, extra.nome ?? 'Apê no Vieux Nice', extra.link ?? 'https://www.airbnb.com.br/rooms/1', '480.00'],
  ).then((r) => r[0].id)

const escolher = (db, quem, id, sim = true) => como(db, quem, 'select public.escolher_hospedagem($1, $2)', [id, sim])

test('011: membro adiciona opção e o comboio vê; estranho não', async () => {
  const db = await novoBanco()
  await novaOpcao(db, MEMBRO)
  assert.equal((await como(db, ADM, 'select nome, criado_por from public.hospedagens'))[0].criado_por, MEMBRO)
  assert.equal((await como(db, ESTRANHO, 'select id from public.hospedagens')).length, 0)
  await assert.rejects(novaOpcao(db, ESTRANHO), /row-level security|não é desta viagem/) // o gatilho barra antes: ele nem vê o destino
})

test('011: membro não apaga nem edita opção de outra pessoa; ADM pode', async () => {
  const db = await novoBanco()
  const id = await novaOpcao(db, ADM)
  await como(db, MEMBRO, 'delete from public.hospedagens where id = $1', [id])
  await como(db, MEMBRO, `update public.hospedagens set nome = 'Hackeado' where id = $1`, [id])
  assert.equal((await db.query('select nome from public.hospedagens where id = $1', [id])).rows[0].nome, 'Apê no Vieux Nice')
  const doMembro = await novaOpcao(db, MEMBRO, { nome: 'Hotel' })
  await como(db, ADM, 'delete from public.hospedagens where id = $1', [doMembro])
  assert.equal((await db.query('select count(*)::int as n from public.hospedagens')).rows[0].n, 1)
})

test('011: só o ADM escolhe, e escolher outra desmarca a primeira', async () => {
  const db = await novoBanco()
  const a = await novaOpcao(db, MEMBRO)
  const b = await novaOpcao(db, MEMBRO, { nome: 'Hotel Negresco' })
  await assert.rejects(escolher(db, MEMBRO, a), /Só o ADM/)
  await assert.rejects(como(db, MEMBRO, 'update public.hospedagens set escolhida = true where id = $1', [a]), /Só o ADM/)
  await escolher(db, ADM, a)
  await escolher(db, ADM, b)
  const r = (await db.query('select nome from public.hospedagens where escolhida')).rows
  assert.deepEqual(r.map((x) => x.nome), ['Hotel Negresco'])
  await escolher(db, ADM, b, false)
  assert.equal((await db.query('select count(*)::int as n from public.hospedagens where escolhida')).rows[0].n, 0)
})

test('011: destino de outra viagem e link sem https são recusados', async () => {
  const db = await novoBanco()
  await db.exec(`
    insert into public.viagens (id, nome, criado_por) values ('22222222-2222-2222-2222-222222222222', 'Outra', '${MEMBRO}');
    insert into public.destinos (id, viagem_id, nome, ordem) values ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Paris', 0);
  `)
  await assert.rejects(novaOpcao(db, MEMBRO, { destino: 'bbbbbbbb-0000-0000-0000-000000000001' }), /não é desta viagem/)
  await assert.rejects(novaOpcao(db, MEMBRO, { link: 'javascript:alert(1)' }), /check/)
})

test('011: cada um dá e tira só o próprio voto', async () => {
  const db = await novoBanco()
  const id = await novaOpcao(db, ADM)
  await como(db, MEMBRO, 'insert into public.hospedagem_votos (hospedagem_id, usuario_id) values ($1, $2)', [id, MEMBRO])
  await assert.rejects(
    como(db, MEMBRO, 'insert into public.hospedagem_votos (hospedagem_id, usuario_id) values ($1, $2)', [id, ADM]),
    /row-level security/,
  )
  await assert.rejects(
    como(db, ESTRANHO, 'insert into public.hospedagem_votos (hospedagem_id, usuario_id) values ($1, $2)', [id, ESTRANHO]),
    /row-level security/,
  )
  await como(db, ADM, 'delete from public.hospedagem_votos where usuario_id = $1', [MEMBRO])
  assert.equal((await como(db, ADM, 'select count(*)::int as n from public.hospedagem_votos'))[0].n, 1)
  await como(db, MEMBRO, 'delete from public.hospedagem_votos where usuario_id = $1', [MEMBRO])
  assert.equal((await db.query('select count(*)::int as n from public.hospedagem_votos')).rows[0].n, 0)
})

test('011: tirar o destino do roteiro não apaga as opções', async () => {
  const db = await novoBanco()
  await novaOpcao(db, MEMBRO, { destino: MONACO })
  await db.exec(`delete from public.destinos where id = '${MONACO}'`)
  assert.equal((await db.query('select destino_id from public.hospedagens')).rows[0].destino_id, null)
})

// ---------------- 013: metas de câmbio e inscrições de push ----------------
test('013: cada um tem a própria meta; quem está fora da viagem não cria', async () => {
  const db = await novoBanco()
  await como(db, MEMBRO, `insert into public.metas_cambio (viagem_id, moeda, meta) values ($1, 'EUR', 5.85)`, [V])
  assert.equal((await como(db, MEMBRO, 'select meta from public.metas_cambio')).length, 1)
  assert.equal((await como(db, ADM, 'select meta from public.metas_cambio')).length, 0) // ADM não vê a meta dos outros
  await assert.rejects(como(db, ESTRANHO, `insert into public.metas_cambio (viagem_id, moeda, meta) values ($1, 'EUR', 5)`, [V]), /row-level security/)
  await assert.rejects(como(db, MEMBRO, `insert into public.metas_cambio (viagem_id, moeda, meta) values ($1, 'BRL', 1)`, [V]), /check/)
})

test('013: registrar_push grava pra quem está logado e passa o aparelho de conta', async () => {
  const db = await novoBanco()
  const reg = (quem) => como(db, quem, `select public.registrar_push('https://push.exemplo/abc', 'chave', 'segredo')`)
  await reg(MEMBRO)
  assert.equal((await como(db, MEMBRO, 'select endpoint from public.push_inscricoes')).length, 1)
  assert.equal((await como(db, ADM, 'select endpoint from public.push_inscricoes')).length, 0)
  await reg(ADM) // mesmo navegador, outra conta
  assert.equal((await como(db, ADM, 'select endpoint from public.push_inscricoes')).length, 1)
  assert.equal((await como(db, MEMBRO, 'select endpoint from public.push_inscricoes')).length, 0)
  await assert.rejects(como(db, null, `select public.registrar_push('https://x/y', 'a', 'b')`), /permission denied|login/)
  await assert.rejects(
    como(db, MEMBRO, `insert into public.push_inscricoes (endpoint, p256dh, auth) values ('https://x/z', 'a', 'b')`),
    /row-level security/,
  )
})

test('013 (boletim): dá pra pedir o boletim sem meta; a meta continua opcional', async () => {
  const db = await novoBanco()
  await como(db, MEMBRO, `insert into public.metas_cambio (viagem_id, moeda) values ($1, 'EUR')`, [V])
  const [linha] = await como(db, MEMBRO, 'select meta, avisar, ultimo_valor from public.metas_cambio')
  assert.equal(linha.meta, null)
  assert.equal(linha.avisar, true)
  assert.equal(linha.ultimo_valor, null)
  await assert.rejects(como(db, MEMBRO, `update public.metas_cambio set meta = 0`), /check/)
})

// ---------------- 018: convidado sem conta ----------------
const CONVIDADO = '00000000-0000-0000-0000-0000000000cc'
const CODIGO = 'convite-teste'

// Convidado = usuário anônimo; o banco cria o perfil sem nome (não tem e-mail)
async function comConvite(db) {
  await db.exec(`
    insert into auth.users (id, is_anonymous) values ('${CONVIDADO}', true);
    insert into public.convites (codigo, viagem_id, criado_por) values ('${CODIGO}', '${V}', '${ADM}');
  `)
}

// Igual ao "como", mas com o token marcando que é convidado
async function comoConvidado(db, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [CONVIDADO])
    await tx.query(`select set_config('request.jwt.claim.is_anonymous', 'true', true)`)
    return (await tx.query(sql, params)).rows
  })
}

test('018: prévia do convite abre sem login e não vaza nada com código errado', async () => {
  const db = await novoBanco()
  await comConvite(db)
  const [{ p }] = await como(db, null, 'select public.ver_convite($1) as p', [CODIGO])
  assert.equal(p.nome, 'Riviera')
  assert.deepEqual(p.destinos, ['Nice', 'Mônaco'])
  assert.deepEqual(p.membros, ['Victor', 'Ingryd'])
  assert.equal(p.ja_sou_membro, false)
  const [{ p: nada }] = await como(db, null, 'select public.ver_convite($1) as p', ['nao-existe'])
  assert.equal(nada, null)
})

test('018: convidado entra com o nome e lança gasto como membro', async () => {
  const db = await novoBanco()
  await comConvite(db)
  const [{ v }] = await comoConvidado(db, 'select public.aceitar_convite($1, $2) as v', [CODIGO, '  Tia Rosa  '])
  assert.equal(v, V)
  const perfil = (await db.query('select nome from public.perfis where id = $1', [CONVIDADO])).rows[0]
  assert.equal(perfil.nome, 'Tia Rosa')
  const id = await comoConvidado(db, 'select public.salvar_gasto($1::uuid, $2::jsonb, $3::jsonb) as id', [
    V,
    JSON.stringify({ ...cafe, pago_por: CONVIDADO }),
    JSON.stringify([
      { usuario_id: CONVIDADO, valor: '6.00' },
      { usuario_id: ADM, valor: '6.00' },
    ]),
  ]).then((r) => r[0].id)
  assert.ok(id)
  // O ADM vê o selo de convidado
  const convidados = await como(db, ADM, 'select public.convidados_da_viagem($1) as id', [V])
  assert.deepEqual(convidados.map((c) => c.id), [CONVIDADO])
  // Quem não é do comboio não descobre quem é convidado
  assert.deepEqual(await como(db, ESTRANHO, 'select public.convidados_da_viagem($1) as id', [V]), [])
})

test('018: nome do convite não sobrescreve o nome de quem já tem', async () => {
  const db = await novoBanco()
  await comConvite(db)
  await como(db, ESTRANHO, 'select public.aceitar_convite($1, $2)', [CODIGO, 'Outro nome'])
  assert.equal((await db.query('select nome from public.perfis where id = $1', [ESTRANHO])).rows[0].nome, 'Estranho')
})

test('018: convidado não vira ADM, nem chamando o banco direto', async () => {
  const db = await novoBanco()
  await comConvite(db)
  await comoConvidado(db, 'select public.aceitar_convite($1, $2)', [CODIGO, 'Tia Rosa'])
  await assert.rejects(
    como(db, ADM, `update public.comboio_membros set papel = 'adm' where viagem_id = $1 and usuario_id = $2`, [V, CONVIDADO]),
    /criar conta antes de virar ADM/,
  )
})

test('018: convidado não cria viagem', async () => {
  const db = await novoBanco()
  await comConvite(db)
  await assert.rejects(
    comoConvidado(db, `insert into public.viagens (nome, criado_por) values ('Minha', $1)`, [CONVIDADO]),
    /row-level security/,
  )
})

// ---------------- 019: avisos do ADM ----------------
const novoAviso = (db, quem, texto = 'Passaporte na mão amanhã!') =>
  como(db, quem, 'insert into public.avisos (viagem_id, texto) values ($1, $2) returning id', [V, texto]).then((r) => r[0]?.id)

test('019: o ADM cria o aviso e o comboio vê; estranho não', async () => {
  const db = await novoBanco()
  const id = await novoAviso(db, ADM)
  assert.ok(id)
  assert.equal((await como(db, MEMBRO, 'select texto, criado_por from public.avisos'))[0].criado_por, ADM)
  assert.equal((await como(db, ESTRANHO, 'select id from public.avisos')).length, 0)
})

test('019: membro e estranho não criam aviso', async () => {
  const db = await novoBanco()
  await assert.rejects(novoAviso(db, MEMBRO), /row-level security/)
  await assert.rejects(novoAviso(db, ESTRANHO), /row-level security/)
  assert.equal((await db.query('select count(*)::int as n from public.avisos')).rows[0].n, 0)
})

test('019: só o ADM edita e apaga; membro não', async () => {
  const db = await novoBanco()
  const id = await novoAviso(db, ADM)
  await como(db, MEMBRO, `update public.avisos set texto = 'Hackeado' where id = $1`, [id])
  await como(db, MEMBRO, 'delete from public.avisos where id = $1', [id])
  assert.equal((await db.query('select texto from public.avisos where id = $1', [id])).rows[0].texto, 'Passaporte na mão amanhã!')
  await como(db, ADM, `update public.avisos set texto = 'Novo recado' where id = $1`, [id])
  assert.equal((await db.query('select texto from public.avisos where id = $1', [id])).rows[0].texto, 'Novo recado')
  await como(db, ADM, 'delete from public.avisos where id = $1', [id])
  assert.equal((await db.query('select count(*)::int as n from public.avisos')).rows[0].n, 0)
})

test('019: texto em branco é recusado', async () => {
  const db = await novoBanco()
  await assert.rejects(novoAviso(db, ADM, '   '), /check/)
})

// ---------------- 020: tarefas com responsável ----------------
const novaTarefa = (db, quem, extra = {}) =>
  como(
    db,
    quem,
    'insert into public.tarefas (viagem_id, titulo, responsavel_id, prazo) values ($1, $2, $3, $4) returning id',
    [V, extra.titulo ?? 'Comprar o seguro', extra.responsavel ?? null, extra.prazo ?? null],
  ).then((r) => r[0]?.id)

test('020: membro cria tarefa e o comboio vê; estranho não', async () => {
  const db = await novoBanco()
  const id = await novaTarefa(db, MEMBRO, { responsavel: ADM })
  assert.ok(id)
  assert.equal((await como(db, ADM, 'select titulo, criado_por from public.tarefas'))[0].criado_por, MEMBRO)
  assert.equal((await como(db, ESTRANHO, 'select id from public.tarefas')).length, 0)
})

test('020: o responsável tem que ser do comboio', async () => {
  const db = await novoBanco()
  await assert.rejects(novaTarefa(db, ADM, { responsavel: ESTRANHO }), /comboio/)
})

test('020: autor e responsável marcam feita; quem não é dono não edita', async () => {
  const db = await novoBanco()
  // Terceiro membro: nem autor, nem responsável, nem ADM
  const OUTRO = '00000000-0000-0000-0000-00000000000d'
  await db.exec(`insert into auth.users (id, email) values ('${OUTRO}', 'outro@teste');
    insert into public.comboio_membros (viagem_id, usuario_id, papel) values ('${V}', '${OUTRO}', 'membro');`)
  const id = await novaTarefa(db, MEMBRO, { responsavel: ADM })
  // O responsável (ADM) marca feita
  await como(db, ADM, 'update public.tarefas set feita = true where id = $1', [id])
  assert.equal((await db.query('select feita from public.tarefas where id = $1', [id])).rows[0].feita, true)
  // O autor (MEMBRO) edita o título
  await como(db, MEMBRO, `update public.tarefas set titulo = 'Comprar seguro já' where id = $1`, [id])
  assert.equal((await db.query('select titulo from public.tarefas where id = $1', [id])).rows[0].titulo, 'Comprar seguro já')
  // OUTRO não é dono: o UPDATE não casa nenhuma linha (RLS) e nada muda
  assert.equal((await como(db, OUTRO, `update public.tarefas set titulo = 'hack' where id = $1 returning id`, [id])).length, 0)
  assert.equal((await db.query('select titulo from public.tarefas where id = $1', [id])).rows[0].titulo, 'Comprar seguro já')
})

test('020: quem criou ou o ADM apaga; outro membro não', async () => {
  const db = await novoBanco()
  const id = await novaTarefa(db, MEMBRO)
  // ADM apaga a tarefa do membro
  assert.equal((await como(db, ADM, 'delete from public.tarefas where id = $1 returning id', [id])).length, 1)
  const id2 = await novaTarefa(db, MEMBRO)
  // Estranho não vê, então não apaga
  assert.equal((await como(db, ESTRANHO, 'delete from public.tarefas where id = $1 returning id', [id2])).length, 0)
  assert.equal((await db.query('select count(*)::int as n from public.tarefas')).rows[0].n, 1)
})

test('020: título em branco é recusado', async () => {
  const db = await novoBanco()
  await assert.rejects(novaTarefa(db, MEMBRO, { titulo: '  ' }), /check/)
})

// ---------------- 021: enquetes rápidas ----------------
const criarEnquete = (db, quem, opcoes = ['Sexta', 'Sábado'], pergunta = 'Que dia a gente vai?', multipla = false) =>
  como(db, quem, 'select public.criar_enquete($1::uuid, $2, $3, $4::jsonb) as id', [V, pergunta, multipla, JSON.stringify(opcoes)]).then(
    (r) => r[0].id,
  )
const opcoesDe = (db, enquete) =>
  db.query('select id, texto, ordem from public.enquete_opcoes where enquete_id = $1 order by ordem', [enquete]).then((r) => r.rows)
const votar = (db, quem, opcao, marcar = true) => como(db, quem, 'select public.votar_enquete($1, $2)', [opcao, marcar])

test('021: membro cria enquete; comboio vê; estranho não; min 2 opções', async () => {
  const db = await novoBanco()
  const id = await criarEnquete(db, MEMBRO)
  assert.equal((await opcoesDe(db, id)).length, 2)
  assert.equal((await como(db, ADM, 'select id from public.enquetes')).length, 1)
  assert.equal((await como(db, ESTRANHO, 'select id from public.enquetes')).length, 0)
  await assert.rejects(criarEnquete(db, ESTRANHO), /viagem/)
  await assert.rejects(criarEnquete(db, MEMBRO, ['só uma']), /2 opções/)
})

test('021: escolha única troca o voto', async () => {
  const db = await novoBanco()
  const id = await criarEnquete(db, ADM)
  const ops = await opcoesDe(db, id)
  await votar(db, MEMBRO, ops[0].id)
  await votar(db, MEMBRO, ops[1].id)
  const meus = (await db.query('select opcao_id from public.enquete_votos where usuario_id = $1', [MEMBRO])).rows
  assert.equal(meus.length, 1)
  assert.equal(meus[0].opcao_id, ops[1].id)
})

test('021: múltipla soma votos; estranho não vota; fechada recusa', async () => {
  const db = await novoBanco()
  const id = await criarEnquete(db, ADM, ['A', 'B', 'C'], 'Quais passeios?', true)
  const ops = await opcoesDe(db, id)
  await votar(db, MEMBRO, ops[0].id)
  await votar(db, MEMBRO, ops[1].id)
  assert.equal((await db.query('select count(*)::int as n from public.enquete_votos where usuario_id = $1', [MEMBRO])).rows[0].n, 2)
  await assert.rejects(votar(db, ESTRANHO, ops[0].id), /viagem/)
  await como(db, ADM, 'update public.enquetes set fechada = true where id = $1', [id])
  await assert.rejects(votar(db, MEMBRO, ops[2].id), /fechada/)
})

test('021: autor ou ADM apaga; outro membro não', async () => {
  const db = await novoBanco()
  const OUTRO = '00000000-0000-0000-0000-00000000000d'
  await db.exec(`insert into auth.users (id, email) values ('${OUTRO}', 'outro@teste');
    insert into public.comboio_membros (viagem_id, usuario_id, papel) values ('${V}', '${OUTRO}', 'membro');`)
  const id = await criarEnquete(db, MEMBRO)
  assert.equal((await como(db, OUTRO, 'delete from public.enquetes where id = $1 returning id', [id])).length, 0)
  assert.equal((await como(db, ADM, 'delete from public.enquetes where id = $1 returning id', [id])).length, 1)
})

// ---------------- 022: votos em lugares ----------------
const novoLugar = (db, quem, destino = NICE, nome = 'Promenade des Anglais') =>
  como(db, quem, `insert into public.lugares (viagem_id, destino_id, tipo, nome) values ($1, $2, 'passeio', $3) returning id`, [V, destino, nome]).then(
    (r) => r[0].id,
  )

test('022: cada um dá e tira só o próprio voto; estranho não vota', async () => {
  const db = await novoBanco()
  const id = await novoLugar(db, ADM)
  await como(db, MEMBRO, 'insert into public.lugar_votos (lugar_id, usuario_id) values ($1, $2)', [id, MEMBRO])
  // Não dá pra votar no nome de outra pessoa
  await assert.rejects(
    como(db, MEMBRO, 'insert into public.lugar_votos (lugar_id, usuario_id) values ($1, $2)', [id, ADM]),
    /row-level security/,
  )
  // Estranho não vota
  await assert.rejects(
    como(db, ESTRANHO, 'insert into public.lugar_votos (lugar_id, usuario_id) values ($1, $2)', [id, ESTRANHO]),
    /row-level security/,
  )
  // O comboio vê o voto; o ADM não tira o voto do membro
  assert.equal((await como(db, ADM, 'select usuario_id from public.lugar_votos')).length, 1)
  await como(db, ADM, 'delete from public.lugar_votos where usuario_id = $1', [MEMBRO])
  assert.equal((await db.query('select count(*)::int as n from public.lugar_votos')).rows[0].n, 1)
  // O próprio membro tira
  await como(db, MEMBRO, 'delete from public.lugar_votos where usuario_id = $1', [MEMBRO])
  assert.equal((await db.query('select count(*)::int as n from public.lugar_votos')).rows[0].n, 0)
})

test('022: apagar o lugar leva os votos junto', async () => {
  const db = await novoBanco()
  const id = await novoLugar(db, MEMBRO)
  await como(db, MEMBRO, 'insert into public.lugar_votos (lugar_id, usuario_id) values ($1, $2)', [id, MEMBRO])
  await como(db, MEMBRO, 'delete from public.lugares where id = $1', [id])
  assert.equal((await db.query('select count(*)::int as n from public.lugar_votos')).rows[0].n, 0)
})

// ---------------- 024: ponto de encontro ----------------
const novoPonto = (db, quem, local = 'Portão 3 da estação') =>
  como(db, quem, `insert into public.pontos_de_encontro (viagem_id, local) values ($1, $2) returning id`, [V, local]).then((r) => r[0].id)

test('024: comboio cria e vê; estranho não cria nem vê', async () => {
  const db = await novoBanco()
  await novoPonto(db, MEMBRO)
  assert.equal((await como(db, ADM, 'select id from public.pontos_de_encontro')).length, 1)
  // Estranho (fora do comboio) não vê
  assert.equal((await como(db, ESTRANHO, 'select id from public.pontos_de_encontro')).length, 0)
  // Estranho não cria
  await assert.rejects(
    como(db, ESTRANHO, `insert into public.pontos_de_encontro (viagem_id, local) values ($1, 'x')`, [V]),
    /row-level security/,
  )
})

test('024: quem criou e o ADM editam/apagam; outro membro não', async () => {
  const db = await novoBanco()
  const id = await novoPonto(db, ADM) // criado pelo ADM
  // MEMBRO não é autor nem ADM: a RLS não deixa editar (0 linhas, sem erro)
  await como(db, MEMBRO, `update public.pontos_de_encontro set local = 'hack' where id = $1`, [id])
  assert.equal((await db.query('select local from public.pontos_de_encontro where id = $1', [id])).rows[0].local, 'Portão 3 da estação')
  // O ADM edita
  await como(db, ADM, `update public.pontos_de_encontro set local = 'Novo local' where id = $1`, [id])
  assert.equal((await db.query('select local from public.pontos_de_encontro where id = $1', [id])).rows[0].local, 'Novo local')
  // MEMBRO não apaga; o ADM apaga
  await como(db, MEMBRO, 'delete from public.pontos_de_encontro where id = $1', [id])
  assert.equal((await db.query('select count(*)::int as n from public.pontos_de_encontro')).rows[0].n, 1)
  await como(db, ADM, 'delete from public.pontos_de_encontro where id = $1', [id])
  assert.equal((await db.query('select count(*)::int as n from public.pontos_de_encontro')).rows[0].n, 0)
})

test('024: não dá pra trocar a viagem nem o autor; atualizado_em sobe', async () => {
  const db = await novoBanco()
  const id = await novoPonto(db, MEMBRO)
  const antes = (await db.query('select atualizado_em from public.pontos_de_encontro where id = $1', [id])).rows[0].atualizado_em
  await assert.rejects(
    como(db, MEMBRO, `update public.pontos_de_encontro set criado_por = $1 where id = $2`, [ADM, id]),
    /mudar a viagem nem o autor/,
  )
  // Uma edição comum sobe o atualizado_em
  await como(db, MEMBRO, `update public.pontos_de_encontro set observacao = 'levem água' where id = $1`, [id])
  const depois = (await db.query('select atualizado_em from public.pontos_de_encontro where id = $1', [id])).rows[0].atualizado_em
  assert.ok(new Date(depois) >= new Date(antes))
})

// ---------------- 026: guia da casa ----------------
const guia = (db, quem, id, campos) =>
  como(
    db,
    quem,
    `update public.hospedagens set endereco = $2, wifi_rede = $3, wifi_senha = $4, codigo_porta = $5, regras_casa = $6
     where id = $1 returning id`,
    [id, campos.endereco ?? null, campos.wifiRede ?? null, campos.wifiSenha ?? null, campos.codigoPorta ?? null, campos.regras ?? null],
  )

test('026: quem adicionou ou o ADM preenchem o guia; o comboio vê; estranho não', async () => {
  const db = await novoBanco()
  const id = await novaOpcao(db, MEMBRO)
  await guia(db, MEMBRO, id, { endereco: 'Rue Droite 12, Nice', wifiRede: 'Casa', wifiSenha: 'soleil2027', codigoPorta: '4821' })
  const visto = (await como(db, ADM, 'select endereco, wifi_senha, codigo_porta from public.hospedagens where id = $1', [id]))[0]
  assert.deepEqual(visto, { endereco: 'Rue Droite 12, Nice', wifi_senha: 'soleil2027', codigo_porta: '4821' })
  await guia(db, ADM, id, { endereco: 'Rue Droite 12, Nice', regras: 'Silêncio depois das 22h' })
  assert.equal((await db.query('select regras_casa from public.hospedagens where id = $1', [id])).rows[0].regras_casa, 'Silêncio depois das 22h')
  assert.equal((await como(db, ESTRANHO, 'select wifi_senha from public.hospedagens')).length, 0)
})

test('026: outro membro não edita o guia de uma opção que não é dele', async () => {
  const db = await novoBanco()
  const id = await novaOpcao(db, ADM)
  assert.equal((await guia(db, MEMBRO, id, { wifiSenha: 'hackeado' })).length, 0)
  assert.equal((await db.query('select wifi_senha from public.hospedagens where id = $1', [id])).rows[0].wifi_senha, null)
})

test('026: campo maior que o limite é recusado', async () => {
  const db = await novoBanco()
  const id = await novaOpcao(db, MEMBRO)
  await assert.rejects(guia(db, MEMBRO, id, { codigoPorta: 'x'.repeat(51) }), /check constraint/)
  await assert.rejects(guia(db, MEMBRO, id, { regras: 'x'.repeat(1001) }), /check constraint/)
})

// ---------------- 027: comentários em itens ----------------
const comentarItem = (db, quem, alvo, texto = 'Topo!') =>
  como(db, quem, `insert into public.comentarios_item (${alvo.coluna}, texto) values ($1, $2) returning id, viagem_id`, [alvo.id, texto]).then(
    (r) => r[0],
  )

test('027: comboio comenta e vê comentários de lugar e hospedagem; estranho não', async () => {
  const db = await novoBanco()
  const lugar = await novoLugar(db, MEMBRO)
  const hosp = await novaOpcao(db, ADM)
  const c = await comentarItem(db, MEMBRO, { coluna: 'lugar_id', id: lugar })
  assert.equal(c.viagem_id, V) // a viagem vem do item
  await comentarItem(db, ADM, { coluna: 'hospedagem_id', id: hosp }, 'Tem café da manhã?')
  assert.equal((await como(db, ADM, 'select id from public.comentarios_item')).length, 2)
  assert.equal((await como(db, ESTRANHO, 'select id from public.comentarios_item')).length, 0)
  await assert.rejects(comentarItem(db, ESTRANHO, { coluna: 'lugar_id', id: lugar }), /não existe ou você não tem acesso/)
})

test('027: comentário de gasto pessoal só quem lançou vê e comenta', async () => {
  const db = await novoBanco()
  const pessoal = await salvarGasto(db, MEMBRO, { ...cafe, pessoal: true })
  const doComboio = await salvarGasto(db, ADM, cafe, metade)
  await comentarItem(db, MEMBRO, { coluna: 'gasto_id', id: pessoal }, 'lembrete')
  await comentarItem(db, MEMBRO, { coluna: 'gasto_id', id: doComboio }, 'paguei em dinheiro')
  assert.equal((await como(db, MEMBRO, 'select id from public.comentarios_item')).length, 2)
  // O ADM não vê o gasto pessoal, nem o comentário dele, nem consegue comentar nele
  assert.equal((await como(db, ADM, 'select id from public.comentarios_item')).length, 1)
  await assert.rejects(comentarItem(db, ADM, { coluna: 'gasto_id', id: pessoal }), /não existe ou você não tem acesso/)
})

test('027: autor ou ADM apaga; outro membro não; apagar o item leva os comentários', async () => {
  const db = await novoBanco()
  const lugar = await novoLugar(db, MEMBRO)
  const doAdm = await comentarItem(db, ADM, { coluna: 'lugar_id', id: lugar })
  const doMembro = await comentarItem(db, MEMBRO, { coluna: 'lugar_id', id: lugar })
  await como(db, MEMBRO, 'delete from public.comentarios_item where id = $1', [doAdm.id])
  assert.equal((await db.query('select count(*)::int as n from public.comentarios_item')).rows[0].n, 2)
  await como(db, ADM, 'delete from public.comentarios_item where id = $1', [doMembro.id])
  assert.equal((await db.query('select count(*)::int as n from public.comentarios_item')).rows[0].n, 1)
  await como(db, MEMBRO, 'delete from public.lugares where id = $1', [lugar])
  assert.equal((await db.query('select count(*)::int as n from public.comentarios_item')).rows[0].n, 0)
})

test('027: sem alvo, com dois alvos ou texto em branco é recusado; sem editar', async () => {
  const db = await novoBanco()
  const lugar = await novoLugar(db, MEMBRO)
  const hosp = await novaOpcao(db, MEMBRO)
  await assert.rejects(como(db, MEMBRO, `insert into public.comentarios_item (texto) values ('oi')`), /não existe|check constraint/)
  await assert.rejects(
    como(db, MEMBRO, 'insert into public.comentarios_item (lugar_id, hospedagem_id, texto) values ($1, $2, $3)', [lugar, hosp, 'oi']),
    /check constraint/,
  )
  await assert.rejects(comentarItem(db, MEMBRO, { coluna: 'lugar_id', id: lugar }, '   '), /check constraint/)
  const c = await comentarItem(db, MEMBRO, { coluna: 'lugar_id', id: lugar })
  await como(db, MEMBRO, `update public.comentarios_item set texto = 'editado' where id = $1`, [c.id])
  assert.equal((await db.query('select texto from public.comentarios_item where id = $1', [c.id])).rows[0].texto, 'Topo!')
})

// ---------------- 028: cofre da viagem + bilhete no trajeto ----------------
const V2 = '22222222-2222-2222-2222-222222222222'
const novoArquivo = (db, quem, extra = {}) =>
  como(
    db,
    quem,
    `insert into public.arquivos_viagem (viagem_id, trajeto_id, nome, caminho, tipo, tamanho)
     values ($1, $2, $3, $4, 'application/pdf', 1000) returning id`,
    [extra.viagem ?? V, extra.trajeto ?? null, extra.nome ?? 'Reserva do trem', extra.caminho ?? `${extra.viagem ?? V}/${crypto.randomUUID()}.pdf`],
  ).then((r) => r[0].id)
const novoTrajeto = (db, viagem = V) =>
  db.query(`insert into public.trajetos (viagem_id, origem_id, destino_id) values ($1, $2, $3) returning id`, [viagem, viagem === V ? NICE : null, viagem === V ? MONACO : null]).then((r) => r.rows[0].id)

test('028: comboio envia e vê arquivos; estranho não', async () => {
  const db = await novoBanco()
  await novoArquivo(db, MEMBRO)
  assert.equal((await como(db, ADM, 'select nome from public.arquivos_viagem'))[0].nome, 'Reserva do trem')
  assert.equal((await como(db, ESTRANHO, 'select id from public.arquivos_viagem')).length, 0)
  await assert.rejects(novoArquivo(db, ESTRANHO), /row-level security/)
})

test('028: arquivo fora da pasta da viagem e trajeto de outra viagem são recusados', async () => {
  const db = await novoBanco()
  await assert.rejects(novoArquivo(db, MEMBRO, { caminho: `${V2}/x.pdf` }), /check constraint/)
  await db.exec(`insert into public.viagens (id, nome, criado_por) values ('${V2}', 'Outra', '${ADM}')`)
  const deOutra = await novoTrajeto(db, V2)
  await assert.rejects(novoArquivo(db, MEMBRO, { trajeto: deOutra }), /não é desta viagem/)
  const daqui = await novoTrajeto(db)
  await novoArquivo(db, MEMBRO, { trajeto: daqui })
})

test('028: quem enviou ou o ADM renomeia/apaga; outro membro não; apagar o trajeto mantém o arquivo', async () => {
  const db = await novoBanco()
  const trajeto = await novoTrajeto(db)
  const doAdm = await novoArquivo(db, ADM, { trajeto })
  await como(db, MEMBRO, `update public.arquivos_viagem set nome = 'Hackeado' where id = $1`, [doAdm])
  await como(db, MEMBRO, 'delete from public.arquivos_viagem where id = $1', [doAdm])
  assert.equal((await db.query('select nome from public.arquivos_viagem where id = $1', [doAdm])).rows[0].nome, 'Reserva do trem')
  const doMembro = await novoArquivo(db, MEMBRO)
  await como(db, ADM, 'delete from public.arquivos_viagem where id = $1', [doMembro])
  await assert.rejects(como(db, ADM, `update public.arquivos_viagem set enviado_por = $1 where id = $2`, [MEMBRO, doAdm]), /Não dá pra mudar/)
  await db.query('delete from public.trajetos where id = $1', [trajeto])
  const r = (await db.query('select trajeto_id from public.arquivos_viagem')).rows
  assert.deepEqual(r, [{ trajeto_id: null }])
})

test('028: storage do cofre: só o comboio envia na pasta da viagem; apaga quem enviou ou o ADM', async () => {
  const db = await novoBanco()
  const enviar = (quem, pasta) =>
    como(db, quem, `insert into storage.objects (bucket_id, name, owner_id) values ('cofre', $1, $2) returning id`, [`${pasta}/a.pdf`, quem])
  await enviar(MEMBRO, V)
  await assert.rejects(enviar(ESTRANHO, V), /row-level security/)
  assert.equal((await como(db, ESTRANHO, `select id from storage.objects where bucket_id = 'cofre'`)).length, 0)
  const outro = (await enviar(ADM, V))[0].id
  await como(db, MEMBRO, 'delete from storage.objects where id = $1', [outro])
  assert.equal((await db.query(`select count(*)::int as n from storage.objects where bucket_id = 'cofre'`)).rows[0].n, 2)
  await como(db, ADM, `delete from storage.objects where bucket_id = 'cofre'`)
  assert.equal((await db.query(`select count(*)::int as n from storage.objects where bucket_id = 'cofre'`)).rows[0].n, 0)
})

// ---------------- 029: agenda do dia ----------------
const novoEvento = (db, quem, extra = {}) =>
  como(
    db,
    quem,
    'insert into public.eventos_agenda (viagem_id, dia, hora, titulo) values ($1, $2, $3, $4) returning id',
    [V, extra.dia ?? '2026-11-20', extra.hora ?? '20:00', extra.titulo ?? 'Jantar no porto'],
  ).then((r) => r[0]?.id)

test('029: membro cria evento e o comboio vê; estranho não vê nem cria', async () => {
  const db = await novoBanco()
  assert.ok(await novoEvento(db, MEMBRO))
  assert.equal((await como(db, ADM, 'select titulo from public.eventos_agenda'))[0].titulo, 'Jantar no porto')
  assert.equal((await como(db, ESTRANHO, 'select id from public.eventos_agenda')).length, 0)
  await assert.rejects(novoEvento(db, ESTRANHO), /row-level security/)
})

test('029: autor ou ADM edita e apaga; outro membro não', async () => {
  const db = await novoBanco()
  const OUTRO = '00000000-0000-0000-0000-00000000000d'
  await db.exec(`insert into auth.users (id, email) values ('${OUTRO}', 'outro@teste');
    insert into public.comboio_membros (viagem_id, usuario_id, papel) values ('${V}', '${OUTRO}', 'membro');`)
  const id = await novoEvento(db, MEMBRO)
  assert.equal((await como(db, OUTRO, `update public.eventos_agenda set titulo = 'x' where id = $1 returning id`, [id])).length, 0)
  assert.equal((await como(db, OUTRO, 'delete from public.eventos_agenda where id = $1 returning id', [id])).length, 0)
  assert.equal((await como(db, MEMBRO, `update public.eventos_agenda set hora = '21:30' where id = $1 returning id`, [id])).length, 1)
  assert.equal((await como(db, ADM, 'delete from public.eventos_agenda where id = $1 returning id', [id])).length, 1)
})

test('029: autor e viagem não mudam; título vazio é recusado', async () => {
  const db = await novoBanco()
  const id = await novoEvento(db, MEMBRO)
  await assert.rejects(como(db, ADM, `update public.eventos_agenda set criado_por = '${ADM}' where id = $1`, [id]), /autor/)
  await assert.rejects(novoEvento(db, MEMBRO, { titulo: '   ' }), /check/)
})

// ---------------- 031: central de notificações ----------------
const atividades = (db, quem) => como(db, quem, 'select tipo, autor, titulo, alvo_id from public.atividades_viagem order by criado_em, tipo')

test('031: gasto do comboio, lugar e evento entram no log com autor e título', async () => {
  const db = await novoBanco()
  await salvarGasto(db, MEMBRO, cafe, metade)
  await como(db, ADM, `insert into public.lugares (viagem_id, destino_id, tipo, nome) values ($1, $2, 'passeio', 'Castelo')`, [V, NICE])
  await como(db, MEMBRO, `insert into public.eventos_agenda (viagem_id, dia, titulo) values ($1, '2026-11-20', 'Jantar')`, [V])
  const log = (await atividades(db, ADM)).filter((a) => a.tipo !== 'membro')
  assert.deepEqual(
    log.map((a) => [a.tipo, a.autor, a.titulo]),
    [
      ['gasto', MEMBRO, 'Café'],
      ['lugar', ADM, 'Castelo'],
      ['evento', MEMBRO, 'Jantar'],
    ],
  )
})

test('031: gasto pessoal e comentário nele não entram no log', async () => {
  const db = await novoBanco()
  await salvarGasto(db, MEMBRO, { ...cafe, pessoal: true })
  const gasto = (await db.query('select id from public.gastos')).rows[0].id
  await como(db, MEMBRO, 'insert into public.comentarios_item (gasto_id, texto) values ($1, $2)', [gasto, 'só meu'])
  assert.equal((await atividades(db, MEMBRO)).filter((a) => a.tipo !== 'membro').length, 0)
})

test('031: estranho não vê o log; ninguém grava no log na mão', async () => {
  const db = await novoBanco()
  await como(db, ADM, `insert into public.tarefas (viagem_id, titulo) values ($1, 'Seguro')`, [V])
  assert.equal((await atividades(db, ESTRANHO)).length, 0)
  assert.ok((await atividades(db, MEMBRO)).some((a) => a.tipo === 'tarefa'))
  await assert.rejects(
    como(db, MEMBRO, `insert into public.atividades_viagem (viagem_id, tipo) values ($1, 'aviso')`, [V]),
    /row-level security|permission denied/,
  )
})

test('031: "visto até" é de cada um', async () => {
  const db = await novoBanco()
  await como(db, MEMBRO, 'insert into public.atividades_vistas (viagem_id) values ($1)', [V])
  assert.equal((await como(db, MEMBRO, 'select usuario_id from public.atividades_vistas'))[0].usuario_id, MEMBRO)
  assert.equal((await como(db, ADM, 'select usuario_id from public.atividades_vistas')).length, 0)
  // Estranho não marca visto numa viagem que não é dele
  await assert.rejects(como(db, ESTRANHO, 'insert into public.atividades_vistas (viagem_id) values ($1)', [V]), /row-level security/)
})

// ---------------- 032: lembretes ----------------
const lembretes = (db) => db.query('select tipo, titulo, meio from public.lembretes_a_enviar()').then((r) => r.rows)

test('032: trajeto e ponto que vencem na próxima hora saem uma vez só', async () => {
  const db = await novoBanco()
  await db.exec(`
    insert into public.trajetos (viagem_id, origem_id, destino_id, meio, partida) values
      ('${V}', '${NICE}', '${MONACO}', 'trem', now() + interval '40 minutes'),
      ('${V}', '${MONACO}', '${NICE}', 'onibus', now() + interval '3 hours'),
      ('${V}', '${MONACO}', '${NICE}', 'trem', now() - interval '10 minutes');
    insert into public.pontos_de_encontro (viagem_id, local, quando, criado_por) values ('${V}', 'Praça Masséna', now() + interval '20 minutes', '${ADM}');
  `)
  const primeira = await lembretes(db)
  assert.deepEqual(
    primeira.map((l) => [l.tipo, l.titulo, l.meio]).sort(),
    [
      ['ponto', 'Praça Masséna', null],
      ['trajeto', 'Nice → Mônaco', 'trem'],
    ],
  )
  // Rodar de novo não repete
  assert.equal((await lembretes(db)).length, 0)
})

test('032: mudou o horário, lembra de novo', async () => {
  const db = await novoBanco()
  await db.exec(`insert into public.trajetos (viagem_id, origem_id, destino_id, partida) values ('${V}', '${NICE}', '${MONACO}', now() + interval '30 minutes')`)
  assert.equal((await lembretes(db)).length, 1)
  await db.exec(`update public.trajetos set partida = now() + interval '50 minutes'`)
  assert.equal((await lembretes(db)).length, 1)
})

test('032: quem usa o app não chama a função nem lê o que foi enviado', async () => {
  const db = await novoBanco()
  await assert.rejects(como(db, ADM, 'select * from public.lembretes_a_enviar()'), /permission denied/)
  assert.equal((await como(db, ADM, 'select * from public.lembretes_enviados')).length, 0)
})

// ---------------- 033: preferências de aviso ----------------
test('033: cada um liga/desliga os próprios avisos e não vê os dos outros', async () => {
  const db = await novoBanco()
  await como(db, MEMBRO, "insert into public.preferencias_aviso (tipo, ligado) values ('lembretes', false)")
  await como(db, MEMBRO, "update public.preferencias_aviso set ligado = true where tipo = 'lembretes'")
  assert.deepEqual(await como(db, MEMBRO, 'select tipo, ligado from public.preferencias_aviso'), [{ tipo: 'lembretes', ligado: true }])
  // O ADM não vê nem mexe na preferência do membro
  assert.equal((await como(db, ADM, 'select * from public.preferencias_aviso')).length, 0)
  await como(db, ADM, "update public.preferencias_aviso set ligado = false")
  assert.equal((await como(db, MEMBRO, 'select ligado from public.preferencias_aviso'))[0].ligado, true)
  // Ninguém grava preferência no nome de outra pessoa
  await assert.rejects(como(db, ADM, `insert into public.preferencias_aviso (usuario_id, tipo, ligado) values ('${MEMBRO}', 'fotos', false)`), /row-level security/)
  // Tipo inventado não entra
  await assert.rejects(como(db, MEMBRO, "insert into public.preferencias_aviso (tipo) values ('spam')"), /check/)
})

// ---------------- 035: situação e preço do trajeto ----------------
test('035: trajeto nasce como sugestão; ADM marca comprado com preço; preço sem moeda é barrado', async () => {
  const db = await novoBanco()
  const [{ id }] = await como(db, ADM, `insert into public.trajetos (viagem_id, origem_id, destino_id) values ('${V}', '${NICE}', '${MONACO}') returning id, situacao`)
  assert.equal((await db.query('select situacao from public.trajetos')).rows[0].situacao, 'sugestao')
  await como(db, ADM, `update public.trajetos set situacao = 'comprado', preco = 45.50, moeda = 'EUR' where id = $1`, [id])
  assert.deepEqual((await como(db, MEMBRO, 'select situacao, preco::text, moeda from public.trajetos'))[0], { situacao: 'comprado', preco: '45.50', moeda: 'EUR' })
  await assert.rejects(como(db, ADM, `update public.trajetos set preco = 10, moeda = null where id = $1`, [id]), /preco_com_moeda/)
  await assert.rejects(como(db, ADM, `update public.trajetos set situacao = 'pago' where id = $1`, [id]), /check/)
  // Membro não muda a situação (o ADM edita trajetos)
  await como(db, MEMBRO, `update public.trajetos set situacao = 'sugestao' where id = $1`, [id])
  assert.equal((await db.query('select situacao from public.trajetos')).rows[0].situacao, 'comprado')
})

// ---------------- 038: passaporte e nacionalidade ----------------
test('038: só a própria pessoa vê a validade; o comboio só recebe o alerta', async () => {
  const db = await novoBanco()
  await db.exec(`update public.viagens set data_inicio = '2027-06-01', data_fim = '2027-06-20' where id = '${V}'`)
  await como(db, MEMBRO, "insert into public.documentos_pessoais (nacionalidades, passaporte_validade) values ('{BR,IT}', '2027-09-01')")
  await como(db, ADM, "insert into public.documentos_pessoais (passaporte_validade) values ('2030-01-01')")
  // ADM não vê a linha do membro
  assert.equal((await como(db, ADM, 'select * from public.documentos_pessoais')).length, 1)
  assert.deepEqual((await como(db, MEMBRO, 'select nacionalidades from public.documentos_pessoais'))[0].nacionalidades, ['BR', 'IT'])
  // Alerta: membro vence antes de 20/12/2027 (volta + 6 meses); ADM está ok
  assert.deepEqual(await como(db, ADM, `select usuario_id, situacao from public.alertas_de_passaporte('${V}')`), [{ usuario_id: MEMBRO, situacao: 'vence' }])
  // Quem não é do comboio não recebe nada
  assert.equal((await como(db, ESTRANHO, `select * from public.alertas_de_passaporte('${V}')`)).length, 0)
})

test('038: sem validade informada vira "sem_data"; país inválido e 4 nacionalidades são barrados', async () => {
  const db = await novoBanco()
  const alertas = await como(db, MEMBRO, `select usuario_id, situacao from public.alertas_de_passaporte('${V}') order by usuario_id`)
  assert.deepEqual(alertas.map((a) => a.situacao), ['sem_data', 'sem_data'])
  await assert.rejects(como(db, MEMBRO, "insert into public.documentos_pessoais (nacionalidades) values ('{brasil}')"), /check/)
  await assert.rejects(como(db, MEMBRO, "insert into public.documentos_pessoais (nacionalidades) values ('{BR,IT,PT,ES}')"), /check/)
  await assert.rejects(como(db, ADM, `insert into public.documentos_pessoais (usuario_id) values ('${MEMBRO}')`), /row-level security/)
})

// ---------------- 039: seguro viagem ----------------
test('039: comboio vê e cadastra seguro; só cobre gente do comboio; autor ou ADM edita', async () => {
  const db = await novoBanco()
  const [{ id }] = await como(
    db,
    MEMBRO,
    `insert into public.seguros_viagem (viagem_id, seguradora, telefone, cobertos) values ('${V}', 'Assist Card', '+55 11 4000-0000', '{${MEMBRO},${ADM}}') returning id`,
  )
  assert.equal((await como(db, ADM, 'select seguradora from public.seguros_viagem'))[0].seguradora, 'Assist Card')
  assert.equal((await como(db, ESTRANHO, 'select * from public.seguros_viagem')).length, 0)
  await assert.rejects(
    como(db, MEMBRO, `insert into public.seguros_viagem (viagem_id, seguradora, cobertos) values ('${V}', 'X', '{${ESTRANHO}}')`),
    /comboio/,
  )
  await assert.rejects(como(db, MEMBRO, `insert into public.seguros_viagem (viagem_id, seguradora, telefone) values ('${V}', 'X', 'liga pra mim')`), /check/)
  // ADM edita o do membro; estranho não cadastra
  await como(db, ADM, `update public.seguros_viagem set cobertura = 'Médico até US$ 60 mil' where id = $1`, [id])
  assert.equal((await db.query('select cobertura from public.seguros_viagem')).rows[0].cobertura, 'Médico até US$ 60 mil')
  await assert.rejects(como(db, ESTRANHO, `insert into public.seguros_viagem (viagem_id, seguradora) values ('${V}', 'X')`), /row-level security/)
})

// ---------------- 041: prazo de cancelamento ----------------
test('041: lembra 2 dias antes do cancelamento grátis, só da hospedagem escolhida, uma vez', async () => {
  const db = await novoBanco()
  await como(
    db,
    ADM,
    `insert into public.hospedagens (viagem_id, destino_id, nome, escolhida, cancelamento_gratis_ate) values
      ('${V}', '${NICE}', 'Casa escolhida', true, current_date + 1),
      ('${V}', '${MONACO}', 'Opção não escolhida', false, current_date + 1),
      ('${V}', null, 'Longe ainda', true, current_date + 10)`,
  )
  const r = await db.query("select tipo, titulo from public.lembretes_a_enviar() where tipo = 'cancelamento'")
  assert.deepEqual(r.rows, [{ tipo: 'cancelamento', titulo: 'Casa escolhida' }])
  assert.equal((await db.query("select * from public.lembretes_a_enviar() where tipo = 'cancelamento'")).rows.length, 0)
  await assert.rejects(db.query("update public.hospedagens set cancelamento_gratis_ate = '1990-01-01'"), /check/)
})
