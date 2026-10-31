// Função "atualizar-exigencias" (spec 111): lê as duas fontes de exigências de entrada e troca os dados.
// Chamada toda segunda 6h UTC pelo agendamento (pg_cron), sem corpo. Também dá pra chamar na mão.
//  1. Wikipédia "Visa requirements for Brazilian citizens" → passaporte brasileiro (fonte 'wikipedia')
//  2. Passport Index Data (GitHub, MIT) → todos os passaportes (fonte 'passport-index')
// Cada fonte só troca os dados se vier inteira; se quebrar, os dados antigos ficam e o erro vai pra
// `fontes_de_exigencias`. Depois compara as fontes e a tabela à mão do app e grava alertas.
// Sem segredos próprios: usa a chave de servidor que o Supabase já põe na função.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const WIKIPEDIA =
  'https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=timestamp|content&rvslots=main&format=json&formatversion=2&titles=Visa_requirements_for_Brazilian_citizens'
const DATASET = 'https://raw.githubusercontent.com/imorte/passport-index-data/main/passport-index.json'
const LEIAME_DO_DATASET = 'https://raw.githubusercontent.com/imorte/passport-index-data/main/README.md'
// A API da Wikipédia pede um User-Agent que identifique quem chama
const CABECALHOS = { 'User-Agent': 'Together/1.0 (https://github.com/ingrydguimaraes2026-cpu/Triply)' }
const MINIMO_WIKIPEDIA = 150 // países; menos que isso = a página mudou de formato
const MINIMO_DATASET = 30000 // combinações passaporte × destino

const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } })

// "South Korea" → "KR" (só pras linhas da Wikipédia sem o código do país)
let mapaDeNomes: Map<string, string> | null = null
function codigoDoPais(nome: string): string | null {
  if (!mapaDeNomes) {
    mapaDeNomes = new Map()
    const nomes = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (const a of letras)
      for (const b of letras) {
        let n: string | undefined
        try {
          n = nomes.of(a + b)
        } catch {
          n = undefined
        }
        if (n) mapaDeNomes.set(n.toLowerCase(), a + b)
      }
  }
  return mapaDeNomes.get(nome.trim().toLowerCase()) ?? null
}

// ---- Cópia de packages/core/src/exigencias.ts (o Deno não importa do pacote). Mudou lá, muda aqui. ----
type TipoDeExigencia = 'livre' | 'isento' | 'na_chegada' | 'eta' | 'evisa' | 'visto' | 'proibido'
type FonteDeExigencia = 'wikipedia' | 'passport-index'
type Exigencia = { passaporte: string; destino: string; tipo: TipoDeExigencia; dias: number | null }

// Do mais fácil pro mais difícil (usado pra escolher o melhor passaporte da pessoa)
const ORDEM_DOS_TIPOS: TipoDeExigencia[] = ['livre', 'isento', 'na_chegada', 'eta', 'evisa', 'visto', 'proibido']

// "90 days" → 90, "3 months" → 90, "1 month" → 30, "up to 90 days" → 90. Sem número → null.
function lerDias(texto: string): number | null {
  const m = texto.match(/(\d+)\s*(day|month|week|year)/i)
  if (!m) return null
  const n = Number(m[1])
  const unidade = m[2].toLowerCase()
  const dias = unidade === 'month' ? n * 30 : unidade === 'week' ? n * 7 : unidade === 'year' ? n * 365 : n
  return dias > 0 && dias < 32000 ? dias : null
}

// Texto da Wikipédia ("Visa not required", "eVisa / Visa on arrival") → tipo. Com duas opções, vale a mais fácil.
function tipoDoTexto(texto: string): TipoDeExigencia | null {
  const t = texto.toLowerCase()
  const achados: TipoDeExigencia[] = []
  if (t.includes('freedom of movement')) achados.push('livre')
  if (/not required|visa[- ]free/.test(t)) achados.push('isento')
  if (/on arrival/.test(t) && !/e-?voa/.test(t)) achados.push('na_chegada')
  if (/electronic travel author|\beta\b/.test(t)) achados.push('eta')
  if (/e-?visa|online visa|e-?voa/.test(t)) achados.push('evisa')
  if (/visa required|entry permit required/.test(t)) achados.push('visto')
  if (/admission refused|not allowed|entry banned|travel ban/.test(t)) achados.push('proibido')
  if (achados.length === 0) return null
  return achados.sort((a, b) => ORDEM_DOS_TIPOS.indexOf(a) - ORDEM_DOS_TIPOS.indexOf(b))[0]
}

// Tira refs, comentários e links da célula: "{{yes|Visa not required}}<ref>..</ref>" → "Visa not required"
function limparCelula(celula: string): string {
  // Tudo depois do 1º <ref> é nota de rodapé (e pode ter link com "evisa" no endereço)
  return celula
    .split('<ref')[0]
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1') // [[link|texto]] → texto
    .replace(/\{\{\s*sort\s*\|[^|}]*\|/gi, '{{x|') // {{sort|chave|texto}} → texto
    .replace(/\{\{[^|{}]*\|([^{}]*)\}\}/g, '$1') // {{yes|texto}} → texto
    .trim()
}

// Lê a tabela da página "Visa requirements for Brazilian citizens" (wikitext).
// Cada linha tem {{Timatic|nationality=BR|destination=XX}}, que já dá o código do país.
function lerWikipedia(wikitext: string, passaporte = 'BR'): Exigencia[] {
  const lista: Exigencia[] = []
  const vistos = new Set<string>()
  for (const linha of wikitext.split(/\n\|-/)) {
    // Sem o Timatic na linha, o nome da bandeira serve ({{flag|South Korea}} → KR)
    const bandeira = linha.match(/\{\{flag\|([^}|]+)/)?.[1]
    const codigo = linha.match(/destination=([A-Z]{2})/)?.[1] ?? (bandeira ? codigoDoPais(bandeira) : null)
    if (!codigo || vistos.has(codigo) || codigo === passaporte) continue
    // Células: linhas que começam com "|" (a 1ª é o país, a 2ª o tipo, a 3ª os dias)
    const celulas = linha
      .split('\n')
      .filter((l) => l.startsWith('|') && !l.startsWith('|}') && !l.startsWith('|+'))
      .map((l) => l.slice(1))
    if (celulas.length < 2) continue
    const tipo = tipoDoTexto(limparCelula(celulas[1]))
    if (!tipo) continue
    vistos.add(codigo)
    lista.push({ passaporte, destino: codigo, tipo, dias: celulas[2] ? lerDias(limparCelula(celulas[2])) : null })
  }
  return lista
}

// Passport Index Data (passport-index.json): { "br": { "th": { "status": "visa free", "days": 90 } } }
type LinhaDoDataset = { status?: string; days?: number | null }
function deDataset(dados: Record<string, Record<string, LinhaDoDataset>>): Exigencia[] {
  const lista: Exigencia[] = []
  const TIPOS: Record<string, TipoDeExigencia> = {
    'visa free': 'isento',
    'visa on arrival': 'na_chegada',
    eta: 'eta',
    'e-visa': 'evisa',
    'visa required': 'visto',
    'no admission': 'proibido',
  }
  for (const [passaporte, destinos] of Object.entries(dados)) {
    for (const [destino, linha] of Object.entries(destinos ?? {})) {
      if (passaporte === destino || !linha?.status) continue
      const status = String(linha.status).toLowerCase()
      // Número no status = isento por X dias (formato do CSV, por garantia)
      const tipo = /^\d+$/.test(status) ? 'isento' : TIPOS[status]
      if (!tipo || passaporte.length !== 2 || destino.length !== 2) continue
      const dias = typeof linha.days === 'number' && linha.days > 0 ? linha.days : /^\d+$/.test(status) ? Number(status) : null
      lista.push({ passaporte: passaporte.toUpperCase(), destino: destino.toUpperCase(), tipo, dias })
    }
  }
  return lista
}

// O que a tabela escrita à mão (spec 010) diz pro passaporte brasileiro. Serve pro alarme:
// se a Wikipédia disser outra coisa, alguém precisa revisar a tabela do app.
const TIPO_DA_TABELA_DO_APP: Record<string, TipoDeExigencia> = {
  ...Object.fromEntries(
    ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'MC', 'SM', 'VA', 'AD'].map((p) => [p, 'isento']),
  ),
  ...Object.fromEntries(['AR', 'UY', 'PY', 'CL', 'BO', 'PE', 'EC', 'CO'].map((p) => [p, 'livre'])),
  GB: 'eta',
  US: 'visto',
  CA: 'visto',
  MX: 'visto',
  JP: 'isento',
  AU: 'evisa',
}

// "livre" e "isento" dão no mesmo pra quem viaja a turismo (não vira alarme)
function mesmoTipo(a: TipoDeExigencia, b: TipoDeExigencia) {
  const grupo = (t: TipoDeExigencia) => (t === 'livre' ? 'isento' : t)
  return grupo(a) === grupo(b)
}

// ---- fim da cópia ----

const MESES: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
}

// "Last updated: **17 February 2026**" → "2026-02-17"
function dataDoLeiame(texto: string): string | null {
  const m = texto.match(/Last updated:\s*\**\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (!m || !MESES[m[2].toLowerCase()]) return null
  return `${m[3]}-${MESES[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = ReturnType<typeof createClient<any>>

async function registrarErro(admin: Admin, fonte: string, erro: unknown) {
  const texto = erro instanceof Error ? erro.message : String(erro)
  await admin.from('fontes_de_exigencias').upsert({ fonte, erro: texto.slice(0, 500), tentado_em: new Date().toISOString() }, { onConflict: 'fonte' })
  return texto
}

async function lerWikipediaAgora(): Promise<{ lista: Exigencia[]; dadosDe: string }> {
  const r = await fetch(WIKIPEDIA, { headers: CABECALHOS })
  if (!r.ok) throw new Error(`Wikipédia respondeu ${r.status}`)
  const corpo = await r.json()
  const revisao = corpo?.query?.pages?.[0]?.revisions?.[0]
  const texto: string | undefined = revisao?.slots?.main?.content
  if (!texto) throw new Error('Wikipédia veio sem o texto da página')
  const lista = lerWikipedia(texto, 'BR')
  if (lista.length < MINIMO_WIKIPEDIA) throw new Error(`Wikipédia: só ${lista.length} países lidos (a página mudou de formato?)`)
  return { lista, dadosDe: String(revisao.timestamp).slice(0, 10) }
}

async function lerDatasetAgora(): Promise<{ lista: Exigencia[]; dadosDe: string | null }> {
  const [r, leiame] = await Promise.all([fetch(DATASET, { headers: CABECALHOS }), fetch(LEIAME_DO_DATASET, { headers: CABECALHOS })])
  if (!r.ok) throw new Error(`Dataset respondeu ${r.status}`)
  const lista = deDataset(await r.json())
  if (lista.length < MINIMO_DATASET) throw new Error(`Dataset: só ${lista.length} linhas (mudou de formato?)`)
  return { lista, dadosDe: leiame.ok ? dataDoLeiame(await leiame.text()) : null }
}

Deno.serve(async () => {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // A função é aberta (o agendamento chama sem login): no máximo uma leitura por hora,
  // pra ninguém usar ela pra martelar a Wikipédia e o GitHub
  const { data: ultimas } = await admin.from('fontes_de_exigencias').select('tentado_em').order('tentado_em', { ascending: false }).limit(1)
  const ultima = ultimas?.[0]?.tentado_em ? new Date(ultimas[0].tentado_em).getTime() : 0
  if (Date.now() - ultima < 60 * 60 * 1000) return json({ pulou: 'Já rodou na última hora.' })

  const resultado: Record<string, unknown> = {}
  let wikipedia: Exigencia[] | null = null
  let dataset: Exigencia[] | null = null

  try {
    const { lista, dadosDe } = await lerWikipediaAgora()
    const { error } = await admin.rpc('trocar_exigencias', { p_fonte: 'wikipedia', p_dados: lista, p_dados_de: dadosDe })
    if (error) throw new Error(error.message)
    wikipedia = lista
    resultado.wikipedia = { paises: lista.length, dadosDe }
  } catch (e) {
    resultado.wikipedia = { erro: await registrarErro(admin, 'wikipedia', e) }
  }

  try {
    const { lista, dadosDe } = await lerDatasetAgora()
    const { error } = await admin.rpc('trocar_exigencias', { p_fonte: 'passport-index', p_dados: lista, p_dados_de: dadosDe })
    if (error) throw new Error(error.message)
    dataset = lista
    resultado.dataset = { linhas: lista.length, dadosDe }
  } catch (e) {
    resultado.dataset = { erro: await registrarErro(admin, 'passport-index', e) }
  }

  // Alarme: as fontes discordam entre si, ou da tabela escrita à mão (spec 010)
  const alertas: { passaporte: string; destino: string; motivo: string; esperado: string; encontrado: string }[] = []
  if (wikipedia) {
    const doDataset = new Map((dataset ?? []).filter((e) => e.passaporte === 'BR').map((e) => [e.destino, e]))
    for (const w of wikipedia) {
      const daTabela = TIPO_DA_TABELA_DO_APP[w.destino]
      if (daTabela && !mesmoTipo(daTabela, w.tipo)) {
        alertas.push({ passaporte: 'BR', destino: w.destino, motivo: 'wikipedia x tabela do app', esperado: daTabela, encontrado: w.tipo })
      }
      const d = doDataset.get(w.destino)
      if (d && !mesmoTipo(d.tipo, w.tipo)) {
        alertas.push({ passaporte: 'BR', destino: w.destino, motivo: 'wikipedia x passport-index', esperado: d.tipo, encontrado: w.tipo })
      }
    }
  }
  // Grava um por um: o índice único recusa os que já estão abertos (não repete toda semana)
  let novos = 0
  for (const a of alertas) {
    const { error } = await admin.from('alertas_de_exigencias').insert(a)
    if (!error) novos++
  }
  resultado.alertas = { encontrados: alertas.length, novos }
  return json(resultado)
})
