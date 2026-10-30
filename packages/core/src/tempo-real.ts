// Tempo real (spec 085): quais tabelas a tela escuta e o que recarregar quando uma muda.
// Puro (sem Supabase) pra dar pra testar.

// Tabelas que o banco transmite (mesma lista da migration 20261031100000_tempo_real.sql)
export const TABELAS_AO_VIVO = [
  'viagens',
  'destinos',
  'comboio_membros',
  'gastos',
  'trajetos',
  'lugares',
  'hospedagens',
  'eventos_agenda',
  'posts',
] as const

export type TabelaAoVivo = (typeof TABELAS_AO_VIVO)[number]

// O que recarregar:
// - 'viagem': a moldura (viagem, destinos, comboio), que todas as abas usam;
// - o nome da própria tabela: só a aba que mostra aquilo.
export function oQueRecarregar(tabela: string): 'viagem' | TabelaAoVivo | null {
  if (tabela === 'viagens' || tabela === 'destinos' || tabela === 'comboio_membros') return 'viagem'
  return (TABELAS_AO_VIVO as readonly string[]).includes(tabela) ? (tabela as TabelaAoVivo) : null
}

// Filtro do Realtime pra só receber a viagem aberta ('viagens' usa o id; as outras, viagem_id)
export function filtroDaTabela(tabela: TabelaAoVivo, viagemId: string): string {
  return tabela === 'viagens' ? `id=eq.${viagemId}` : `viagem_id=eq.${viagemId}`
}
