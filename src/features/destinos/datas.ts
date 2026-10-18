// Regras de datas do roteiro (spec 001). Funções puras, testadas em tests/datas.test.mjs.
// Datas são texto "2026-11-12": comparar texto funciona e evita problema de fuso horário.

type ComDatas = { nome: string; chegada?: string | null; saida?: string | null }

// "2026-11-12" → número de dias desde 1970, sem fuso horário
function dia(data: string) {
  const [a, m, d] = data.split('-').map(Number)
  return Date.UTC(a, m - 1, d) / 86_400_000
}

// Chegada 12, saída 15 → 3 noites. Sem as duas datas → null.
export function contarNoites(chegada?: string | null, saida?: string | null): number | null {
  if (!chegada || !saida) return null
  const noites = dia(saida) - dia(chegada)
  return noites >= 0 ? noites : null
}

// Data de hoje no celular, em "2026-11-12"
export function hojeTexto(agora = new Date()): string {
  const m = String(agora.getMonth() + 1).padStart(2, '0')
  const d = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${m}-${d}`
}

export type AvisoDeData = { tipo: 'bloqueia' | 'aviso'; texto: string; indice?: number }

/**
 * Avisos das datas do roteiro (sem mudar nada sozinho):
 * - saída antes da chegada (bloqueia o salvar);
 * - fora do período da viagem;
 * - dois destinos se sobrepõem;
 * - buraco de dias sem destino.
 */
export function avisosDasDatas(itens: ComDatas[], inicio: string | null, fim: string | null): AvisoDeData[] {
  const avisos: AvisoDeData[] = []
  itens.forEach((item, indice) => {
    if (item.chegada && item.saida && item.saida < item.chegada) {
      avisos.push({ tipo: 'bloqueia', indice, texto: `${item.nome}: a saída está antes da chegada.` })
    }
    const fora = [item.chegada, item.saida].some((d) => d && ((inicio && d < inicio) || (fim && d > fim)))
    if (fora) avisos.push({ tipo: 'aviso', indice, texto: `${item.nome}: data fora do período da viagem.` })
  })

  // Sobreposição e buraco: olha os destinos com as duas datas, em ordem de chegada
  const comDatas = itens
    .filter((i): i is ComDatas & { chegada: string; saida: string } => Boolean(i.chegada && i.saida && i.saida >= i.chegada))
    .sort((a, b) => a.chegada.localeCompare(b.chegada))
  for (let k = 1; k < comDatas.length; k++) {
    const antes = comDatas[k - 1]
    const depois = comDatas[k]
    // Sair e chegar no mesmo dia é o normal (dia de viagem); sobrepor é chegar antes de sair do anterior
    if (depois.chegada < antes.saida) {
      avisos.push({ tipo: 'aviso', texto: `${antes.nome} e ${depois.nome} se sobrepõem.` })
    } else if (dia(depois.chegada) - dia(antes.saida) > 1) {
      const dias = dia(depois.chegada) - dia(antes.saida) - 1
      avisos.push({
        tipo: 'aviso',
        texto: `${dias} ${dias === 1 ? 'dia' : 'dias'} sem destino entre ${antes.nome} e ${depois.nome}.`,
      })
    }
  }
  return avisos
}

// Primeira chegada e última saída (pra sugerir o período da viagem)
export function periodoDosDestinos(itens: ComDatas[]): { inicio: string; fim: string } | null {
  const chegadas = itens.map((i) => i.chegada).filter((d): d is string => Boolean(d)).sort()
  const saidas = itens.map((i) => i.saida).filter((d): d is string => Boolean(d)).sort()
  if (chegadas.length === 0 || saidas.length === 0) return null
  return { inicio: chegadas[0], fim: saidas.at(-1)! }
}

// Índice do destino em que o comboio está hoje (chegada ≤ hoje ≤ saída), ou -1
export function destinoDeHoje(itens: ComDatas[], hoje: string): number {
  return itens.findIndex((i) => i.chegada && i.chegada <= hoje && (i.saida ? hoje <= i.saida : hoje === i.chegada))
}

// 3 → "3 noites"; 0 → "bate-e-volta"
export function textoNoites(noites: number) {
  return noites === 0 ? 'bate-e-volta' : `${noites} ${noites === 1 ? 'noite' : 'noites'}`
}