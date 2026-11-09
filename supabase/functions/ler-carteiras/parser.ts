// Parser dos e-mails de transação (spec 015).
//
// Transforma um e-mail do Wise ou do Nomad numa transação { tipo, valor, moeda, ... }.
// É de propósito uma peça PURA e sem internet: recebe texto, devolve dados. Assim dá pra
// testar em cima de e-mails de exemplo (tests/carteira.test.mjs) sem precisar do Gmail.
//
// ATENÇÃO: os padrões (regex) de cada banco são PROVISÓRIOS até a gente olhar e-mails reais.
// Enquanto não tiver amostra confirmada, o provedor fica com `confirmado: false` e o
// despachante devolve null (não inventa transação). Ver as perguntas em aberto da spec 015.

export type Transacao = {
  tipo: 'entrada' | 'gasto'
  valor: number
  moeda: string // ISO de 3 letras, ex.: EUR
  descricao: string | null
  data: Date | null
  provedor: 'wise' | 'nomad'
}

// Símbolo ou nome de moeda → código ISO. Só o que interessa pra viagem por ora.
const MOEDAS: Record<string, string> = {
  '€': 'EUR',
  eur: 'EUR',
  euro: 'EUR',
  euros: 'EUR',
  'R$': 'BRL',
  brl: 'BRL',
  real: 'BRL',
  reais: 'BRL',
  $: 'USD',
  us$: 'USD',
  usd: 'USD',
  'dólar': 'USD',
  '£': 'GBP',
  gbp: 'GBP',
  libra: 'GBP',
}

export function moedaDeSimbolo(simbolo: string): string | null {
  const s = simbolo.trim().toLowerCase()
  return MOEDAS[simbolo.trim()] ?? MOEDAS[s] ?? null
}

// Normaliza um valor em texto pra número. Lida com os dois formatos:
//   "1.234,56" (pt/eu)  e  "1,234.56" (en).  Também "20", "20,00", "1 234,56".
export function normalizarValor(texto: string): number | null {
  if (!texto) return null
  let s = texto.replace(/[^\d.,]/g, '').trim()
  if (!s) return null

  const temVirgula = s.includes(',')
  const temPonto = s.includes('.')

  if (temVirgula && temPonto) {
    // O último separador que aparece é o decimal; o outro é separador de milhar.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.') // 1.234,56 -> 1234.56
    } else {
      s = s.replace(/,/g, '') // 1,234.56 -> 1234.56
    }
  } else if (temVirgula) {
    // Só vírgula: se tem 2 casas depois dela, é decimal; senão é milhar.
    const depois = s.length - s.lastIndexOf(',') - 1
    s = depois === 2 ? s.replace(',', '.') : s.replace(/,/g, '')
  }
  // só ponto, ou nenhum: já serve

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// De qual banco é o e-mail, pelo remetente.
export function provedorDoRemetente(remetente: string): 'wise' | 'nomad' | null {
  const r = remetente.toLowerCase()
  if (r.includes('wise.com') || r.includes('transferwise')) return 'wise'
  if (r.includes('nomadglobal.com') || r.includes('nomad.com') || r.includes('@nomad')) return 'nomad'
  return null
}

// Acha SÓ o valor em euro dentro de um trecho ("20 EUR", "€ 20", "1.234,56 EUR").
// Por ora a carteira considera apenas euro: valores em dólar/outras moedas são ignorados.
function valorEuro(trecho: string): number | null {
  // valor antes da moeda: "20 EUR" / "20,00 €"
  let m = trecho.match(/(\d[\d .,]*\d|\d)\s*(?:EUR|€|euros?)\b/i)
  // moeda antes do valor: "€ 20" / "EUR 20"
  if (!m) m = trecho.match(/(?:EUR|€|euros?)\s*(\d[\d .,]*\d|\d)/i)
  if (!m) return null
  const valor = normalizarValor(m[1])
  return valor != null && valor > 0 ? valor : null
}

// Cada provedor tem um interpretador. `confirmado` vira true quando o padrão foi
// validado em cima de e-mail real (com teste em tests/carteira.test.mjs).
type Interpretador = {
  confirmado: boolean
  ler: (assunto: string, corpo: string) => Omit<Transacao, 'provedor'> | null
}

// Padrão em português usado pelo Wise e pelo Nomad (as duas são BR, o texto é parecido):
//   entrada: "Você adicionou/recebeu X EUR"   ·   gasto: "Você gastou/pagou/comprou X EUR"
// A data vem dos metadados do e-mail (a Edge Function preenche), não do corpo: por isso `data: null`.
function lerTransacaoPt(assunto: string, corpo: string, rotulo: string): Omit<Transacao, 'provedor'> | null {
  const texto = `${assunto}\n${corpo}`
  const entrada = texto.match(/voc[eê]\s+(?:adicionou|recebeu|adicionados?|creditou)\b([^.\n]{0,60})/i)
  if (entrada) {
    const valor = valorEuro(entrada[1])
    if (valor) return { tipo: 'entrada', valor, moeda: 'EUR', descricao: `Entrada (${rotulo})`, data: null }
  }
  const gasto = texto.match(/voc[eê]\s+(?:gastou|pagou|comprou|debitou)\b([^.\n]{0,60})/i)
  if (gasto) {
    const valor = valorEuro(gasto[1])
    if (valor) return { tipo: 'gasto', valor, moeda: 'EUR', descricao: `Gasto (${rotulo})`, data: null }
  }
  return null
}

const INTERPRETADORES: Record<'wise' | 'nomad', Interpretador> = {
  // Wise: entrada confirmada com e-mail real; gasto provisório (sem amostra ainda).
  wise: { confirmado: true, ler: (assunto, corpo) => lerTransacaoPt(assunto, corpo, 'Wise') },
  // Nomad: mesmo padrão em português. PROVISÓRIO — confirmar com e-mail real quando houver conta.
  nomad: { confirmado: true, ler: (assunto, corpo) => lerTransacaoPt(assunto, corpo, 'Nomad') },
}

// Entrada principal: recebe o e-mail, devolve a transação ou null (não é de transação,
// ou o provedor ainda não foi confirmado).
export function interpretarEmail(remetente: string, assunto: string, corpo: string): Transacao | null {
  const provedor = provedorDoRemetente(remetente)
  if (!provedor) return null
  const interpretador = INTERPRETADORES[provedor]
  if (!interpretador.confirmado) return null
  const t = interpretador.ler(assunto ?? '', corpo ?? '')
  return t ? { ...t, provedor } : null
}
