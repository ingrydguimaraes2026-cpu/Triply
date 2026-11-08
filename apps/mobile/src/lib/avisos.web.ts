// Versão do navegador de avisos.ts: o app no navegador não recebe push do Expo
// (e nem carrega o expo-notifications). Quem usa pelo navegador liga os avisos no site.
export type EstadoDosAvisos = 'pedir' | 'ligado' | 'bloqueado' | 'sem-suporte' | 'sem-projeto'
export type DadosDoAviso = { tipo?: 'trajeto' | 'ponto' | 'cancelamento' | 'match' | 'retrospectiva'; viagemId?: string }

export async function estadoDosAvisos(): Promise<EstadoDosAvisos> {
  return 'sem-suporte'
}

export async function ligarAvisos(): Promise<EstadoDosAvisos> {
  return 'sem-suporte'
}

export async function esquecerEsteAparelho() {}

export function telaDoAviso(dados: DadosDoAviso): string | null {
  if (!dados.viagemId) return null
  if (dados.tipo === 'match') return `/viagem/${dados.viagemId}/roteiro` // spec 117: falta você opinar
  if (dados.tipo === 'retrospectiva') return '/retrospectiva' // spec 118c: a retrospectiva está pronta
  return dados.tipo === 'trajeto' ? '/transportes' : `/viagem/${dados.viagemId}`
}
