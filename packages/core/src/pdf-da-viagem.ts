// PDF da viagem no app (specs 088 e 106 no mobile): monta o HTML que o celular transforma em PDF.
// Puro (só texto), pra dar pra testar. Quem chama já entrega datas e horas formatadas.
// No site, as mesmas páginas são telas com "Imprimir → Salvar como PDF".

import { fonteDoNomeNoCarimbo } from './carimbos.ts'

// Escapa o texto pra não quebrar o HTML (nome com "<" ou "&", por exemplo)
export function escaparHtml(texto: string | null | undefined): string {
  return (texto ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const ESTILO = `
  @page { margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #2B1B0E; font-size: 12pt; line-height: 1.45; margin: 0; }
  .marca { font: 700 10pt -apple-system, Roboto, Arial, sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #B97A22; }
  h1 { font-size: 26pt; margin: 6px 0 4px; color: #4A2E14; }
  h2 { font-size: 15pt; color: #4A2E14; border-bottom: 1px solid #E3D2B8; padding-bottom: 4px; margin: 22px 0 8px; }
  h3 { font-size: 12.5pt; margin: 14px 0 4px; }
  small, .suave { color: #8A7560; }
  .sub { color: #6B5540; margin: 2px 0; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 3px 0; }
  .hora { display: inline-block; min-width: 48px; font: 600 10.5pt -apple-system, Roboto, Arial, sans-serif; color: #B97A22; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
  th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #EFE3D0; vertical-align: top; }
  th { font: 600 9.5pt -apple-system, Roboto, Arial, sans-serif; color: #8A7560; text-transform: uppercase; }
  .casa { page-break-inside: avoid; margin-bottom: 10px; }
  .casa p { margin: 2px 0; }
  .dia { page-break-inside: avoid; }
  .capa { text-align: center; padding: 30vh 0 0; page-break-after: always; }
  .capa h1 { font-size: 34pt; }
  .pagina { page-break-before: always; }
  blockquote { margin: 10px 0; padding: 8px 12px; border-left: 3px solid #B97A22; background: #FBF5EC; font-style: italic; }
  blockquote cite { display: block; margin-top: 4px; font-style: normal; font-size: 10pt; color: #8A7560; }
  .fotos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .fotos figure { margin: 0; width: calc(50% - 4px); page-break-inside: avoid; }
  .fotos img { width: 100%; height: 190px; object-fit: cover; border-radius: 6px; }
  .fotos figcaption { font-size: 9.5pt; color: #6B5540; margin-top: 2px; }
  .vazio { color: #8A7560; font-style: italic; }
  .carimbos { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin: 28px auto 0; max-width: 520px; }
  .carimbo { width: 104px; height: 104px; border: 3px double #B97A22; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; text-align: center; color: #7B542F; }
  .carimbo:nth-child(odd) { transform: rotate(-6deg); }
  .carimbo:nth-child(even) { transform: rotate(5deg); }
  .carimbo.memoria { border-style: dashed; }
  .carimbo strong { font-family: -apple-system, Roboto, Arial, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; line-height: 1.15; }
  .carimbo span { font: 600 8pt -apple-system, Roboto, Arial, sans-serif; color: #B97A22; margin-top: 3px; text-transform: uppercase; }
  .rodape { margin-top: 26px; font-size: 9pt; color: #8A7560; text-align: center; }
`

const pagina = (titulo: string, corpo: string) =>
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escaparHtml(titulo)}</title><style>${ESTILO}</style></head><body>${corpo}</body></html>`

// ---------- Resumo pra imprimir (spec 088) ----------

export type ResumoParaPdf = {
  nome: string
  periodo: string // "1–8 jun 2027"
  rota: string // "Paris → Nice → Roma"
  dias: { titulo: string; onde: string | null; itens: { hora: string; titulo: string; detalhe: string }[] }[]
  trajetos: { trecho: string; meio: string; partida: string; chegada: string; obs: string }[]
  hospedagens: { destino: string; nome: string; horarios: string; endereco: string | null; comoChegar: string | null; wifi: string | null; codigoPorta: string | null }[]
  comboio: { nome: string; telefone: string; emergencia: string }[]
  geradoEm: string // "31/10/2026"
}

export function htmlDoResumo(r: ResumoParaPdf): string {
  const e = escaparHtml
  const dias = r.dias.length
    ? r.dias
        .map(
          (d) => `<div class="dia"><h3>${e(d.titulo)}${d.onde ? ` <small>· ${e(d.onde)}</small>` : ''}</h3><ul>${d.itens
            .map((i) => `<li><span class="hora">${e(i.hora || '—')}</span>${e(i.titulo)}${i.detalhe ? ` <small>· ${e(i.detalhe)}</small>` : ''}</li>`)
            .join('')}</ul></div>`,
        )
        .join('')
    : '<p class="vazio">Ainda sem datas ou sem nada na agenda.</p>'
  const trajetos = r.trajetos.length
    ? `<h2>Transportes</h2><table><thead><tr><th>Trecho</th><th>Meio</th><th>Partida</th><th>Chegada</th><th>Obs.</th></tr></thead><tbody>${r.trajetos
        .map((t) => `<tr><td>${e(t.trecho)}</td><td>${e(t.meio)}</td><td>${e(t.partida)}</td><td>${e(t.chegada)}</td><td>${e(t.obs)}</td></tr>`)
        .join('')}</tbody></table>`
    : ''
  const casas = r.hospedagens.length
    ? `<h2>Hospedagens</h2>${r.hospedagens
        .map(
          (h) =>
            `<div class="casa"><h3>${e(h.destino)}: ${e(h.nome)}</h3>${h.horarios ? `<p>${e(h.horarios)}</p>` : ''}${h.endereco ? `<p>Endereço: ${e(h.endereco)}</p>` : ''}${
              h.comoChegar ? `<p>Como chegar: ${e(h.comoChegar)}</p>` : ''
            }${h.wifi ? `<p>Wi-Fi: ${e(h.wifi)}</p>` : ''}${h.codigoPorta ? `<p>Código da porta: ${e(h.codigoPorta)}</p>` : ''}</div>`,
        )
        .join('')}`
    : ''
  const comboio = `<h2>Comboio</h2><table><thead><tr><th>Pessoa</th><th>Telefone</th><th>Emergência</th></tr></thead><tbody>${r.comboio
    .map((c) => `<tr><td>${e(c.nome)}</td><td>${e(c.telefone)}</td><td>${e(c.emergencia)}</td></tr>`)
    .join('')}</tbody></table>`
  return pagina(
    r.nome,
    `<div class="marca">Norti</div><h1>${e(r.nome)}</h1><p class="sub">${e([r.periodo, r.rota].filter(Boolean).join(' · '))}</p>` +
      `<h2>Roteiro dia a dia</h2>${dias}${trajetos}${casas}${comboio}<p class="rodape">Gerado pela Norti em ${e(r.geradoEm)}.</p>`,
  )
}

// ---------- Livro da viagem (spec 106) ----------

export type LivroParaPdf = {
  nome: string
  periodo: string
  rota: string
  comboio: string // "Ana · Bia · Caio"
  // Spec 118c: os carimbos da viagem na capa ("dez 2026"; de memória tem o traço tracejado)
  carimbos?: { nome: string; data: string; memoria?: boolean }[]
  paginas: {
    titulo: string // "Sábado, 5 de junho · Nice"
    agenda: { hora: string; titulo: string }[]
    diario: { texto: string; autor: string }[]
    fotos: { url: string; legenda: string | null }[]
  }[]
  geradoEm: string
}

function capaDosCarimbos(carimbos: NonNullable<LivroParaPdf['carimbos']>): string {
  if (carimbos.length === 0) return ''
  const e = escaparHtml
  return `<div class="carimbos">${carimbos
    .slice(0, 12)
    .map((c) => `<div class="carimbo${c.memoria ? ' memoria' : ''}"><strong style="font-size:${fonteDoNomeNoCarimbo(c.nome, 84, 13)}px">${e(c.nome)}</strong><span>${e(c.data)}</span></div>`)
    .join('')}</div>`
}

export function htmlDoLivro(l: LivroParaPdf): string {
  const e = escaparHtml
  const capa = `<section class="capa"><div class="marca">Norti</div><h1>${e(l.nome)}</h1><p class="sub">${e(l.periodo)}</p><p class="sub">${e(l.rota)}</p><p class="suave">${e(l.comboio)}</p>${capaDosCarimbos(l.carimbos ?? [])}</section>`
  const paginas = l.paginas.length
    ? l.paginas
        .map(
          (p, i) =>
            `<section class="${i > 0 ? 'pagina' : ''}"><h2>${e(p.titulo)}</h2>` +
            (p.agenda.length ? `<ul>${p.agenda.map((a) => `<li><span class="hora">${e(a.hora || '—')}</span>${e(a.titulo)}</li>`).join('')}</ul>` : '') +
            p.diario.map((d) => `<blockquote>${e(d.texto)}<cite>${e(d.autor)}</cite></blockquote>`).join('') +
            (p.fotos.length
              ? `<div class="fotos">${p.fotos
                  .map((f) => `<figure><img src="${e(f.url)}" alt="">${f.legenda ? `<figcaption>${e(f.legenda)}</figcaption>` : ''}</figure>`)
                  .join('')}</div>`
              : '') +
            '</section>',
        )
        .join('')
    : '<p class="vazio">Ainda não tem agenda, diário nem fotos pra montar o livro.</p>'
  return pagina(l.nome, `${capa}${paginas}<p class="rodape">Feito na Norti em ${e(l.geradoEm)}.</p>`)
}
