// Spec 122c: opções de um mesmo deslocamento (mesmo `grupo_opcoes`) lado a lado.
// Folga depois do deslocamento anterior, duração, selos ("Mais folga", "Mais rápido", "Mais barato")
// e a hora em que o grupo fica livre no dia. Usado pelo app (comparar, novo-deslocamento) e pelo site (Passagens).
// Funções puras, menos `escolherOpcaoDoDeslocamento` (grava no banco). Teste: apps/web/tests/opcoes-do-deslocamento.test.mjs
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'
import { diaNoFuso } from './agenda.ts'
import { FOLGA_MINIMA } from './avisos-do-dia.ts'

type Trajeto = Pick<Tables<'trajetos'>, 'id' | 'partida' | 'chegada'> &
  Partial<Pick<Tables<'trajetos'>, 'de_texto' | 'grupo_opcoes' | 'escolhida' | 'preco' | 'situacao'>>

export type Folga = { minutos: number; de: string }

// Folga de uma opção: da chegada do deslocamento anterior no mesmo dia (de fora do grupo) até a saída dela
export function folgaDaOpcao(opcao: Trajeto, todos: Trajeto[]): Folga | null {
  if (!opcao.partida) return null
  const dia = diaNoFuso(opcao.partida)
  const anteriores = todos.filter(
    (t) => t.grupo_opcoes !== opcao.grupo_opcoes && t.chegada && t.partida && diaNoFuso(t.partida) === dia && t.chegada <= opcao.partida!,
  )
  const anterior = anteriores.sort((a, b) => b.chegada!.localeCompare(a.chegada!))[0]
  if (!anterior) return null
  return { minutos: Math.round((new Date(opcao.partida).getTime() - new Date(anterior.chegada!).getTime()) / 60000), de: anterior.de_texto ?? '' }
}

export function duracaoDaOpcao(t: Pick<Trajeto, 'partida' | 'chegada'>): number | null {
  return t.partida && t.chegada ? Math.round((new Date(t.chegada).getTime() - new Date(t.partida).getTime()) / 60000) : null
}

// Índice do melhor valor (maior ou menor). Só quando 2 ou mais têm o dado; senão -1.
function melhor(valores: (number | null)[], maior: boolean): number {
  const com = valores.map((v, i) => ({ v, i })).filter((x) => x.v != null) as { v: number; i: number }[]
  if (com.length < 2) return -1
  return com.sort((a, b) => (maior ? b.v - a.v : a.v - b.v))[0].i
}

export type LinhaDaComparacao<T> = {
  opcao: T
  folga: Folga | null
  folgaCurta: boolean
  duracao: number | null
  selos: string[] // "Mais folga", "Mais rápido", "Mais barato"
  escolhida: boolean
}

// Opções em ordem de saída, com folga, duração e selos. `escolhida` só vale quando há uma marcada e outra não.
export function compararOpcoes<T extends Trajeto>(opcoes: T[], todos: Trajeto[]): LinhaDaComparacao<T>[] {
  const lista = [...opcoes].sort((a, b) => (a.partida ?? '9').localeCompare(b.partida ?? '9'))
  const folgas = lista.map((o) => folgaDaOpcao(o, todos))
  const duracoes = lista.map(duracaoDaOpcao)
  const maisFolga = melhor(folgas.map((f) => f?.minutos ?? null), true)
  const maisRapido = melhor(duracoes, false)
  const maisBarato = melhor(lista.map((o) => (o.preco != null ? Number(o.preco) : null)), false)
  const temEscolhida = lista.length > 1 && lista.some((o) => o.escolhida) && lista.some((o) => !o.escolhida)
  return lista.map((opcao, i) => ({
    opcao,
    folga: folgas[i],
    folgaCurta: folgas[i] != null && folgas[i]!.minutos < FOLGA_MINIMA,
    duracao: duracoes[i],
    selos: [i === maisFolga ? 'Mais folga' : null, i === maisRapido ? 'Mais rápido' : null, i === maisBarato ? 'Mais barato' : null].filter(Boolean) as string[],
    escolhida: temEscolhida && !!opcao.escolhida,
  }))
}

// A que horas o grupo fica livre no dia: a última chegada de outro deslocamento (fora do mesmo grupo)
export function livreNoDia(trajetos: Trajeto[], dia: string, ignorarId: string | null, grupo: string | null): { quando: string; de: string } | null {
  const doDia = trajetos.filter((t) => t.id !== ignorarId && t.chegada && t.partida && diaNoFuso(t.partida) === dia && (t.grupo_opcoes ?? null) !== grupo)
  const ultimo = doDia.sort((a, b) => b.chegada!.localeCompare(a.chegada!))[0]
  return ultimo ? { quando: ultimo.chegada!, de: ultimo.de_texto ?? '' } : null
}

export const textoDasTrocas = (n: number) => (n === 0 ? 'direto' : n === 1 ? '1 troca' : `${n} trocas`)
export const textoDaFrequencia = (min: number) => (min >= 60 && min % 60 === 0 ? `a cada ${min / 60}h` : `a cada ${min} min`)

// Escolher uma opção é decidir: desmarca as outras do grupo e marca esta (sugestão vira "decidido").
// O banco só deixa o ADM ou quem ele liberou (erro 42501 pros outros).
export async function escolherOpcaoDoDeslocamento(
  sb: ClienteTogether,
  grupo: string,
  opcao: { id: string; situacao: string | null },
): Promise<void> {
  const a = await sb.from('trajetos').update({ escolhida: false }).eq('grupo_opcoes', grupo)
  if (a.error) throw a.error
  const situacao = (opcao.situacao ?? 'sugestao') === 'sugestao' ? 'decidido' : opcao.situacao!
  const b = await sb.from('trajetos').update({ escolhida: true, situacao }).eq('id', opcao.id)
  if (b.error) throw b.error
}
