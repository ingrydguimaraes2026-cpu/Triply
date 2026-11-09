// Testes da spec 010 (checklist de documentos), sem banco. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const importar = (arq) => import(new URL(`../src/features/documentos/${arq}`, import.meta.url))
const { codigoDoPais } = await importar('paises.ts')
const { montarChecklist, somarMeses, somarDias, textoDoPrazo, prazoVencido, progresso } = await importar('checklist.ts')

const ROTEIRO_EUROPA = [
  { pais: 'Brasil' },
  { pais: 'França' },
  { pais: 'França' },
  { pais: 'Mónaco' },
  { pais: 'Itália' },
  { pais: 'Itália' },
  { pais: 'Itália' },
]
const JUNHO_2027 = { data_inicio: '2027-06-01', data_fim: '2027-06-08' }
const item = (c, chave) => c.itens.find((i) => i.chave === chave)

test('nome do país vira código, com ou sem acento e em outros idiomas', () => {
  assert.equal(codigoDoPais('Mónaco'), 'MC')
  assert.equal(codigoDoPais('Mônaco'), 'MC')
  assert.equal(codigoDoPais('Italia'), 'IT')
  assert.equal(codigoDoPais('  frança '), 'FR')
  assert.equal(codigoDoPais('Vaticano'), 'VA')
  assert.equal(codigoDoPais('Lugar Nenhum'), null)
  assert.equal(codigoDoPais(null), null)
})

test('datas: somar meses e dias', () => {
  assert.equal(somarMeses('2027-06-08', 3), '2027-09-08')
  assert.equal(somarMeses('2027-11-30', 3), '2028-02-29')
  assert.equal(somarDias('2027-06-01', -30), '2027-05-02')
})

test('roteiro Galeão → França → Mônaco → Itália (jun 2027)', () => {
  const c = montarChecklist(JUNHO_2027, ROTEIRO_EUROPA)
  assert.deepEqual(c.paises, ['FR', 'MC', 'IT'])
  assert.deepEqual(c.semRegra, [])
  assert.match(item(c, 'passaporte').texto, /08\/09\/2027/)
  assert.match(item(c, 'passaporte').texto, /menos de 10 anos/)

  const etias = c.itens.filter((i) => i.chave === 'etias')
  assert.equal(etias.length, 1, 'ETIAS aparece uma vez só')
  assert.deepEqual(etias[0].paises, ['FR', 'MC', 'IT'])
  assert.equal(etias[0].aConfirmar, true)
  assert.match(etias[0].texto, /França, Mônaco e Itália/)

  assert.ok(item(c, 'seguro-schengen'))
  assert.equal(item(c, 'seguro'), undefined, 'o seguro da Europa substitui o geral')
  assert.ok(item(c, 'comprovantes-schengen'))
  assert.equal(item(c, 'febre-amarela'), undefined)
  assert.ok(c.itens.every((i) => !i.paises.includes('BR')), 'nada sobre o Brasil')
})

test('só Mercosul: passaporte ou RG', () => {
  const c = montarChecklist(JUNHO_2027, [{ pais: 'Argentina' }, { pais: 'Chile' }])
  assert.equal(item(c, 'passaporte').titulo, 'Passaporte ou RG')
  assert.match(item(c, 'passaporte').texto, /RG\/CIN emitido há menos de 10 anos/)
  assert.ok(item(c, 'seguro'))
})

test('Mercosul + Europa: passaporte obrigatório', () => {
  const c = montarChecklist(JUNHO_2027, [{ pais: 'Argentina' }, { pais: 'Espanha' }])
  assert.equal(item(c, 'passaporte').titulo, 'Passaporte')
})

test('país sem regra manda pro Itamaraty e lembra da febre amarela', () => {
  const c = montarChecklist(JUNHO_2027, [{ pais: 'Tailândia' }])
  assert.deepEqual(c.semRegra, ['TH'])
  assert.match(item(c, 'sem-regra-TH').texto, /Itamaraty/)
  assert.deepEqual(item(c, 'febre-amarela').paises, ['TH'])
  assert.equal(item(c, 'passaporte').titulo, 'Passaporte')
})

test('viagem nacional: checklist vazio', () => {
  const c = montarChecklist(JUNHO_2027, [{ pais: 'Brasil' }, { pais: 'Brasil' }])
  assert.equal(c.itens.length, 0)
})

test('prazos: com data, sem data e vencido', () => {
  const comData = montarChecklist(JUNHO_2027, [{ pais: 'Estados Unidos' }])
  const visto = item(comData, 'visto-eua')
  assert.equal(textoDoPrazo(visto), 'Resolver até 03/12/2026')
  assert.equal(prazoVencido(visto, '2026-12-04'), true)
  assert.equal(prazoVencido(visto, '2026-10-18'), false)
  assert.equal(comData.itens[0].chave, 'visto-eua', 'prazo mais perto primeiro')

  const semData = montarChecklist({ data_inicio: null, data_fim: null }, [{ pais: 'Estados Unidos' }])
  assert.equal(textoDoPrazo(item(semData, 'visto-eua')), '180 dias antes da viagem')
})

test('sem datas na viagem usa as datas dos destinos', () => {
  const c = montarChecklist({ data_inicio: null, data_fim: null }, [
    { pais: 'Itália', chegada: '2027-06-01', saida: '2027-06-04' },
    { pais: 'França', chegada: '2027-06-04', saida: '2027-06-08' },
  ])
  assert.match(item(c, 'passaporte').texto, /08\/09\/2027/)
})

test('progresso conta só tarefas e aceita "não preciso"', () => {
  const c = montarChecklist(JUNHO_2027, ROTEIRO_EUROPA)
  const total = c.itens.filter((i) => i.tipo === 'tarefa').length
  assert.deepEqual(progresso(c.itens, {}), { feitas: 0, total })
  assert.deepEqual(progresso(c.itens, { passaporte: 'resolvido', etias: 'nao_preciso', ees: 'resolvido' }), { feitas: 2, total })
})
