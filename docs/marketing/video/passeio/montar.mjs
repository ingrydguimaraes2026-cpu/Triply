// Monta o vídeo do passeio (1920×1080): a gravação do app (passeio/gravacao/app.mp4) dentro de um iPhone em 3D
// (inclinado, em perspectiva, balançando de leve), no fundo de couro do vídeo antigo, com o nome de cada parte
// do lado (pt-BR) e a marca no fim. Sem narração nem música.
// Gera passeio/projeto/index.html (HyperFrames + GSAP) e renderiza docs/marketing/videos/norti-passeio.mp4.
// Uso (dentro de docs/marketing/video): node passeio/montar.mjs            -> monta e renderiza
//                                       node passeio/montar.mjs --so-html  -> só monta
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '../../../..')
const PROJETO = path.join(AQUI, 'projeto')
const SAIDA = path.join(RAIZ, 'docs/marketing/videos/norti-passeio.mp4')
const W = 1920
const H = 1080

const { duracao, marcas } = JSON.parse(await readFile(path.join(AQUI, 'gravacao/marcas.json'), 'utf8'))
const FIM_DO_APP = duracao // a gravação acaba aqui
const TOTAL = r2(FIM_DO_APP + 2.6) // + o cartão da marca

// Cada parte: quando começa (marca da gravação), o rótulo e o título (o trecho entre *asteriscos* fica dourado)
const PARTES = [
  { id: 'login', rotulo: 'Entrar', titulo: 'Dois toques e *bora*' },
  { id: 'inicio-app', rotulo: 'Início', titulo: 'Suas viagens *num lugar só*' },
  { id: 'tour', rotulo: 'Primeira vez', titulo: 'A *Norti* mostra o caminho' },
  { id: 'viagem', rotulo: 'Viagem', titulo: 'Tudo da viagem *num olhar*', aba: 0 },
  { id: 'roteiro', rotulo: 'Roteiro', titulo: 'Cada dia com o *seu plano*', aba: 1 },
  { id: 'reservas', rotulo: 'Reservas', titulo: 'Passagem e hospedagem *juntas*', aba: 2 },
  { id: 'contas', rotulo: 'Contas', titulo: 'Ninguém *fica devendo*', aba: 3 },
  { id: 'fotos', rotulo: 'Fotos', titulo: 'As fotos de *todo mundo*', aba: 4 },
  { id: 'fim', rotulo: 'Pronto', titulo: 'Tudo da galera *num lugar só*' },
].filter((p) => marcas[p.id] !== undefined)
  .map((p, i, todas) => ({ ...p, de: Math.max(0.2, marcas[p.id] - 0.15), ate: todas[i + 1] ? marcas[todas[i + 1].id] - 0.15 : FIM_DO_APP - 0.6 }))

// ---------- Arquivos do projeto ----------
await rm(PROJETO, { recursive: true, force: true })
await mkdir(path.join(PROJETO, 'assets'), { recursive: true })
const fonte = (pkg, peso, nome) => path.join(path.dirname(require.resolve(`${pkg}/package.json`, { paths: [path.join(RAIZ, 'apps/mobile')] })), peso, nome)
await copyFile(fonte('@expo-google-fonts/fraunces', '700Bold', 'Fraunces_700Bold.ttf'), path.join(PROJETO, 'assets/Fraunces.ttf'))
await copyFile(fonte('@expo-google-fonts/plus-jakarta-sans', '700Bold', 'PlusJakartaSans_700Bold.ttf'), path.join(PROJETO, 'assets/Jakarta.ttf'))
await copyFile(fonte('@expo-google-fonts/plus-jakarta-sans', '500Medium', 'PlusJakartaSans_500Medium.ttf'), path.join(PROJETO, 'assets/JakartaMedia.ttf'))
await copyFile(require.resolve('gsap/dist/gsap.min.js'), path.join(PROJETO, 'assets/gsap.min.js'))
await copyFile(path.join(RAIZ, 'docs/marketing/norti/recorte/norti-idle.png'), path.join(PROJETO, 'assets/norti-topo.png'))
await copyFile(path.join(RAIZ, 'docs/marketing/norti/recorte/norti-celebrate.png'), path.join(PROJETO, 'assets/norti-fim.png'))
await copyFile(path.join(AQUI, 'gravacao/app.mp4'), path.join(PROJETO, 'assets/app.mp4'))
// Trilha feita na mão (passeio/trilha.py): música + sons leves de toque, teclas e falas do tour
execFileSync('python', [path.join(AQUI, 'trilha.py'), path.join(PROJETO, 'assets/trilha.wav'), String(TOTAL)], { stdio: 'inherit' })

// ---------- iPhone ----------
// A gravação é a tela do iPhone da moldura do app (393×852, com a barra 9:41 e a Dynamic Island)
const TELA_H = 884
const TELA_W = r2(TELA_H * 393 / 852)
const BORDA = 15
const CEL = { w: TELA_W + BORDA * 2, h: TELA_H + BORDA * 2 }
const CEL_X = 1300 // centro do celular
const ABAS = ['Viagem', 'Roteiro', 'Reservas', 'Contas', 'Fotos']

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
  :root { --noite: #170F09; --creme: #FBF3E6; --couro: #7B542F; --caramelo: #B97A22; --dourado: #E3A04A; --apagado: rgba(251,243,230,.55); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--noite); }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: Jakarta, sans-serif; font-weight: 700; background: var(--noite); }
  #fundo { position: absolute; inset: -80px; }
  .luz { position: absolute; border-radius: 50%; filter: blur(110px); }
  #grao { position: absolute; inset: -100px; opacity: .07; mix-blend-mode: overlay; pointer-events: none; }
  #vinheta { position: absolute; inset: 0; background: radial-gradient(ellipse at 60% 50%, transparent 45%, rgba(0,0,0,.55) 100%); pointer-events: none; }

  /* Texto de cada parte */
  #marca-topo { position: absolute; left: 150px; top: 120px; display: flex; align-items: center; gap: 14px; color: var(--creme); font-family: Fraunces, serif; font-size: 40px; }
  #marca-topo img { width: 58px; }
  .parte { position: absolute; left: 150px; top: 400px; width: 760px; color: var(--creme); }
  .rotulo { display: flex; align-items: center; gap: 16px; color: var(--dourado); font-size: 24px; letter-spacing: .26em; text-transform: uppercase; margin-bottom: 26px; }
  .traco { display: inline-block; width: 54px; height: 2px; background: var(--dourado); transform-origin: left; }
  .titulo { font-family: Fraunces, serif; font-weight: 700; font-size: 92px; line-height: 1.02; letter-spacing: -0.025em; }
  .p { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: .26em; margin-bottom: -.26em; }
  .pi { display: inline-block; }
  em { font-style: normal; color: var(--dourado); }

  /* As 5 partes da viagem */
  #abas { position: absolute; left: 150px; top: 860px; display: flex; gap: 12px; }
  #abas span { padding: 10px 20px; border-radius: 30px; border: 1.5px solid rgba(227,160,74,.3); color: var(--apagado); font-size: 21px; font-weight: 500; }
  #abas span.ativa { background: var(--dourado); border-color: var(--dourado); color: var(--noite); font-weight: 700; }

  /* iPhone em 3D */
  #palco { position: absolute; inset: 0; perspective: 2300px; perspective-origin: ${CEL_X}px 50%; }
  #celular { position: absolute; left: ${CEL_X - CEL.w / 2}px; top: ${(H - CEL.h) / 2}px; width: ${CEL.w}px; height: ${CEL.h}px;
    transform-style: preserve-3d; }
  #costas { position: absolute; inset: 0; border-radius: 70px; background: #241a12; transform: translateZ(-16px);
    box-shadow: 0 0 0 1px #3d3026; }
  #lateral { position: absolute; inset: 0; border-radius: 70px; background: linear-gradient(90deg, #5a4c40, #1b140f 30%, #120d09 70%, #4a3e34);
    transform: translateZ(-8px); }
  #frente { position: absolute; inset: 0; padding: ${BORDA}px; border-radius: 70px;
    background: linear-gradient(140deg, #4a4038 0%, #16110d 30%, #0d0a08 70%, #3d342c 100%);
    box-shadow: 0 0 0 2px #5b5047 inset, 0 0 0 5px #0b0806 inset; }
  .botao { position: absolute; width: 6px; border-radius: 3px; background: #3b322b; transform: translateZ(-6px); }
  #tela { position: relative; width: ${TELA_W}px; height: ${TELA_H}px; border-radius: 56px; overflow: hidden; background: #FBF3E6; }
  #app { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  #reflexo { position: absolute; inset: 0; z-index: 5; pointer-events: none;
    background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.16) 45%, rgba(255,255,255,.04) 52%, transparent 60%); transform: translateX(-130%); }
  #sombra { position: absolute; left: ${CEL_X - 300}px; top: ${H - 95}px; width: 600px; height: 70px; border-radius: 50%; background: rgba(0,0,0,.6); filter: blur(34px); }

  /* Fim */
  #fim { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; color: var(--creme); }
  #fim img { width: 230px; }
  #fim h1 { font-family: Fraunces, serif; font-size: 150px; line-height: 1; letter-spacing: -0.03em; }
  #fim p { font-size: 40px; color: var(--dourado); }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">
  <audio id="trilha" class="clip" src="assets/trilha.wav" data-start="0" data-duration="${TOTAL}"></audio>
  <div id="fundo">
    <div class="luz" id="luz1" style="left:120px; top:60px; width:950px; height:760px; background:rgba(185,122,34,.22)"></div>
    <div class="luz" id="luz2" style="left:1050px; top:380px; width:950px; height:760px; background:rgba(123,84,47,.38)"></div>
  </div>

  <div id="marca-topo"><img src="assets/norti-topo.png" /><span>Norti</span></div>
  ${PARTES.map((p) => `
  <div class="parte" id="pt-${p.id}">
    <div class="rotulo"><span class="traco"></span>${p.rotulo}</div>
    <h1 class="titulo">${palavras(p.titulo)}</h1>
  </div>`).join('')}
  <div id="abas">${ABAS.map((a, i) => `<span id="aba-${i}">${a}</span>`).join('')}</div>

  <div id="sombra"></div>
  <div id="palco">
    <div id="celular">
      <div id="costas"></div>
      <div id="lateral"></div>
      <span class="botao" style="left:-5px; top:190px; height:64px"></span><span class="botao" style="left:-5px; top:274px; height:96px"></span>
      <span class="botao" style="right:-5px; top:240px; height:130px"></span>
      <div id="frente">
        <div id="tela">
          <video id="app" class="clip" src="assets/app.mp4" muted data-start="0" data-duration="${FIM_DO_APP}"></video>
          <div id="reflexo"></div>
        </div>
      </div>
    </div>
  </div>

  <div id="fim"><img src="assets/norti-fim.png" /><h1>Norti</h1><p>Agora vai: essa viagem sai.</p></div>

  <svg id="grao" width="${W + 200}" height="${H + 200}"><filter id="ruido"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#ruido)"/></svg>
  <div id="vinheta"></div>
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  const PARTES = ${JSON.stringify(PARTES.map(({ id, de, ate, aba }) => ({ id, de: r2(de), ate: r2(ate), aba: aba ?? null })))};
  const TOTAL = ${TOTAL}, FIM_DO_APP = ${FIM_DO_APP};
  const tarde = { immediateRender: false };

  gsap.set(['.parte', '#abas', '#fim', '#marca-topo'], { autoAlpha: 0 });

  // Fundo vivo
  tl.fromTo('#luz1', { x: 0, y: 0 }, { x: 240, y: 110, duration: TOTAL, ease: 'sine.inOut' }, 0);
  tl.fromTo('#luz2', { x: 0, y: 0 }, { x: -300, y: -150, duration: TOTAL, ease: 'sine.inOut' }, 0);

  // O iPhone chega do fundo girando e fica inclinado, balançando devagar
  tl.fromTo('#celular', { z: -1500, rotationY: -55, rotationX: 14, y: 40, autoAlpha: 0 },
    { z: 0, rotationY: -17, rotationX: 5, rotationZ: 1.2, y: 0, autoAlpha: 1, duration: 1.3, ease: 'power3.out' }, 0);
  tl.from('#sombra', { autoAlpha: 0, scale: .6, duration: 1.1, ease: 'power2.out' }, 0.2);
  const balanco = Math.max(1, Math.floor((FIM_DO_APP - 1.6) / 4));
  for (let i = 0; i < balanco; i++) {
    tl.to('#celular', { rotationY: i % 2 ? -17 : -11, rotationX: i % 2 ? 5 : 3, y: i % 2 ? 0 : -12, duration: 4, ease: 'sine.inOut' }, 1.3 + i * 4);
  }
  // Brilho que passa pela tela de vez em quando
  tl.fromTo('#reflexo', { xPercent: -130 }, { xPercent: 130, duration: 1.4, ease: 'power2.inOut' }, 2.5);
  for (let t = 16.5; t < FIM_DO_APP - 2; t += 14) tl.fromTo('#reflexo', { xPercent: -130 }, { xPercent: 130, duration: 1.4, ease: 'power2.inOut', immediateRender: false }, t);

  tl.to('#marca-topo', { autoAlpha: 1, duration: .6 }, 0.8);

  // Nome de cada parte: palavras sobem, ficam, saem
  for (const p of PARTES) {
    const el = '#pt-' + p.id;
    tl.set(el, { autoAlpha: 1 }, p.de);
    tl.from(el + ' .traco', { scaleX: 0, duration: .5, ease: 'power3.out' }, p.de);
    tl.from(el + ' .rotulo', { x: -20, autoAlpha: 0, duration: .5, ease: 'power3.out' }, p.de);
    tl.from(el + ' .pi', { yPercent: 110, duration: .6, stagger: .06, ease: 'power4.out' }, p.de + .1);
    tl.to(el, { autoAlpha: 0, y: -20, duration: .35, ease: 'power2.in' }, p.ate - .35);
    if (p.aba !== null) {
      tl.set('#aba-' + p.aba, { attr: { class: 'ativa' } }, p.de);
      tl.fromTo('#aba-' + p.aba, { scale: .9 }, { scale: 1, duration: .4, ease: 'back.out(3)', ...tarde }, p.de);
      tl.set('#aba-' + p.aba, { attr: { class: '' } }, p.ate);
    }
  }
  const primeiraAba = PARTES.find((p) => p.aba !== null);
  if (primeiraAba) {
    tl.fromTo('#abas', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .5, ease: 'power3.out', ...tarde }, primeiraAba.de);
    const ultimaAba = PARTES.filter((p) => p.aba !== null).at(-1);
    tl.to('#abas', { autoAlpha: 0, y: 20, duration: .4, ease: 'power2.in' }, ultimaAba.ate - .35);
  }

  // Fim: o celular sai pro fundo e a marca entra
  tl.to('#celular', { z: -1200, rotationY: 30, autoAlpha: 0, duration: .7, ease: 'power3.in' }, FIM_DO_APP - .8);
  tl.to(['#sombra', '#marca-topo'], { autoAlpha: 0, duration: .4 }, FIM_DO_APP - .8);
  tl.fromTo('#fim', { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, ...tarde }, FIM_DO_APP + .1);
  tl.from('#fim img', { y: 260, rotation: 10, duration: .8, ease: 'back.out(1.6)' }, FIM_DO_APP + .1);
  tl.from('#fim h1', { y: 40, autoAlpha: 0, duration: .6, ease: 'power3.out' }, FIM_DO_APP + .35);
  tl.from('#fim p', { y: 30, autoAlpha: 0, duration: .6, ease: 'power3.out' }, FIM_DO_APP + .7);

  window.__timelines = window.__timelines || {};
  window.__timelines['main'] = tl;
  tl.seek(0);
</script>
</body>
</html>`

await writeFile(path.join(PROJETO, 'index.html'), html)
console.log(`Composição: ${TOTAL}s, ${PARTES.length} partes ->`, path.join(PROJETO, 'index.html'))

if (!process.argv.includes('--so-html')) {
  await mkdir(path.dirname(SAIDA), { recursive: true })
  const bruto = path.join(PROJETO, 'render.mp4')
  execFileSync('npx', ['hyperframes', 'render', PROJETO, '-o', bruto, '-q', 'delivery', '--fps', '60', '--video-frame-format', 'png'], {
    stdio: 'inherit', shell: true, cwd: path.resolve(AQUI, '..'),
    env: { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1', HYPERFRAMES_SKIP_SKILLS: '1' },
  })
  // 60 fps (a gravação do app é quadro a quadro em 60 fps). O render sai pesado; recomprimido em CRF 19 fica bem menor sem diferença visível
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', bruto, '-c:v', 'libx264', '-crf', '19', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '192k', SAIDA])
  console.log('Vídeo:', SAIDA)
}

function r2(n) { return Math.round(n * 100) / 100 }

// Título palavra por palavra; o trecho entre *asteriscos* fica dourado
function palavras(texto) {
  return texto.split(/(\*[^*]+\*)/).filter(Boolean).map((parte) => {
    const destaque = parte.startsWith('*')
    const ps = parte.replace(/\*/g, '').trim().split(/\s+/).filter(Boolean).map((p) => `<span class="p"><span class="pi">${p}</span></span>`).join(' ')
    if (destaque) return `<em>${ps}</em>`
    return (/^\s/.test(parte) ? ' ' : '') + ps + (/\s$/.test(parte) ? ' ' : '')
  }).join('')
}
