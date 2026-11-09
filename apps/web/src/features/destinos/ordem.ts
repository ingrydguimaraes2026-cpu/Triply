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

// ---------- Sugestão de ordem (spec 076) ----------
// Vizinho mais perto, a partir do PRIMEIRO destino (o ponto de partida fica onde está).
// Só sugere quando economiza pelo menos 10% e 30 km. Itens sem coordenada ficam no fim, na ordem de antes.

type ComPonto = { chave: string; latitude: number | null; longitude: number | null }

function km(a: ComPonto, b: ComPonto): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const h =
    Math.sin(rad(b.latitude! - a.latitude!) / 2) ** 2 + Math.cos(rad(a.latitude!)) * Math.cos(rad(b.latitude!)) * Math.sin(rad(b.longitude! - a.longitude!) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

function totalKm(lista: ComPonto[]): number {
  let soma = 0
  for (let i = 1; i < lista.length; i++) soma += km(lista[i - 1], lista[i])
  return soma
}

export function sugerirOrdem(lista: ComPonto[]): (SugestaoDeOrdem & { economiaKm: number }) | null {
  const comPonto = lista.filter((d) => d.latitude !== null && d.longitude !== null)
  const semPonto = lista.filter((d) => d.latitude === null || d.longitude === null)
  if (comPonto.length < 3) return null
  const [primeiro, ...resto] = comPonto
  const caminho = [primeiro]
  const faltam = [...resto]
  while (faltam.length) {
    const atual = caminho[caminho.length - 1]
    let melhor = 0
    for (let i = 1; i < faltam.length; i++) if (km(atual, faltam[i]) < km(atual, faltam[melhor])) melhor = i
    caminho.push(...faltam.splice(melhor, 1))
  }
  const antes = totalKm(comPonto)
  const depois = totalKm(caminho)
  const economia = antes - depois
  if (economia < 30 || economia < antes * 0.1) return null
  return {
    chavesNaOrdem: [...caminho, ...semPonto].map((d) => d.chave),
    motivo: `Essa ordem anda uns ${Math.round(economia)} km a menos (de ${Math.round(antes)} pra ${Math.round(depois)} km).`,
    fonte: 'Distância em linha reta entre as cidades (cálculo próprio, sem trânsito nem horários)',
    economiaKm: Math.round(economia),
  }
}
