// Histórico e lixeira (spec 087): frases e regras da tela. Puro, pra dar pra testar.

export type ItemDoHistorico = {
  id: string
  tabela: 'gastos' | 'lugares' | 'trajetos' | 'eventos_agenda'
  linha_id: string
  acao: 'editou' | 'apagou' | 'restaurou'
  autor: string | null
  titulo: string | null
  restaurado_em: string | null
  criado_em: string
}

const NOMES: Record<ItemDoHistorico['tabela'], string> = {
  gastos: 'o gasto',
  lugares: 'o lugar',
  trajetos: 'o trajeto',
  eventos_agenda: 'o evento',
}

const DIAS_DA_LIXEIRA = 30

// "Victor apagou o gasto “Café”"
export function fraseDoHistorico(item: ItemDoHistorico, nomeDoAutor: string): string {
  const titulo = item.titulo?.trim() ? ` “${item.titulo.trim()}”` : ''
  return `${nomeDoAutor} ${item.acao} ${NOMES[item.tabela]}${titulo}`
}

// Dias que faltam pra sumir da lixeira (0 = some hoje)
export function diasNaLixeira(item: ItemDoHistorico, agora: Date): number {
  const passou = (agora.getTime() - new Date(item.criado_em).getTime()) / 86_400_000
  return Math.max(0, Math.ceil(DIAS_DA_LIXEIRA - passou))
}

// Mesmo critério da função restaurar_da_lixeira do banco
export function podeRestaurar(item: ItemDoHistorico, meuId: string, euSouAdm: boolean, agora: Date): boolean {
  if (item.acao !== 'apagou' || item.restaurado_em) return false
  if (diasNaLixeira(item, agora) <= 0) return false
  return item.autor === meuId || euSouAdm
}
