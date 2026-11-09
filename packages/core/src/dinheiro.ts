// Dinheiro sempre em CENTAVOS (número inteiro) nas contas. Só vira "€ 12,50" na hora de mostrar.
// Assim 0,1 + 0,2 não vira 0,30000000004.

// "12", "12,5", "1.234,56" ou "12.50" → centavos. Texto inválido → null.
export function lerValor(texto: string): number | null {
  let limpo = texto.trim().replace(/\s/g, '').replace(/^[^\d-]+/, '')
  if (!limpo) return null
  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.')
  } else if (/\.\d{3}$/.test(limpo) || (limpo.match(/\./g) ?? []).length > 1) {
    limpo = limpo.replace(/\./g, '') // "1.234" = mil duzentos e trinta e quatro
  }
  if (!/^\d+(\.\d{0,2})?$/.test(limpo)) return null
  return Math.round(Number(limpo) * 100)
}

// Valor do banco (12.5) → centavos (1250)
export function deBanco(valor: number | string): number {
  return Math.round(Number(valor) * 100)
}

// Centavos → texto pro banco ("12.50"), sem perder precisão
export function paraBanco(centavos: number): string {
  const sinal = centavos < 0 ? '-' : ''
  const abs = Math.abs(centavos)
  return `${sinal}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

const formatos = new Map<string, Intl.NumberFormat>()

// Centavos → "€ 12,50" / "R$ 1.234,00"
export function formatarDinheiro(centavos: number, moeda: string): string {
  let formato = formatos.get(moeda)
  if (!formato) {
    try {
      formato = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda })
    } catch {
      formato = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    formatos.set(moeda, formato)
  }
  return formato.format(centavos / 100)
}

// Centavos → "12,50" (pra colocar de volta num campo de texto)
export function paraCampo(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}
