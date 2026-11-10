// Grava o passeio completo pela Norti no Expo web (http://localhost:8089), dentro da moldura de iPhone do app:
// login (e-mail e senha digitados) → início → abre a Eurotrip → tour da Norti (11 passos) → Viagem, Roteiro,
// Reservas, Contas e Fotos. Conta: demo@norti.test (login de QA, passeio/login-qa.mjs).
//
// O login aparece igualzinho ao de verdade, mas a senha é de enfeite: o Playwright segura o pedido
// "grant_type=password" e responde com a sessão do login de QA. A senha nunca sai do PC e o app não muda nada.
//
// Grava quadro a quadro (screencast do Chrome) com DPR 3: a tela do iPhone sai em 1179×2556.
// Saída: passeio/gravacao/app.mp4 (só a tela do iPhone) + passeio/gravacao/marcas.json (quando cada parte começa).
// Uso (dentro de docs/marketing/video, com o Expo web no ar na porta 8089): node passeio/gravar.mjs
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sessaoDeQa, configDoSupabase, EMAIL_DEMO } from './login-qa.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '../../../..')
const PASTA = path.join(AQUI, 'gravacao')
const QUADROS = path.join(PASTA, 'quadros')
const APP = 'http://localhost:8089'
// Janela larga o bastante pra moldura aparecer (≥500) e alta o bastante pra ela ficar em tamanho real (escala 1)
const JANELA = { width: 593, height: 932 }
const DPR = 3
const SENHA_DE_ENFEITE = 'viagem2027' // inventada: nunca vai pro Supabase
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// Falas do tour, lidas do próprio core (assim o script acompanha se mudarem)
const fonteDoTour = await readFile(path.join(RAIZ, 'packages/core/src/tour.ts'), 'utf8')
const PASSOS = [...fonteDoTour.matchAll(/\{ alvo: [^\n]*?fala: '([^']+)'(?:, tocar: '(\w+)')? \}/g)].map((m) => ({
  fala: m[1].replace(/\*/g, ''),
  tocar: m[2] ?? null,
}))
if (PASSOS.length < 5) throw new Error(`Não achei as falas do tour em packages/core/src/tour.ts (${PASSOS.length})`)
const ROTULO = { roteiro: 'Roteiro', reservas: 'Reservas', contas: 'Contas', fotos: 'Fotos' }
// Fim do endereço de cada aba (/viagem/<id>/roteiro…): é por ele que o script sabe que a aba abriu mesmo
const FIM_DA_ABA = { Viagem: '', Roteiro: '/roteiro', Reservas: '/reservas', Contas: '/contas', Fotos: '/fotos' }
const ehAba = (rotulo) => (u) => new RegExp(`^/viagem/[^/]+${FIM_DA_ABA[rotulo]}/?$`).test(new URL(u).pathname)
const esperarAba = (page, rotulo) => page.waitForURL(ehAba(rotulo), { timeout: 15000 })

// ---------- Gestos ----------
let tela = null // retângulo da tela do iPhone na janela (medido depois que a moldura aparece)

// Toque num elemento (o círculo aparece pelo script injetado no pointerdown)
async function tocar(page, alvo, { pausa = 260 } = {}) {
  const caixa = await alvo.boundingBox()
  if (!caixa) throw new Error('Peça sem tamanho na tela')
  const x = caixa.x + caixa.width / 2
  const y = caixa.y + caixa.height / 2
  await page.mouse.move(x, y, { steps: 6 })
  await page.mouse.down()
  await esperar(90)
  await page.mouse.up()
  await esperar(pausa)
}

// Rolagem suave (rodinha em passos pequenos, devagar no começo e no fim). Segue o relógio:
// cada passo rola o que falta até onde a curva manda estar agora, então dura `duracao` mesmo gravando.
async function rolar(page, total, duracao = 1800) {
  await page.mouse.move(tela.x + tela.w / 2, tela.y + tela.h * 0.55)
  const comeco = Date.now()
  rolagens.push([comeco / 1000, total])
  let feito = 0
  for (;;) {
    const p = Math.min(1, (Date.now() - comeco) / duracao)
    const alvo = Math.round(total * (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2))
    if (alvo !== feito) await page.mouse.wheel(0, alvo - feito)
    feito = alvo
    if (p >= 1) break
    await esperar(16)
  }
}

// ---------- O passeio ----------
async function passeio(page, marcar) {
  // 1. Login: a abertura com a Norti e a tela de entrar
  await page.goto(`${APP}/login`)
  const campoEmail = page.getByPlaceholder('voce@email.com')
  await campoEmail.waitFor({ timeout: 60000 })
  // Espera o logo e as outras imagens da tela carregarem (senão o vídeo começa com um quadrado vazio)
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {})
  await esperar(500)
  tela = await medirTela(page)
  marcar('inicio')
  await esperar(1400)
  marcar('login')
  await tocar(page, campoEmail)
  await campoEmail.pressSequentially(EMAIL_DEMO, { delay: 85 })
  await esperar(350)
  const campoSenha = page.getByPlaceholder('Sua senha')
  await tocar(page, campoSenha)
  await campoSenha.pressSequentially(SENHA_DE_ENFEITE, { delay: 110 })
  await esperar(600)
  await tocar(page, page.getByText('Entrar', { exact: true }).last())
  marcar('entrou') // daqui até a lista aparecer é a tela "Arrumando a mala…": no vídeo passa 4× mais rápido

  // 2. Início: a lista de viagens
  const cartao = page.getByLabel(/^Abrir Eurotrip/)
  await cartao.waitFor({ timeout: 30000 })
  marcar('inicio-app')
  await esperar(2600)
  await tocar(page, cartao)

  // 3. Tour da Norti (primeira vez na viagem)
  for (const [i, p] of PASSOS.entries()) {
    const caixa = page.getByLabel(p.fala, { exact: true })
    await caixa.waitFor({ timeout: 30000 })
    if (i === 0) marcar('tour')
    marcar(`tour-${i}`)
    // tempo da "máquina de escrever" (26 ms por letra) + tempo de ler
    await esperar(p.fala.length * 26 + 700 + Math.min(1800, p.fala.length * 28))
    if (p.tocar) await tocar(page, page.getByRole('tab', { name: ROTULO[p.tocar] }))
    else await tocar(page, caixa)
  }
  await page.getByLabel(PASSOS.at(-1).fala, { exact: true }).waitFor({ state: 'detached', timeout: 15000 })
  await esperar(900)

  // 4. As 5 partes da viagem (o tour termina na Viagem; se não, toca nela)
  if (!ehAba('Viagem')(page.url())) await tocar(page, page.getByRole('tab', { name: 'Viagem' }))
  await esperarAba(page, 'Viagem')
  marcar('viagem')
  await esperar(1200)
  await rolar(page, 700, 2600)
  await esperar(1400)

  const abrir = async (rotulo, marca) => {
    await tocar(page, page.getByRole('tab', { name: rotulo }))
    await esperarAba(page, rotulo)
    marcar(marca)
    await esperar(1800)
  }

  await abrir('Roteiro', 'roteiro')
  await rolar(page, 650, 2600)
  await esperar(1400)

  await abrir('Reservas', 'reservas')
  await rolar(page, 450, 2000)
  await esperar(1000)
  const hospedagem = page.getByText('Hospedagem', { exact: true }).first()
  if (await hospedagem.isVisible().catch(() => false)) {
    await rolar(page, -450, 1200)
    await tocar(page, page.getByText('Hospedagem', { exact: true }).first())
    marcar('reservas-hospedagem')
    await esperar(1600)
    await rolar(page, 550, 2200)
    await esperar(1200)
  }

  await abrir('Contas', 'contas')
  await rolar(page, 550, 2400)
  await esperar(1400)

  await abrir('Fotos', 'fotos')
  await esperar(800) // fotos carregam
  await rolar(page, 900, 3400)
  await esperar(1600)

  // Volta pra Viagem e sobe até o bilhete ("206 dias pra Nice") pra fechar
  await tocar(page, page.getByRole('tab', { name: 'Viagem' }))
  marcar('fim')
  await esperar(700)
  await rolar(page, -1200, 2000)
  await esperar(2000)
}

// Acha a tela do iPhone desenhado pela moldura (393×852) e devolve onde ela está na janela
async function medirTela(page) {
  const r = await page.evaluate(() => {
    for (const d of document.querySelectorAll('div')) {
      const b = d.getBoundingClientRect()
      if (Math.round(b.width) === 393 && Math.round(b.height) === 852) return { x: b.x, y: b.y, w: b.width, h: b.height }
    }
    return null
  })
  if (!r) throw new Error('Não achei a moldura do iPhone: a janela precisa ter ≥500 px de largura')
  return r
}

// ---------- Gravação ----------
const { url: SUPABASE } = configDoSupabase()
let lista = [] // quadros que chegaram: { arquivo, t }
let marcas = {}
let inicio = 0
let rolagens = [] // [começo, total] de cada rolagem: ali a tela muda o tempo todo, então tem que chegar quadro
const marcar = (nome) => {
  const agora = Date.now() / 1000
  if (nome === 'inicio') inicio = agora
  marcas[nome] = agora
}

async function gravarUmaVez() {
  await rm(QUADROS, { recursive: true, force: true }) // a pasta gravacao/ fica (o Windows não deixa apagar se estiver aberta)
  await mkdir(QUADROS, { recursive: true })
  lista = []
  marcas = {}
  inicio = 0
  rolagens = []

  const sessao = await sessaoDeQa() // sessão nova a cada tentativa
  console.log('Login de QA ok:', sessao.user.email)

  const navegador = await chromium.launch({ args: [`--force-device-scale-factor=${DPR}`] }) // sem isso o screencast vem em 1x
  const contexto = await navegador.newContext({ viewport: JANELA, deviceScaleFactor: DPR, locale: 'pt-BR', colorScheme: 'light', timezoneId: 'America/Sao_Paulo' })

  // Login de enfeite: o pedido de senha é respondido aqui com a sessão do login de QA (o resto vai pro Supabase)
  await contexto.route((u) => u.href.startsWith(`${SUPABASE}/auth/v1/token`), async (rota) => {
    const pedido = rota.request()
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    const grant = new URL(pedido.url()).searchParams.get('grant_type')
    if (grant !== 'password') return rota.continue()
    if (pedido.method() === 'OPTIONS') return rota.fulfill({ status: 204, headers: cors })
    return rota.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(sessao) })
  })

  await contexto.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const estilo = document.createElement('style')
      estilo.textContent = `
        * { user-select: none !important; -webkit-user-select: none !important; scrollbar-width: none !important; caret-color: #B97A22; }
        *::-webkit-scrollbar { display: none !important; }
        .toque-do-video { position: fixed; z-index: 2147483647; pointer-events: none; width: 46px; height: 46px; margin: -23px 0 0 -23px;
          border-radius: 50%; background: rgba(255,255,255,.45); border: 2.5px solid rgba(59,39,21,.55);
          box-shadow: 0 2px 10px rgba(0,0,0,.25); animation: toque-do-video .55s ease-out forwards; }
        @keyframes toque-do-video { 0% { transform: scale(.55); opacity: 1 } 60% { opacity: .9 } 100% { transform: scale(1.35); opacity: 0 } }`
      document.head.appendChild(estilo)
    })
    // Esconde a caixa "Modo teste" do login (só existe no modo dev, nunca na loja)
    const vigia = new MutationObserver(() => {
      if (location.pathname !== '/login') return vigia.disconnect() // só a tela de login tem essa caixa
      for (const el of document.querySelectorAll('div')) {
        if (el.childElementCount === 0 && el.textContent === 'Modo teste (não aparece na loja)' && el.parentElement) el.parentElement.style.display = 'none'
      }
    })
    vigia.observe(document, { childList: true, subtree: true })
    // Círculo onde o "dedo" toca
    window.addEventListener('pointerdown', (e) => {
      const c = document.createElement('div')
      c.className = 'toque-do-video'
      c.style.left = `${e.clientX}px`
      c.style.top = `${e.clientY}px`
      document.body.appendChild(c)
      setTimeout(() => c.remove(), 700)
    }, true)
  })

  const page = await contexto.newPage()
  const cdp = await contexto.newCDPSession(page)
  const salvando = new Set()
  cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
    // Responde "recebi" antes de salvar: se o disco demorar, o Chrome continua mandando quadros
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    const arquivo = `q${String(lista.length).padStart(5, '0')}.jpg`
    lista.push({ arquivo, t: Date.now() / 1000 })
    const p = writeFile(path.join(QUADROS, arquivo), Buffer.from(data, 'base64')).finally(() => salvando.delete(p))
    salvando.add(p)
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: JANELA.width * DPR, maxHeight: JANELA.height * DPR, everyNthFrame: 1 })

  try {
    await passeio(page, marcar)
  } catch (e) {
    await page.screenshot({ path: path.join(PASTA, 'erro.png') }).catch(() => {})
    throw e
  } finally {
    await cdp.send('Page.stopScreencast').catch(() => {})
    await esperar(300)
    await contexto.close()
    await navegador.close()
    await Promise.all(salvando)
  }
}

// Confere se o Chrome parou de mandar quadros no meio (já aconteceu: 20 s de tela parada com o PC pesado).
// Parada nenhuma passa de ~2,6 s (a mais longa é ler uma fala do tour), e toda rolagem pra baixo mexe a tela na hora.
function buracoNaGravacao() {
  const ts = lista.filter((q) => q.t >= inicio).map((q) => q.t)
  for (let i = 1; i < ts.length; i++) {
    if (ts[i] - ts[i - 1] > 3.5) return `${(ts[i] - ts[i - 1]).toFixed(1)} s sem quadro aos ${(ts[i - 1] - inicio).toFixed(0)} s`
  }
  for (const [comeco, total] of rolagens) {
    if (total > 0 && !ts.some((t) => t > comeco && t < comeco + 0.6)) return `rolagem aos ${(comeco - inicio).toFixed(0)} s sem quadro`
  }
  return null
}

for (let tentativa = 1; ; tentativa++) {
  await gravarUmaVez()
  const buraco = buracoNaGravacao()
  if (!buraco) break
  if (tentativa >= 3) throw new Error(`A gravação travou 3 vezes (${buraco}). Feche o que estiver pesando o PC e rode de novo.`)
  console.log(`Tentativa ${tentativa} travou (${buraco}). Gravando de novo...`)
}

// Junta os quadros num vídeo de 30 fps a partir do "inicio" (cada quadro dura até o próximo chegar)
// e recorta só a tela do iPhone. O carregamento depois do login passa 4× mais rápido (não é parte do passeio).
const RAPIDO = { de: marcas.entrou + 0.5, ate: marcas['inicio-app'] - 0.2, fator: 4 }
const noVideo = (t) => { // hora do relógio → segundo do vídeo
  const r = t - inicio
  const a = RAPIDO.de - inicio
  const b = RAPIDO.ate - inicio
  if (!(b > a) || r <= a) return r
  if (r < b) return a + (r - a) / RAPIDO.fator
  return r - (b - a) * (1 - 1 / RAPIDO.fator)
}
const daqui = lista.filter((q, i) => i + 1 < lista.length && lista[i + 1].t > inicio)
const fim = lista.at(-1)
const linhas = daqui.map((q, i) => {
  const prox = daqui[i + 1] ?? fim
  return `file '${q.arquivo}'\nduration ${Math.max(0.001, noVideo(prox.t) - noVideo(Math.max(q.t, inicio))).toFixed(4)}`
})
linhas.push(`file '${fim.arquivo}'\nduration 1`, `file '${fim.arquivo}'`)
await writeFile(path.join(QUADROS, 'lista.txt'), linhas.join('\n'))
const par = (n) => Math.floor(n * DPR / 2) * 2 // o vídeo (yuv420p) precisa de medidas pares
const recorte = [par(tela.w), par(tela.h), Math.round(tela.x * DPR), Math.round(tela.y * DPR)]
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(QUADROS, 'lista.txt'),
  '-vf', `crop=${recorte.join(':')},fps=30,format=yuv420p`, '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', path.join(PASTA, 'app.mp4')])

const rel = Object.fromEntries(Object.entries(marcas).map(([k, v]) => [k, Math.round(noVideo(v) * 100) / 100]))
await writeFile(path.join(PASTA, 'marcas.json'), JSON.stringify({ duracao: Math.round((noVideo(fim.t) + 1) * 100) / 100, marcas: rel }, null, 2))
await rm(QUADROS, { recursive: true, force: true })
console.log(`${lista.length} quadros → passeio/gravacao/app.mp4`, rel)
