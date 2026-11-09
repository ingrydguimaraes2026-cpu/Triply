// Monta o vídeo horizontal (1920x1080, estilo do vídeo do HPM): roteiro.json + narração (audio/) + gravações do app
// (gravacoes/) num iPhone em 3D que troca de lado a cada cena, com balões ligados ao celular, câmera que dá zoom,
// trilha e efeitos (trilha.py). Gera saida/projeto/index.html (HyperFrames + GSAP) e renderiza saida/tripwave-app.mp4.
// Uso: node montar.mjs            -> monta e renderiza
//      node montar.mjs --so-html  -> só monta (pra abrir no "npx hyperframes preview saida/projeto")
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const RAIZ = path.resolve('../../..') // raiz do repositório
const PROJETO = path.resolve('saida/projeto')
const W = 1920
const H = 1080

const roteiro = JSON.parse(await readFile('roteiro.json', 'utf8'))
const duracoes = JSON.parse(await readFile('audio/duracoes.json', 'utf8'))
const marcas = JSON.parse(await readFile('gravacoes/marcas.json', 'utf8'))

// ---------- Tempo de cada cena: a fala + um respiro ----------
const RESPIRO = { gancho: 0.9, fim: 2.2 }
const ATRASO_DA_FALA = { gancho: 0.4 }
let t = 0
const cenas = roteiro.cenas.map((c) => {
  const dur = r2(duracoes[c.id] + (RESPIRO[c.id] ?? 0.7))
  const cena = { ...c, inicio: r2(t), dur, ev: marcas[c.gravacao]?.eventos ?? {} }
  t += dur
  return cena
})
const TOTAL = r2(t)
const cena = Object.fromEntries(cenas.map((c) => [c.id, c]))
const comCelular = cenas.filter((c) => c.gravacao)
const celularDe = comCelular[0].inicio
const fim = cena.fim

// ---------- Arquivos do projeto ----------
await rm(PROJETO, { recursive: true, force: true })
await mkdir(path.join(PROJETO, 'assets'), { recursive: true })
const fonte = (pkg, peso, nome) => path.join(path.dirname(require.resolve(`${pkg}/package.json`, { paths: [path.join(RAIZ, 'apps/mobile')] })), peso, nome)
await copyFile(fonte('@expo-google-fonts/fraunces', '700Bold', 'Fraunces_700Bold.ttf'), path.join(PROJETO, 'assets/Fraunces.ttf'))
await copyFile(fonte('@expo-google-fonts/plus-jakarta-sans', '700Bold', 'PlusJakartaSans_700Bold.ttf'), path.join(PROJETO, 'assets/Jakarta.ttf'))
await copyFile(fonte('@expo-google-fonts/plus-jakarta-sans', '500Medium', 'PlusJakartaSans_500Medium.ttf'), path.join(PROJETO, 'assets/JakartaMedia.ttf'))
await copyFile(require.resolve('gsap/dist/gsap.min.js'), path.join(PROJETO, 'assets/gsap.min.js'))
for (const pose of ['oops', 'point', 'celebrate']) {
  await copyFile(path.join(RAIZ, `docs/marketing/norti/recorte/norti-${pose}.png`), path.join(PROJETO, `assets/norti-${pose}.png`))
}
for (const c of cenas) await copyFile(`audio/${c.id}.mp3`, path.join(PROJETO, `assets/${c.id}.mp3`))
for (const c of comCelular) await copyFile(`gravacoes/${c.gravacao}.mp4`, path.join(PROJETO, `assets/${c.gravacao}.mp4`))

// Cor do topo de cada gravação: a barra das 9:41 acompanha o app (no carimbo o fundo escurece)
const corDoTopo = (arquivo, seg) => {
  const b = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(seg), '-i', arquivo, '-frames:v', '1', '-vf', 'crop=40:12:40:4,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
  return [b[0], b[1], b[2]]
}
const barras = Object.fromEntries(comCelular.map((c) => {
  const [r, g, b] = corDoTopo(`gravacoes/${c.gravacao}.mp4`, 1.2)
  return [c.id, { fundo: `rgb(${r},${g},${b})`, texto: r * 0.3 + g * 0.59 + b * 0.11 > 140 ? '#3B2715' : '#FBF3E6' }]
}))

// ---------- Geometria ----------
const CEL = { tela: 397, borda: 14, barra: 46 } // largura da tela do iPhone, borda preta e barra de status
CEL.video = Math.round((CEL.tela * 2532) / 1170)
CEL.largura = CEL.tela + CEL.borda * 2
CEL.altura = CEL.video + CEL.barra + CEL.borda * 2
const CENTRO = { dir: 1300, esq: 620 } // centro do iPhone de cada lado
const TEXTO = { dir: 150, esq: 1010 } // começo da coluna de texto
const GIRO = { dir: -13, esq: 13 } // o iPhone vira de leve pro texto

// ---------- Balões que saem do celular (como os nós do vídeo do HPM) ----------
// x/y = canto do balão; quando = segundos dentro da cena; o fio liga o balão à borda do celular
const AV = { PV: ['PV', '#B97A22'], AC: ['AC', '#8C6A3E'], JU: ['JU', '#C25A3C'], BE: ['BE', '#6E7F5A'] }
const ex = cena.explorar.ev
const co = cena.contas.ev
const du = cena.duelo.ev
const baloes = [
  { cena: 'explorar', x: 1570, y: 250, quando: ex.quero1 + 0.25, quem: ['AC', 'JU', 'BE'], titulo: 'Torre Eiffel', sub: 'Ana, Ju e Beto querem' },
  { cena: 'explorar', x: 1570, y: 470, quando: ex.quero2 + 0.25, quem: ['AC', 'JU'], titulo: 'Sacré-Cœur', sub: 'Ana e Ju querem' },
  { cena: 'explorar', x: 1570, y: 690, quando: ex.match + 0.15, quem: ['PV', 'AC', 'JU'], titulo: 'Deu match', sub: 'entra no roteiro de Paris', destaque: true },
  { cena: 'duelo', x: 40, y: 300, quando: 0.9, quem: ['AC'], titulo: 'Ana votou', sub: 'Apê em Montmartre' },
  { cena: 'duelo', x: 40, y: 450, quando: 1.4, quem: ['JU'], titulo: 'Ju votou', sub: 'Apê em Montmartre' },
  { cena: 'duelo', x: 40, y: 600, quando: 1.9, quem: ['BE'], titulo: 'Beto votou', sub: 'Loft no Marais' },
  { cena: 'duelo', x: 40, y: 750, quando: du.voto + 0.2, quem: ['PV'], titulo: 'Você votou', sub: 'Apê em Montmartre', destaque: true },
  ...['PV', 'AC', 'JU', 'BE'].map((q, i) => ({ cena: 'contas', x: 1570, y: 250 + i * 150, quando: co.salvo + 0.55 + i * 0.12, quem: [q], titulo: '€ 21,00', sub: ['Você pagou', 'Ana deve', 'Ju deve', 'Beto deve'][i], destaque: i === 0 })),
].map((b, i) => {
  const c = cena[b.cena]
  const cx = CENTRO[c.lado]
  const larg = 320
  const x1 = b.x > cx ? b.x : b.x + larg
  const y1 = b.y + 44
  const x2 = cx + (x1 > cx ? 1 : -1) * (CEL.largura / 2 - 6)
  const y2 = Math.round(Math.max(170, Math.min(H - 170, y1 * 0.6 + 540 * 0.4)))
  return { ...b, id: `b${i}`, t: r2(c.inicio + b.quando), saida: r2(c.inicio + c.dur - 0.45), x1, y1, x2, y2, larg }
})

// ---------- Mensagens do grupo (gancho) ----------
const mensagens = [
  ['quem vai pagar o airbnb??', 'L', 80, 70], ['alguém fez a conta?', 'R', 90, 90], ['gente, e o roteiro', 'L', 150, 480],
  ['vamos de Nice ou Roma?', 'R', 170, 480], ['já comprei a passagem!!', 'L', 50, 780], ['cadê o link do hotel', 'R', 60, 780],
  ['quanto ficou pra cada um?', 'L', 190, 930], ['esqueci de mandar o pix', 'R', 150, 940], ['ok mas e o Louvre', 'L', 60, 630],
  ['votação amanhã?', 'R', 50, 630], ['alguém???', 'L', 640, 60],
]

// ---------- Mapa de nós ao fundo (Paris -> Nice -> Roma e pontinhos ligados) ----------
const pontos = Array.from({ length: 46 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453
  const b = Math.sin(i * 78.233) * 12543.123
  return [Math.round((a - Math.floor(a)) * (W + 200) - 100), Math.round((b - Math.floor(b)) * (H + 100) - 50)]
})
const ligacoes = []
pontos.forEach((p, i) => {
  const perto = pontos.map((q, j) => [j, Math.hypot(p[0] - q[0], p[1] - q[1])]).filter(([j]) => j > i).sort((a, b) => a[1] - b[1]).slice(0, 2)
  for (const [j, d] of perto) if (d < 380) ligacoes.push([p, pontos[j]])
})
const cidades = [['PARIS', 420, 300], ['NICE', 980, 760], ['ROMA', 1540, 330]]

// ---------- Deixas pra trilha (música + efeitos) ----------
const efeitos = []
mensagens.forEach((m, i) => efeitos.push({ tipo: 'pop', t: 0.35 + i * 0.27, altura: (i * 5) % 9 - 3, pan: m[1] === 'L' ? -0.5 : 0.5 }))
efeitos.push({ tipo: 'subida', t: cena.gancho.dur - 0.4, dur: 1.4 })
efeitos.push({ tipo: 'whoosh', t: cena.gancho.dur - 0.35, dur: 0.7 })
for (const c of comCelular.slice(1)) efeitos.push({ tipo: 'whoosh', t: c.inicio, pan: c.lado === 'dir' ? 0.4 : -0.4 })
for (const b of baloes) efeitos.push({ tipo: 'pop', t: b.t, altura: b.destaque ? 7 : 2, pan: b.x > W / 2 ? 0.5 : -0.5 })
efeitos.push({ tipo: 'brilho', t: cena.explorar.inicio + ex.match })
for (let i = 0; i < 'jantar 84'.length; i++) efeitos.push({ tipo: 'tecla', t: cena.contas.inicio + co.digita + 0.05 + i * 0.112 })
efeitos.push({ tipo: 'pop', t: cena.contas.inicio + co.salvo, altura: 10 })
efeitos.push({ tipo: 'baque', t: cena.carimbo.inicio + 0.55 })
efeitos.push({ tipo: 'brilho', t: cena.carimbo.inicio + 1.4 })
efeitos.push({ tipo: 'whoosh', t: fim.inicio - 0.1, dur: 0.8 })
efeitos.push({ tipo: 'brilho', t: fim.inicio + 0.9 })
const falas = cenas.map((c) => ({ id: c.id, inicio: r2(c.inicio + (ATRASO_DA_FALA[c.id] ?? 0.15)), dur: duracoes[c.id] }))
await writeFile('saida/deixas.json', JSON.stringify({ total: TOTAL, musica_de: celularDe - 0.35, bateria_ate: fim.inicio + 0.3, falas, efeitos }, null, 2))
execFileSync('python', ['trilha.py'], { stdio: 'inherit' })

// ---------- Composição ----------
const textoDaCena = (c) => `
  <div id="tx-${c.id}" class="texto" style="left:${TEXTO[c.lado]}px">
    <div class="rotulo"><span class="traco"></span>${c.rotulo}</div>
    <h1 class="titulo">${palavras(c.texto)}</h1>
    ${extraDaCena(c)}
  </div>`

function extraDaCena(c) {
  if (c.id === 'duelo') {
    return `<div class="placar">
      ${[['Apê em Montmartre', '€ 680', 'pl-a'], ['Loft no Marais', '€ 720', 'pl-b']].map(([nome, preco, id]) => `
      <div class="linha"><div class="nome">${nome}<span>${preco}</span></div><div class="trilho"><i id="${id}"></i></div><b id="${id}-n">0</b></div>`).join('')}
    </div>`
  }
  if (c.id === 'contas') {
    return `<div class="digitar"><span id="digitado"></span><span id="cursor"></span><span id="lancar">Lançar</span></div>
      <div class="dica">a Norti entende, divide e mostra quem deve quem</div>`
  }
  if (c.id === 'carimbo') {
    return `<div class="passaporte">${['Roteiro', 'Galera', 'Datas', 'Hospedagem', 'Transporte', 'Contas'].map((n, i) => `
      <div class="selo ${i === 5 ? 'novo' : ''}" id="selo-${i}"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26"/><path d="M19 31 l8 8 l15 -17"/></svg><span>${n}</span></div>`).join('')}
    </div><div class="dica"><b id="contagem">5</b> de 6 carimbos · passaporte do comboio</div>`
  }
  return ''
}

const balaoHtml = (b) => `
  <div id="${b.id}" class="balao ${b.destaque ? 'forte' : ''}" style="left:${b.x}px; top:${b.y}px; width:${b.larg}px">
    <div class="avatares">${b.quem.map((q) => `<i style="background:${AV[q][1]}">${AV[q][0]}</i>`).join('')}</div>
    <div><div class="b-titulo">${b.titulo}</div><div class="b-sub">${b.sub}</div></div>
  </div>`

const html = `<!doctype html>
<html lang="pt-BR" data-resolution="landscape">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="assets/gsap.min.js"></script>
<style>
  @font-face { font-family: Fraunces; src: url(assets/Fraunces.ttf); font-weight: 700; }
  @font-face { font-family: Jakarta; src: url(assets/Jakarta.ttf); font-weight: 700; }
  @font-face { font-family: Jakarta; src: url(assets/JakartaMedia.ttf); font-weight: 500; }
  :root { --noite: #170F09; --creme: #FBF3E6; --areia: #F1E4CF; --texto: #3B2715; --couro: #7B542F;
    --caramelo: #B97A22; --dourado: #E3A04A; --tinta: #C9492A; --apagado: rgba(251,243,230,.55); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--noite); }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: Jakarta, sans-serif; font-weight: 700; background: var(--noite); }
  #gancho-titulo, #grupo, .texto { filter: blur(0px); }
  #fundo { position: absolute; inset: -60px; }
  .luz { position: absolute; border-radius: 50%; filter: blur(90px); }
  #mapa { position: absolute; inset: 0; }
  #mapa line { stroke: rgba(227,160,74,.16); stroke-width: 1.2; }
  #mapa circle { fill: rgba(227,160,74,.35); }
  #rota { fill: none; stroke: rgba(227,160,74,.55); stroke-width: 2.5; stroke-dasharray: 10 12; }
  .cidade { position: absolute; padding: 9px 16px 9px 34px; border: 1.5px solid rgba(227,160,74,.45); border-radius: 10px; color: rgba(251,243,230,.8);
    font-size: 17px; letter-spacing: .22em; background: rgba(23,15,9,.7); }
  .cidade::before { content: ''; position: absolute; left: 13px; top: 50%; width: 9px; height: 9px; margin-top: -4.5px; border-radius: 50%; background: var(--dourado); }
  #camera { position: absolute; inset: 0; perspective: 2200px; }
  #fios { position: absolute; left: 0; top: 0; overflow: visible; }
  #fios path { fill: none; stroke: rgba(227,160,74,.7); stroke-width: 2; }
  #fios circle { fill: var(--dourado); }

  /* Gancho */
  .msg { position: absolute; padding: 18px 26px; border-radius: 26px; background: #2C1E12; color: var(--creme); font-size: 30px; font-weight: 500;
    box-shadow: 0 18px 40px rgba(0,0,0,.45); white-space: nowrap; border: 1px solid rgba(255,255,255,.06); }
  .msg.R { background: var(--couro); }
  .msg small { display: block; font-size: 17px; color: var(--dourado); margin-bottom: 4px; font-weight: 700; letter-spacing: .04em; }
  #grupo { position: absolute; left: 50%; top: 240px; width: 560px; margin-left: -280px; text-align: center; color: var(--apagado); font-size: 22px; letter-spacing: .18em; text-transform: uppercase; }
  #grupo b { display: inline-block; margin-left: 12px; padding: 4px 14px; border-radius: 20px; background: var(--tinta); color: #fff; letter-spacing: 0; font-size: 22px; }
  #gancho-titulo { position: absolute; left: 0; right: 0; top: 320px; text-align: center; font-family: Fraunces, serif; font-weight: 700; color: var(--creme);
    font-size: 112px; line-height: 1.02; letter-spacing: -0.02em; }
  #norti-oops { position: absolute; width: 230px; left: ${(W - 230) / 2}px; top: 640px; }
  #clarao { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; margin: -20px; border-radius: 50%; border: 6px solid var(--dourado); opacity: 0; }

  /* Texto das cenas */
  .texto { position: absolute; top: 290px; width: 770px; color: var(--creme); }
  .rotulo { display: flex; align-items: center; gap: 16px; color: var(--dourado); font-size: 22px; letter-spacing: .26em; text-transform: uppercase; margin-bottom: 26px; }
  .traco { display: inline-block; width: 54px; height: 2px; background: var(--dourado); transform-origin: left; }
  .titulo { font-family: Fraunces, serif; font-weight: 700; font-size: 104px; line-height: 1.0; letter-spacing: -0.025em; }
  .p { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: .1em; margin-bottom: -.1em; }
  .pi { display: inline-block; }
  em { font-style: normal; color: var(--dourado); position: relative; display: inline-block; isolation: isolate; }
  em .risco { position: absolute; left: -2px; right: -2px; bottom: .1em; height: .16em; background: rgba(227,160,74,.28); border-radius: 6px; transform-origin: left; z-index: -1; }
  .dica { margin-top: 26px; color: var(--apagado); font-size: 28px; font-weight: 500; }
  .dica b { display: inline-block; color: var(--dourado); }
  .placar { margin-top: 44px; width: 640px; }
  .placar .linha { display: grid; grid-template-columns: 250px 1fr 40px; align-items: center; gap: 22px; margin-bottom: 22px; }
  .placar .nome { font-size: 25px; } .placar .nome span { display: block; color: var(--apagado); font-size: 19px; font-weight: 500; margin-top: 2px; }
  .trilho { height: 16px; border-radius: 10px; background: rgba(251,243,230,.1); overflow: hidden; }
  .trilho i { display: block; height: 100%; width: 0; border-radius: 10px; background: linear-gradient(90deg, var(--caramelo), var(--dourado)); }
  .placar b { display: inline-block; font-size: 30px; color: var(--dourado); text-align: right; }
  .digitar { margin-top: 44px; width: 640px; height: 92px; border-radius: 46px; background: var(--creme); display: flex; align-items: center; padding: 0 12px 0 40px;
    color: var(--texto); font-size: 40px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
  #cursor { width: 3px; height: 44px; background: var(--caramelo); margin-left: 4px; }
  #lancar { margin-left: auto; padding: 18px 30px; border-radius: 40px; background: var(--caramelo); color: #fff; font-size: 26px; }
  .passaporte { margin-top: 40px; display: flex; gap: 18px; }
  .selo { width: 104px; text-align: center; color: var(--apagado); font-size: 15px; letter-spacing: .02em; }
  .selo svg { width: 92px; height: 92px; display: block; margin: 0 auto 8px; }
  .selo circle { fill: rgba(227,160,74,.14); stroke: var(--dourado); stroke-width: 2.5; stroke-dasharray: 5 4; }
  .selo path { fill: none; stroke: var(--dourado); stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; }
  .selo.novo circle { fill: rgba(201,73,42,.2); stroke: var(--tinta); }
  .selo.novo path { stroke: #F07A55; }

  /* iPhone */
  #celular { position: absolute; left: ${CENTRO.dir - CEL.largura / 2}px; top: ${(H - CEL.altura) / 2}px; width: ${CEL.largura}px; height: ${CEL.altura}px;
    padding: ${CEL.borda}px; border-radius: 66px; background: linear-gradient(140deg, #4a4038 0%, #16110d 30%, #0d0a08 70%, #3d342c 100%);
    box-shadow: 0 0 0 2px #5b5047 inset, 0 0 0 5px #0b0806 inset, 0 70px 120px rgba(0,0,0,.6), 0 30px 50px rgba(0,0,0,.35); }
  #celular .botao { position: absolute; width: 5px; border-radius: 3px; background: #3b322b; }
  #tela { position: relative; width: ${CEL.tela}px; height: ${CEL.video + CEL.barra}px; border-radius: 52px; overflow: hidden; background: var(--creme); }
  #barra { position: absolute; top: 0; left: 0; right: 0; height: ${CEL.barra}px; display: flex; align-items: center; justify-content: space-between;
    padding: 4px 36px 0 44px; font-size: 18px; z-index: 3; }
  #ilha { position: absolute; top: 11px; left: 50%; width: 112px; height: 32px; margin-left: -56px; border-radius: 20px; background: #000; z-index: 4; }
  .bateria { width: 29px; height: 14px; border: 2px solid currentColor; border-radius: 5px; padding: 1.5px; }
  .bateria i { display: block; width: 80%; height: 100%; background: currentColor; border-radius: 2px; }
  .gravacao { position: absolute; top: ${CEL.barra}px; left: 0; width: ${CEL.tela}px; height: ${CEL.video}px; object-fit: cover; }
  #reflexo { position: absolute; inset: 0; z-index: 5; pointer-events: none;
    background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.22) 45%, rgba(255,255,255,.05) 52%, transparent 60%); transform: translateX(-120%); }
  #sombra { position: absolute; left: ${CENTRO.dir - 260}px; top: ${H - 120}px; width: 520px; height: 70px; border-radius: 50%; background: rgba(0,0,0,.55); filter: blur(30px); }

  /* Balões */
  .balao { position: absolute; display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 20px; background: rgba(39,27,16,.92);
    border: 1.5px solid rgba(227,160,74,.35); box-shadow: 0 20px 50px rgba(0,0,0,.45); color: var(--creme); }
  .balao.forte { background: var(--dourado); border-color: var(--dourado); color: var(--noite); }
  .avatares { display: flex; flex-shrink: 0; }
  .avatares i { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-style: normal; font-size: 16px; color: #fff;
    border: 3px solid #271B10; margin-left: -12px; }
  .avatares i:first-child { margin-left: 0; }
  .forte .avatares i { border-color: var(--dourado); }
  .b-titulo { font-size: 24px; } .b-sub { font-size: 17px; font-weight: 500; opacity: .75; margin-top: 2px; }

  /* Match, moeda e carimbo */
  .anel { position: absolute; width: 200px; height: 200px; margin: -100px; border-radius: 50%; border: 4px solid var(--dourado); opacity: 0; }
  .faisca { position: absolute; width: 14px; height: 14px; margin: -7px; background: var(--dourado); opacity: 0; }
  #moeda { position: absolute; left: 1570px; top: 470px; width: 320px; padding: 22px 0; border-radius: 22px; background: var(--creme); color: var(--texto);
    text-align: center; font-family: Fraunces, serif; font-size: 52px; box-shadow: 0 20px 60px rgba(0,0,0,.5); opacity: 0; }
  #carimbo { position: absolute; left: ${CENTRO.esq + 45}px; top: 330px; width: 330px; height: 330px; opacity: 0; }
  .poeira { position: absolute; width: 10px; height: 10px; margin: -5px; border-radius: 50%; background: var(--tinta); opacity: 0; }
  .norti { position: absolute; }

  /* Fim */
  #luz-fim { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; background: radial-gradient(90% 90% at 50% 40%, #FFF9EF 0%, var(--creme) 50%, var(--areia) 100%);
    clip-path: circle(0px at ${CENTRO.esq}px 540px); }
  #fim-mapa { position: absolute; left: 0; top: 0; }
  #fim-rota { fill: none; stroke: var(--caramelo); stroke-width: 4; }
  .fim-cidade { position: absolute; font-size: 20px; letter-spacing: .24em; color: var(--couro); }
  .fim-cidade::before { content: ''; display: block; width: 22px; height: 22px; border-radius: 50%; background: var(--caramelo); border: 5px solid var(--creme);
    box-shadow: 0 0 0 2px var(--caramelo); margin: 0 auto 10px; }
  #aviao { position: absolute; left: 300px; top: 250px; width: 22px; height: 22px; margin: -11px; border-radius: 50%; background: var(--tinta); box-shadow: 0 0 0 6px rgba(201,73,42,.25); }
  #marca { position: absolute; left: 0; right: 0; top: 390px; text-align: center; font-family: Fraunces, serif; font-weight: 700; color: var(--couro); font-size: 210px;
    letter-spacing: -0.035em; line-height: 1; }
  #marca span { display: inline-block; }
  #slogan { position: absolute; left: 0; right: 0; top: 650px; text-align: center; font-size: 50px; color: var(--texto); }
  #slogan em { color: var(--caramelo); }
  #norti-fim { width: 300px; left: 1530px; top: 640px; }
  .confete { position: absolute; left: ${W / 2}px; top: 470px; width: 16px; height: 26px; border-radius: 4px; opacity: 0; }

  #grao { position: absolute; left: -100px; top: -100px; opacity: .09; mix-blend-mode: overlay; pointer-events: none; }
  #vinheta { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%); }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">

  <!-- Fundo: luzes quentes + mapa de nós (a rota Paris -> Nice -> Roma) -->
  <div id="fundo">
    <div class="luz" id="luz1" style="left:200px; top:100px; width:900px; height:700px; background:rgba(185,122,34,.22)"></div>
    <div class="luz" id="luz2" style="left:1100px; top:400px; width:900px; height:700px; background:rgba(123,84,47,.35)"></div>
    <svg id="mapa" width="${W + 120}" height="${H + 120}">
      ${ligacoes.map(([a, b]) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`).join('')}
      ${pontos.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6"/>`).join('')}
      <path id="rota" d="M ${cidades[0][1]} ${cidades[0][2]} C 640 600, 760 760, ${cidades[1][1]} ${cidades[1][2]} S 1380 420, ${cidades[2][1]} ${cidades[2][2]}"/>
    </svg>
    ${cidades.map(([n, x, y]) => `<div class="cidade" id="c-${n}" style="left:${x - 20}px; top:${y - 20}px">${n}</div>`).join('')}
  </div>

  <div id="camera">
    <!-- Gancho: o grupo da viagem pegando fogo -->
    <div id="grupo">Eurotrip 2027 · 4 pessoas <b id="naolidas">87</b></div>
    ${mensagens.map(([m, lado, dx, y], i) => `<div class="msg ${lado}" id="m${i}" style="${lado === 'L' ? 'left' : 'right'}:${dx}px; top:${y}px"><small>${['Ana', 'Beto', 'Ju'][i % 3]}</small>${m}</div>`).join('\n    ')}
    <h1 id="gancho-titulo">${palavras(cena.gancho.texto)}</h1>
    <img id="norti-oops" src="assets/norti-oops.png" />
    <div id="clarao"></div>

    ${comCelular.map(textoDaCena).join('')}

    <svg id="fios" width="${W}" height="${H}">
      ${baloes.map((b) => `<path id="f-${b.id}" d="M ${b.x1} ${b.y1} C ${(b.x1 + b.x2) / 2} ${b.y1}, ${(b.x1 + b.x2) / 2} ${b.y2}, ${b.x2} ${b.y2}"/><circle id="d-${b.id}" cx="${b.x2}" cy="${b.y2}" r="6"/>`).join('')}
    </svg>

    <div id="sombra"></div>
    <!-- O app no iPhone -->
    <div id="celular">
      <span class="botao" style="left:-4px; top:170px; height:60px"></span><span class="botao" style="left:-4px; top:250px; height:90px"></span>
      <span class="botao" style="right:-4px; top:220px; height:120px"></span>
      <div id="tela">
        <div id="ilha"></div>
        <div id="barra"><span>9:41</span><span class="bateria"><i></i></span></div>
        ${comCelular.map((c) => `<video id="v-${c.id}" class="gravacao clip" src="assets/${c.gravacao}.mp4" muted data-start="${c.inicio}" data-duration="${c.dur}"></video>`).join('\n        ')}
        <div id="reflexo"></div>
      </div>
    </div>

    ${baloes.map(balaoHtml).join('')}
    ${Array.from({ length: 3 }, (_, i) => `<div class="anel" id="anel${i}" style="left:${CENTRO.dir}px; top:470px"></div>`).join('')}
    ${Array.from({ length: 12 }, (_, i) => `<div class="faisca" id="fa${i}" style="left:${CENTRO.dir}px; top:470px"></div>`).join('')}
    <div id="moeda">€ 84,00</div>
    <img id="norti-point" class="norti" src="assets/norti-point.png" style="width:210px; left:-230px; top:780px" />

    <svg id="carimbo" viewBox="0 0 330 330">
      <defs>
        <filter id="tinta-falha"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter>
        <path id="volta" d="M 165 165 m -122 0 a 122 122 0 1 1 244 0 a 122 122 0 1 1 -244 0"/>
      </defs>
      <g filter="url(#tinta-falha)" fill="none" stroke="#C9492A">
        <circle cx="165" cy="165" r="156" stroke-width="7"/><circle cx="165" cy="165" r="100" stroke-width="3"/>
        <text font-family="Jakarta" font-weight="700" font-size="25" letter-spacing="7" fill="#C9492A" stroke="none"><textPath href="#volta">NORTI · PASSAPORTE DO COMBOIO ·</textPath></text>
        <text x="165" y="160" text-anchor="middle" font-family="Fraunces" font-weight="700" font-size="50" fill="#C9492A" stroke="none">Contas</text>
        <text x="165" y="198" text-anchor="middle" font-family="Jakarta" font-weight="700" font-size="22" letter-spacing="5" fill="#C9492A" stroke="none">RESOLVIDO</text>
      </g>
    </svg>
    ${Array.from({ length: 14 }, (_, i) => `<div class="poeira" id="po${i}" style="left:${CENTRO.esq + 210}px; top:495px"></div>`).join('')}
  </div>

  <!-- Fim: abre a luz, a rota se desenha e a marca entra -->
  <div id="luz-fim">
    <svg id="fim-mapa" width="${W}" height="${H}"><path id="fim-rota" d="M 300 250 C 560 120, 760 330, 960 220 S 1400 120, 1620 250"/></svg>
    ${[['PARIS', 300, 250], ['NICE', 960, 220], ['ROMA', 1620, 250]].map(([n, x, y]) => `<div class="fim-cidade" id="fc-${n}" style="left:${x - 60}px; width:120px; text-align:center; top:${y - 16}px">${n}</div>`).join('')}
    <div id="aviao"></div>
    <div id="marca">${[...'Norti'].map((l) => `<span>${l}</span>`).join('')}</div>
    <div id="slogan">${fim.texto.replace(/(\S+)$/, '<em>$1</em>')}</div>
    <img id="norti-fim" class="norti" src="assets/norti-celebrate.png" />
    ${Array.from({ length: 44 }, (_, i) => `<div class="confete" id="cf${i}" style="background:${['#E3A04A', '#B97A22', '#7B542F', '#C9492A', '#6E7F5A'][i % 5]}"></div>`).join('')}
  </div>

  <svg id="grao" width="${W + 200}" height="${H + 200}"><filter id="ruido"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#ruido)"/></svg>
  <div id="vinheta"></div>

  <!-- Som: trilha (música + efeitos) e narração -->
  <audio id="trilha" class="clip" src="assets/trilha.wav" data-start="0" data-duration="${TOTAL}"></audio>
  ${falas.map((f) => `<audio id="fala-${f.id}" class="clip" src="assets/${f.id}.mp3" data-start="${f.inicio}" data-duration="${f.dur}"></audio>`).join('\n  ')}
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  const C = ${JSON.stringify(Object.fromEntries(cenas.map((c) => [c.id, { inicio: c.inicio, dur: c.dur, lado: c.lado ?? null, ev: c.ev }])))};
  const ORDEM = ${JSON.stringify(comCelular.map((c) => c.id))};
  const CENTRO = ${JSON.stringify(CENTRO)}, GIRO = ${JSON.stringify(GIRO)}, BARRAS = ${JSON.stringify(barras)};
  const BALOES = ${JSON.stringify(baloes.map(({ id, t, saida, x }) => ({ id, t, saida, x })))};
  const W = ${W}, H = ${H}, CELULAR_DE = ${celularDe}, TOTAL = ${TOTAL};
  const sorte = (i) => { const a = Math.sin(i * 91.7) * 10000; return a - Math.floor(a); };
  const tarde = { immediateRender: false }; // efeitos que só aparecem na hora deles

  // Comprimento das linhas pra desenhar
  document.querySelectorAll('#fios path, #fim-rota').forEach((p) => { p.dataset.l = p.getTotalLength(); p.style.strokeDasharray = p.dataset.l; p.style.strokeDashoffset = p.dataset.l; });

  // Tudo que entra depois começa escondido
  gsap.set(['.texto', '.balao', '#fios circle', '.norti', '#celular', '#sombra', '.cidade'], { autoAlpha: 0 });

  // ---------- Fundo vivo: luzes andando, mapa em paralaxe, granulado ----------
  tl.fromTo('#luz1', { x: 0, y: 0 }, { x: 260, y: 120, duration: TOTAL, ease: 'sine.inOut' }, 0);
  tl.fromTo('#luz2', { x: 0, y: 0 }, { x: -320, y: -160, duration: TOTAL, ease: 'sine.inOut' }, 0);
  tl.fromTo('#mapa', { x: 0, y: 0, opacity: .5 }, { x: -110, y: -50, opacity: 1, duration: TOTAL, ease: 'none' }, 0);
  tl.fromTo('#grao', { x: 0, y: 0 }, { x: -90, y: -70, duration: TOTAL, ease: 'steps(${Math.round(TOTAL * 12)})' }, 0);
  tl.fromTo('#rota', { strokeDashoffset: 600, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 3, ease: 'power2.inOut', ...tarde }, CELULAR_DE);
  ['PARIS', 'NICE', 'ROMA'].forEach((n, i) => tl.fromTo('#c-' + n, { autoAlpha: 0, scale: .7 }, { autoAlpha: 1, scale: 1, duration: .5, ease: 'back.out(2)' }, CELULAR_DE + 0.2 + i * 0.9));

  // ---------- Gancho: o grupo pegando fogo ----------
  const g = C.gancho;
  tl.fromTo('#grupo', { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: .4 }, 0.1);
  tl.fromTo({ n: 87 }, { n: 87 }, { n: 214, duration: 3.2, ease: 'power1.in', onUpdate() { document.querySelector('#naolidas').textContent = Math.round(this.targets()[0].n); } }, 0.3);
  document.querySelectorAll('.msg').forEach((el, i) => {
    const t = 0.35 + i * 0.27;
    const r = el.getBoundingClientRect();
    tl.fromTo(el, { autoAlpha: 0, scale: .3, rotation: (sorte(i) - .5) * 30, y: 40 }, { autoAlpha: 1, scale: 1, rotation: (sorte(i + 9) - .5) * 8, y: 0, duration: .45, ease: 'back.out(2.4)' }, t);
    tl.to(el, { y: -(10 + sorte(i + 3) * 18), duration: 1.6, ease: 'sine.inOut' }, t + .45);
    tl.to(el, { x: W / 2 - r.left - r.width / 2, y: H / 2 - r.top - r.height / 2, scale: 0, rotation: 0, autoAlpha: 0, duration: .5, ease: 'power3.in' }, g.dur - .75 + i * .015);
  });
  tl.from('#gancho-titulo .pi', { yPercent: 110, rotation: 4, duration: .6, stagger: .07, ease: 'power3.out' }, 0.45);
  tl.from('#gancho-titulo .risco', { scaleX: 0, duration: .5, ease: 'power2.out' }, 1.3);
  tl.to('#gancho-titulo em', { rotation: -3, duration: .07, yoyo: true, repeat: 7, ease: 'none' }, 2.0);
  tl.fromTo('#norti-oops', { y: 460, rotation: -10 }, { y: 0, rotation: 0, duration: .6, ease: 'back.out(1.8)' }, 1.0);
  tl.to('#norti-oops', { y: -14, duration: .16, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 1.9);
  // a bagunça cresce: a câmera treme cada vez mais
  for (let i = 0; i < 14; i++) {
    const forca = 2 + i * 0.6;
    tl.to('#camera', { x: (sorte(i) - .5) * forca * 2, y: (sorte(i + 40) - .5) * forca * 2, duration: .07, ease: 'none' }, 1.9 + i * .1);
  }
  tl.to('#camera', { x: 0, y: 0, duration: .1 }, 1.9 + 14 * .1);
  // tudo é sugado pro centro e explode num clarão
  tl.to(['#gancho-titulo', '#grupo'], { scale: .4, autoAlpha: 0, filter: 'blur(14px)', duration: .45, ease: 'power3.in' }, g.dur - .7);
  tl.to('#norti-oops', { y: 500, rotation: 15, duration: .45, ease: 'power3.in' }, g.dur - .75);
  tl.fromTo('#clarao', { scale: 0, opacity: 1 }, { scale: 60, opacity: 0, duration: .8, ease: 'power2.out', ...tarde }, g.dur - .3);

  // ---------- iPhone: entra girando do fundo; troca de lado a cada cena ----------
  const L0 = C[ORDEM[0]].lado;
  const posicao = (lado) => CENTRO[lado] - CENTRO.dir;
  tl.fromTo('#celular', { autoAlpha: 0, x: posicao(L0), z: -1400, rotationY: GIRO[L0] * -4, rotationX: 18 },
    { autoAlpha: 1, z: 0, rotationY: GIRO[L0], rotationX: 0, duration: 1.0, ease: 'expo.out' }, CELULAR_DE - .35);
  tl.fromTo('#sombra', { autoAlpha: 0, x: posicao(L0), scale: .3 }, { autoAlpha: 1, scale: 1, duration: 1, ease: 'expo.out' }, CELULAR_DE - .35);
  // flutua de leve o tempo todo
  tl.to('#celular', { y: -10, duration: 1.6, yoyo: true, repeat: ${Math.ceil((fim.inicio - celularDe) / 1.6)}, ease: 'sine.inOut' }, CELULAR_DE + .6);

  ORDEM.forEach((id, k) => {
    const c = C[id];
    const tx = '#tx-' + id;
    tl.set('#barra', { backgroundColor: BARRAS[id].fundo, color: BARRAS[id].texto }, c.inicio);
    if (k > 0) {
      tl.to('#celular', { x: posicao(c.lado), rotationY: GIRO[c.lado], duration: .8, ease: 'power3.inOut' }, c.inicio - .4);
      tl.to('#celular', { scale: .9, duration: .4, yoyo: true, repeat: 1, ease: 'sine.inOut' }, c.inicio - .4);
      tl.to('#sombra', { x: posicao(c.lado), duration: .8, ease: 'power3.inOut' }, c.inicio - .4);
    }
    // reflexo passando no vidro
    tl.fromTo('#reflexo', { xPercent: -120 }, { xPercent: 140, duration: 1.1, ease: 'power2.inOut', ...tarde }, c.inicio + .05);
    // texto entra palavra por palavra (sobe de baixo com desfoque) e sai antes da troca
    tl.set(tx, { autoAlpha: 1 }, c.inicio);
    tl.from(tx + ' .traco', { scaleX: 0, duration: .5, ease: 'power2.out' }, c.inicio + .1);
    tl.from(tx + ' .rotulo', { x: -20, autoAlpha: 0, duration: .5, ease: 'power2.out' }, c.inicio + .1);
    tl.from(tx + ' .pi', { yPercent: 115, rotation: 4, duration: .6, stagger: .07, ease: 'power3.out' }, c.inicio + .2);
    tl.from(tx + ' .risco', { scaleX: 0, duration: .5, ease: 'power2.out' }, c.inicio + .75);
    tl.to(tx, { autoAlpha: 0, x: c.lado === 'dir' ? -40 : 40, filter: 'blur(8px)', duration: .35, ease: 'power2.in' }, c.inicio + c.dur - .45);
  });

  // ---------- Balões ligados ao celular ----------
  for (const b of BALOES) {
    const el = '#' + b.id;
    const fio = document.querySelector('#f-' + b.id);
    tl.fromTo(fio, { strokeDashoffset: fio.dataset.l }, { strokeDashoffset: 0, duration: .45, ease: 'power2.out', ...tarde }, b.t - .2);
    tl.fromTo('#d-' + b.id, { autoAlpha: 0, scale: 0, transformOrigin: 'center' }, { autoAlpha: 1, scale: 1, duration: .3, ...tarde }, b.t - .2);
    tl.fromTo(el, { autoAlpha: 0, scale: .6, x: b.x > W / 2 ? -40 : 40 }, { autoAlpha: 1, scale: 1, x: 0, duration: .5, ease: 'back.out(2)', ...tarde }, b.t);
    tl.to([el, '#d-' + b.id], { autoAlpha: 0, scale: .8, duration: .3, ease: 'power2.in' }, b.saida);
    tl.to(fio, { strokeDashoffset: -fio.dataset.l, duration: .4, ease: 'power2.in' }, b.saida);
  }

  // ---------- Explorar: o match explode e a câmera chega perto ----------
  const ex = C.explorar;
  const tm = ex.inicio + ex.ev.match;
  tl.set('#camera', { transformOrigin: '1600px 540px' }, ex.inicio);
  tl.to('#camera', { scale: 1.06, duration: .7, ease: 'power3.out' }, tm - .1);
  tl.to('#camera', { scale: 1, duration: .6, ease: 'power2.inOut' }, ex.inicio + ex.dur - .7);
  for (let i = 0; i < 3; i++) tl.fromTo('#anel' + i, { scale: .2, opacity: .9 }, { scale: 3.2 + i, opacity: 0, duration: 1.1, ease: 'power2.out', ...tarde }, tm + i * .12);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    tl.fromTo('#fa' + i, { x: 0, y: 0, opacity: 1, scale: 1, rotation: 45 }, { x: Math.cos(a) * (260 + sorte(i) * 140), y: Math.sin(a) * (260 + sorte(i) * 140), opacity: 0, scale: .3, rotation: 225, duration: 1, ease: 'power3.out', ...tarde }, tm);
  }
  tl.fromTo('#norti-point', { autoAlpha: 1, x: 0, rotation: -10 }, { autoAlpha: 1, x: 330, rotation: 0, duration: .6, ease: 'back.out(1.6)', ...tarde }, ex.inicio + 1.2);
  tl.to('#norti-point', { x: 0, duration: .35, ease: 'power2.in' }, ex.inicio + ex.dur - .6);

  // ---------- Onde dormir: placar enche com os votos ----------
  const du = C.duelo;
  const voto = (sel, n, t) => { tl.to(sel, { width: (n / 4 * 100) + '%', duration: .5, ease: 'power3.out' }, t); tl.set(sel + '-n', { textContent: n }, t); };
  voto('#pl-a', 1, du.inicio + .9); voto('#pl-a', 2, du.inicio + 1.4); voto('#pl-b', 1, du.inicio + 1.9); voto('#pl-a', 3, du.inicio + du.ev.voto + .2);
  tl.fromTo('#pl-a-n', { scale: 1.6 }, { scale: 1, duration: .4, ease: 'back.out(3)', ...tarde }, du.inicio + du.ev.voto + .2);

  // ---------- Contas: digita "jantar 84", vira € 84 e se divide em 4 ----------
  const co = C.contas;
  const frase = 'jantar 84';
  for (let i = 1; i <= frase.length; i++) tl.set('#digitado', { textContent: frase.slice(0, i) }, co.inicio + co.ev.digita + .05 + (i - 1) * .112);
  for (let i = 0; i < 16; i++) tl.set('#cursor', { opacity: i % 2 ? 0 : 1 }, co.inicio + i * .26);
  tl.to('#lancar', { scale: .9, duration: .1, yoyo: true, repeat: 1 }, co.inicio + co.ev.salvar - .1);
  const ts = co.inicio + co.ev.salvo;
  tl.set('#camera', { transformOrigin: '1600px 540px' }, co.inicio);
  tl.to('#camera', { scale: 1.05, duration: .7, ease: 'power3.out' }, ts - .1);
  tl.to('#camera', { scale: 1, duration: .5, ease: 'power2.inOut' }, co.inicio + co.dur - .6);
  tl.fromTo('#moeda', { autoAlpha: 0, x: -240, scale: .3, rotationY: 0 }, { autoAlpha: 1, x: 0, scale: 1, rotationY: 360, duration: .6, ease: 'back.out(1.7)', ...tarde }, ts);
  tl.to('#moeda', { scale: 0, autoAlpha: 0, duration: .25, ease: 'power3.in' }, ts + .5);

  // ---------- Carimbo: bate com força, a câmera treme, o passaporte completa ----------
  const ca = C.carimbo;
  const tb = ca.inicio + .55;
  tl.fromTo('#carimbo', { autoAlpha: 0, scale: 3.2, rotation: 8 }, { autoAlpha: .95, scale: 1, rotation: -14, duration: .3, ease: 'power4.in', ...tarde }, tb - .3);
  for (let i = 0; i < 8; i++) tl.to('#camera', { x: (sorte(i + 70) - .5) * (22 - i * 2.5), y: (sorte(i + 90) - .5) * (22 - i * 2.5), duration: .05, ease: 'none' }, tb + i * .05);
  tl.to('#camera', { x: 0, y: 0, duration: .08 }, tb + .4);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + sorte(i);
    tl.fromTo('#po' + i, { x: 0, y: 0, opacity: .9, scale: 1 + sorte(i + 5) }, { x: Math.cos(a) * (190 + sorte(i + 2) * 120), y: Math.sin(a) * (190 + sorte(i + 2) * 120), opacity: 0, scale: .2, duration: .7, ease: 'power3.out', ...tarde }, tb);
  }
  for (let i = 0; i < 5; i++) tl.from('#selo-' + i, { autoAlpha: 0, y: 20, duration: .35, ease: 'back.out(2)' }, ca.inicio + .25 + i * .05);
  tl.fromTo('#selo-5', { autoAlpha: 0, scale: 2.4, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: .45, ease: 'back.out(2.2)' }, ca.inicio + 1.3);
  tl.set('#contagem', { textContent: 6 }, ca.inicio + 1.4);
  tl.fromTo('#contagem', { scale: 1.8 }, { scale: 1, duration: .4, ease: 'back.out(3)', ...tarde }, ca.inicio + 1.4);
  tl.to('#carimbo', { autoAlpha: 0, scale: .9, duration: .3 }, ca.inicio + ca.dur - .45);

  // ---------- Fim: o celular some, a luz abre e a marca entra ----------
  const f = C.fim;
  tl.to('#celular', { z: -900, rotationY: 40, autoAlpha: 0, duration: .6, ease: 'power3.in' }, f.inicio - .35);
  tl.to('#sombra', { autoAlpha: 0, duration: .4 }, f.inicio - .35);
  tl.to('#luz-fim', { clipPath: 'circle(1400px at ${CENTRO.esq}px 540px)', duration: .9, ease: 'power3.inOut' }, f.inicio - .25);
  const fr = document.querySelector('#fim-rota');
  tl.to(fr, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, f.inicio + .3);
  tl.fromTo({ p: 0 }, { p: 0 }, { p: 1, duration: 2.2, ease: 'power2.inOut', onUpdate() {
    const p = fr.getPointAtLength(this.targets()[0].p * fr.dataset.l); gsap.set('#aviao', { left: p.x, top: p.y });
  } }, f.inicio + .3);
  ['PARIS', 'NICE', 'ROMA'].forEach((n, i) => tl.from('#fc-' + n, { autoAlpha: 0, y: 14, duration: .4, ease: 'back.out(2)' }, f.inicio + .35 + i * 1.0));
  tl.from('#marca span', { yPercent: 70, autoAlpha: 0, scale: .6, rotation: 6, duration: .7, stagger: .05, ease: 'power4.out' }, f.inicio + .35);
  tl.from('#slogan', { y: 30, autoAlpha: 0, duration: .6, ease: 'power3.out' }, f.inicio + .95);
  tl.fromTo('#norti-fim', { autoAlpha: 1, y: 500, rotation: 10 }, { autoAlpha: 1, y: 0, rotation: 0, duration: .8, ease: 'back.out(1.5)', ...tarde }, f.inicio + .6);
  tl.to('#norti-fim', { y: -30, duration: .28, yoyo: true, repeat: 5, ease: 'sine.inOut' }, f.inicio + 1.5);
  for (let i = 0; i < 44; i++) {
    const a = -Math.PI / 2 + (sorte(i) - .5) * Math.PI * 1.6;
    const v = 380 + sorte(i + 7) * 520;
    const t0 = f.inicio + .9;
    tl.fromTo('#cf' + i, { x: 0, y: 0, rotation: 0, opacity: 1 }, { x: Math.cos(a) * v, y: Math.sin(a) * v * .7, rotation: (sorte(i + 3) - .5) * 720, duration: .7, ease: 'power3.out', ...tarde }, t0);
    tl.to('#cf' + i, { y: '+=' + (700 + sorte(i + 11) * 300), rotation: '+=' + (sorte(i + 13) - .5) * 600, x: '+=' + (sorte(i + 17) - .5) * 200, duration: 2.2, ease: 'power1.in' }, t0 + .7);
  }

  window.__timelines = window.__timelines || {};
  window.__timelines['main'] = tl;
  tl.seek(0);
</script>
</body>
</html>`

await writeFile(path.join(PROJETO, 'index.html'), html)
console.log(`Composição: ${TOTAL}s, ${cenas.length} cenas ->`, path.join(PROJETO, 'index.html'))

if (!process.argv.includes('--so-html')) {
  execFileSync('npx', ['hyperframes', 'render', PROJETO, '-o', path.resolve('saida/tripwave-app.mp4'), '-q', 'delivery', '--video-frame-format', 'png'], {
    stdio: 'inherit', shell: true,
    env: { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1', HYPERFRAMES_SKIP_SKILLS: '1' },
  })
}

function r2(n) { return Math.round(n * 100) / 100 }

// Título palavra por palavra (cada uma sobe de dentro de uma "janela"); o trecho entre *asteriscos* fica dourado e grifado
function palavras(texto) {
  return texto.split(/(\*[^*]+\*)/).filter(Boolean).map((parte) => {
    const destaque = parte.startsWith('*')
    const ps = parte.replace(/\*/g, '').trim().split(/\s+/).filter(Boolean).map((p) => `<span class="p"><span class="pi">${p}</span></span>`).join(' ')
    if (destaque) return `<em>${ps}<span class="risco"></span></em>`
    return (/^\s/.test(parte) ? ' ' : '') + ps + (/\s$/.test(parte) ? ' ' : '')
  }).join('')
}
