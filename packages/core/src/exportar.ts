// Exportar gastos (spec 052): CSV que abre no Excel/Google Planilhas e um CSV no formato do Splitwise.
// Puro, testado em apps/web/tests/exportar.test.mjs. Valores em CENTAVOS na entrada.

export type GastoParaExportar = {
  data: string
  descricao: string
  categoria: string
  valor: number // centavos
  moeda: string
  pago_por: string
  pessoal: boolean
  divisoes: { usuarioId: string; valor: number }[] // centavos
}

// Campo de CSV: aspas quando tem o separador, aspas ou quebra de linha. Começo com = + - @ vira texto (não fórmula).
function campo(valor: string | number, separador: string): string {
  let t = String(valor)
  if (/^[=+\-@]/.test(t) && !/^-?\d+([.,]\d+)?$/.test(t)) t = `'${t}` // número negativo continua número
  return t.includes(separador) || /["\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

const valorBr = (centavos: number) => (centavos / 100).toFixed(2).replace('.', ',')
const valorPonto = (centavos: number) => (centavos / 100).toFixed(2)

// CSV em português (separador ";", vírgula decimal) — abre direto no Excel do Brasil.
// Uma coluna por pessoa com a parte dela. BOM no começo pro Excel ler os acentos.
export function gastosEmCsv(gastos: GastoParaExportar[], pessoas: { id: string; nome: string }[], nomeDaCategoria: (c: string) => string): string {
  const cab = ['Data', 'Descrição', 'Categoria', 'Valor', 'Moeda', 'Pago por', 'Tipo', ...pessoas.map((p) => `Parte de ${p.nome}`)]
  const nome = (id: string) => pessoas.find((p) => p.id === id)?.nome ?? 'Ex-membro'
  const linhas = [...gastos]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((g) => [
      g.data.split('-').reverse().join('/'),
      g.descricao,
      nomeDaCategoria(g.categoria),
      valorBr(g.valor),
      g.moeda,
      nome(g.pago_por),
      g.pessoal ? 'Pessoal' : 'Comboio',
      ...pessoas.map((p) => {
        const d = g.divisoes.find((x) => x.usuarioId === p.id)
        return d ? valorBr(d.valor) : ''
      }),
    ])
  return '﻿' + [cab, ...linhas].map((l) => l.map((c) => campo(c, ';')).join(';')).join('\r\n') + '\r\n'
}

// Formato que o Splitwise importa: Date, Description, Category, Cost, Currency e uma coluna por pessoa
// com o saldo daquele gasto (pagou − parte). Só gastos do comboio.
export function gastosParaSplitwise(gastos: GastoParaExportar[], pessoas: { id: string; nome: string }[]): string {
  const cab = ['Date', 'Description', 'Category', 'Cost', 'Currency', ...pessoas.map((p) => p.nome)]
  const linhas = gastos
    .filter((g) => !g.pessoal)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((g) => [
      g.data,
      g.descricao,
      g.categoria,
      valorPonto(g.valor),
      g.moeda,
      ...pessoas.map((p) => {
        const pagou = g.pago_por === p.id ? g.valor : 0
        const parte = g.divisoes.find((x) => x.usuarioId === p.id)?.valor ?? 0
        return valorPonto(pagou - parte)
      }),
    ])
  return [cab, ...linhas].map((l) => l.map((c) => campo(c, ',')).join(',')).join('\r\n') + '\r\n'
}
