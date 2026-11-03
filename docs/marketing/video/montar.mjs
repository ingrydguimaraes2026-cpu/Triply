// Monta o vídeo: roteiro.json + narração (audio/) + gravações do app (gravacoes/) dentro de um iPhone.
// Gera saida/projeto/index.html (composição HyperFrames + GSAP) e renderiza saida/tripwave-app.mp4.
// Uso: node montar.mjs            -> monta e renderiza
//      node montar.mjs --so-html  -> só monta (pra abrir no "npx hyperframes preview saida/projeto")
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const RAIZ = path.resolve('../../..') // raiz do repositório
const PROJETO = path.resolve('saida/projeto')
const W = 1080
const H = 1920

const roteiro = JSON.parse(await readFile('roteiro.json', 'utf8'))
const duracoes = JSON.parse(await readFile('audio/duracoes.json', 'utf8'))
const marcas = JSON.parse(await readFile('gravacoes/marcas.json', 'utf8'))

// ---------- Tempo de cada cena: a fala + um respiro ----------
const RESPIRO = { gancho: 0.6, fim: 1.6 }
let t = 0
const cenas = roteiro.cenas.map((c) => {
  const dur = Math.round((duracoes[c.id] + (RESPIRO[c.id] ?? 0.45)) * 100) / 100
  const cena = { ...c, inicio: Math.round(t * 100) / 100, dur }
  t += dur
  return cena
})
const TOTAL = Math.round(t * 100) / 100
const comCelular = cenas.filter((c) => c.gravacao)
const celularDe = comCelular[0].inicio
const celularAte = comCelular.at(-1).inicio + comCelular.at(-1).dur

// ---------- Arquivos do projeto ----------
await rm(PROJETO, { recursive: true, force: true })
await mkdir(path.join(PROJETO, 'assets'), { recursive: true })
const fonte = (pkg, peso, nome) => path.join(path.dirname(require.resolve(`${pkg}/package.json`, { paths: [path.join(RAIZ, 'apps/mobile')] })), peso, nome)
await copyFile(fonte('@expo-google-fonts/fraunces', '700Bold', 'Fraunces_700Bold.ttf'), path.join(PROJETO, 'assets/Fraunces.ttf'))
await copyFile(fonte('@expo-google-fonts/plus-jakarta-sans', '700Bold', 'PlusJakartaSans_700Bold.ttf'), path.join(PROJETO, 'assets/Jakarta.ttf'))
await copyFile(require.resolve('gsap/dist/gsap.min.js'), path.join(PROJETO, 'assets/gsap.min.js'))
for (const pose of ['oops', 'point', 'celebrate']) {
  await copyFile(path.join(RAIZ, `docs/marketing/norti/recorte/norti-${pose}.png`), path.join(PROJETO, `assets/norti-${pose}.png`))
}
for (const c of cenas) await copyFile(`audio/${c.id}.mp3`, path.join(PROJETO, `assets/${c.id}.mp3`))

// Gravações: corta a partir da marca, segura o último quadro e converte pra H.264 sem áudio
for (const c of comCelular) {
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-ss', String(marcas[c.gravacao].inicio), '-i', `gravacoes/${c.gravacao}.webm`,
    '-vf', `crop=390:844:0:0,scale=1200:-2:flags=lanczos,tpad=stop_mode=clone:stop_duration=${Math.ceil(c.dur) + 1},fps=30`, '-t', String(c.dur + 0.5),
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', path.join(PROJETO, `assets/${c.gravacao}.mp4`),
  ])
}

// ---------- Composição ----------
const CEL = { largura: 640, borda: 20, barra: 74 } // moldura, borda preta e barra de status do iPhone
const tela = CEL.largura - CEL.borda * 2
const alturaDoVideo = Math.round((tela * 844) / 390)
const alturaDoCel = alturaDoVideo + CEL.barra + CEL.borda * 2
const topoDoCel = H - alturaDoCel - 96

const bolhas = ['quem vai pagar o airbnb??', 'gente, e o roteiro', '87 mensagens não lidas', 'alguém fez a conta?', 'onde a gente dorme']

const html = `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="assets/gsap.min.js"></script>
<style>
  @font-face { font-family: Fraunces; src: url(assets/Fraunces.ttf); font-weight: 700; }
  @font-face { font-family: Jakarta; src: url(assets/Jakarta.ttf); font-weight: 700; }
  :root { --fundo: #FBF3E6; --areia: #F1E4CF; --texto: #3B2715; --couro: #7B542F; --caramelo: #B97A22; --dourado: #E3A04A; --escuro: #4A2E14; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--fundo); }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: Jakarta, sans-serif;
    background: radial-gradient(120% 70% at 50% 18%, #FFF8EC 0%, var(--fundo) 45%, var(--areia) 100%); }
  .titulo { position: absolute; left: 70px; right: 70px; top: 150px; text-align: center; font-family: Fraunces, serif; font-weight: 700;
    color: var(--texto); font-size: 92px; line-height: 1.02; letter-spacing: -0.02em; }
  .titulo em { font-style: normal; color: var(--caramelo); }
  #celular { position: absolute; left: ${(W - CEL.largura) / 2}px; top: ${topoDoCel}px; width: ${CEL.largura}px; height: ${alturaDoCel}px;
    padding: ${CEL.borda}px; border-radius: 104px; background: #17120E;
    box-shadow: 0 60px 120px rgba(74,46,20,.35), 0 0 0 3px #3a2f27 inset, 0 0 0 2px #0d0a08; }
  #tela { position: relative; width: ${tela}px; height: ${alturaDoVideo + CEL.barra}px; border-radius: 84px; overflow: hidden; background: var(--fundo); }
  #barra { position: absolute; top: 0; left: 0; right: 0; height: ${CEL.barra}px; display: flex; align-items: center; justify-content: space-between;
    padding: 6px 56px 0 64px; font-weight: 700; font-size: 27px; color: var(--texto); background: var(--fundo); z-index: 3; }
  #ilha { position: absolute; top: 18px; left: 50%; width: 176px; height: 50px; margin-left: -88px; border-radius: 30px; background: #000; z-index: 4; }
  .bateria { width: 46px; height: 22px; border: 3px solid var(--texto); border-radius: 7px; padding: 2px; }
  .bateria i { display: block; width: 80%; height: 100%; background: var(--texto); border-radius: 3px; }
  .gravacao { position: absolute; top: ${CEL.barra}px; left: 0; width: ${tela}px; height: ${alturaDoVideo}px; object-fit: cover; }
  .norti { position: absolute; }
  .bolha { position: absolute; padding: 26px 34px; border-radius: 40px; background: #fff; color: var(--texto); font-size: 40px; font-weight: 700;
    box-shadow: 0 16px 40px rgba(74,46,20,.18); white-space: nowrap; }
  .bolha.minha { background: var(--couro); color: #fff; }
  #marca { position: absolute; left: 0; right: 0; top: 330px; text-align: center; font-family: Fraunces, serif; font-weight: 700; color: var(--couro); font-size: 190px; letter-spacing: -0.03em; }
  #slogan { position: absolute; left: 80px; right: 80px; top: 580px; text-align: center; font-size: 60px; font-weight: 700; color: var(--texto); line-height: 1.15; }
  .confete { position: absolute; width: 22px; height: 34px; border-radius: 4px; top: -60px; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">

  ${cenas.filter((c) => c.id !== 'fim').map((c) => `<h1 id="t-${c.id}" class="titulo clip" data-start="${c.inicio}" data-duration="${c.dur}">${destacar(c.texto)}</h1>`).join('\n  ')}

  <!-- Gancho: o grupo da viagem pegando fogo -->
  ${bolhas.map((b, i) => `<div id="bolha-${i}" class="bolha ${i % 2 ? 'minha' : ''} clip" data-start="0" data-duration="${cenas[0].dur}" style="left:${[90, 470, 140, 520, 200][i]}px; top:${[520, 690, 900, 1090, 1290][i]}px">${b}</div>`).join('\n  ')}
  <img id="norti-oops" class="norti clip" src="assets/norti-oops.png" data-start="0" data-duration="${cenas[0].dur}" style="width:440px; left:${(W - 440) / 2}px; top:1420px" />

  <!-- O app no iPhone -->
  <div id="celular">
    <div id="tela">
      <div id="ilha"></div>
      <div id="barra"><span>9:41</span><span class="bateria"><i></i></span></div>
      ${comCelular.map((c) => `<video id="v-${c.id}" class="gravacao clip" src="assets/${c.gravacao}.mp4" muted data-start="${c.inicio}" data-duration="${c.dur}"></video>`).join('\n      ')}
    </div>
  </div>
  <img id="norti-point" class="norti clip" src="assets/norti-point.png" data-start="${celularDe}" data-duration="${celularAte - celularDe}" style="width:250px; left:-10px; top:${H - 330}px" />

  <!-- Fim: marca + Norti comemorando -->
  ${cenas.filter((c) => c.id === 'fim').map((c) => `
  <div id="marca" class="clip" data-start="${c.inicio}" data-duration="${c.dur}">Tripwave</div>
  <div id="slogan" class="clip" data-start="${c.inicio}" data-duration="${c.dur}">${c.texto}</div>
  <img id="norti-fim" class="norti clip" src="assets/norti-celebrate.png" data-start="${c.inicio}" data-duration="${c.dur}" style="width:560px; left:${(W - 560) / 2}px; top:900px" />
  ${Array.from({ length: 28 }, (_, i) => `<div class="confete clip" data-start="${c.inicio}" data-duration="${c.dur}" style="left:${(i * 37 + 13) % W}px; background:${['#E3A04A', '#B97A22', '#7B542F', '#F5E9D6', '#C9492A'][i % 5]}"></div>`).join('\n  ')}`).join('')}

  <!-- Narração -->
  ${cenas.map((c) => `<audio id="fala-${c.id}" class="clip" src="assets/${c.id}.mp3" data-start="${c.inicio + 0.15}" data-duration="${duracoes[c.id]}"></audio>`).join('\n  ')}
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  const cenas = ${JSON.stringify(cenas.map(({ id, inicio, dur }) => ({ id, inicio, dur })))};

  // Título de cada cena: sobe com mola e some no fim
  for (const c of cenas) {
    if (c.id === 'fim') continue;
    tl.fromTo('#t-' + c.id, { y: 50, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }, c.inicio);
    tl.to('#t-' + c.id, { opacity: 0, y: -20, duration: 0.25, ease: 'power2.in' }, c.inicio + c.dur - 0.25);
  }

  // Gancho: as mensagens pipocam uma atrás da outra e a Norti leva um susto
  ${bolhas.map((_, i) => `tl.fromTo('#bolha-${i}', { scale: 0.4, opacity: 0, rotation: ${i % 2 ? 6 : -6} }, { scale: 1, opacity: 1, rotation: ${i % 2 ? 2 : -2}, duration: 0.35, ease: 'back.out(2.2)' }, ${0.35 + i * 0.32});`).join('\n  ')}
  tl.fromTo('#norti-oops', { y: 400, rotation: -8 }, { y: 0, rotation: 0, duration: 0.6, ease: 'back.out(1.6)' }, 0.2);
  tl.to('#norti-oops', { y: -18, duration: 0.18, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 1.4);
  tl.to(['#bolha-0', '#bolha-1', '#bolha-2', '#bolha-3', '#bolha-4', '#norti-oops'], { opacity: 0, scale: 0.8, duration: 0.3, stagger: 0.03 }, ${cenas[0].dur - 0.35});

  // O iPhone entra por baixo, inclina de leve e sai no fim (fora disso fica escondido abaixo da tela)
  tl.set('#celular', { y: ${H} }, 0);
  tl.fromTo('#celular', { y: ${H}, rotation: 4 }, { y: 0, rotation: 0, duration: 0.75, ease: 'power3.out' }, ${celularDe - 0.4});
  for (const c of cenas.slice(2)) {
    if (c.id === 'fim') break;
    tl.fromTo('#tela', { scale: 0.97 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' }, c.inicio);
  }
  tl.to('#celular', { y: ${H}, rotation: -3, duration: 0.55, ease: 'power3.in' }, ${celularAte - 0.05});
  tl.fromTo('#norti-point', { x: -280 }, { x: 0, duration: 0.5, ease: 'back.out(1.5)' }, ${celularDe + 0.3});
  tl.to('#norti-point', { x: -300, duration: 0.35, ease: 'power2.in' }, ${celularAte - 0.4});

  // Fim: marca, slogan, Norti pulando e confete
  const fim = cenas.at(-1);
  tl.fromTo('#marca', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' }, fim.inicio + 0.1);
  tl.fromTo('#slogan', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, fim.inicio + 0.45);
  tl.fromTo('#norti-fim', { y: 700 }, { y: 0, duration: 0.7, ease: 'back.out(1.4)' }, fim.inicio + 0.2);
  tl.to('#norti-fim', { y: -40, duration: 0.3, yoyo: true, repeat: 3, ease: 'sine.inOut' }, fim.inicio + 1);
  document.querySelectorAll('.confete').forEach((el, i) => {
    tl.fromTo(el, { y: 0, rotation: 0 }, { y: ${H + 120} + (i % 4) * 60, rotation: (i % 2 ? 1 : -1) * (300 + i * 20), x: (i % 3 - 1) * 90, duration: 2.4 + (i % 5) * 0.25, ease: 'power1.in' }, fim.inicio + 0.25 + (i % 7) * 0.08);
  });

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

// Uma palavra do título em caramelo: a que vem entre *asteriscos*, ou a última
function destacar(texto) {
  return texto.includes('*') ? texto.replace(/\*(.+?)\*/g, '<em>$1</em>') : texto.replace(/(\S+)$/, '<em>$1</em>')
}
