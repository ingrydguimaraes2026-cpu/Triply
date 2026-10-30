// Montar os dias pelos votos (spec 096): uma proposta de quais lugares fazer em cada dia
// de um destino. Quem "não abre mão" primeiro, depois os mais votados; lugares perto
// ficam no mesmo dia. A pessoa vê a proposta e escolhe aplicar ou descartar.
// Puro, pra dar pra testar.

export type LugarParaMontar = {
  id: string
  nome: string
  tipo: string // 'passeio' | 'comida' | 'guarda_volumes' | 'outro'
  votos: number
  prioridades: number
  latitude?: number | null
  longitude?: number | null
  endereco?: string | null
}

export type ItemProposto = { lugarId: string; nome: string; hora: string; local: string | null }
export type DiaProposto = { dia: string; itens: ItemProposto[] }

const HORAS_DOS_PASSEIOS = ['10:00', '15:00', '17:30']
const HORA_DA_COMIDA = '13:00'

const comPonto = (l: LugarParaMontar) => l.latitude != null && l.longitude != null
function distancia(a: LugarParaMontar, b: LugarParaMontar): number {
  if (!comPonto(a) || !comPonto(b)) return Number.POSITIVE_INFINITY
  // Aproximação boa pra distâncias de cidade (graus → km)
  const dLat = (a.latitude! - b.latitude!) * 111
  const dLng = (a.longitude! - b.longitude!) * 111 * Math.cos((a.latitude! * Math.PI) / 180)
  return Math.hypot(dLat, dLng)
}

const pontuacao = (a: LugarParaMontar, b: LugarParaMontar) =>
  b.prioridades - a.prioridades || b.votos - a.votos || a.nome.localeCompare(b.nome)

// Ordem de visita dentro do dia: começa no mais importante e vai pro mais perto
function ordenarPorCaminho(lugares: LugarParaMontar[]): LugarParaMontar[] {
  if (lugares.length <= 2) return lugares
  const resto = [...lugares]
  const caminho = [resto.shift()!]
  while (resto.length) {
    const ultimo = caminho[caminho.length - 1]
    let melhor = 0
    for (let i = 1; i < resto.length; i++) if (distancia(ultimo, resto[i]) < distancia(ultimo, resto[melhor])) melhor = i
    caminho.push(resto.splice(melhor, 1)[0])
  }
  return caminho
}

export function montarDiasPelosVotos(
  dias: string[],
  lugares: LugarParaMontar[],
  porDia = 3,
): { dias: DiaProposto[]; sobraram: string[] } {
  if (dias.length === 0) return { dias: [], sobraram: lugares.map((l) => l.nome) }
  const passeios = lugares.filter((l) => l.tipo === 'passeio' || l.tipo === 'outro').sort(pontuacao)
  const comidas = lugares.filter((l) => l.tipo === 'comida').sort(pontuacao)

  // Cada dia começa com um dos mais importantes; o resto vai pro dia com o "começo" mais perto (e com vaga)
  const grupos: LugarParaMontar[][] = dias.map(() => [])
  const sobraram: string[] = []
  passeios.forEach((l, i) => {
    if (i < dias.length) {
      grupos[i].push(l)
      return
    }
    const comVaga = grupos.map((g, j) => ({ g, j })).filter(({ g }) => g.length < porDia)
    if (comVaga.length === 0) return sobraram.push(l.nome)
    const perto = comVaga.reduce((a, b) => (distancia(l, b.g[0]) < distancia(l, a.g[0]) ? b : a))
    // Sem coordenada: vai pro dia com menos coisa
    const alvo = Number.isFinite(distancia(l, perto.g[0])) ? perto : comVaga.reduce((a, b) => (b.g.length < a.g.length ? b : a))
    alvo.g.push(l)
  })
  comidas.slice(dias.length).forEach((c) => sobraram.push(c.nome))

  const propostos = dias.map((dia, i) => {
    const ordem = ordenarPorCaminho(grupos[i])
    const itens: ItemProposto[] = ordem.map((l, k) => ({ lugarId: l.id, nome: l.nome, hora: HORAS_DOS_PASSEIOS[k] ?? '', local: l.endereco ?? null }))
    const comida = comidas[i]
    if (comida) itens.splice(Math.min(1, itens.length), 0, { lugarId: comida.id, nome: comida.nome, hora: HORA_DA_COMIDA, local: comida.endereco ?? null })
    return { dia, itens }
  })
  return { dias: propostos.filter((d) => d.itens.length > 0), sobraram }
}
