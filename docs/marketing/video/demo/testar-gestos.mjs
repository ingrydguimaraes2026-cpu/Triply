// Roteiro de teste (modo demonstração, sem login): deslize do Explorar (arrasto e peteleco) e folha de Novo trajeto.
// Uso: com o Expo web na 8089, rodar `node demo/testar-gestos.mjs` nesta pasta. Mostra PASSOU/FALHOU.
import { chromium } from 'playwright'
import { instalarDemo } from './servidor.mjs'
const APP = 'http://localhost:8089'
const nav = await chromium.launch()
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', hasTouch: false })
await instalarDemo(ctx)
const page = await ctx.newPage()
const erros = []
page.on('pageerror', (e) => erros.push(String(e).slice(0, 200)))
await page.goto(APP + '/explorar'); await page.waitForTimeout(6000)
const antes = await page.getByText(/\d de \d/).first().innerText()
const box = await page.getByText('Torre Eiffel').first().boundingBox()
const cx = 195, cy = box.y - 150
await page.mouse.move(cx, cy); await page.mouse.down()
for (let i = 1; i <= 12; i++) { await page.mouse.move(cx + i * 20, cy + i * 2); await page.waitForTimeout(16) }
await page.screenshot({ path: 'gravacoes/teste-arrastando.png' })
await page.mouse.up(); await page.waitForTimeout(1200)
const depois = await page.getByText(/\d de \d/).first().innerText()
console.log('contador:', antes, '->', depois, depois !== antes ? 'PASSOU' : 'FALHOU')
// segundo cartão, arrasto longo pra esquerda
await page.mouse.move(cx, cy); await page.mouse.down()
for (let i = 1; i <= 12; i++) { await page.mouse.move(cx - i * 20, cy); await page.waitForTimeout(16) }
await page.mouse.up(); await page.waitForTimeout(1200)
const segundo = await page.getByText(/\d de \d/).first().innerText(); console.log('segundo cartao:', segundo)
// peteleco curto e rapido
await page.mouse.move(cx, cy); await page.mouse.down()
for (let i = 1; i <= 6; i++) { await page.mouse.move(cx + i * 12, cy) }
await page.mouse.up(); await page.waitForTimeout(1200)
const peteleco = await page.getByText(/\d de \d/).first().innerText()
console.log('peteleco:', segundo, '->', peteleco, peteleco !== segundo ? 'PASSOU' : 'FALHOU')
await page.goto(APP + '/transportes'); await page.waitForTimeout(5000)
await page.screenshot({ path: 'gravacoes/teste-transportes.png' })
await page.getByText('Adicionar trajeto').click(); await page.waitForTimeout(1200)
await page.screenshot({ path: 'gravacoes/teste-novo-trajeto.png' })
console.log('folha:', (await page.getByText('Novo trajeto').count()) > 0 ? 'PASSOU' : 'FALHOU')
if (erros.length) console.log('ERROS:', [...new Set(erros)].join('\n'))
await nav.close()
