// Exigências de entrada automáticas (spec 111): o que o passaporte X precisa pra entrar no país Y.
// Duas fontes: Wikipédia (passaporte brasileiro, mais fresca) e Passport Index Data (todos os passaportes).
// Funções puras: a função do servidor "atualizar-exigencias" tem uma CÓPIA de lerWikipedia,
// deDataset e TIPO_DA_TABELA_DO_APP (o Deno não importa do pacote). Mudou aqui, muda lá.
import type { ClienteTogether } from './supabase'
import { codigoDoPais } from './paises.ts'

export type TipoDeExigencia = 'livre' | 'isento' | 'na_chegada' | 'eta' | 'evisa' | 'visto' | 'proibido'
export type FonteDeExigencia = 'wikipedia' | 'passport-index'
export type Exigencia = { passaporte: string; destino: string; tipo: TipoDeExigencia; dias: number | null }

// Do mais fácil pro mais difícil (usado pra escolher o melhor passaporte da pessoa)
export const ORDEM_DOS_TIPOS: TipoDeExigencia[] = ['livre', 'isento', 'na_chegada', 'eta', 'evisa', 'visto', 'proibido']

// "90 days" → 90, "3 months" → 90, "1 month" → 30, "up to 90 days" → 90. Sem número → null.
export function lerDias(texto: string): number | null {
  const m = texto.match(/(\d+)\s*(day|month|week|year)/i)
  if (!m) return null
  const n = Number(m[1])
  const unidade = m[2].toLowerCase()
  const dias = unidade === 'month' ? n * 30 : unidade === 'week' ? n * 7 : unidade === 'year' ? n * 365 : n
  return dias > 0 && dias < 32000 ? dias : null
}

// Texto da Wikipédia ("Visa not required", "eVisa / Visa on arrival") → tipo. Com duas opções, vale a mais fácil.
export function tipoDoTexto(texto: string): TipoDeExigencia | null {
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
export function lerWikipedia(wikitext: string, passaporte = 'BR'): Exigencia[] {
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
export function deDataset(dados: Record<string, Record<string, LinhaDoDataset>>): Exigencia[] {
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
export const TIPO_DA_TABELA_DO_APP: Record<string, TipoDeExigencia> = {
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
export function mesmoTipo(a: TipoDeExigencia, b: TipoDeExigencia) {
  const grupo = (t: TipoDeExigencia) => (t === 'livre' ? 'isento' : t)
  return grupo(a) === grupo(b)
}

// Pra cada destino, a exigência do passaporte mais fácil da pessoa.
// Por passaporte, a Wikipédia vence o dataset (é mais fresca).
export function melhorExigencia(
  linhas: (Exigencia & { fonte: FonteDeExigencia })[],
  passaportes: string[],
): Map<string, Exigencia & { fonte: FonteDeExigencia }> {
  const porPassaporteEDestino = new Map<string, Exigencia & { fonte: FonteDeExigencia }>()
  for (const l of linhas) {
    if (!passaportes.includes(l.passaporte)) continue
    const chave = `${l.passaporte}-${l.destino}`
    const atual = porPassaporteEDestino.get(chave)
    if (!atual || (atual.fonte !== 'wikipedia' && l.fonte === 'wikipedia')) porPassaporteEDestino.set(chave, l)
  }
  const melhor = new Map<string, Exigencia & { fonte: FonteDeExigencia }>()
  for (const l of porPassaporteEDestino.values()) {
    const atual = melhor.get(l.destino)
    const maisFacil = !atual || ORDEM_DOS_TIPOS.indexOf(l.tipo) < ORDEM_DOS_TIPOS.indexOf(atual.tipo)
    const empataComMaisDias = atual && l.tipo === atual.tipo && (l.dias ?? 0) > (atual.dias ?? 0)
    if (maisFacil || empataComMaisDias) melhor.set(l.destino, l)
  }
  return melhor
}

// ---------- Banco ----------

export type ExigenciasDaViagem = {
  porDestino: Map<string, Exigencia & { fonte: FonteDeExigencia }>
  fontes: { fonte: FonteDeExigencia; dadosDe: string | null; lidoEm: string | null }[]
}

// Exigências dos meus passaportes nos países da viagem + de quando são os dados.
// Sem passaporte informado, vale o brasileiro.
export async function buscarExigencias(cli: ClienteTogether, destinos: string[], passaportes: string[]): Promise<ExigenciasDaViagem> {
  const meus = passaportes.length ? [...new Set(passaportes.map((p) => p.toUpperCase()))] : ['BR']
  if (destinos.length === 0) return { porDestino: new Map(), fontes: [] }
  const [linhas, fontes] = await Promise.all([
    cli.from('exigencias_de_entrada').select('passaporte, destino, fonte, tipo, dias').in('passaporte', meus).in('destino', destinos),
    cli.from('fontes_de_exigencias').select('fonte, dados_de, lido_em'),
  ])
  if (linhas.error) throw linhas.error
  if (fontes.error) throw fontes.error
  const lista = (linhas.data ?? []).map((l) => ({
    passaporte: l.passaporte,
    destino: l.destino,
    fonte: l.fonte as FonteDeExigencia,
    tipo: l.tipo as TipoDeExigencia,
    dias: l.dias,
  }))
  return {
    porDestino: melhorExigencia(lista, meus),
    fontes: (fontes.data ?? []).map((f) => ({ fonte: f.fonte as FonteDeExigencia, dadosDe: f.dados_de, lidoEm: f.lido_em })),
  }
}

// Nacionalidades do meu perfil (spec 038). Brasileiro sempre entra: é o público do app.
export async function buscarMeusPassaportes(cli: ClienteTogether, meuId: string): Promise<string[]> {
  const { data, error } = await cli.from('documentos_pessoais').select('nacionalidades').eq('usuario_id', meuId).maybeSingle()
  if (error) throw error
  const lista = (data?.nacionalidades ?? []).map((n: string) => n.toUpperCase()).filter((n: string) => n.length === 2)
  return [...new Set(['BR', ...lista])]
}
