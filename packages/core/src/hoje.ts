// Tela Hoje (spec 058): o que está acontecendo agora e o que vem depois.
// Puro, testado em apps/web/tests/hoje.test.mjs.

type ComHora = { hora: string } // "08:30" ou "" (sem hora)

// "Agora" = o último item com hora que já começou (até 2 h atrás); "próximo" = o primeiro que ainda não começou
export function agoraEProximo<I extends ComHora>(itens: I[], horaAtual: string): { agora: I | null; proximo: I | null } {
  const comHora = itens.filter((i) => i.hora).sort((a, b) => a.hora.localeCompare(b.hora))
  const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
  const atual = minutos(horaAtual)
  const comecados = comHora.filter((i) => minutos(i.hora) <= atual)
  const ultimo = comecados[comecados.length - 1]
  const agora = ultimo && atual - minutos(ultimo.hora) <= 120 ? ultimo : null
  const proximo = comHora.find((i) => minutos(i.hora) > atual) ?? null
  return { agora, proximo }
}

// "em 25 min" / "em 2 h 10 min" a partir de duas horas "HH:MM" do mesmo dia
export function faltaPara(hora: string, horaAtual: string): string {
  const m = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
  const dif = m(hora) - m(horaAtual)
  if (dif <= 0) return 'agora'
  if (dif < 60) return `em ${dif} min`
  return dif % 60 ? `em ${Math.floor(dif / 60)} h ${dif % 60} min` : `em ${dif / 60} h`
}

// Dia de passagem (spec 060 / J5): hoje o comboio sai do destino (bate-e-volta de 0 noites ou troca de cidade)?
// Devolve a primeira saída do dia, pra mostrar "saída 15:40 pra Roma" e lembrar das malas.
type DestinoP = { id: string; nome: string; chegada: string | null; saida: string | null }
type TrajetoP = { origem_id: string | null; destino_id: string | null; partida: string | null }

export function diaDePassagem(
  dia: string,
  onde: DestinoP | undefined,
  trajetos: TrajetoP[],
  destinos: DestinoP[],
  diaDe: (instante: string) => string,
  horaDe: (instante: string) => string,
): { tipo: 'passagem' | 'mudanca'; saida: { hora: string; para: string } | null } | null {
  if (!onde) return null
  const saidas = trajetos
    .filter((t) => t.origem_id === onde.id && t.partida && diaDe(t.partida) === dia)
    .sort((a, b) => a.partida!.localeCompare(b.partida!))
  const primeira = saidas[0]
  const saida = primeira ? { hora: horaDe(primeira.partida!), para: destinos.find((d) => d.id === primeira.destino_id)?.nome ?? '?' } : null
  if (onde.chegada === dia && onde.saida === dia) return { tipo: 'passagem', saida }
  if (onde.saida === dia || saida) return { tipo: 'mudanca', saida }
  return null
}

// Tempo entre compromissos (spec 077). Sem API de rota: avisa quando um compromisso começa
// antes do anterior acabar (ex.: jantar marcado com o trem ainda andando) ou com menos de `folga` min.
export function compromissosApertados(
  itens: { chave: string; hora: string; titulo: string; fim?: string }[],
  folga = 30,
): Record<string, { tipo: 'conflito' | 'apertado'; com: string; minutos: number }> {
  const m = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
  const comHora = itens.filter((i) => i.hora).sort((a, b) => a.hora.localeCompare(b.hora))
  const saida: Record<string, { tipo: 'conflito' | 'apertado'; com: string; minutos: number }> = {}
  for (let i = 1; i < comHora.length; i++) {
    const antes = comHora[i - 1]
    const agora = comHora[i]
    const termina = antes.fim ? m(antes.fim) : m(antes.hora)
    const minutos = m(agora.hora) - termina
    if (antes.fim && minutos < 0) saida[agora.chave] = { tipo: 'conflito', com: antes.titulo, minutos }
    else if (minutos >= 0 && minutos < folga && agora.hora !== antes.hora) saida[agora.chave] = { tipo: 'apertado', com: antes.titulo, minutos }
  }
  return saida
}
