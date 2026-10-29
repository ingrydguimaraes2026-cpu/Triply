import { Bed, Plane, Receipt, ShoppingBag, Ticket, Utensils, type LucideIcon } from 'lucide-react'

// Mesmas categorias da tabela "gastos" no banco
export const CATEGORIAS: { chave: string; nome: string; icone: LucideIcon }[] = [
  { chave: 'transporte', nome: 'Transporte', icone: Plane },
  { chave: 'hospedagem', nome: 'Hospedagem', icone: Bed },
  { chave: 'alimentacao', nome: 'Alimentação', icone: Utensils },
  { chave: 'passeios', nome: 'Passeios', icone: Ticket },
  { chave: 'comprinhas', nome: 'Comprinhas', icone: ShoppingBag },
  { chave: 'outros', nome: 'Outros', icone: Receipt },
]

export function categoria(chave: string) {
  return CATEGORIAS.find((c) => c.chave === chave) ?? CATEGORIAS[5]
}

// Moedas que aparecem nos formulários (a da viagem entra sempre, mesmo se não estiver aqui)
export const MOEDAS = ['EUR', 'BRL', 'USD', 'GBP', 'CHF', 'ARS', 'CLP', 'JPY', 'CZK', 'HUF', 'PLN', 'DKK', 'SEK', 'NOK', 'TRY', 'MXN']

export function moedasDaViagem(moedaPrincipal: string, extras: string[] = []) {
  return [...new Set([moedaPrincipal, ...extras, ...MOEDAS])]
}
