// Tira fotos das telas do app (Expo web em http://localhost:8089) no modo demonstração, em resolução de iPhone.
// Serve pros carrosséis de marketing. Nada vai pro banco: o demo/servidor.mjs responde no lugar do Supabase.
// Uso: node telas.mjs   -> gravacoes/telas/<nome>.png (1170×2532)
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { instalarDemo } from './demo/servidor.mjs'
import { VIAGEM } from './demo/dados.mjs'

const APP = 'http://localhost:8089'
const PASTA = 'gravacoes/telas'
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const TODOS_OS_CARIMBOS = ['roteiro', 'galera', 'datas', 'hospedagem', 'transporte', 'gastos']

// Arrasta o cartão do Explorar pra direita, como um dedo (igual ao gravar.mjs)
async function deslizar(page) {
  const x = 195, y = 844 * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= 20; i++) { await page.mouse.move(x + 240 * (i / 20) ** 1.5, y - 20 * (i / 20)); await esperar(14) }
  await page.mouse.up()
}

const TELAS = {
  async inicio(page) {
    await page.goto(`${APP}/`)
    await page.getByText('Eurotrip').first().waitFor({ timeout: 30000 })
    await esperar(3000)
  },
  async viagem(page) {
    await page.goto(`${APP}/viagem/${VIAGEM}`)
    await page.getByText('Apê em Montmartre').waitFor({ timeout: 30000 })
    await esperar(3000)
  },
  async passaporte(page) {
    await page.goto(`${APP}/viagem/${VIAGEM}`)
    await page.getByText('Apê em Montmartre').waitFor({ timeout: 30000 })
    await esperar(2000)
    await page.mouse.move(195, 600)
    await page.mouse.wheel(0, 520)
    await esperar(1500)
  },
  async explorar(page) {
    await page.goto(`${APP}/explorar`)
    await page.getByText('Ana, Juliana e Beto querem').waitFor({ timeout: 30000 })
    await esperar(3000)
  },
  async match(page) {
    await page.goto(`${APP}/explorar`)
    await page.getByText('Ana, Juliana e Beto querem').waitFor({ timeout: 30000 })
    await esperar(2500)
    await deslizar(page)
    await esperar(1500)
    await deslizar(page)
    await page.getByText(/Deu match/).waitFor({ timeout: 10000 })
    await esperar(1800)
  },
  async contas(page) {
    await page.goto(`${APP}/viagem/${VIAGEM}/contas`)
    await page.getByPlaceholder(/o que foi/).waitFor({ timeout: 30000 })
    await esperar(2500)
  },
  async roteiro(page) {
    await page.goto(`${APP}/viagem/${VIAGEM}/roteiro`)
    await esperar(5000)
  },
}

await mkdir(PASTA, { recursive: true })
const opcoes = existsSync('/usr/bin/google-chrome') ? { executablePath: '/usr/bin/google-chrome' } : {}
const navegador = await chromium.launch(opcoes)
for (const [nome, fazer] of Object.entries(TELAS)) {
  if (process.argv[2] && process.argv[2] !== nome) continue
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, locale: 'pt-BR', colorScheme: 'light' })
  await instalarDemo(contexto)
  const page = await contexto.newPage()
  // carimbos já vistos: a tela abre sem a comemoração por cima
  await page.addInitScript(([chave, v]) => localStorage.setItem(chave, v), [`tripwave.carimbos.${VIAGEM}`, JSON.stringify(TODOS_OS_CARIMBOS)])
  try {
    await fazer(page)
    await page.screenshot({ path: `${PASTA}/${nome}.png` })
    console.log('ok', nome)
  } catch (e) {
    console.log('falhou', nome, String(e).slice(0, 160))
  }
  await contexto.close()
}
await navegador.close()
