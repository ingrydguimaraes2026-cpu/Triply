// Grava o passeio completo pela Norti no Expo web (http://localhost:8089), dentro da moldura de iPhone do app:
// login (e-mail e senha digitados) → início → abre a Eurotrip → tour da Norti (11 passos) → Viagem, Roteiro,
// Reservas, Contas e Fotos. Conta: demo@norti.test (login de QA, passeio/login-qa.mjs).
//
// O login aparece igualzinho ao de verdade, mas a senha é de enfeite: o Playwright segura o pedido
// "grant_type=password" e responde com a sessão do login de QA. A senha nunca sai do PC e o app não muda nada.
//
// Gravação quadro a quadro, com relógio de mentira: dentro da página, o tempo (Date.now, performance.now,
// setTimeout, setInterval, requestAnimationFrame e as animações de CSS) só anda quando o script manda.
// O script anda 1/60 s, tira a foto da tela do iPhone, anda mais 1/60 s... Assim o vídeo sai a 60 fps lisos,
// por mais pesado que o PC esteja (gravar em tempo real dava ~12 quadros por segundo e o vídeo pulava).
// Saída: passeio/gravacao/app.mp4 (só a tela do iPhone, 786×1704) + passeio/gravacao/marcas.json
// (quando cada parte começa, e a hora de cada toque e tecla, pros sons da trilha).
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
const DPR = 2 // a tela do iPhone sai em 786×1704: o dobro do tamanho em que ela aparece no vídeo
const FPS = 60
const DT = 1000 / FPS
const SENHA_DE_ENFEITE = 'viagem2027' // inventada: nunca vai pro Supabase
const esperarDeVerdade = (ms) => new Promise((r) => setTimeout(r, ms))
// Só um trecho, pra testar rápido: node passeio/gravar.mjs --ate=tour-2 (para depois dessa marca)
const PARAR_EM = process.argv.find((a) => a.startsWith('--ate='))?.slice(6) ?? null

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
const ehAba = (rotulo, endereco) => new RegExp(`^/viagem/[^/]+${FIM_DA_ABA[rotulo]}/?$`).test(new URL(endereco).pathname)

// ---------- Relógio de mentira (roda dentro da página, antes do app) ----------
function relogioDeMentira() {
  const base = Date.now()
  const real0 = performance.now()
  let agora = real0 // o performance.now() de mentira
  const timers = new Map()
  const quadros = new Map()
  let seq = 1
  // "Respiro": deixa as promessas e o React terminarem o que começaram (sem esperar timer de verdade)
  const canal = new MessageChannel()
  const fila = []
  canal.port1.onmessage = () => fila.shift()?.()
  const respiro = () => new Promise((r) => { fila.push(r); canal.port2.postMessage(0) })

  window.setTimeout = (fn, ms, ...args) => { const id = seq++; timers.set(id, { em: agora + Math.max(0, Number(ms) || 0), fn, args, cada: 0 }); return id }
  window.setInterval = (fn, ms, ...args) => { const id = seq++; const p = Math.max(1, Number(ms) || 0); timers.set(id, { em: agora + p, fn, args, cada: p }); return id }
  window.clearTimeout = (id) => { timers.delete(id) }
  window.clearInterval = (id) => { timers.delete(id) }
  window.requestAnimationFrame = (fn) => { const id = seq++; quadros.set(id, fn); return id }
  window.cancelAnimationFrame = (id) => { quadros.delete(id) }
  performance.now = () => agora
  Date.now = () => base + (agora - real0)

  const vistas = new WeakSet()
  // Anda `dt` ms: dispara os timers na ordem, avança as animações de CSS e chama os requestAnimationFrame
  window.__passo = async (dt) => {
    const alvo = agora + dt
    for (let n = 0; n < 5000; n++) {
      let prox = null
      let idProx = 0
      for (const [id, t] of timers) if (t.em <= alvo && (!prox || t.em < prox.em)) { prox = t; idProx = id }
      if (!prox) break
      if (prox.em > agora) agora = prox.em
      if (prox.cada) prox.em += prox.cada
      else timers.delete(idProx)
      try { if (typeof prox.fn === 'function') prox.fn(...prox.args) } catch (e) { console.error(e) }
      await respiro()
    }
    agora = alvo
    for (const a of document.getAnimations()) {
      if (!vistas.has(a)) { vistas.add(a); a.pause(); continue } // animação nova: daqui pra frente anda no relógio de mentira
      if (a.playState !== 'paused') continue
      const fim = a.effect?.getComputedTiming().endTime ?? Infinity
      const t = (a.currentTime ?? 0) + dt
      if (Number.isFinite(fim) && t >= fim) a.finish()
      else a.currentTime = t
    }
    const chamar = [...quadros.values()]
    quadros.clear()
    for (const fn of chamar) { try { fn(agora) } catch (e) { console.error(e) } }
    await respiro()
  }
}

// ---------- Quadros ----------
let page = null
let cdp = null
let tela = null // retângulo da tela do iPhone na janela (medido depois que a moldura aparece)
let gravando = false
let pulo = 1 // grava 1 a cada `pulo` quadros (o carregamento depois do login passa 4× mais rápido)
let passos = 0
let quadrosGravados = 0
const salvando = new Set()
const marcas = {}
const toques = [] // segundo do vídeo de cada toque e de cada tecla: a trilha põe um som leve neles
const teclas = []
const agoraNoVideo = () => Math.round((quadrosGravados / FPS) * 1000) / 1000
class Parar extends Error {}
const marcar = (nome) => {
  marcas[nome] = Math.round((quadrosGravados / FPS) * 100) / 100
  if (PARAR_EM && nome === PARAR_EM) throw new Parar()
}

// Anda 1/60 s na página e, se estiver gravando, fotografa a tela do iPhone
async function quadro() {
  await page.evaluate((dt) => window.__passo(dt), DT)
  passos++
  if (!gravando) return esperarDeVerdade(12) // fora da gravação o relógio anda mais ou menos no tempo de verdade
  if (passos % pulo) return
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg', quality: 93, optimizeForSpeed: true,
    clip: { x: tela.x, y: tela.y, width: tela.w, height: tela.h, scale: DPR }, // scale = DPR: foto em 2x
  })
  const arquivo = path.join(QUADROS, `q${String(quadrosGravados++).padStart(5, '0')}.jpg`)
  const p = writeFile(arquivo, Buffer.from(data, 'base64')).finally(() => salvando.delete(p))
  salvando.add(p)
}
const passar = async (ms) => { for (let i = 0; i < Math.round(ms / DT); i++) await quadro() }
// Passa quadros até a condição valer (o app só anda quando o relógio anda)
async function ate(condicao, nome, limite = 45000) {
  const comeco = Date.now()
  while (!(await condicao().catch(() => false))) {
    if (Date.now() - comeco > limite) throw new Error(`Esperei demais por: ${nome}`)
    await quadro()
  }
}
const aparecer = (alvo, nome) => ate(() => alvo.isVisible(), nome)
const sumir = (alvo, nome) => ate(async () => !(await alvo.isVisible()), nome)
const abaAberta = (rotulo) => ate(async () => ehAba(rotulo, page.url()), `aba ${rotulo}`)

// ---------- Gestos ----------
// Toque num elemento (o círculo aparece pelo script injetado no pointerdown)
async function tocar(alvo, { pausa = 260 } = {}) {
  const caixa = await alvo.boundingBox()
  if (!caixa) throw new Error('Peça sem tamanho na tela')
  await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2)
  await page.mouse.down()
  if (gravando) toques.push(agoraNoVideo())
  await passar(90)
  await page.mouse.up()
  await passar(pausa)
}

// Digita letra por letra
async function digitar(texto, intervalo) {
  for (const letra of texto) {
    await page.keyboard.type(letra)
    teclas.push(agoraNoVideo())
    await passar(intervalo)
  }
}

// Rolagem suave (devagar no começo e no fim), quadro a quadro, na lista que está sob o "dedo"
async function rolar(total, duracao = 1800) {
  const ponto = [tela.x + tela.w / 2, tela.y + tela.h * 0.55]
  await page.evaluate(([x, y]) => {
    let el = document.elementFromPoint(x, y)
    const rola = (e) => e.scrollHeight > e.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)
    while (el && !rola(el)) el = el.parentElement
    el = el ?? document.scrollingElement
    window.__rolagem = { el, comeco: el.scrollTop }
  }, ponto)
  const n = Math.max(1, Math.round(duracao / DT))
  for (let i = 1; i <= n; i++) {
    const p = i / n
    const andou = total * (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)
    await page.evaluate((y) => { const r = window.__rolagem; r.el.scrollTop = r.comeco + y }, andou)
    await quadro()
  }
}

// Acha a tela do iPhone desenhado pela moldura (393×852) e devolve onde ela está na janela
async function medirTela() {
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

// ---------- O passeio ----------
async function passeio() {
  // 1. Login: a abertura com a Norti e a tela de entrar
  await page.goto(`${APP}/login`)
  const campoEmail = page.getByPlaceholder('voce@email.com')
  await aparecer(campoEmail, 'campo de e-mail')
  // Espera o logo e as outras imagens da tela carregarem (senão o vídeo começa com um quadrado vazio)
  await ate(() => page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0)), 'imagens do login', 15000).catch(() => {})
  await passar(500)
  tela = await medirTela()
  gravando = true
  marcar('inicio')
  await passar(1400)
  marcar('login')
  await tocar(campoEmail)
  await digitar(EMAIL_DEMO, 85)
  await passar(350)
  const campoSenha = page.getByPlaceholder('Sua senha')
  await tocar(campoSenha)
  await digitar(SENHA_DE_ENFEITE, 110)
  await passar(600)
  await tocar(page.getByText('Entrar', { exact: true }).last())
  marcar('entrou')

  // 2. Início: a lista de viagens (o "Arrumando a mala…" do meio passa 4× mais rápido)
  await passar(500)
  pulo = 4
  const cartao = page.getByLabel(/^Abrir Eurotrip/)
  await aparecer(cartao, 'cartão da Eurotrip')
  pulo = 1
  marcar('inicio-app')
  await passar(2600)
  await tocar(cartao)

  // 3. Tour da Norti (primeira vez na viagem)
  for (const [i, p] of PASSOS.entries()) {
    const caixa = page.getByLabel(p.fala, { exact: true })
    await aparecer(caixa, `fala ${i + 1} do tour`)
    if (i === 0) marcar('tour')
    marcar(`tour-${i}`)
    // tempo da "máquina de escrever" (26 ms por letra) + tempo de ler
    await passar(p.fala.length * 26 + 700 + Math.min(1800, p.fala.length * 28))
    if (p.tocar) await tocar(page.getByRole('tab', { name: ROTULO[p.tocar] }))
    else await tocar(caixa)
  }
  await sumir(page.getByLabel(PASSOS.at(-1).fala, { exact: true }), 'fim do tour')
  await passar(900)

  // 4. As 5 partes da viagem (o tour termina na Viagem; se não, toca nela)
  if (!ehAba('Viagem', page.url())) await tocar(page.getByRole('tab', { name: 'Viagem' }))
  await abaAberta('Viagem')
  marcar('viagem')
  await passar(1200)
  await rolar(700, 2600)
  await passar(1400)

  const abrir = async (rotulo, marca) => {
    await tocar(page.getByRole('tab', { name: rotulo }), { pausa: 0 })
    await abaAberta(rotulo)
    marcar(marca)
    await passar(1800)
  }

  await abrir('Roteiro', 'roteiro')
  await rolar(650, 2600)
  await passar(1400)

  await abrir('Reservas', 'reservas')
  await rolar(450, 2000)
  await passar(1000)
  const hospedagem = page.getByText('Hospedagem', { exact: true }).first()
  if (await hospedagem.isVisible().catch(() => false)) {
    await rolar(-450, 1200)
    await tocar(page.getByText('Hospedagem', { exact: true }).first())
    marcar('reservas-hospedagem')
    await passar(1600)
    await rolar(550, 2200)
    await passar(1200)
  }

  await abrir('Contas', 'contas')
  await rolar(550, 2400)
  await passar(1400)

  await abrir('Fotos', 'fotos')
  await passar(800) // fotos carregam
  await rolar(900, 3400)
  await passar(1600)

  // Volta pra Viagem e sobe até o bilhete ("206 dias pra Nice") pra fechar
  await tocar(page.getByRole('tab', { name: 'Viagem' }))
  marcar('fim')
  await passar(700)
  await rolar(-1200, 2000)
  await passar(3000)
}

// ---------- Gravação ----------
await rm(QUADROS, { recursive: true, force: true }) // a pasta gravacao/ fica (o Windows não deixa apagar se estiver aberta)
await mkdir(QUADROS, { recursive: true })

const sessao = await sessaoDeQa()
const { url: SUPABASE } = configDoSupabase()
console.log('Login de QA ok:', sessao.user.email)

const navegador = await chromium.launch()
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

await contexto.addInitScript(relogioDeMentira)
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
  // Círculo onde o "dedo" toca (some com o relógio de mentira)
  window.addEventListener('pointerdown', (e) => {
    const c = document.createElement('div')
    c.className = 'toque-do-video'
    c.style.left = `${e.clientX}px`
    c.style.top = `${e.clientY}px`
    document.body.appendChild(c)
    setTimeout(() => c.remove(), 700)
  }, true)
})

page = await contexto.newPage()
cdp = await contexto.newCDPSession(page)
const comecou = Date.now()
try {
  await passeio()
} catch (e) {
  if (!(e instanceof Parar)) {
    await page.screenshot({ path: path.join(PASTA, 'erro.png') }).catch(() => {})
    throw e
  }
  await passar(1500) // trecho de teste: grava mais um pouco depois da marca
} finally {
  await Promise.all(salvando)
  await contexto.close()
  await navegador.close()
}

// Junta os quadros (já recortados na tela do iPhone) num vídeo de 60 fps
const saida = path.join(PASTA, PARAR_EM ? 'teste.mp4' : 'app.mp4')
execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(QUADROS, 'q%05d.jpg'),
  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p', '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', saida])

const duracao = Math.round((quadrosGravados / FPS) * 100) / 100
if (!PARAR_EM) await writeFile(path.join(PASTA, 'marcas.json'), JSON.stringify({ duracao, marcas, toques, teclas }, null, 2))
await rm(QUADROS, { recursive: true, force: true })
console.log(`${quadrosGravados} quadros (${FPS} fps, ${duracao} s) em ${Math.round((Date.now() - comecou) / 1000)} s → ${path.relative(AQUI, saida)}`, marcas)
