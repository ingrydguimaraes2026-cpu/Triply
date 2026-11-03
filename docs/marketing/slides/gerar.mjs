// Gera as imagens dos carrosséis a partir da planilha (planilha.csv).
// Uso (na raiz do repo):  node docs/marketing/slides/gerar.mjs S1
// Sai em docs/marketing/slides/saida/<post>/: tiktok-1.png ... (1080×1920) e instagram-1.png ... (1080×1350).
// Quem tira a "foto" de cada slide é o Chrome sem janela (o Chromium do Playwright ou o Chrome instalado).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pasta = dirname(fileURLToPath(import.meta.url))
const post = process.argv[2]
if (!post) {
  console.log('Diga qual post gerar. Ex.: node docs/marketing/slides/gerar.mjs S1')
  process.exit(1)
}

// ---------- Planilha ----------
const linhas = readFileSync(join(pasta, 'planilha.csv'), 'utf8').trim().split(/\r?\n/)
const colunas = linhas[0].split(';')
const slides = linhas
  .slice(1)
  .map((l) => Object.fromEntries(l.split(';').map((v, i) => [colunas[i], v.trim()])))
  .filter((s) => s.post === post)
  .sort((a, b) => Number(a.slide) - Number(b.slide))
if (!slides.length) {
  console.log(`Nenhum slide do post ${post} na planilha.`)
  process.exit(1)
}

// ---------- Formatos ----------
// "folga" é a margem que fica livre dos botões e legendas de cada rede
const FORMATOS = {
  tiktok: { largura: 1080, altura: 1920, folga: { topo: 170, base: 430, esq: 90, dir: 160 } },
  instagram: { largura: 1080, altura: 1350, folga: { topo: 90, base: 90, esq: 90, dir: 90 } },
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const norti = (pose) => pathToFileURL(join(pasta, '..', 'norti', 'png', `norti-${pose === 'think' ? 'think' : pose}.png`)).href
// Pose sem a borda vazia (pra Norti aparecer grande)
const nortiRecorte = (pose) => pathToFileURL(join(pasta, '..', 'norti', 'recorte', `norti-${pose}.png`)).href
const fonte = (arq) => pathToFileURL(join(pasta, 'fontes', arq)).href
const reais = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })

// Cor fixa pro nome de cada pessoa na conversa
const CORES = { Ana: '#B5462F', Bia: '#7B542F', Caio: '#5E6B2E', Duda: '#B97A22', Gabi: '#8A4F7D', Léo: '#2F6B6B', Mari: '#A1442B', Rafa: '#4F5FA1' }

function conteudo(s, f) {
  // Modelo do benchmark (PADROES.md): frase gigante + Norti grande, nada de tela do app
  if (s.tipo === 'nome' || s.tipo === 'frase' || s.tipo === 'frase-escura') {
    return `
      <div class="frase-slide ${s.tipo}">
        <h1${s.tipo === 'nome' && s.titulo.length > 8 ? ' class="longo"' : ''}>${esc(s.titulo).split(' | ').join('<br>')}</h1>
        ${s.texto ? `<p>${esc(s.texto)}</p>` : ''}
        <img class="norti-grande" src="${nortiRecorte(s.pose)}">
        <span class="assinatura">@tripwave.app</span>
      </div>`
  }
  if (s.tipo === 'capa') {
    return `
      <div class="capa">
        <div class="brilhos">${Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 62}%;--t:${6 + (i % 5) * 3}px;opacity:${0.25 + (i % 4) * 0.18}"></i>`).join('')}</div>
        <h1>${esc(s.titulo).replace('dia 2 de janeiro', '<em>dia 2 de janeiro</em>')}</h1>
        <img class="norti-capa" src="${norti(s.pose)}">
      </div>`
  }
  if (s.tipo === 'chat') {
    const msgs = s.texto.split('|').map((m) => m.trim())
    const bolhas = msgs
      .map((m) => {
        if (m.startsWith('#')) return `<div class="data-chat">${esc(m.slice(1).trim())}</div>`
        const [nome, ...resto] = m.split(':')
        return `<div class="bolha"><b style="color:${CORES[nome] ?? '#7B542F'}">${esc(nome)}</b>${esc(resto.join(':').trim())}</div>`
      })
      .join('')
    return `
      <div class="chat-slide">
        <p class="rotulo">${esc(s.titulo)}</p>
        <div class="chat">
          <div class="chat-topo"><span class="avatar-grupo"><img src="${norti('idle')}"></span><div><b>Réveillon Búzios</b><small>Ana, Bia, Caio, Duda, Gabi, Léo, Mari, Rafa</small></div></div>
          <div class="chat-corpo">${bolhas}</div>
        </div>
        <img class="norti-canto" src="${norti(s.pose)}">
      </div>`
  }
  if (s.tipo === 'app') {
    const itens = s.texto.split('|').map((m) => {
      const [par, valor] = m.trim().split(':')
      const [de, para] = par.split('>')
      return { de, para, valor: Number(valor) }
    })
    const lista = itens
      .map(
        (a) => `<li><span class="av" style="background:${CORES[a.de]}">${a.de[0]}</span><span class="quem"><b>${esc(a.de)}</b> paga <b>${esc(a.para)}</b></span><span class="valor">${reais(a.valor)}</span></li>`,
      )
      .join('')
    return `
      <div class="app-slide">
        <h2>${esc(s.titulo)}</h2>
        <div class="tela">
          <div class="tela-topo"><small>Réveillon Búzios · Financeiro</small><b>Quem paga quem</b></div>
          <div class="resumo"><div><small>total da viagem</small><b>R$ 6.200</b></div><div><small>cada um</small><b>R$ 775</b></div></div>
          <ul>${lista}</ul>
          <p class="fim">${itens.length} Pix e acabou ✓</p>
        </div>
        <img class="norti-app" src="${norti(s.pose)}">
      </div>`
  }
  // cta
  return `
    <div class="cta">
      <img class="norti-cta" src="${norti(s.pose)}">
      <h1>${esc(s.titulo)}</h1>
      <p>${esc(s.texto)}</p>
      <span class="pilula">em breve · lista de espera no perfil</span>
    </div>`
}

function pagina(s, f) {
  const { largura, altura, folga } = f
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face { font-family: Fraunces; font-weight: 600; src: url(${fonte('Fraunces_600SemiBold.ttf')}); }
@font-face { font-family: Fraunces; font-weight: 700; src: url(${fonte('Fraunces_700Bold.ttf')}); }
@font-face { font-family: Jakarta; font-weight: 500; src: url(${fonte('PlusJakartaSans_500Medium.ttf')}); }
@font-face { font-family: Jakarta; font-weight: 700; src: url(${fonte('PlusJakartaSans_700Bold.ttf')}); }
:root { --creme: #F5E9D6; --papel: #FFFAF2; --couro: #7B542F; --dourado: #E3A04A; --caramelo: #B97A22; --texto: #3B2715; --suave: #7A5F45; --escuro: #24160A; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${largura}px; height: ${altura}px; overflow: hidden; }
body { font-family: Jakarta, sans-serif; color: var(--texto); background: var(--creme); }
.slide { position: absolute; inset: 0; padding: ${folga.topo}px ${folga.dir}px ${folga.base}px ${folga.esq}px; display: flex; flex-direction: column; justify-content: center; }
img { display: block; }

/* Capa */
.capa-fundo { background: radial-gradient(120% 80% at 50% 0%, #4A2E17 0%, var(--escuro) 70%); color: var(--creme); }
.capa { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 60px; }
.brilhos { position: absolute; inset: -${folga.topo}px -${folga.dir}px 0 -${folga.esq}px; pointer-events: none; }
.brilhos i { position: absolute; width: var(--t); height: var(--t); border-radius: 50%; background: var(--dourado); box-shadow: 0 0 18px var(--dourado); }
.capa h1 { position: relative; font-family: Fraunces; font-weight: 700; font-size: ${altura > 1500 ? 112 : 96}px; line-height: 1.04; letter-spacing: -0.02em; }
.capa h1 em { font-style: normal; color: var(--dourado); }
.norti-capa { position: relative; width: ${altura > 1500 ? 360 : 280}px; align-self: flex-end; margin-right: -20px; }

/* Conversa */
.chat-slide { position: relative; display: flex; flex-direction: column; gap: 34px; }
.rotulo { font-family: Fraunces; font-weight: 700; font-size: 64px; color: var(--couro); }
.chat { background: #EFE3CE; border-radius: 44px; overflow: hidden; box-shadow: 0 24px 60px rgba(59, 39, 21, .18); }
.chat-topo { display: flex; align-items: center; gap: 22px; padding: 26px 32px; background: var(--couro); color: var(--creme); }
.chat-topo b { display: block; font-size: 36px; }
.chat-topo small { font-size: 22px; opacity: .8; }
.avatar-grupo { width: 74px; height: 74px; border-radius: 50%; background: var(--creme); display: grid; place-items: center; flex: none; overflow: hidden; }
.avatar-grupo img { width: 64px; margin-top: 8px; }
.chat-corpo { padding: 34px 30px 40px; display: flex; flex-direction: column; gap: 20px; }
.bolha { align-self: flex-start; max-width: 84%; background: var(--papel); border-radius: 8px 34px 34px 34px; padding: 18px 26px 22px; font-size: ${altura > 1500 ? 40 : 36}px; line-height: 1.25; box-shadow: 0 2px 0 rgba(59, 39, 21, .08); }
.bolha b { display: block; font-size: 25px; margin-bottom: 4px; }
.data-chat { align-self: center; background: rgba(123, 84, 47, .14); color: var(--couro); font-weight: 700; font-size: 26px; padding: 8px 22px; border-radius: 999px; }
.norti-canto { position: absolute; right: -40px; bottom: -150px; width: ${altura > 1500 ? 260 : 200}px; transform: rotate(6deg); }

/* App */
.app-slide { position: relative; display: flex; flex-direction: column; gap: 40px; }
.app-slide h2 { font-family: Fraunces; font-weight: 700; font-size: ${altura > 1500 ? 62 : 52}px; line-height: 1.1; color: var(--texto); }
.tela { background: var(--papel); border-radius: 48px; padding: 38px 40px 34px; box-shadow: 0 30px 70px rgba(59, 39, 21, .2); border: 3px solid #EADCC6; }
.tela-topo small { display: block; font-size: 24px; color: var(--suave); }
.tela-topo b { font-family: Fraunces; font-size: 46px; }
.resumo { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 24px 0; }
.resumo div { background: var(--creme); border-radius: 24px; padding: 18px 22px; }
.resumo small { display: block; font-size: 22px; color: var(--suave); }
.resumo b { font-size: 40px; font-variant-numeric: tabular-nums; }
.tela ul { list-style: none; padding: 0; display: flex; flex-direction: column; }
.tela li { display: grid; grid-template-columns: 58px 1fr auto; align-items: center; gap: 18px; padding: ${altura > 1500 ? 15 : 9}px 0; border-top: 2px solid #F0E4D2; font-size: 30px; }
.av { width: 58px; height: 58px; border-radius: 50%; color: #fff; font-weight: 700; display: grid; place-items: center; font-size: 28px; }
.quem b { font-weight: 700; }
.valor { font-weight: 700; font-variant-numeric: tabular-nums; }
.fim { margin-top: 16px; text-align: center; font-weight: 700; font-size: 30px; color: #5E6B2E; background: #EEF0DF; border-radius: 999px; padding: 12px; }
.norti-app { position: absolute; right: -70px; top: ${altura > 1500 ? 150 : 110}px; width: ${altura > 1500 ? 230 : 170}px; }

/* Frase gigante (modelo do benchmark) */
.frase-slide { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; gap: 36px; padding-top: ${altura > 1500 ? 120 : 40}px; }
.frase-slide h1 { font-family: Jakarta; font-weight: 700; font-size: ${altura > 1500 ? 104 : 88}px; line-height: 1.08; letter-spacing: -0.025em; color: var(--texto); }
.frase-slide p { font-size: ${altura > 1500 ? 50 : 42}px; line-height: 1.25; font-weight: 500; color: var(--suave); }
.frase-slide.nome h1.longo { font-size: ${altura > 1500 ? 150 : 124}px; }
.frase-slide.nome h1 { font-family: Fraunces; font-size: ${altura > 1500 ? 230 : 190}px; line-height: .95; letter-spacing: -0.03em; }
.norti-grande { position: absolute; left: 50%; bottom: ${altura > 1500 ? 10 : -10}px; transform: translateX(-50%); width: ${altura > 1500 ? 760 : 470}px; }
.assinatura { position: absolute; left: 0; bottom: ${altura > 1500 ? -200 : -50}px; font-weight: 700; font-size: 26px; color: var(--suave); opacity: .7; }
.fundo-escuro { background: var(--escuro); }
.fundo-escuro .frase-slide h1 { color: var(--creme); }
.fundo-escuro .frase-slide p, .fundo-escuro .assinatura { color: #C9B192; }

/* Fecho */
.cta-fundo { background: var(--couro); color: var(--creme); }
.cta { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 30px; }
.norti-cta { width: ${altura > 1500 ? 520 : 400}px; }
.cta h1 { font-family: Fraunces; font-weight: 700; font-size: 120px; letter-spacing: -0.02em; line-height: 1; }
.cta p { font-size: 42px; line-height: 1.3; max-width: 820px; opacity: .92; }
.pilula { margin-top: 10px; background: var(--dourado); color: var(--escuro); font-weight: 700; font-size: 34px; padding: 22px 40px; border-radius: 999px; }
</style></head><body>
<div class="slide ${s.tipo === 'capa' ? 'capa-fundo' : s.tipo === 'cta' ? 'cta-fundo' : s.tipo === 'frase-escura' ? 'fundo-escuro' : ''}">${conteudo(s, f)}</div>
</body></html>`
}

// ---------- Chrome sem janela ----------
function acharChrome() {
  const base = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright')
  if (existsSync(base)) {
    const versoes = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()
    for (const v of versoes) {
      const exe = join(base, v, 'chrome-win64', 'chrome.exe')
      if (existsSync(exe)) return exe
    }
  }
  for (const exe of ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'])
    if (existsSync(exe)) return exe
  throw new Error('Não achei o Chrome. Instale o Google Chrome ou rode "npx playwright install chromium".')
}

const chrome = acharChrome()
const saida = join(pasta, 'saida', post)
mkdirSync(join(saida, 'html'), { recursive: true })

for (const [nome, f] of Object.entries(FORMATOS)) {
  for (const s of slides) {
    const html = join(saida, 'html', `${nome}-${s.slide}.html`)
    const png = join(saida, `${nome}-${s.slide}.png`)
    writeFileSync(html, pagina(s, f))
    execFileSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--force-device-scale-factor=1',
      `--window-size=${f.largura},${f.altura}`,
      '--virtual-time-budget=3000',
      `--screenshot=${png}`,
      pathToFileURL(html).href,
    ], { stdio: 'ignore' })
    console.log('ok', `${nome}-${s.slide}.png`)
  }
}

// Legenda pronta pra colar (coluna "legenda" do slide 1; " / " vira quebra de linha)
const legenda = (slides[0].legenda ?? '').split(' / ').join('\n\n')
writeFileSync(join(saida, 'legenda.txt'), legenda)
console.log('Pronto:', saida)
