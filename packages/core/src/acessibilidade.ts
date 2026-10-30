// Acessibilidade e modo simples (spec 090). Puro, pra dar pra testar.

export type Preferencias = {
  fonte: 'normal' | 'grande' | 'maior'
  contraste: boolean
  simples: boolean // "só o essencial": menos abas, pro familiar menos digital
}

export const PREFERENCIAS_PADRAO: Preferencias = { fonte: 'normal', contraste: false, simples: false }

// Abas que ficam no modo simples: Início, Hoje, Financeiro, Fotos, Comboio
export const ABAS_DO_MODO_SIMPLES = ['', 'hoje', 'financeiro', 'fotos', 'comboio']

export function abasVisiveis<A extends { para: string }>(abas: A[], simples: boolean): A[] {
  return simples ? abas.filter((a) => ABAS_DO_MODO_SIMPLES.includes(a.para)) : abas
}

// Lê o que estava guardado no aparelho, aceitando só valores conhecidos
export function lerPreferencias(texto: string | null): Preferencias {
  try {
    const p = JSON.parse(texto ?? '{}') as Partial<Preferencias>
    return {
      fonte: p.fonte === 'grande' || p.fonte === 'maior' ? p.fonte : 'normal',
      contraste: p.contraste === true,
      simples: p.simples === true,
    }
  } catch {
    return { ...PREFERENCIAS_PADRAO }
  }
}
