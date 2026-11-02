// Roteiro do destino (spec 115 v2): o plano dia a dia que o grupo arruma junto.
// No banco é uma lista de dias, cada dia uma lista de ids de lugares (tabela `roteiros`).
// Puro e sem import (o teste carrega o arquivo direto). A tela só mostra.

export type DiasDoRoteiro = string[][]

// Lê o que veio do banco sem confiar no formato
export function lerDiasDoRoteiro(json: unknown): DiasDoRoteiro {
  if (!Array.isArray(json)) return []
  return json.map((d) => (Array.isArray(d) ? d.filter((x): x is string => typeof x === 'string') : []))
}

// Encaixa o roteiro salvo no número de dias e nos lugares que o grupo curtiu:
// - lugar que saiu do grupo (descurtido ou apagado) some;
// - dia a mais é cortado e os lugares dele vão pro "Sem dia";
// - curtido que não está em nenhum dia fica no "Sem dia", na ordem de `idsDoGrupo`.
export function arrumarRoteiro(salvo: DiasDoRoteiro, idsDoGrupo: string[], numeroDeDias: number): { dias: DiasDoRoteiro; semDia: string[] } {
  const doGrupo = new Set(idsDoGrupo)
  const vistos = new Set<string>()
  const dias: DiasDoRoteiro = Array.from({ length: Math.max(1, numeroDeDias) }, (_, i) =>
    (salvo[i] ?? []).filter((id) => {
      if (!doGrupo.has(id) || vistos.has(id)) return false
      vistos.add(id)
      return true
    }),
  )
  return { dias, semDia: idsDoGrupo.filter((id) => !vistos.has(id)) }
}

// Leva o lugar pro fim de um dia (índice) ou pro "Sem dia" (null)
export function moverPraDia(dias: DiasDoRoteiro, id: string, alvo: number | null): DiasDoRoteiro {
  const novo = dias.map((d) => d.filter((x) => x !== id))
  if (alvo !== null && novo[alvo]) novo[alvo] = [...novo[alvo], id]
  return novo
}

// Sobe (-1) ou desce (+1) o lugar dentro do dia dele
export function moverNaOrdem(dias: DiasDoRoteiro, id: string, direcao: -1 | 1): DiasDoRoteiro {
  return dias.map((d) => {
    const i = d.indexOf(id)
    const j = i + direcao
    if (i < 0 || j < 0 || j >= d.length) return d
    const novo = [...d]
    ;[novo[i], novo[j]] = [novo[j], novo[i]]
    return novo
  })
}
