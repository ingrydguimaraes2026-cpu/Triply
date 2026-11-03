// Abre as telas das cenas no modo demonstração e lista o que o app pediu ao Supabase.
// Uso: node demo/descobrir.mjs [/caminho ...]   (tira um print de cada tela em gravacoes/descobrir-N.png)
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { instalarDemo, pedidos } from './servidor.mjs'
import { VIAGEM } from './dados.mjs'

const APP = 'http://localhost:8089'
const caminhos = process.argv.slice(2).length ? process.argv.slice(2) : ['/', `/viagem/${VIAGEM}`, `/viagem/${VIAGEM}/roteiro`, `/viagem/${VIAGEM}/contas`]
await mkdir('gravacoes', { recursive: true })
const navegador = await chromium.launch()
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'pt-BR' })
await instalarDemo(contexto, { registrar: true })
const page = await contexto.newPage()
const erros = []
page.on('pageerror', (e) => erros.push(String(e).slice(0, 200)))
for (const [i, c] of caminhos.entries()) {
  pedidos.length = 0
  await page.goto(APP + c)
  await page.waitForTimeout(6000)
  await page.screenshot({ path: `gravacoes/descobrir-${i}.png` })
  console.log(`\n=== ${c}  (texto: ${(await page.innerText('body')).slice(0, 140).replace(/\n/g, ' | ')})`)
  for (const p of [...new Set(pedidos)]) console.log('  ', p.slice(0, 260))
}
if (erros.length) console.log('\nERROS:', [...new Set(erros)].join('\n'))
await navegador.close()
