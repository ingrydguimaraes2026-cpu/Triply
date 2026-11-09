// Gasto por frase ou voz (spec 093): "jantar 45,50 a Ingryd pagou" → valor, quem pagou, categoria.
// Sem IA: regras simples. Puro, pra dar pra testar.

export type GastoDaFrase = {
  valor: number | null // centavos
  moeda: string | null
  descricao: string
  categoria: string | null
  pagoPor: string | null // id
  pessoal: boolean
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const MOEDAS: [RegExp, string][] = [
  [/\b(reais|real|brl)\b|r\$/, 'BRL'],
  [/\b(euros?|eur)\b|€/, 'EUR'],
  [/\b(dolares?|usd)\b|us\$/, 'USD'],
  [/\b(libras?|gbp)\b|£/, 'GBP'],
  [/\b(francos?|chf)\b/, 'CHF'],
  [/\b(pesos?)\b/, 'ARS'],
  [/\b(ienes?|yen|jpy)\b/, 'JPY'],
]

const CATEGORIAS: [string, string[]][] = [
  ['alimentacao', ['cafe', 'jantar', 'almoco', 'restaurante', 'mercado', 'supermercado', 'lanche', 'pizza', 'sorvete', 'gelato', 'cerveja', 'vinho', 'bar', 'padaria', 'comida', 'agua', 'cafe da manha']],
  ['transporte', ['uber', 'taxi', 'trem', 'onibus', 'metro', 'gasolina', 'combustivel', 'pedagio', 'estacionamento', 'voo', 'passagem', 'bolt', 'barco', 'ferry', 'aluguel de carro']],
  ['hospedagem', ['hotel', 'airbnb', 'hostel', 'pousada', 'diaria', 'hospedagem']],
  ['passeios', ['ingresso', 'museu', 'passeio', 'tour', 'show', 'entrada', 'parque', 'excursao']],
  ['comprinhas', ['lembrancinha', 'presente', 'roupa', 'loja', 'compras', 'souvenir', 'farmacia', 'chip', 'esim']],
]

// "1.234,56" / "12,50" / "12.50" / "12" → centavos
function lerNumero(texto: string): number | null {
  let t = texto
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.')
  else t = t.replace(',', '.')
  const n = Number(t)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null
}

export function lerFraseDeGasto(frase: string, { pessoas, meuId }: { pessoas: { id: string; nome: string }[]; meuId: string }): GastoDaFrase {
  let resto = ` ${semAcento(frase)} `
  const original = frase

  // Valor: o primeiro número da frase
  let valor: number | null = null
  const num = resto.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/)
  if (num) {
    valor = lerNumero(num[1])
    resto = resto.replace(num[1], ' ')
  }

  // Moeda
  let moeda: string | null = null
  for (const [re, codigo] of MOEDAS) {
    if (re.test(resto)) {
      moeda = codigo
      resto = resto.replace(re, ' ')
      break
    }
  }

  // Pessoal
  const rePessoal = /\b(so (eu|meu|minha|pra mim)|pessoal|so pra mim)\b/
  const pessoal = rePessoal.test(resto)
  resto = resto.replace(rePessoal, ' ')

  // Quem pagou
  let pagoPor: string | null = null
  if (/\b(eu paguei|paguei)\b/.test(resto)) {
    pagoPor = meuId
    resto = resto.replace(/\b(eu paguei|paguei)\b/, ' ')
  } else {
    for (const p of pessoas) {
      const primeiro = semAcento(p.nome.split(' ')[0] ?? '')
      if (!primeiro) continue
      const re = new RegExp(`\\b((pago )?(pel[oa]|por) ${primeiro}|(o |a )?${primeiro} pagou)\\b`)
      if (re.test(resto)) {
        pagoPor = p.id
        resto = resto.replace(re, ' ')
        break
      }
    }
  }

  // Categoria pelas palavras
  let categoria: string | null = null
  for (const [chave, palavras] of CATEGORIAS) {
    if (palavras.some((p) => new RegExp(`\\b${p}s?\\b`).test(resto))) {
      categoria = chave
      break
    }
  }

  // Descrição: o que sobrou, com as palavras de ligação tiradas, mantendo os acentos da frase original
  const sobrou = resto
    .replace(/\b(de|no|na|com|e|o|a|um|uma|dividido|entre todos|pra todos)\b/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const palavrasOriginais = original.split(/\s+/)
  const descricao = sobrou
    .map((p) => palavrasOriginais.find((o) => semAcento(o).replace(/[^a-z0-9]/g, '') === p) ?? p)
    .join(' ')
  return {
    valor,
    moeda,
    descricao: descricao ? descricao.charAt(0).toUpperCase() + descricao.slice(1) : '',
    categoria,
    pagoPor,
    pessoal,
  }
}
