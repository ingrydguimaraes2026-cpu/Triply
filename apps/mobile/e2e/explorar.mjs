// Roteiro de teste do Explorar no app (versão web do Expo), em texto: passou/falhou, sem prints.
// Confere: entrar, abrir o Explorar, não preparar aeroporto, "Mover pra Dia 2" salvar
// (sobrevive a recarregar) e o tempo real (uma 2ª aba vê a mudança sem recarregar).
//
// Precisa: o Expo web rodando (porta 8089) e uma conta de TESTE com uma viagem que já tenha destino.
//   node apps/mobile/e2e/conta-de-teste.mjs   (cria conta + viagem e guarda em e2e/.contas-teste.local.json)
//   node apps/mobile/e2e/explorar.mjs        (ou TRIPWAVE_EMAIL=... TRIPWAVE_SENHA=... VIAGEM_ID=<uuid>)
// Opcional: BASE=http://localhost:8089  MOSTRAR=1 (abre a janela do navegador)
// Playwright: `npx playwright` já baixa; o roteiro usa o Chrome instalado (channel 'chrome').
const BASE = process.env.BASE ?? 'http://localhost:8089'
// Sem variáveis, usa a última conta de `node apps/mobile/e2e/conta-de-teste.mjs` (arquivo fora do git)
import { existsSync, readFileSync } from 'node:fs'
const arquivoDeContas = new URL('.contas-teste.local.json', import.meta.url)
const ultima = existsSync(arquivoDeContas) ? JSON.parse(readFileSync(arquivoDeContas, 'utf8'))[0] : undefined
const email = process.env.TRIPWAVE_EMAIL ?? ultima?.email
const senha = process.env.TRIPWAVE_SENHA ?? ultima?.senha
const viagemId = process.env.VIAGEM_ID ?? ultima?.viagemId
if (!email || !senha || !viagemId) {
  console.error('Faltou conta de teste: rode `node apps/mobile/e2e/conta-de-teste.mjs` (ou passe TRIPWAVE_EMAIL, TRIPWAVE_SENHA e VIAGEM_ID).')
  process.exit(2)
}

// Import depois da checagem: dá pra apontar outro Playwright com PLAYWRIGHT=/caminho/node_modules/playwright/index.mjs
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright')

let falhas = 0
async function passo(nome, fazer) {
  try {
    await fazer()
    console.log(`PASSOU  ${nome}`)
  } catch (e) {
    falhas++
    console.log(`FALHOU  ${nome}\n        ${String(e?.message ?? e).split('\n')[0]}`)
    throw e
  }
}

const navegador = await chromium.launch({ channel: 'chrome', headless: !process.env.MOSTRAR })
const contexto = await navegador.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })
const a = await contexto.newPage()
const pedidosDeCidade = []
a.on('request', (r) => r.url().includes('/functions/v1/explorar-cidade') && pedidosDeCidade.push(r.postData() ?? ''))
const errosNoConsole = []
a.on('pageerror', (e) => errosNoConsole.push(e.message))

// Abre o roteiro do Explorar: se cair no deslize, arrasta 3 cartões pra direita ("quero") e toca "Pronto".
// (Os botões "Quero" saíram da tela: o deslize agora é só por gesto.)
async function abrirRoteiro(p) {
  const reorganizar = p.getByText('Reorganizar tudo pela proximidade')
  const desfazer = p.getByRole('button', { name: 'Desfazer', exact: true })
  await reorganizar.or(desfazer).first().waitFor({ timeout: 60_000 })
  if (!(await reorganizar.isVisible())) {
    for (let i = 0; i < 3 && (await desfazer.isVisible()); i++) {
      await p.mouse.move(187, 420)
      await p.mouse.down()
      await p.mouse.move(370, 430, { steps: 12 })
      await p.mouse.up()
      await p.waitForTimeout(900)
    }
    if (!(await reorganizar.isVisible())) await p.getByText('Pronto', { exact: true }).click()
    await reorganizar.waitFor({ timeout: 60_000 })
  }
}
const aba = (p, t) => p.getByRole('tab', { name: new RegExp(`^${t}\\b`) })
const mexer = (p, nome) => p.getByRole('button', { name: `Mexer em ${nome}`, exact: true })

let lugar = ''
try {
  await passo('entrar com a conta de teste', async () => {
    await a.goto(`${BASE}/login`)
    await a.getByPlaceholder('voce@email.com').fill(email)
    await a.getByPlaceholder('Sua senha').fill(senha)
    await a.getByText('Entrar', { exact: true }).last().click()
    await a.waitForURL((u) => !u.pathname.includes('login'), { timeout: 20_000 })
  })

  await passo('abrir a viagem e o Explorar', async () => {
    // O botão "Explorar" saiu da tela da viagem (agora vem do Roteiro): abre pelo endereço
    await a.goto(`${BASE}/explorar?viagem=${viagemId}&roteiro=1`)
    await abrirRoteiro(a)
  })

  await passo('não pediu catálogo de aeroporto (Galeão etc.)', async () => {
    const ruim = pedidosDeCidade.filter((c) => /gale[aã]o|aeroporto|airport|guarulhos|confins|viracopos/i.test(c))
    if (ruim.length) throw new Error(`pediu: ${ruim.join(' | ')}`)
    if (await a.getByText(/Preparando os lugares de (Gale|Aeroporto)/).count()) throw new Error('tela mostrou "Preparando" do aeroporto')
  })

  await passo('"Mover pra Dia 2" no menu "…"', async () => {
    await aba(a, 'Dia 1').click()
    const primeiro = a.getByRole('button', { name: /^Mexer em / }).first()
    await primeiro.waitFor({ timeout: 10_000 })
    lugar = (await primeiro.getAttribute('aria-label')).replace('Mexer em ', '')
    await primeiro.click()
    await a.getByText('Mover pra').waitFor()
    await a.getByText('Dia 2', { exact: true }).last().click()
    await aba(a, 'Dia 2').click()
    await mexer(a, lugar).waitFor({ timeout: 5_000 })
  })

  await passo('a mudança ficou salva (recarregar a página)', async () => {
    await a.waitForTimeout(1500) // deixa o salvamento chegar no banco
    await a.reload()
    await abrirRoteiro(a)
    await aba(a, 'Dia 2').click()
    await mexer(a, lugar).waitFor({ timeout: 10_000 })
  })

  await passo('tempo real: a outra aba vê a mudança sem recarregar', async () => {
    const b = await contexto.newPage()
    await b.goto(a.url())
    await abrirRoteiro(b)
    await aba(b, 'Dia 2').click()
    await mexer(b, lugar).waitFor({ timeout: 10_000 })
    // Na aba A, devolve o lugar pro Dia 1 (também deixa os dados como estavam)
    await mexer(a, lugar).click()
    await a.getByText('Mover pra').waitFor()
    await a.getByText('Dia 1', { exact: true }).last().click()
    await mexer(b, lugar).waitFor({ state: 'detached', timeout: 10_000 })
    await aba(b, 'Dia 1').click()
    await mexer(b, lugar).waitFor({ timeout: 5_000 })
  })

  await passo('sem erro de JavaScript na tela', async () => {
    if (errosNoConsole.length) throw new Error(errosNoConsole.join(' | '))
  })
} catch {
  // o passo que falhou já foi impresso
} finally {
  await navegador.close()
  console.log(falhas ? `\nRESULTADO: FALHOU (${falhas})` : '\nRESULTADO: PASSOU')
  process.exit(falhas ? 1 : 0)
}
