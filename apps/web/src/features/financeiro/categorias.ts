import { Bed, Plane, Receipt, ShoppingBag, Ticket, Utensils, type LucideIcon } from '../../components/ui/icones'

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

// Moedas: a lista mora no core (web e app usam a mesma)
export { MOEDAS, moedasDaViagem } from '@together/core'
