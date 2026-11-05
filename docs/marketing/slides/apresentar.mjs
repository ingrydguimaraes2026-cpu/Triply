// Carrosséis que apresentam o app (APRESENTAR-O-APP.md), no visual do vídeo do app:
// fundo escuro de couro com mapa de rota, título com uma palavra em destaque, celular com a tela real e a Norti.
// Uso (na raiz do repo):  node docs/marketing/slides/apresentar.mjs C0   (ou C1, ou sem nada pra todos)
// Telas: docs/marketing/video/gravacoes/telas/ (gere com `node telas.mjs` dentro de docs/marketing/video).
// Sai em docs/marketing/slides/saida/<post>/instagram-N.png (1080×1350) + previa.png
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const pasta = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(pasta, '..', 'video', 'package.json'))
const { chromium } = require('playwright')
const url = (...p) => pathToFileURL(join(pasta, ...p)).href
const tela = (nome) => url('..', 'video', 'gravacoes', 'telas', `${nome}.png`)
const norti = (pose) => url('..', 'norti', 'recorte', `norti-${pose}.png`)
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// *palavra* vira destaque caramelo; | vira quebra de linha
const rico = (t) => esc(t).replace(/\*(.+?)\*/g, '<em>$1</em>').split(' | ').join('<br>')

// ---------- Os posts ----------
const POSTS = {
  C0: [
    { tipo: 'capa', olho: 'a história', titulo: 'A gente criou um app porque sempre *um da galera* organiza a viagem sozinho', pose: 'think' },
    { tipo: 'lista', olho: 'toda viagem é igual', titulo: 'O organizador:', itens: ['acha a casa', 'faz a planilha', 'cobra quem não confirmou', 'faz a conta no fim'], pose: 'oops' },
    { tipo: 'tela', olho: 'aí a gente fez', titulo: 'A *Norti*: a viagem da galera num lugar só', telas: ['inicio'], pose: 'celebrate' },
    { tipo: 'tela', olho: 'decidir junto', titulo: 'Manda um link no grupo. Cada um *vota* onde ficar', sub: 'quem não quiser instalar vota pelo navegador', telas: ['viagem'], pose: 'point' },
    { tipo: 'duas', olho: 'o roteiro', titulo: 'Cada um desliza os lugares. *Deu match*, entra no roteiro', telas: ['explorar', 'match'], pose: 'love' },
    { tipo: 'tela', olho: 'a memória', titulo: 'E cada lugar vira *carimbo* no passaporte da galera', telas: ['pass-2'], pose: 'celebrate', escuro: true },
    { tipo: 'fim', titulo: 'Norti', sub: 'o app da viagem com a galera', pose: 'wave' },
  ],
  C1: [
    { tipo: 'capa', olho: 'norti', titulo: 'O que é a *Norti*?', sub: 'arrasta pro lado →', pose: 'wave' },
    { tipo: 'tela', olho: 'em uma frase', titulo: 'O app da viagem com a galera: do *"bora?"* ao carimbo no passaporte', telas: ['inicio'], pose: 'idle' },
    { tipo: 'tela', olho: '1 · o convite', titulo: 'Um link no grupo e *todo mundo topa*, sem instalar', telas: ['viagem'], pose: 'wave' },
    { tipo: 'duas', olho: '2 · os lugares', titulo: 'Cada um desliza. Quando a galera quer o mesmo, *deu match*', telas: ['explorar', 'match'], pose: 'love' },
    { tipo: 'duas', olho: '3 · casa e contas', titulo: 'Casa no *voto*. Gastos sem planilha', telas: ['passaporte', 'contas'], pose: 'point' },
    { tipo: 'duas', olho: '4 · o passaporte', titulo: 'Cada lugar vira *carimbo*. O mapa da galera acende', telas: ['pass-1', 'pass-carimbou'], pose: 'celebrate' },
    { tipo: 'fim', titulo: 'Norti', sub: 'do "bora?" ao carimbo', pose: 'celebrate' },
  ],
  C2: [
    { tipo: 'capa', olho: 'pergunta séria', titulo: 'Sua galera ainda decide a viagem num grupo com *300 mensagens*?', pose: 'think' },
    { tipo: 'bolhas', olho: 'o grupo de sempre', titulo: 'Toda vez é *assim*:', bolhas: ['Ana: e aquela casa que eu mandei?', 'Beto: qual?? manda de novo', 'Ju: gente, vota na enquete', 'Léo: que enquete', 'Ana: esquece, eu decido'], pose: 'oops' },
    { tipo: 'tela', olho: 'na norti', titulo: 'Cada um vota em *1 toque*. O grupo vê o placar', telas: ['viagem'], pose: 'point' },
    { tipo: 'tela', olho: 'sem cobrar ninguém', titulo: 'Quem ainda não votou aparece ali: *falta você*', telas: ['passaporte'], pose: 'think' },
    { tipo: 'fim', titulo: 'Norti', sub: 'a galera decide junto', pose: 'celebrate' },
  ],
  C3: [
    { tipo: 'capa', olho: 'pode apagar', titulo: 'Você *não precisa* de planilha pra viagem com os amigos', pose: 'celebrate' },
    { tipo: 'lista', olho: 'a planilha tentava', titulo: 'Guardar:', itens: ['quem vai', 'onde dorme', 'o que fazer', 'quanto deu'], pose: 'think' },
    { tipo: 'tela', olho: 'o roteiro', titulo: 'O que a galera quer vira o *roteiro* do dia', telas: ['roteiro'], pose: 'point' },
    { tipo: 'tela', olho: 'as contas', titulo: 'Escreveu "jantar 84", a Norti *divide* sozinha', telas: ['contas'], pose: 'wave' },
    { tipo: 'fim', titulo: 'Norti', sub: 'a viagem da galera num lugar só', pose: 'celebrate' },
  ],
  C4: [
    { tipo: 'capa', olho: 'pra você', titulo: 'Se você é quem *sempre organiza* a viagem, precisa ler isso', pose: 'point' },
    { tipo: 'lista', olho: 'a sua vida hoje', titulo: 'Você:', itens: ['acha a casa', 'cobra a confirmação', 'monta o roteiro', 'faz a conta no fim'], pose: 'oops' },
    { tipo: 'tela', olho: 'agora', titulo: 'Manda um link e a galera *vota*', telas: ['viagem'], pose: 'wave' },
    { tipo: 'duas', olho: 'o roteiro', titulo: 'Cada um desliza. O roteiro sai dos *matches*', telas: ['explorar', 'roteiro'], pose: 'love' },
    { tipo: 'duas', olho: 'e no fim', titulo: 'Você ganha o *passaporte* de todas as viagens de vocês', telas: ['pass-capa', 'pass-1'], pose: 'celebrate' },
    { tipo: 'fim', titulo: 'Norti', sub: 'pra quem sempre organiza', pose: 'wave' },
  ],
  K1: [
    { tipo: 'capa', olho: 'comparação', titulo: 'Grupo do zap *x* Norti', pose: 'think' },
    { tipo: 'versus', olho: '1 · a casa', titulo: 'Onde a galera vai *dormir*', zap: ['olha essa casa', 'e essa?', 'qual era a primeira mesmo?'], legenda: '40 links perdidos na conversa', telas: ['viagem'], norti: 'as casas lado a lado, com votos' },
    { tipo: 'versus', olho: '2 · os passeios', titulo: 'O que a galera vai *fazer*', zap: ['quem quer ir no museu?', '...', 'alguém?'], legenda: 'enquete que ninguém responde', telas: ['match'], norti: 'deu match: 3 querem o mesmo' },
    { tipo: 'versus', olho: '3 · a conta', titulo: 'Quanto *deu* a viagem', zap: ['quanto foi o mercado?', 'acho que 800', 'eu achei 1.200'], legenda: 'a planilha no fim', telas: ['contas'], norti: 'cada gasto dividido na hora' },
    { tipo: 'versus', olho: '4 · a memória', titulo: 'O que *fica* da viagem', zap: ['manda as fotos', 'quais?', 'tá no drive do Léo'], legenda: 'tudo espalhado', telas: ['pass-2'], norti: 'cada lugar vira carimbo' },
    { tipo: 'fim', titulo: 'Norti', sub: 'sai do grupo, entra na viagem', pose: 'celebrate' },
  ],
}

// ---------- Visual ----------
const L = 1080, A = 1350
const fundoMapa = () => {
  // rede de rotas fixa (sempre igual, pra série ter cara de série)
  const nos = [[90, 210], [300, 120], [520, 260], [760, 150], [980, 300], [180, 560], [420, 640], [700, 520], [930, 700], [120, 980], [380, 1120], [650, 980], [900, 1180], [560, 1290]]
  const lig = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [2, 6], [5, 9], [9, 10], [10, 11], [11, 12], [7, 11], [10, 13], [8, 12]]
  return `<svg class="mapa" viewBox="0 0 ${L} ${A}">${lig.map(([a, b]) => `<line x1="${nos[a][0]}" y1="${nos[a][1]}" x2="${nos[b][0]}" y2="${nos[b][1]}"/>`).join('')}${nos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</svg>`
}
const celular = (nome, classe = '') => `<div class="celular ${classe}"><img src="${tela(nome)}"></div>`

function conteudo(s, i, total) {
  const olho = s.olho ? `<span class="olho">${esc(s.olho)}</span>` : ''
  const sub = s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ''
  // com celular, o @ ficaria atrás do aparelho: só o número da página
  const comCelular = s.tipo === 'tela' || s.tipo === 'duas' || s.tipo === 'versus'
  const rodape = `${comCelular ? '' : '<span class="arroba">@norti.app</span>'}<span class="conta">${i}/${total}</span>`
  if (s.tipo === 'capa') return `
    <div class="capa">${olho}<h1${s.titulo.length < 30 ? ' class="curto"' : ''}>${rico(s.titulo)}</h1>${sub}</div>
    <img class="norti n-capa" src="${norti(s.pose)}">${rodape}`
  if (s.tipo === 'lista') return `
    <div class="topo">${olho}<h2>${rico(s.titulo)}</h2></div>
    <ul class="lista">${s.itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <img class="norti n-lista" src="${norti(s.pose)}">${rodape}`
  if (s.tipo === 'tela') return `
    <div class="topo estreito">${olho}<h2>${rico(s.titulo)}</h2>${sub}</div>
    ${celular(s.telas[0], 'um')}
    <img class="norti n-tela" src="${norti(s.pose)}">${rodape}`
  if (s.tipo === 'duas') return `
    <div class="topo">${olho}<h2>${rico(s.titulo)}</h2>${sub}</div>
    ${celular(s.telas[0], 'esq')}${celular(s.telas[1], 'dir')}
    <img class="norti n-duas" src="${norti(s.pose)}">${rodape}`
  if (s.tipo === 'bolhas') return `
    <div class="topo">${olho}<h2>${rico(s.titulo)}</h2></div>
    <div class="bolhas">${s.bolhas.map((b, k) => { const [quem, ...resto] = b.split(': '); return `<div class="bolha ${k % 2 ? 'dir' : ''}"><b>${esc(quem)}</b>${esc(resto.join(': '))}</div>` }).join('')}</div>
    <img class="norti n-bolhas" src="${norti(s.pose)}">${rodape}`
  if (s.tipo === 'versus') return `
    <div class="topo">${olho}<h2>${rico(s.titulo)}</h2></div>
    <div class="lado zap"><span class="rotulo">no grupo do zap</span>
      ${s.zap.map((b) => `<div class="bolha">${esc(b)}</div>`).join('')}
      <span class="nota">✕ ${esc(s.legenda)}</span></div>
    <div class="lado app"><span class="rotulo ouro">na Norti</span>${celular(s.telas[0], 'vs')}<span class="nota ok">✓ ${esc(s.norti)}</span></div>
    ${rodape}`
  // fim
  return `
    <div class="fim">
      <img class="norti n-fim" src="${norti(s.pose)}">
      <h1>${esc(s.titulo)}</h1><p>${esc(s.sub)}</p>
      <span class="pilula">em breve · lista de espera no perfil</span>
    </div><span class="arroba">@norti.app</span>`
}

function pagina(s, i, total) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face { font-family: Fraunces; font-weight: 600; src: url(${url('fontes', 'Fraunces_600SemiBold.ttf')}); }
@font-face { font-family: Fraunces; font-weight: 700; src: url(${url('fontes', 'Fraunces_700Bold.ttf')}); }
@font-face { font-family: Jakarta; font-weight: 500; src: url(${url('fontes', 'PlusJakartaSans_500Medium.ttf')}); }
@font-face { font-family: Jakarta; font-weight: 700; src: url(${url('fontes', 'PlusJakartaSans_700Bold.ttf')}); }
:root { --creme: #F5E9D6; --dourado: #E3A04A; --ouro: #C9A066; --couro: #7B542F; --escuro: #1A1009; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${L}px; height: ${A}px; overflow: hidden; }
body { font-family: Jakarta, sans-serif; color: var(--creme);
  background: radial-gradient(120% 90% at 20% 0%, #4A2E17 0%, #2A190D 45%, var(--escuro) 100%); position: relative; }
body.claro { background: radial-gradient(110% 90% at 50% 10%, #FFF8EC 0%, #F3E3C8 100%); color: #3B2715; }
body::after { content: ""; position: absolute; inset: 0; opacity: .07; pointer-events: none;
  background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 5px 5px; }
.mapa { position: absolute; inset: 0; width: 100%; height: 100%; }
.mapa line { stroke: rgba(227,160,74,.14); stroke-width: 2; stroke-dasharray: 6 9; }
.mapa circle { fill: rgba(227,160,74,.35); }
.claro .mapa line { stroke: rgba(123,84,47,.16); } .claro .mapa circle { fill: rgba(123,84,47,.3); }
.olho { display: inline-flex; align-items: center; gap: 14px; font-weight: 700; font-size: 26px; letter-spacing: .16em; text-transform: uppercase; color: var(--ouro); }
.olho::before { content: ""; width: 44px; height: 3px; background: var(--ouro); border-radius: 2px; }
h1, h2 { font-family: Fraunces; font-weight: 700; letter-spacing: -0.02em; line-height: 1.04; }
em { font-style: normal; color: var(--dourado); }
.sub { font-size: 32px; line-height: 1.3; color: #D9C3A2; margin-top: 22px; }
.arroba { position: absolute; left: 80px; bottom: 54px; font-weight: 700; font-size: 24px; color: rgba(245,233,214,.55); z-index: 5; }
.conta { position: absolute; right: 80px; bottom: 54px; font-weight: 700; font-size: 24px; color: rgba(245,233,214,.55); z-index: 5; }
.claro .arroba { color: rgba(59,39,21,.5); }
.norti { position: absolute; z-index: 4; filter: drop-shadow(0 18px 24px rgba(0,0,0,.35)); }

/* capa */
.capa { position: absolute; left: 80px; right: 80px; top: 170px; display: flex; flex-direction: column; gap: 34px; z-index: 3; }
.capa h1 { font-size: 104px; }
.capa h1.curto { font-size: 150px; }
.n-capa { width: 380px; right: 60px; bottom: 90px; transform: rotate(6deg); }

/* topo dos slides com tela */
.topo { position: absolute; left: 80px; right: 80px; top: 92px; display: flex; flex-direction: column; gap: 22px; z-index: 3; }
.topo.estreito { right: 80px; }
.topo h2 { font-size: 72px; }

/* lista */
.lista { position: absolute; left: 80px; right: 360px; top: 300px; list-style: none; display: flex; flex-direction: column; gap: 26px; z-index: 3; }
.lista li { font-family: Fraunces; font-weight: 600; font-size: 76px; line-height: 1.05; display: flex; gap: 26px; align-items: baseline; }
.lista li::before { content: ""; flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--dourado); transform: translateY(-8px); box-shadow: 0 0 22px rgba(227,160,74,.6); }
.n-lista { width: 340px; right: 50px; bottom: 120px; transform: rotate(-4deg); }

/* celular */
.celular { position: absolute; z-index: 2; padding: 16px; border-radius: 74px; background: linear-gradient(145deg, #2b211a, #0b0705); box-shadow: 0 50px 90px rgba(0,0,0,.55), inset 0 0 0 2px rgba(255,255,255,.07); }
.celular img { display: block; width: 100%; border-radius: 58px; }
.celular.um { width: 470px; left: 330px; top: 470px; transform: rotate(-3deg); }
.celular.esq { width: 400px; left: 110px; top: 470px; transform: rotate(-5deg); }
.celular.dir { width: 400px; left: 560px; top: 520px; transform: rotate(4deg); }
.n-tela { width: 250px; left: 70px; bottom: 120px; transform: rotate(-6deg); }
.n-duas { width: 200px; right: 40px; top: 400px; transform: rotate(8deg); }


/* balões do grupo (genéricos, sem marca de app de mensagem) */
.bolhas { position: absolute; left: 80px; right: 80px; top: 330px; display: flex; flex-direction: column; gap: 22px; z-index: 3; }
.bolha { align-self: flex-start; max-width: 78%; background: #3A2A1E; border: 2px solid rgba(255,255,255,.06); color: #F1E4CF; border-radius: 10px 36px 36px 36px; padding: 20px 30px 24px; font-size: 40px; line-height: 1.2; box-shadow: 0 10px 24px rgba(0,0,0,.3); }
.bolha b { display: block; font-size: 24px; letter-spacing: .04em; color: var(--ouro); margin-bottom: 4px; }
.bolha.dir { align-self: flex-end; border-radius: 36px 10px 36px 36px; background: #2E2218; }
.n-bolhas { width: 220px; right: 60px; bottom: 80px; transform: rotate(8deg); }

/* versus */
.lado { position: absolute; top: 380px; bottom: 120px; display: flex; flex-direction: column; gap: 18px; z-index: 3; }
.lado.zap { left: 70px; width: 440px; padding: 30px 28px; border-radius: 40px; background: rgba(0,0,0,.28); border: 2px dashed rgba(245,233,214,.18); }
.lado.app { left: 560px; width: 450px; align-items: center; }
.lado .bolha { font-size: 32px; max-width: 100%; padding: 16px 24px 18px; }
.lado .bolha:nth-of-type(2) { align-self: flex-end; transform: rotate(2deg); }
.lado .bolha:nth-of-type(3) { transform: rotate(-2deg); opacity: .8; }
.rotulo { font-weight: 700; font-size: 26px; letter-spacing: .14em; text-transform: uppercase; color: rgba(245,233,214,.6); }
.rotulo.ouro { color: var(--dourado); }
.nota { margin-top: auto; font-weight: 700; font-size: 30px; line-height: 1.25; color: #E9A58C; }
.nota.ok { margin-top: 0; color: #CFE0A0; text-align: center; }
.celular.vs { position: relative; width: 330px; left: auto; top: auto; transform: rotate(2deg); padding: 12px; border-radius: 56px; }
.celular.vs img { border-radius: 44px; height: 620px; object-fit: cover; object-position: top; }

/* fim */
.fim { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 22px; z-index: 3; }
.fim h1 { font-size: 150px; color: #3B2715; }
.fim p { font-size: 40px; color: #7A5F45; }
.n-fim { position: static; width: 360px; }
.pilula { margin-top: 18px; background: var(--couro); color: var(--creme); font-weight: 700; font-size: 32px; padding: 22px 40px; border-radius: 999px; }
</style></head><body class="${s.tipo === 'fim' ? 'claro' : ''}">${fundoMapa()}${conteudo(s, i, total)}</body></html>`
}

// ---------- Fotografar ----------
const pedidos = process.argv[2] ? [process.argv[2]] : Object.keys(POSTS)
const opcoes = existsSync('/usr/bin/google-chrome') ? { executablePath: '/usr/bin/google-chrome' } : {}
const navegador = await chromium.launch(opcoes)
const page = await navegador.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 })
for (const nome of pedidos) {
  const slides = POSTS[nome]
  const saida = join(pasta, 'saida', nome)
  mkdirSync(join(saida, 'html'), { recursive: true })
  for (const [k, s] of slides.entries()) {
    const html = join(saida, 'html', `instagram-${k + 1}.html`)
    writeFileSync(html, pagina(s, k + 1, slides.length))
    await page.goto(pathToFileURL(html).href)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(saida, `instagram-${k + 1}.png`) })
  }
  console.log('ok', nome, slides.length, 'slides')
}
await navegador.close()
