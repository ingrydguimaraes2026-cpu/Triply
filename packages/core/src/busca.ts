// Busca na viagem (spec 053): um campo acha qualquer coisa. Puro (o índice vem montado de fora).
// Testado em apps/web/tests/busca.test.mjs.

export type ItemDeBusca = {
  tipo: 'destino' | 'lugar' | 'gasto' | 'hospedagem' | 'trajeto' | 'evento' | 'tarefa' | 'arquivo' | 'enquete'
  id: string
  titulo: string
  detalhe?: string | null // observação, link, código de reserva…
  caminho: string // pra onde o resultado leva
}

export const NOMES_DOS_TIPOS: Record<ItemDeBusca['tipo'], string> = {
  destino: 'Destino',
  lugar: 'Lugar',
  gasto: 'Gasto',
  hospedagem: 'Hospedagem',
  trajeto: 'Trajeto',
  evento: 'Agenda',
  tarefa: 'Tarefa',
  arquivo: 'Cofre',
  enquete: 'Enquete',
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Todas as palavras do termo têm que aparecer (no título ou no detalhe). Título conta mais;
// começar com o termo conta mais ainda. No máximo 30 resultados.
export function buscarNaViagem(itens: ItemDeBusca[], termo: string): ItemDeBusca[] {
  const palavras = normalizar(termo).split(/\s+/).filter((p) => p.length > 0)
  if (palavras.length === 0 || palavras.join('').length < 2) return []
  const pontuados: { item: ItemDeBusca; pontos: number }[] = []
  for (const item of itens) {
    const titulo = normalizar(item.titulo)
    const detalhe = normalizar(item.detalhe ?? '')
    if (!palavras.every((p) => titulo.includes(p) || detalhe.includes(p))) continue
    let pontos = 0
    for (const p of palavras) {
      if (titulo.startsWith(p)) pontos += 3
      else if (titulo.includes(p)) pontos += 2
      else pontos += 1
    }
    pontuados.push({ item, pontos })
  }
  return pontuados
    .sort((a, b) => b.pontos - a.pontos || a.item.titulo.localeCompare(b.item.titulo))
    .slice(0, 30)
    .map((p) => p.item)
}
