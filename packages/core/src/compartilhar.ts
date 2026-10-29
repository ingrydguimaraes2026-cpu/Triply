// Compartilhar um item da viagem (roadmap #5). Funções puras: montam o link que abre
// direto no item e o texto da mensagem. Quem envia é o usuário (no WhatsApp, etc.).
// Testado em tests/compartilhar.test.mjs.

export type TipoCompartilhavel = 'gasto' | 'lugar' | 'enquete' | 'ponto'

export type ItemCompartilhavel = {
  tipo: TipoCompartilhavel
  id: string
  titulo?: string // nome do item, se houver (deixa a mensagem mais clara)
}

// Qual aba abre cada tipo. '' = a Overview (raiz da viagem).
const ABA: Record<TipoCompartilhavel, string> = {
  gasto: 'financeiro',
  lugar: 'lugares',
  enquete: '',
  ponto: '',
}

const ROTULO: Record<TipoCompartilhavel, string> = {
  gasto: 'o gasto',
  lugar: 'o lugar',
  enquete: 'a enquete',
  ponto: 'o ponto de encontro',
}

/**
 * URL que abre direto no item: /viagem/<id>/<aba>?foco=<itemId>.
 * `base` é o domínio do app (ex.: "https://together.app" ou "http://localhost:5173"),
 * com ou sem barra no fim.
 */
export function linkDoItem(base: string, viagemId: string, item: ItemCompartilhavel): string {
  const raiz = base.replace(/\/+$/, '')
  const aba = ABA[item.tipo]
  const caminho = `/viagem/${viagemId}${aba ? `/${aba}` : ''}`
  return `${raiz}${caminho}?foco=${encodeURIComponent(item.id)}`
}

/** Texto da mensagem de compartilhar, já com o link no fim. */
export function textoDoItem(item: ItemCompartilhavel, link: string, nomeDaViagem?: string): string {
  const alvo = item.titulo ? `"${item.titulo.trim()}"` : ROTULO[item.tipo]
  const ondeVai = nomeDaViagem ? ` da viagem ${nomeDaViagem}` : ''
  return `Dá uma olhada em ${alvo}${ondeVai} no Together: ${link}`
}
