// Versão do navegador de avisos.ts: o app no navegador não recebe push do Expo
// (e nem carrega o expo-notifications). Quem usa pelo navegador liga os avisos no site.
export type EstadoDosAvisos = 'pedir' | 'ligado' | 'bloqueado' | 'sem-suporte' | 'sem-projeto'
export type DadosDoAviso = { tipo?: 'trajeto' | 'ponto' | 'cancelamento'; viagemId?: string }

export async function estadoDosAvisos(): Promise<EstadoDosAvisos> {
  return 'sem-suporte'
}

export async function ligarAvisos(): Promise<EstadoDosAvisos> {
  return 'sem-suporte'
}

export async function esquecerEsteAparelho() {}

export function telaDoAviso(dados: DadosDoAviso): string | null {
  if (!dados.viagemId) return null
  return dados.tipo === 'trajeto' ? '/transportes' : `/viagem/${dados.viagemId}`
}
