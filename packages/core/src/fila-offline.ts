// Fila de marcações feitas sem internet (spec 086): marcar item da lista, da mala e tarefa.
// Puro (sem Supabase nem localStorage) pra dar pra testar.
//
// Regra de conflito, em palavras simples:
// - a mesma coisa marcada várias vezes sem internet vira UMA mudança só (vale a última);
// - ao enviar, vale o que a pessoa fez por último (a marcação do celular passa por cima);
// - se o item foi apagado por alguém enquanto isso, a marcação é descartada.

export type TabelaMarcavel = 'itens_lista' | 'mala_itens' | 'tarefas'

export type Marcacao = {
  tabela: TabelaMarcavel
  id: string
  campos: Record<string, boolean | string | null>
  quando: number // ms, hora em que a pessoa marcou
}

// Põe uma marcação na fila, juntando com outra do mesmo item
export function juntarNaFila(fila: Marcacao[], nova: Marcacao): Marcacao[] {
  const igual = fila.find((m) => m.tabela === nova.tabela && m.id === nova.id)
  if (!igual) return [...fila, nova]
  const juntada: Marcacao = {
    ...igual,
    campos: { ...igual.campos, ...nova.campos },
    quando: Math.max(igual.quando, nova.quando),
  }
  return fila.map((m) => (m === igual ? juntada : m))
}

// Ordem de envio: na ordem em que a pessoa fez
export function ordemDeEnvio(fila: Marcacao[]): Marcacao[] {
  return [...fila].sort((a, b) => a.quando - b.quando)
}

// Tira uma marcação da fila (depois de enviada ou descartada)
export function tirarDaFila(fila: Marcacao[], m: Pick<Marcacao, 'tabela' | 'id'>): Marcacao[] {
  return fila.filter((x) => !(x.tabela === m.tabela && x.id === m.id))
}

// O que a tela mostra enquanto a fila não foi enviada: aplica as marcações pendentes por cima
export function comPendentes<T extends { id: string }>(itens: T[], fila: Marcacao[], tabela: TabelaMarcavel): T[] {
  return itens.map((i) => {
    const m = fila.find((x) => x.tabela === tabela && x.id === i.id)
    return m ? { ...i, ...m.campos } : i
  })
}

// ---------- Itens criados sem internet ----------
// Cada item já nasce com o id gerado no aparelho: mandar duas vezes não duplica.

export type Criacao = { tabela: 'itens_lista'; linha: { id: string; viagem_id: string } & Record<string, unknown>; quando: number }

// O que a tela mostra: o que veio do banco + o que está na fila (sem repetir)
export function comCriacoesPendentes<T extends { id: string }>(itens: T[], criacoes: Criacao[], tabela: Criacao['tabela'], viagemId: string): T[] {
  const ids = new Set(itens.map((i) => i.id))
  const pendentes = criacoes.filter((c) => c.tabela === tabela && c.linha.viagem_id === viagemId && !ids.has(c.linha.id)).map((c) => c.linha as unknown as T)
  return [...itens, ...pendentes]
}
