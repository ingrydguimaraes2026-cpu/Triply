// Grava as cenas do app (Expo web em http://localhost:8089) no tamanho de um iPhone, no modo demonstração:
// o Supabase é respondido por demo/servidor.mjs (comboio de 4 da "Eurotrip"). Sem login e sem tocar no banco.
// Grava quadro a quadro (screencast do Chrome) em tamanho de iPhone de verdade (390x844 com DPR 3 = 1170x2532),
// bem mais nítido que o recordVideo do Playwright. Cada cena marca o início e os momentos-chave (eventos) pra
// montagem sincronizar os efeitos. Saída: gravacoes/<cena>.mp4 + gravacoes/marcas.json
// Uso: node gravar.mjs           -> grava todas as cenas
//      node gravar.mjs contas    -> grava só uma cena
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { instalarDemo } from './demo/servidor.mjs'
import { VIAGEM } from './demo/dados.mjs'

const APP = 'http://localhost:8089'
const PASTA = path.resolve('gravacoes')
const TELA = { width: 390, height: 844 }
const DPR = 3
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
  async explorar(page, marcar, evento) {
    await page.goto(`${APP}/explorar`)
    await page.getByLabel('Quero').waitFor({ timeout: 30000 })
    await esperar(2500) // fotos carregam
    marcar()
    await esperar(1000)
    evento('quero1')
    await deslizar(page, 1)
    await esperar(1500)
    evento('quero2')
    await deslizar(page, 1)
    await page.getByText(/Deu match/).waitFor({ timeout: 10000 })
    evento('match')
    await esperar(3800)
  },

  // Onde dormir: o duelo das 2 hospedagens; o voto enche a barra e "todo mundo votou"
  async duelo(page, marcar, evento) {
    await page.addInitScript(([chave, vistos]) => localStorage.setItem(chave, vistos), [`tripwave.carimbos.${VIAGEM}`, JSON.stringify(TODOS_OS_CARIMBOS)])
    await page.goto(`${APP}/viagem/${VIAGEM}`)
    await page.getByText('Apê em Montmartre').waitFor({ timeout: 30000 })
    await esperar(1200)
    marcar()
    await esperar(1200)
    evento('rolar')
    await rolar(page, 300)
    await esperar(900)
    evento('voto')
    await page.getByText('Apê em Montmartre').click()
    await esperar(2600)
  },

  // Contas: "jantar 84" na barra, o novo gasto abre preenchido, salva e entra na conversa
  async contas(page, marcar, evento) {
    await page.goto(`${APP}/viagem/${VIAGEM}/contas`)
    const campo = page.getByPlaceholder(/o que foi/)
    await campo.waitFor({ timeout: 30000 })
    await esperar(1500)
    marcar()
    await esperar(500)
    await campo.click()
    evento('digita')
    await campo.pressSequentially('jantar 84', { delay: 110 })
    await esperar(400)
    await page.getByLabel('Lançar', { exact: true }).click()
    await page.getByText('Salvar gasto', { exact: true }).waitFor({ timeout: 30000 })
    await esperar(1400)
    await page.getByText('Salvar gasto', { exact: true }).click()
    evento('salvar')
    await page.getByText(/84,00 · Jantar/).waitFor({ timeout: 15000 })
    evento('salvo')
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
  const navegador = await chromium.launch({ args: [`--force-device-scale-factor=${DPR}`] }) // sem isso o screencast vem em 390 px
  for (const nome of nomes) {
    const quadros = path.join(PASTA, 'quadros', nome)
    await rm(quadros, { recursive: true, force: true })
    await mkdir(quadros, { recursive: true })
    const contexto = await navegador.newContext({ viewport: TELA, deviceScaleFactor: DPR, isMobile: true, hasTouch: false, locale: 'pt-BR', colorScheme: 'light' })
    await instalarDemo(contexto)
    // Arrastar com o mouse não pode selecionar texto (no celular isso nem existe)
    await contexto.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
      const estilo = document.createElement('style')
      estilo.textContent = '* { user-select: none !important; -webkit-user-select: none !important; }'
      document.head.appendChild(estilo)
    }))
    const page = await contexto.newPage()

    // Screencast: o Chrome manda um quadro (jpeg) a cada mudança de tela; guardo com a hora que chegou
    const lista = []
    const cdp = await contexto.newCDPSession(page)
    cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
      const arquivo = `q${String(lista.length).padStart(5, '0')}.jpg`
      lista.push({ arquivo, t: Date.now() / 1000 })
      await writeFile(path.join(quadros, arquivo), Buffer.from(data, 'base64'))
      await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: TELA.width * DPR, maxHeight: TELA.height * DPR, everyNthFrame: 1 })

    let marca = 0
    const eventos = {}
    try {
      await CENAS[nome](page, () => (marca = Date.now() / 1000), (ev) => (eventos[ev] = Date.now() / 1000))
    } finally {
      await cdp.send('Page.stopScreencast').catch(() => {})
      await esperar(300)
      await contexto.close()
    }

    // Junta os quadros num vídeo de 30 fps a partir da marca (cada quadro dura até o próximo chegar)
    const daqui = lista.filter((q, i) => i + 1 < lista.length && lista[i + 1].t > marca)
    const fim = lista.at(-1)
    const linhas = daqui.map((q, i) => {
      const prox = daqui[i + 1] ?? fim
      const dur = Math.max(0.001, prox.t - Math.max(q.t, marca))
      return `file '${q.arquivo}'\nduration ${dur.toFixed(4)}`
    })
    linhas.push(`file '${fim.arquivo}'\nduration 2`, `file '${fim.arquivo}'`)
    await writeFile(path.join(quadros, 'lista.txt'), linhas.join('\n'))
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(quadros, 'lista.txt'),
      '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', path.join(PASTA, `${nome}.mp4`)])

    const rel = (t) => Math.round((t - marca) * 100) / 100
    marcas[nome] = { inicio: 0, eventos: Object.fromEntries(Object.entries(eventos).map(([k, v]) => [k, rel(v)])) }
    await writeFile(arquivoMarcas, JSON.stringify(marcas, null, 2))
    console.log(nome, lista.length, 'quadros', marcas[nome])
  }
  await navegador.close()
}

await gravar(process.argv[2] ? [process.argv[2]] : Object.keys(CENAS))
