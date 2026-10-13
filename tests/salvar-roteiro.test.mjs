// Testes da função salvar_roteiro num PostgreSQL descartável (PGlite), dentro do Node.
// Nada toca o Supabase real. Rodar: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const PROJETO = join(import.meta.dirname, '..')
const ler = (arq) => readFileSync(arq, 'utf8')
const MIGRATIONS = [
  join(import.meta.dirname, 'supabase-falso.sql'),
  join(PROJETO, 'supabase/migrations/20261010120000_estrutura_inicial.sql'),
  join(PROJETO, 'supabase/migrations/20261010121000_ajustes_seguranca.sql'),
  join(PROJETO, 'supabase/migrations/20261013182836_salvar_roteiro.sql'),
].map(ler)

// Pessoas e dados de teste
const ADM = '00000000-0000-0000-0000-00000000000a'
const MEMBRO = '00000000-0000-0000-0000-00000000000b'
const ESTRANHO = '00000000-0000-0000-0000-00000000000c'
const V = '11111111-1111-1111-1111-111111111111'
const V2 = '22222222-2222-2222-2222-222222222222'
const LIS = 'aaaaaaaa-0000-0000-0000-000000000001'
const POR = 'aaaaaaaa-0000-0000-0000-000000000002'
const MAD = 'aaaaaaaa-0000-0000-0000-000000000003'
const XOUTRA = 'bbbbbbbb-0000-0000-0000-000000000001'

async function novoBanco() {
  const db = new PGlite({ extensions: { pgcrypto } })
  for (const sql of MIGRATIONS) await db.exec(sql)
  await db.exec(`
    insert into auth.users (id, email) values ('${ADM}', 'adm@teste'), ('${MEMBRO}', 'membro@teste'), ('${ESTRANHO}', 'estranho@teste');
    insert into public.viagens (id, nome, criado_por) values ('${V}', 'Ibérica', '${ADM}'), ('${V2}', 'Outra', '${ESTRANHO}');
    insert into public.comboio_membros (viagem_id, usuario_id, papel) values ('${V}', '${MEMBRO}', 'membro');
    insert into public.destinos (id, viagem_id, nome, pais, latitude, longitude, ordem, chegada, saida) values
      ('${LIS}', '${V}', 'Lisboa', 'Portugal', 38.7, -9.1, 0, '2026-11-01', '2026-11-03'),
      ('${POR}', '${V}', 'Porto', 'Portugal', 41.1, -8.6, 1, '2026-11-03', '2026-11-05'),
      ('${MAD}', '${V}', 'Madri', 'Espanha', 40.4, -3.7, 2, null, null),
      ('${XOUTRA}', '${V2}', 'Roma', 'Itália', 41.9, 12.5, 0, null, null);
    insert into public.trajetos (viagem_id, origem_id, destino_id, meio) values ('${V}', '${LIS}', '${POR}', 'trem'), ('${V}', '${POR}', '${MAD}', 'aviao');
    insert into public.fotos (viagem_id, destino_id, enviada_por, caminho) values ('${V}', '${POR}', '${MEMBRO}', '${V}/porto.webp');
    insert into storage.objects (bucket_id, name, owner_id) values ('fotos', '${V}/porto.webp', '${MEMBRO}');
  `)
  return db
}

// Chama a função como uma pessoa logada (ou sem login), numa transação, igual ao site
async function salvar(db, quem, destinos, removidos = [], viagem = V) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${quem ? 'authenticated' : 'anon'}`)
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [quem ?? ''])
    const r = await tx.query('select * from public.salvar_roteiro($1::uuid, $2::jsonb, $3::uuid[])', [
      viagem,
      destinos === null ? null : JSON.stringify(destinos),
      removidos,
    ])
    return r.rows
  })
}

// Leitura como "dono do banco" (sem RLS), pra conferir o estado real
const roteiro = async (db, viagem = V) =>
  (await db.query(`select nome, ordem, chegada, saida from public.destinos where viagem_id = $1 order by ordem`, [viagem])).rows
const nomes = async (db, viagem = V) => (await roteiro(db, viagem)).map((d) => `${d.ordem}:${d.nome}`).join(' ')
const ORIGINAL = '0:Lisboa 1:Porto 2:Madri'
const tudo = async (db) => ({
  destinos: (await db.query('select * from public.destinos order by viagem_id, ordem')).rows,
  trajetos: (await db.query('select origem_id, destino_id from public.trajetos order by meio')).rows,
  fotos: (await db.query('select destino_id from public.fotos')).rows,
  arquivos: (await db.query('select name from storage.objects')).rows,
})
const existente = (id, nome) => ({ id, nome })
const novo = (nome, lat = 41.9, lon = 12.5) => ({ id: null, nome, pais: 'Itália', latitude: lat, longitude: lon })
const L = existente(LIS, 'Lisboa'), Pt = existente(POR, 'Porto'), M = existente(MAD, 'Madri')

// Espera um erro e confere que NADA mudou no banco
async function recusa(db, promessa, padrao) {
  const antes = await tudo(db)
  await assert.rejects(promessa, padrao)
  assert.deepEqual(await tudo(db), antes, 'o banco deveria continuar igual')
}

// ---------------- Permissões ----------------
test('ADM consegue salvar', async () => {
  const db = await novoBanco()
  const r = await salvar(db, ADM, [M, L, Pt])
  assert.deepEqual(r.map((d) => d.nome), ['Madri', 'Lisboa', 'Porto'])
})
test('MEMBRO não consegue salvar (e nada muda)', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, MEMBRO, [M, L, Pt]), /Só o ADM/)
})
test('Pessoa de fora da viagem não consegue salvar', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ESTRANHO, [M, L, Pt]), /Só o ADM/)
})
test('Visitante sem login não pode nem chamar a função', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, null, [M, L, Pt]), /permission denied for function salvar_roteiro/)
})
test('ADM de uma viagem não mexe em outra viagem', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [existente(XOUTRA, 'Roma')], [], V2), /Só o ADM/)
})

// ---------------- Validação ----------------
test('Lista vazia é recusada', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [], [LIS, POR, MAD]), /pelo menos um destino/)
})
test('Lista nula é recusada (antes apagaria tudo!)', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, null, [LIS]), /Formato de roteiro inválido/)
  assert.equal(await nomes(db), ORIGINAL)
})
test('Formato que não é lista é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, { nome: 'x' }), /Formato de roteiro inválido/)
})
test('Item que não é objeto é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [L, 'Porto', M]), /Formato de destino inválido/)
})
test('Destino de OUTRA viagem na lista é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [L, Pt, M, existente(XOUTRA, 'Roma')]), /alterado em outro lugar/)
  assert.equal(await nomes(db, V2), '0:Roma')
})
test('Id repetido é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [L, Pt, M, { id: LIS.toUpperCase(), nome: 'Lisboa' }]), /repetido/)
})
test('Mesmo destino mantido e removido é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [L, Pt, M], [POR]), /mantido e removido/)
})
test('Destino novo com coordenada inválida é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [L, Pt, M, novo('Lugar errado', 200, 0)]), /dados inválidos/)
})
test('Destino novo sem nome (ou só espaços) é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [L, Pt, M, novo('   ')]), /dados inválidos/)
})
test('Mais de 100 destinos é recusado', async () => {
  const db = await novoBanco()
  const muitos = [L, Pt, M, ...Array.from({ length: 98 }, (_, i) => novo(`Lugar ${i}`))]
  await recusa(db, salvar(db, ADM, muitos), /no máximo 100/)
})
test('Id que não é uuid é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [L, Pt, M, { id: 'abc', nome: 'x' }]), /invalid input syntax for type uuid/)
})

// ---------------- Adicionar, reordenar, remover ----------------
test('Reordenar muda só a ordem: datas e posição continuam iguais', async () => {
  const db = await novoBanco()
  const antes = Object.fromEntries((await tudo(db)).destinos.map((d) => [d.id, d]))
  await salvar(db, ADM, [M, Pt, L])
  assert.equal(await nomes(db), '0:Madri 1:Porto 2:Lisboa')
  for (const d of (await tudo(db)).destinos) {
    const { ordem: _a, ...resto } = d
    const { ordem: _b, ...restoAntes } = antes[d.id]
    assert.deepEqual(resto, restoAntes)
  }
  assert.deepEqual((await tudo(db)).trajetos.length, 2)
})
test('Adicionar novo no meio: entra na posição certa e os outros andam', async () => {
  const db = await novoBanco()
  const r = await salvar(db, ADM, [L, novo('  Roma  '), Pt, M])
  assert.equal(await nomes(db), '0:Lisboa 1:Roma 2:Porto 3:Madri')
  const roma = r.find((d) => d.nome === 'Roma')
  assert.ok(roma.id && roma.pais === 'Itália' && roma.chegada === null, 'Roma salva com id, país e sem datas (nome sem espaços)')
})
test('Remover Porto (com 2 trajetos e 1 foto do MEMBRO): Porto sai, trajetos/foto/arquivo FICAM sem o lugar', async () => {
  const db = await novoBanco()
  await salvar(db, ADM, [L, M], [POR])
  assert.equal(await nomes(db), '0:Lisboa 1:Madri')
  const { trajetos, fotos, arquivos } = await tudo(db)
  assert.deepEqual(trajetos, [
    { origem_id: null, destino_id: MAD }, // avião Porto→Madri: perdeu a origem
    { origem_id: LIS, destino_id: null }, // trem Lisboa→Porto: perdeu o destino
  ])
  assert.deepEqual(fotos, [{ destino_id: null }], 'a foto do membro continua, sem lugar')
  assert.equal(arquivos.length, 1, 'o arquivo da foto continua no Storage')
})
test('Adicionar, remover e reordenar tudo de uma vez', async () => {
  const db = await novoBanco()
  await salvar(db, ADM, [novo('Roma'), M, L], [POR])
  assert.equal(await nomes(db), '0:Roma 1:Madri 2:Lisboa')
})
test('Remover até o último destino possível: a lista não pode ficar vazia', async () => {
  const db = await novoBanco()
  await salvar(db, ADM, [M], [LIS, POR])
  assert.equal(await nomes(db), '0:Madri')
  await recusa(db, salvar(db, ADM, [], [MAD]), /pelo menos um destino/)
})
test('Id de outra viagem em "removidos" NÃO apaga nada da outra viagem', async () => {
  const db = await novoBanco()
  await salvar(db, ADM, [L, Pt, M], [XOUTRA])
  assert.equal(await nomes(db, V2), '0:Roma')
  assert.equal(await nomes(db), ORIGINAL)
})

// ---------------- Tudo ou nada ----------------
test('Erro no FIM desfaz a remoção feita no COMEÇO (nada fica pela metade)', async () => {
  const db = await novoBanco()
  // remove Porto (passo 1) e depois falha no destino novo inválido (passo 2)
  await recusa(db, salvar(db, ADM, [L, M, novo('Inválido', 999, 0)], [POR]), /dados inválidos/)
  assert.equal(await nomes(db), ORIGINAL)
  const { trajetos, fotos } = await tudo(db)
  assert.ok(trajetos.every((t) => t.origem_id && t.destino_id), 'trajetos continuam ligados')
  assert.equal(fotos[0].destino_id, POR, 'foto continua ligada ao Porto')
})

// ---------------- Edição desatualizada / duas abas ----------------
test('Duas abas: a aba B adiciona Roma; a aba A (desatualizada) salva → recusada e Roma NÃO é apagada', async () => {
  const db = await novoBanco()
  await salvar(db, ADM, [L, Pt, M, novo('Roma')]) // aba B
  const depoisDeB = await tudo(db)
  await recusa(db, salvar(db, ADM, [M, L, Pt]), /alterado em outro lugar/) // aba A, que não conhecia Roma
  assert.deepEqual(await tudo(db), depoisDeB)
  assert.equal(await nomes(db), '0:Lisboa 1:Porto 2:Madri 3:Roma')
})
test('Duas abas: a aba B remove Porto; a aba A (desatualizada, ainda com Porto) salva → recusada', async () => {
  const db = await novoBanco()
  await salvar(db, ADM, [L, M], [POR]) // aba B
  await recusa(db, salvar(db, ADM, [Pt, L, M]), /alterado em outro lugar/) // aba A
  assert.equal(await nomes(db), '0:Lisboa 1:Madri')
})
test('Duas abas: as duas removem Porto → a segunda também funciona (nada a apagar de novo)', async () => {
  const db = await novoBanco()
  await salvar(db, ADM, [L, M], [POR])
  await salvar(db, ADM, [M, L], [POR])
  assert.equal(await nomes(db), '0:Madri 1:Lisboa')
})
test('O código do erro de conflito é TR409 (o site usa isso pra mostrar a mensagem certa)', async () => {
  const db = await novoBanco()
  await salvar(db, ADM, [L, Pt, M, novo('Roma')])
  await assert.rejects(salvar(db, ADM, [L, Pt, M]), (e) => e.code === 'TR409')
})

// ---------------- Segurança da função ----------------
test('A função roda com as permissões de quem chamou (security invoker) e com search_path vazio', async () => {
  const db = await novoBanco()
  const { rows } = await db.query(`
    select p.prosecdef, p.proconfig, has_function_privilege('anon', p.oid, 'execute') as anon_pode,
           has_function_privilege('authenticated', p.oid, 'execute') as logado_pode
    from pg_proc p where p.proname = 'salvar_roteiro'`)
  assert.deepEqual(rows, [{ prosecdef: false, proconfig: ['search_path=""'], anon_pode: false, logado_pode: true }])
})
test('Mesmo sem a função, o MEMBRO não consegue apagar destinos direto na tabela (RLS)', async () => {
  const db = await novoBanco()
  const apagados = await db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [MEMBRO])
    return (await tx.query(`delete from public.destinos where viagem_id = $1 returning id`, [V])).rows.length
  })
  assert.equal(apagados, 0)
  assert.equal(await nomes(db), ORIGINAL)
})

// ---------------- O pacote que o SITE envia ----------------
// Capturado no navegador (Overview > Editar: Madri pro 1º, remove Porto, adiciona Roma pela busca real)
const PACOTE_DO_SITE = {
  p_viagem: V,
  p_destinos: [
    { id: MAD, latitude: 40, longitude: -3, nome: 'Madri', pais: 'Espanha' },
    { id: LIS, latitude: 40, longitude: -5, nome: 'Lisboa', pais: 'Portugal' },
    { id: null, latitude: 41.89193, longitude: 12.51133, nome: 'Roma', pais: 'Itália' },
  ],
  p_removidos: [POR],
}
test('O pacote real enviado pelo site funciona (chamada por nome, como o Supabase faz)', async () => {
  const db = await novoBanco()
  const r = await db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [ADM])
    return (await tx.query(
      'select * from public.salvar_roteiro(p_viagem => $1, p_destinos => $2, p_removidos => $3)',
      [PACOTE_DO_SITE.p_viagem, JSON.stringify(PACOTE_DO_SITE.p_destinos), PACOTE_DO_SITE.p_removidos],
    )).rows
  })
  assert.deepEqual(r.map((d) => `${d.ordem}:${d.nome}`), ['0:Madri', '1:Lisboa', '2:Roma'])
  // "Atualizar a página" = buscar de novo do banco, em ordem (o mesmo select do site)
  assert.equal(await nomes(db), '0:Madri 1:Lisboa 2:Roma')
  assert.deepEqual((await tudo(db)).fotos, [{ destino_id: null }])
})

test('Destino novo SEM latitude/longitude é recusado', async () => {
  const db = await novoBanco()
  await recusa(db, salvar(db, ADM, [L, Pt, M, { id: null, nome: 'Sem lugar', pais: 'X', latitude: null, longitude: 10 }]), /dados inválidos/)
  await recusa(db, salvar(db, ADM, [L, Pt, M, { id: null, nome: 'Sem lugar', pais: 'X' }]), /dados inválidos/)
})
