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
