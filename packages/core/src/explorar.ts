// Explorar (spec 114): deslizar lugares e montar o roteiro.
// Regras puras (sem rede, sem banco), usadas pelo site, pelo app e pela Edge Function `explorar-cidade`.
// Testado em apps/web/tests/explorar.test.mjs.

// ---------- Tipos do catálogo ----------
export type TipoDoCatalogo =
  | 'museu' | 'igreja' | 'castelo' | 'palacio' | 'monumento' | 'mirante' | 'ponte' | 'praca' | 'parque' | 'jardim'
  | 'praia' | 'cachoeira' | 'lagoa' | 'duna' | 'natureza' | 'sitio_historico' | 'zoologico' | 'aquario' | 'bairro' | 'outro'

export type EstiloId = 'romantica' | 'cultura' | 'ar_livre' | 'fotogenica' | 'criancas'
export type Escolha = 'quero' | 'passo' | 'nao_abro_mao'
export type RitmoId = 'tranquilo' | 'equilibrado' | 'intenso'
export type OrcamentoId = 'barato' | 'medio' | 'sem_limite'

export const ESTILOS: { id: EstiloId; nome: string }[] = [
  { id: 'romantica', nome: 'Romântica' },
  { id: 'cultura', nome: 'Cultura' },
  { id: 'ar_livre', nome: 'Ao ar livre' },
  { id: 'fotogenica', nome: 'Fotogênica' },
  { id: 'criancas', nome: 'Com crianças' },
]

export const RITMOS: { id: RitmoId; nome: string; porDia: number }[] = [
  { id: 'tranquilo', nome: 'Tranquilo', porDia: 2 },
  { id: 'equilibrado', nome: 'Equilibrado', porDia: 3 },
  { id: 'intenso', nome: 'Intenso', porDia: 4 },
]

export const ORCAMENTOS: { id: OrcamentoId; nome: string }[] = [
  { id: 'barato', nome: 'Grátis e barato' },
  { id: 'medio', nome: 'Médio' },
  { id: 'sem_limite', nome: 'Sem limite' },
]

export const porDiaDoRitmo = (ritmo: RitmoId) => RITMOS.find((r) => r.id === ritmo)?.porDia ?? 3

// O que cada tipo de lugar costuma ser: estilos, tempo médio de visita e melhor hora. Sem IA.
type InfoDoTipo = { nome: string; estilos: EstiloId[]; tempoMin: number; melhorHora: string; gratis: boolean | null }
export const INFO_DO_TIPO: Record<TipoDoCatalogo, InfoDoTipo> = {
  museu: { nome: 'Museu', estilos: ['cultura'], tempoMin: 120, melhorHora: 'Manhã', gratis: false },
  igreja: { nome: 'Igreja', estilos: ['cultura', 'fotogenica'], tempoMin: 45, melhorHora: 'Manhã', gratis: true },
  castelo: { nome: 'Castelo', estilos: ['cultura', 'fotogenica', 'criancas'], tempoMin: 120, melhorHora: 'Manhã', gratis: false },
  palacio: { nome: 'Palácio', estilos: ['cultura', 'fotogenica'], tempoMin: 120, melhorHora: 'Manhã', gratis: false },
  monumento: { nome: 'Monumento', estilos: ['cultura', 'fotogenica'], tempoMin: 30, melhorHora: 'Qualquer hora', gratis: true },
  mirante: { nome: 'Mirante', estilos: ['romantica', 'fotogenica', 'ar_livre'], tempoMin: 30, melhorHora: 'Pôr do sol', gratis: true },
  ponte: { nome: 'Ponte', estilos: ['romantica', 'fotogenica'], tempoMin: 20, melhorHora: 'Fim da tarde', gratis: true },
  praca: { nome: 'Praça', estilos: ['fotogenica', 'cultura'], tempoMin: 30, melhorHora: 'Fim da tarde', gratis: true },
  parque: { nome: 'Parque', estilos: ['ar_livre', 'criancas', 'romantica'], tempoMin: 90, melhorHora: 'Tarde', gratis: true },
  jardim: { nome: 'Jardim', estilos: ['ar_livre', 'romantica', 'fotogenica'], tempoMin: 60, melhorHora: 'Manhã', gratis: null },
  praia: { nome: 'Praia', estilos: ['ar_livre', 'romantica', 'criancas'], tempoMin: 180, melhorHora: 'Manhã', gratis: true },
  cachoeira: { nome: 'Cachoeira', estilos: ['ar_livre', 'fotogenica'], tempoMin: 120, melhorHora: 'Manhã', gratis: null },
  lagoa: { nome: 'Lagoa', estilos: ['ar_livre', 'romantica', 'criancas'], tempoMin: 120, melhorHora: 'Tarde', gratis: true },
  duna: { nome: 'Duna', estilos: ['ar_livre', 'romantica', 'fotogenica'], tempoMin: 90, melhorHora: 'Pôr do sol', gratis: true },
  natureza: { nome: 'Natureza', estilos: ['ar_livre', 'fotogenica'], tempoMin: 180, melhorHora: 'Manhã', gratis: null },
  sitio_historico: { nome: 'Sítio histórico', estilos: ['cultura', 'fotogenica'], tempoMin: 90, melhorHora: 'Manhã', gratis: false },
  zoologico: { nome: 'Zoológico', estilos: ['criancas', 'ar_livre'], tempoMin: 180, melhorHora: 'Manhã', gratis: false },
  aquario: { nome: 'Aquário', estilos: ['criancas'], tempoMin: 120, melhorHora: 'Qualquer hora', gratis: false },
  bairro: { nome: 'Bairro', estilos: ['fotogenica', 'romantica', 'cultura'], tempoMin: 120, melhorHora: 'Fim da tarde', gratis: true },
  outro: { nome: 'Passeio', estilos: [], tempoMin: 60, melhorHora: 'Qualquer hora', gratis: null },
}

// Classes da Wikidata → nosso tipo. A Edge Function busca "é um(a) [classe] ou subclasse dela".
// Lista de INCLUSÃO de propósito: sem ela vêm conceitos como "Império Romano" (teste de 02/11/2026).
export const CLASSES_WIKIDATA: Record<string, TipoDoCatalogo> = {
  Q33506: 'museu', Q207694: 'museu',
  Q16970: 'igreja', Q2977: 'igreja', Q163687: 'igreja', Q108325: 'igreja', Q44613: 'igreja', Q32815: 'igreja', Q44539: 'igreja',
  Q23413: 'castelo', Q57821: 'castelo', Q1785071: 'castelo',
  Q16560: 'palacio',
  Q4989906: 'monumento', Q5003624: 'monumento', Q575759: 'monumento', Q12518: 'monumento', Q179700: 'monumento',
  Q6017969: 'mirante',
  Q12280: 'ponte',
  Q174782: 'praca',
  Q22698: 'parque', Q22746: 'parque', Q46169: 'natureza',
  Q1107656: 'jardim', Q167346: 'jardim',
  Q40080: 'praia',
  Q34038: 'cachoeira',
  Q23397: 'lagoa', Q187223: 'lagoa',
  Q25391: 'duna',
  Q8502: 'natureza', Q23442: 'natureza', Q39816: 'natureza', Q35509: 'natureza',
  Q839954: 'sitio_historico', Q1081138: 'sitio_historico', Q9259: 'sitio_historico',
  Q43501: 'zoologico',
  Q2281788: 'aquario',
  Q570116: 'outro',
}

// ---------- Cartão ----------
export type LugarDoCatalogo = {
  id: string
  wikidata: string | null
  nome: string
  bairro: string | null
  tipo: TipoDoCatalogo
  estilos: EstiloId[]
  fama: number
  latitude: number
  longitude: number
  porQue: string | null
  sobre: string | null
  tempoMin: number | null
  gratis: boolean | null
  melhorHora: string | null
  fotoUrl: string | null
  fotoAutor: string | null
  fotoLicenca: string | null
  fotoPagina: string | null
  linkWikipedia: string | null
}

export function tempoLegivel(min: number | null): string {
  if (min == null) return '—'
  if (min >= 360) return 'Dia todo'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

export const precoLegivel = (gratis: boolean | null) => (gratis === true ? 'Grátis' : gratis === false ? 'Pago' : 'Ver preço')

// "Foto: Autor · CC BY-SA". Domínio público/CC0 sem autor: só "Foto: Wikimedia Commons".
export function creditoDaFoto(autor: string | null, licenca: string | null): string {
  const livre = !licenca || /^(cc0|public domain|pd|domínio público)/i.test(licenca)
  const nome = (autor ?? '').replace(/<[^>]*>/g, '').trim()
  if (livre && !nome) return 'Foto: Wikimedia Commons'
  const curto = nome.length > 40 ? nome.slice(0, 39) + '…' : nome
  return ['Foto: ' + (curto || 'Wikimedia Commons'), licenca && !livre ? licenca : null].filter(Boolean).join(' · ')
}

// ---------- Pilha ----------
// Spec 114, Decisão 4: vagas = dias × por dia; pilha = vagas × 2,5, entre 15 e 40.
export function tamanhoDaPilha(dias: number, porDia: number): number {
  const vagas = Math.max(1, dias) * Math.max(1, porDia)
  return Math.min(40, Math.max(15, Math.round(vagas * 2.5)))
}

export const simplificar = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

type OpcoesDaPilha = {
  estilos: EstiloId[]
  orcamento: OrcamentoId
  tamanho: number
  // Lugares que não devem voltar: já são da viagem (por wikidata ou nome) ou já foram escolhidos
  jaNaViagem?: { wikidata: string | null; nome: string }[]
  jaEscolhidos?: string[] // ids do catálogo
}

// Ordem: combina com o estilo primeiro, depois o resto; dentro de cada grupo, os mais famosos.
// "Grátis e barato" empurra os pagos pro fim. Sem foto vai pro fim do seu grupo.
export function montarPilha(lugares: LugarDoCatalogo[], o: OpcoesDaPilha): LugarDoCatalogo[] {
  const qids = new Set((o.jaNaViagem ?? []).map((l) => l.wikidata).filter(Boolean))
  const nomes = new Set((o.jaNaViagem ?? []).map((l) => simplificar(l.nome)))
  const escolhidos = new Set(o.jaEscolhidos ?? [])
  const nota = (l: LugarDoCatalogo) => {
    const combina = o.estilos.length === 0 || l.estilos.some((e) => o.estilos.includes(e))
    const caro = o.orcamento === 'barato' && l.gratis === false
    return (combina ? 0 : 2) + (caro ? 1 : 0)
  }
  return lugares
    .filter((l) => !escolhidos.has(l.id) && !(l.wikidata && qids.has(l.wikidata)) && !nomes.has(simplificar(l.nome)))
    .map((l, i) => ({ l, i, n: nota(l) }))
    .sort((a, b) => a.n - b.n || Number(!a.l.fotoUrl) - Number(!b.l.fotoUrl) || b.l.fama - a.l.fama || a.i - b.i)
    .slice(0, o.tamanho)
    .map((x) => x.l)
}

// ---------- Deslizar (o "redutor": estado + ação = novo estado) ----------
export type EstadoDoDeslize = { pilha: string[]; posicao: number; escolhas: Record<string, Escolha>; historico: string[] }

export const comecarDeslize = (ids: string[], escolhasAntigas: Record<string, Escolha> = {}): EstadoDoDeslize => ({
  pilha: ids,
  posicao: 0,
  escolhas: { ...escolhasAntigas },
  historico: [],
})

export const LIMITE_NAO_ABRO_MAO = 3

// `jaTenho` = "não abro mão" que a pessoa já tem nesse destino fora deste deslize (prioridades antigas)
export function podeNaoAbrirMao(e: EstadoDoDeslize, jaTenho = 0): boolean {
  const aqui = Object.values(e.escolhas).filter((x) => x === 'nao_abro_mao').length
  return aqui + jaTenho < LIMITE_NAO_ABRO_MAO
}

export function decidir(e: EstadoDoDeslize, escolha: Escolha, jaTenho = 0): EstadoDoDeslize {
  const id = e.pilha[e.posicao]
  if (!id) return e
  if (escolha === 'nao_abro_mao' && !podeNaoAbrirMao(e, jaTenho)) return e
  return { ...e, posicao: e.posicao + 1, escolhas: { ...e.escolhas, [id]: escolha }, historico: [...e.historico, id] }
}

export function desfazer(e: EstadoDoDeslize): EstadoDoDeslize {
  const id = e.historico[e.historico.length - 1]
  if (!id) return e
  const escolhas = { ...e.escolhas }
  delete escolhas[id]
  return { ...e, posicao: Math.max(0, e.posicao - 1), escolhas, historico: e.historico.slice(0, -1) }
}

export const acabou = (e: EstadoDoDeslize) => e.posicao >= e.pilha.length

export function contarEscolhas(escolhas: Record<string, Escolha>) {
  const v = Object.values(escolhas)
  return {
    quero: v.filter((x) => x === 'quero').length,
    naoAbroMao: v.filter((x) => x === 'nao_abro_mao').length,
    passo: v.filter((x) => x === 'passo').length,
  }
}

// ---------- Roteiro ----------
export function distanciaKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// "12 min a pé" até 2,5 km (4,5 km/h, com 30% a mais por causa das ruas); depois, transporte.
export function trecho(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): string {
  const km = distanciaKm(a, b)
  if (km > 2.5) return km > 40 ? 'de trem ou carro' : 'de transporte'
  return `${Math.max(3, Math.round(((km * 1.3) / 4.5) * 60))} min a pé`
}

// Região grande: os escolhidos ficam a mais de 60 km um do outro (Decisão 3)
export function regiaoEspalhada(lugares: { latitude: number; longitude: number }[], limiteKm = 60): boolean {
  for (let i = 0; i < lugares.length; i++)
    for (let j = i + 1; j < lugares.length; j++) if (distanciaKm(lugares[i], lugares[j]) > limiteKm) return true
  return false
}

// ---------- Vários destinos (spec 115, etapa 7) ----------
// Divide os dias da viagem entre os destinos pelo peso de cada um (ex.: país pesa mais que cidade).
// Todo destino ganha pelo menos 1 dia; a sobra vai pra quem tem mais peso.
export function dividirDias(total: number, pesos: number[]): number[] {
  if (pesos.length === 0) return []
  const dias = Math.max(total, pesos.length)
  const soma = pesos.reduce((s, p) => s + Math.max(p, 0.1), 0)
  const exato = pesos.map((p) => (dias * Math.max(p, 0.1)) / soma)
  const res = exato.map((x) => Math.max(1, Math.floor(x)))
  // Acerta a conta: tira de quem tem mais (sem ir abaixo de 1) ou dá pra quem ficou com a maior fração
  let falta = dias - res.reduce((s, x) => s + x, 0)
  const porFracao = exato.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f)
  for (let k = 0; falta > 0; k++, falta--) res[porFracao[k % porFracao.length].i]++
  while (falta < 0) {
    const maior = res.indexOf(Math.max(...res))
    res[maior]--
    falta++
  }
  return res
}

// Ordem que anda menos: começa no primeiro destino e vai sempre pro mais perto que falta.
// Só sugere se economizar de verdade (mais de 15% e mais de 100 km). Devolve os índices na nova ordem.
export function ordemMaisPerto(pontos: ({ latitude: number; longitude: number } | null)[]): { ordem: number[]; economiaKm: number } | null {
  if (pontos.length < 3 || pontos.some((p) => !p)) return null
  const ps = pontos as { latitude: number; longitude: number }[]
  const total = (ordem: number[]) => ordem.slice(1).reduce((s, i, k) => s + distanciaKm(ps[ordem[k]], ps[i]), 0)
  const ordem = [0]
  const faltam = new Set(ps.map((_, i) => i).slice(1))
  while (faltam.size) {
    const ultimo = ps[ordem[ordem.length - 1]]
    const perto = [...faltam].reduce((a, b) => (distanciaKm(ultimo, ps[b]) < distanciaKm(ultimo, ps[a]) ? b : a))
    ordem.push(perto)
    faltam.delete(perto)
  }
  const atual = total(ps.map((_, i) => i))
  const economiaKm = Math.round(atual - total(ordem))
  return economiaKm > 100 && economiaKm > atual * 0.15 ? { ordem, economiaKm } : null
}

// ---------- Cidade ----------
// Chave única da cidade no catálogo: "paris|fr"
export const chaveDaCidade = (nome: string, pais: string | null) => `${simplificar(nome)}|${(pais ?? '').toLowerCase()}`

const TIPOS_DE_REGIAO = new Set(['state', 'region', 'county', 'province', 'island', 'archipelago', 'state_district'])
export const ehRegiao = (tipoNominatim: string | null | undefined) => !!tipoNominatim && TIPOS_DE_REGIAO.has(tipoNominatim)

// Raio de busca: cidade 4 km (5 km se for grande); região = metade da diagonal da área, entre 15 e 80 km.
// `caixa` = [sul, norte, oeste, leste], como o Nominatim devolve em `boundingbox`.
export function raioDeBusca(tipoNominatim: string | null | undefined, caixa?: [number, number, number, number] | null): number {
  if (!caixa) return ehRegiao(tipoNominatim) ? 40 : 4
  const [s, n, o, l] = caixa
  const diagonal = distanciaKm({ latitude: s, longitude: o }, { latitude: n, longitude: l })
  if (ehRegiao(tipoNominatim)) return Math.round(Math.min(80, Math.max(15, diagonal / 2)))
  return diagonal > 30 ? 5 : 4
}
