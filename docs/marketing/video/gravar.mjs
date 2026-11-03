// Grava as cenas do app (Expo web rodando em http://localhost:8089) no tamanho de um iPhone.
// Uso:
//   node gravar.mjs entrar   -> abre uma janela pra você entrar na sua conta (só na primeira vez)
//   node gravar.mjs          -> grava todas as cenas em gravacoes/<cena>.webm
//   node gravar.mjs contas   -> grava só uma cena
// O login fica salvo em gravacoes/perfil (fora do git). Nada é salvo no banco: o gasto não é salvo.
import { chromium } from 'playwright'
import { mkdir, readdir, rename, rm, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const APP = 'http://localhost:8089'
const VIAGEM = 'e1004c1f-2147-466d-92eb-c82bff81cee9' // "Lisboa", viagem de teste do Victor
const PASTA = path.resolve('gravacoes')
const PERFIL = path.join(PASTA, 'perfil')
const TELA = { width: 390, height: 844 }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

const modo = process.argv[2]

async function abrir({ gravar, visivel }) {
  return chromium.launchPersistentContext(PERFIL, {
    headless: !visivel,
    viewport: TELA,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'pt-BR',
    colorScheme: 'light',
    ...(gravar ? { recordVideo: { dir: path.join(PASTA, 'bruto'), size: { width: TELA.width * 2, height: TELA.height * 2 } } } : {}),
  })
}

// Clica no elemento com o texto exato (o app é React Native Web: o clique vai no pai clicável)
async function tocarNoTexto(page, texto) {
  await page.getByText(texto, { exact: true }).first().click()
}

// Arrasta o cartão do Explorar como um dedo: devagar no começo, solta no fim
async function deslizar(page, direcao) {
  const x = TELA.width / 2
  const y = TELA.height * 0.42
  await page.mouse.move(x, y)
  await page.mouse.down()
  const passos = 18
  for (let i = 1; i <= passos; i++) {
    await page.mouse.move(x + direcao * 230 * (i / passos) ** 1.4, y + 25 * (i / passos))
    await esperar(16)
  }
  await page.mouse.up()
}

const CENAS = {
  // Deslizar no Explorar: quero, quero, passo
  async explorar(page, marcar) {
    await page.goto(`${APP}/viagem/${VIAGEM}/roteiro`)
    await page.getByText('Descobrir mais lugares').waitFor({ timeout: 30000 })
    await esperar(800)
    await tocarNoTexto(page, 'Descobrir mais lugares')
    await page.getByText('Ver mais lugares').waitFor({ timeout: 30000 })
    await tocarNoTexto(page, 'Ver mais lugares')
    await page.getByLabel('Quero').waitFor({ timeout: 30000 })
    await esperar(1500) // fotos carregam
    marcar()
    await esperar(900)
    await deslizar(page, 1)
    await esperar(1300)
    await deslizar(page, 1)
    await esperar(1300)
    await deslizar(page, -1)
    await esperar(1500)
  },

  // Contas: escreve "jantar 84" na barra e o novo gasto abre preenchido (não salva)
  async contas(page, marcar) {
    await page.goto(`${APP}/viagem/${VIAGEM}/contas`)
    const campo = page.getByPlaceholder(/o que foi/)
    await campo.waitFor({ timeout: 30000 })
    await esperar(1500)
    marcar()
    await esperar(600)
    await campo.click()
    await campo.pressSequentially('jantar 84', { delay: 120 })
    await esperar(500)
    await campo.press('Enter')
    await page.getByText('Novo gasto').waitFor({ timeout: 30000 })
    await esperar(2600)
  },

  // Carimbo: finge que o carimbo do roteiro ainda não foi visto, então a Norti comemora
  async carimbo(page, marcar) {
    await page.addInitScript((chave) => localStorage.setItem(chave, '[]'), `tripwave.carimbos.${VIAGEM}`)
    marcar()
    await page.goto(`${APP}/viagem/${VIAGEM}`)
    await page.getByText('resolvido!').waitFor({ timeout: 30000 })
    await esperar(3500)
  },
}

async function entrar() {
  const ctx = await abrir({ gravar: false, visivel: true })
  const page = ctx.pages()[0] ?? (await ctx.newPage())
  await page.goto(APP)
  console.log('Entre na sua conta na janela que abriu. Espero até aparecer o Início ("Boa ..."), por até 5 minutos.')
  await page.getByText(/^Boa (noite|tarde|dia)/).first().waitFor({ timeout: 300000 })
  console.log('Pronto: login salvo em gravacoes/perfil.')
  await ctx.close()
}

async function gravar(nomes) {
  await mkdir(PASTA, { recursive: true })
  const arquivoMarcas = path.join(PASTA, 'marcas.json')
  const marcas = existsSync(arquivoMarcas) ? JSON.parse(await readFile(arquivoMarcas, 'utf8')) : {}
  for (const nome of nomes) {
    await rm(path.join(PASTA, 'bruto'), { recursive: true, force: true })
    const ctx = await abrir({ gravar: true, visivel: false })
    const page = await ctx.newPage()
    for (const p of ctx.pages()) if (p !== page) await p.close()
    const inicio = Date.now()
    let marca = 0
    try {
      await CENAS[nome](page, () => (marca = (Date.now() - inicio) / 1000))
    } finally {
      await ctx.close() // fecha e termina de escrever o vídeo
    }
    const [video] = await readdir(path.join(PASTA, 'bruto'))
    await rename(path.join(PASTA, 'bruto', video), path.join(PASTA, `${nome}.webm`))
    marcas[nome] = { inicio: Math.round(marca * 100) / 100, fim: Math.round(((Date.now() - inicio) / 1000) * 100) / 100 }
    console.log(nome, marcas[nome])
  }
  await writeFile(arquivoMarcas, JSON.stringify(marcas, null, 2))
}

if (modo === 'entrar') await entrar()
else await gravar(modo ? [modo] : Object.keys(CENAS))
