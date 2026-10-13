// Regras de ordem do roteiro. Funções "puras": recebem uma lista e devolvem outra nova,
// sem falar com o banco. Assim dá pra testar fácil e reaproveitar (inclusive na sugestão de rota futura).

// Troca um item de lugar com o vizinho de cima (-1) ou de baixo (+1)
export function mover<T>(lista: T[], indice: number, direcao: -1 | 1): T[] {
  const alvo = indice + direcao
  if (alvo < 0 || alvo >= lista.length) return lista
  const nova = [...lista]
  ;[nova[indice], nova[alvo]] = [nova[alvo], nova[indice]]
  return nova
}

// Reordena a lista seguindo uma sequência de chaves. Se a sequência não tiver
// exatamente os mesmos itens (nem a mais, nem a menos), devolve a lista como está.
export function aplicarOrdem<T extends { chave: string }>(lista: T[], chavesNaOrdem: string[]): T[] {
  const porChave = new Map(lista.map((item) => [item.chave, item]))
  const mesmosItens =
    chavesNaOrdem.length === lista.length &&
    new Set(chavesNaOrdem).size === lista.length &&
    chavesNaOrdem.every((chave) => porChave.has(chave))
  if (!mesmosItens) return lista
  return chavesNaOrdem.map((chave) => porChave.get(chave)!)
}

// Avisa se algum destino com data de chegada aparece antes de outro que chega mais cedo.
// Só avisa: as datas nunca são mudadas sozinhas.
export function datasForaDeOrdem(lista: { chegada?: string | null }[]): boolean {
  const datas = lista.map((item) => item.chegada).filter((data): data is string => Boolean(data))
  return datas.some((data, i) => i > 0 && data < datas[i - 1])
}

/**
 * Formato de uma futura SUGESTÃO de ordem (ainda não existe na tela).
 * - É só uma proposta: a pessoa vê e decide se aceita. Aceitar = aplicarOrdem(lista, chavesNaOrdem).
 * - `fonte` é obrigatória: nenhuma sugestão pode aparecer sem dizer de onde vêm os dados
 *   (ex.: "Distância em linha reta (cálculo próprio)" ou o nome de uma API de rotas/transportes).
 * - Nada de tempos ou preços de transporte inventados: só mostrar o que a fonte realmente informa.
 */
export type SugestaoDeOrdem = {
  chavesNaOrdem: string[]
  motivo: string
  fonte: string
}
