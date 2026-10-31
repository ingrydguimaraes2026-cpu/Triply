// Testes da spec 111 (exigências automáticas), sem banco. Rodar: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { lerWikipedia, lerDias, tipoDoTexto, deDataset, melhorExigencia } = await import('@together/core/exigencias')
const { montarChecklist } = await import(new URL('../src/features/documentos/checklist.ts', import.meta.url))

// Trecho no formato da página "Visa requirements for Brazilian citizens"
const WIKI = `
{| class="sortable wikitable"
|-
| {{flag|Thailand}}
| {{yes|Visa not required}}<ref>{{Timatic|nationality=BR|destination=TH}}</ref>
| 3 months
|
|{{yes|✓}}
|-
| {{flag|Egypt}}
| {{Optional|eVisa/Visa on arrival}}<ref>{{Timatic|nationality=BR|destination=EG}}</ref><ref>{{cite web | url=https://www.visa2egypt.gov.eg | title=Egypt eVisa}}</ref>
| 30 days
|
|{{no|X}}
|-
| {{flag|South Korea}}
| {{yes|Electronic Travel Authorization}}<ref>{{cite web | url=http://www.k-eta.go.kr | title=K-ETA}}</ref>
| 90 days
|
|-
| {{flag|India}}
| {{yes2|eVisa}}<ref>{{Timatic|nationality=BR|destination=IN}}</ref>
| 30 days
|-
| {{flag|United States}}
| {{no|Visa required}}<ref>{{Timatic|nationality=BR|destination=US}}</ref>
|
|}`

test('lê a tabela da Wikipédia (com e sem o código do país na linha)', () => {
  const lista = lerWikipedia(WIKI)
  const de = (p) => lista.find((e) => e.destino === p)
  assert.deepEqual(de('TH'), { passaporte: 'BR', destino: 'TH', tipo: 'isento', dias: 90 })
  assert.equal(de('EG').tipo, 'na_chegada', 'duas opções: vale a mais fácil')
  assert.equal(de('KR').tipo, 'eta', 'sem Timatic: usa o nome da bandeira')
  assert.equal(de('IN').tipo, 'evisa')
  assert.equal(de('US').tipo, 'visto')
  assert.equal(de('US').dias, null)
})

test('dias e tipos', () => {
  assert.equal(lerDias('3 months'), 90)
  assert.equal(lerDias('up to 90 days'), 90)
  assert.equal(lerDias(''), null)
  assert.equal(tipoDoTexto('Online visa required'), 'evisa')
  assert.equal(tipoDoTexto('Freedom of Movement'), 'livre')
  assert.equal(tipoDoTexto('Something else'), null)
})

test('dataset vira exigências e o passaporte mais fácil vence', () => {
  const ds = deDataset({ BR: { US: { status: 'visa required' } }, IT: { US: { status: 'eta', days: 90 }, IT: { status: '-1' } } })
  assert.equal(ds.length, 2, 'ignora o próprio país')
  const wiki = [{ passaporte: 'BR', destino: 'US', tipo: 'visto', dias: null, fonte: 'wikipedia' }]
  const comFonte = ds.map((e) => ({ ...e, fonte: 'passport-index' }))
  assert.equal(melhorExigencia([...wiki, ...comFonte], ['BR']).get('US').fonte, 'wikipedia', 'Wikipédia vence o dataset')
  assert.equal(melhorExigencia([...wiki, ...comFonte], ['BR', 'IT']).get('US').tipo, 'eta', 'italiano entra com ETA')
})

test('checklist: país sem regra à mão usa a exigência automática', () => {
  const viagem = { data_inicio: '2027-06-01', data_fim: '2027-06-20' }
  const auto = new Map([['TH', { tipo: 'isento', dias: 90, passaporte: 'BR', fonte: 'wikipedia', dadosDe: '2026-10-19' }]])
  const c = montarChecklist(viagem, [{ pais: 'Tailândia' }, { pais: 'Índia' }], auto)
  assert.deepEqual(c.automaticos, ['TH'])
  const th = c.itens.find((i) => i.chave === 'auto-TH')
  assert.equal(th.titulo, 'Tailândia: sem visto até 90 dias')
  assert.match(th.texto, /Wikipédia, 19\/10\/2026/)
  assert.equal(th.prazo.data, '2027-05-02')
  assert.ok(c.itens.find((i) => i.chave === 'sem-regra-IN'), 'sem dado automático: continua o Itamaraty')
  assert.ok(!c.itens.find((i) => i.chave === 'sem-regra-TH'))
})
