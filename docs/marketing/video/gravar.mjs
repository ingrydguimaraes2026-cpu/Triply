// Grava as cenas do app (Expo web em http://localhost:8089) no tamanho de um iPhone, no modo demonstração:
// o Supabase é respondido por demo/servidor.mjs (comboio de 4 da "Eurotrip"). Sem login e sem tocar no banco.
// Uso: node gravar.mjs           -> grava todas as cenas em gravacoes/<cena>.webm (+ gravacoes/marcas.json)
//      node gravar.mjs contas    -> grava só uma cena
import { chromium } from 'playwright'
import { mkdir, readdir, rename, rm, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { instalarDemo } from './demo/servidor.mjs'
import { VIAGEM } from './demo/dados.mjs'

const APP = 'http://localhost:8089'
const PASTA = path.resolve('gravacoes')
const TELA = { width: 390, height: 844 }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const TODOS_OS_CARIMBOS = ['roteiro', 'galera', 'datas', 'hospedagem', 'transporte', 'gastos']

// Arrasta o cartão do Explorar como um dedo: acelera até soltar
async function deslizar(page, direcao) {
  const x = TELA.width / 2
  const y = TELA.height * 0.45
  await page.mouse.move(x, y)
  await page.mouse.down()
  const passos = 20
  for (let i = 1; i <= passos; i++) {
    await page.mouse.move(x + direcao * 240 * (i / passos) ** 1.5, y - 20 * (i / passos))
    await esperar(14)
  }
  await page.mouse.up()
}

// Rola a tela devagar (rodinha do mouse em passos pequenos)
async function rolar(page, total, passos = 24) {
  await page.mouse.move(TELA.width / 2, TELA.height * 0.6)
  for (let i = 0; i < passos; i++) {
    await page.mouse.wheel(0, total / passos)
    await esperar(16)
  }
}

const CENAS = {
  // Explorar: Torre Eiffel (quero), Sacré-Cœur (quero) fecha o match e a Norti comemora
  async explorar(page, marcar) {
    await page.goto(`${APP}/explorar`)
    await page.getByLabel('Quero').waitFor({ timeout: 30000 })
    await esperar(2500) // fotos carregam
    marcar()
    await esperar(1000)
    await deslizar(page, 1)
    await esperar(1500)
    await deslizar(page, 1)
    await page.getByText(/Deu match/).waitFor({ timeout: 10000 })
    await esperar(3800)
  },

  // Onde dormir: o duelo das 2 hospedagens; o voto enche a barra e "todo mundo votou"
  async duelo(page, marcar) {
    await page.addInitScript(([chave, vistos]) => localStorage.setItem(chave, vistos), [`tripwave.carimbos.${VIAGEM}`, JSON.stringify(TODOS_OS_CARIMBOS)])
    await page.goto(`${APP}/viagem/${VIAGEM}`)
    await page.getByText('Apê em Montmartre').waitFor({ timeout: 30000 })
    await esperar(1200)
    marcar()
    await esperar(1200)
    await rolar(page, 300)
    await esperar(900)
    await page.getByText('Apê em Montmartre').click()
    await esperar(2600)
  },

  // Contas: "jantar 84" na barra, o novo gasto abre preenchido, salva e entra na conversa
  async contas(page, marcar) {
    await page.goto(`${APP}/viagem/${VIAGEM}/contas`)
    const campo = page.getByPlaceholder(/o que foi/)
    await campo.waitFor({ timeout: 30000 })
    await esperar(1500)
    marcar()
    await esperar(500)
    await campo.click()
    await campo.pressSequentially('jantar 84', { delay: 110 })
    await esperar(400)
    await page.getByLabel('Lançar', { exact: true }).click()
    await page.getByText('Salvar gasto', { exact: true }).waitFor({ timeout: 30000 })
    await esperar(1400)
    await page.getByText('Salvar gasto', { exact: true }).click()
    await page.getByText(/84,00 · Jantar/).waitFor({ timeout: 15000 })
    await esperar(2200)
  },

  // Carimbo novo: a aba Viagem abre e a Norti comemora o carimbo das Contas
  async carimbo(page, marcar) {
    const vistos = TODOS_OS_CARIMBOS.filter((c) => c !== 'gastos')
    await page.addInitScript(([chave, v]) => localStorage.setItem(chave, v), [`tripwave.carimbos.${VIAGEM}`, JSON.stringify(vistos)])
    await page.goto(`${APP}/viagem/${VIAGEM}`)
    await page.getByText('resolvido!').waitFor({ timeout: 30000 })
    marcar() // começa quando a comemoração entra (pula a tela de abertura)
    await esperar(3800)
  },
}

async function gravar(nomes) {
  await mkdir(PASTA, { recursive: true })
  const arquivoMarcas = path.join(PASTA, 'marcas.json')
  const marcas = existsSync(arquivoMarcas) ? JSON.parse(await readFile(arquivoMarcas, 'utf8')) : {}
  const navegador = await chromium.launch()
  for (const nome of nomes) {
    const bruto = path.join(PASTA, 'bruto')
    await rm(bruto, { recursive: true, force: true })
    const contexto = await navegador.newContext({
      viewport: TELA, deviceScaleFactor: 2, isMobile: true, hasTouch: false, locale: 'pt-BR', colorScheme: 'light',
      recordVideo: { dir: bruto, size: { width: TELA.width * 2, height: TELA.height * 2 } },
    })
    await instalarDemo(contexto)
    // Arrastar com o mouse não pode selecionar texto (no celular isso nem existe)
    await contexto.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
      const estilo = document.createElement('style')
      estilo.textContent = '* { user-select: none !important; -webkit-user-select: none !important; }'
      document.head.appendChild(estilo)
    }))
    const page = await contexto.newPage()
    const inicio = Date.now()
    let marca = 0
    try {
      await CENAS[nome](page, () => (marca = (Date.now() - inicio) / 1000))
    } finally {
      await contexto.close() // termina de escrever o vídeo
    }
    const [video] = await readdir(bruto)
    await rename(path.join(bruto, video), path.join(PASTA, `${nome}.webm`))
    marcas[nome] = { inicio: Math.round(marca * 100) / 100 }
    await writeFile(arquivoMarcas, JSON.stringify(marcas, null, 2))
    console.log(nome, marcas[nome])
  }
  await navegador.close()
}

await gravar(process.argv[2] ? [process.argv[2]] : Object.keys(CENAS))
