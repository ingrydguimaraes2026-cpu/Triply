// "Há 1 ano vocês estavam em..." (spec 118d): no dia em que faz 1, 2, 3... anos de um carimbo,
// o Início mostra o cartão "neste dia" e o celular avisa (no máximo 1 aviso por dia).
// Viagem antiga (118f) só guarda o mês: a lembrança cai no dia 1 do mês e fala "em julho de 2019".
// Sem tabela nova: lê os carimbos e as viagens. Teste: apps/web/tests/ha-um-ano.test.mjs

import type { ClienteTogether } from './supabase'
import { buscarCarimbos, type Carimbo } from './carimbos.ts'
import { buscarPostsDaViagem, type PostDaViagem } from './posts.ts'

export type CarimboDaLembranca = { viagem_id: string; nome: string; data: string }
export type ViagemDaLembranca = { id: string; nome?: string; tipo?: string | null }

export type Lembranca = {
  viagemId: string
  data: string // o dia do carimbo (AAAA-MM-DD)
  anos: number
  lugares: string[] // na ordem em que caíram, sem repetir
  soOMes: boolean // viagem antiga: só sabe o mês
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const bissexto = (ano: number) => (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0

// O carimbo faz aniversário hoje? 29/02 comemora em 28/02 nos anos que não são bissextos.
export function fazAniversario(dia: string, hoje: string): boolean {
  if (dia.slice(0, 4) >= hoje.slice(0, 4)) return false
  const md = dia.slice(5)
  const mdHoje = hoje.slice(5)
  if (md === mdHoje) return true
  return md === '02-29' && mdHoje === '02-28' && !bissexto(Number(hoje.slice(0, 4)))
}

// Todas as lembranças de hoje, uma por viagem e ano (a mais recente primeiro)
export function lembrancasDeHoje(carimbos: CarimboDaLembranca[], viagens: ViagemDaLembranca[], hoje: string): Lembranca[] {
  const antiga = new Set(viagens.filter((v) => v.tipo === 'antiga').map((v) => v.id))
  const porChave = new Map<string, Lembranca>()
  for (const c of [...carimbos].sort((a, b) => a.data.localeCompare(b.data))) {
    if (!fazAniversario(c.data, hoje)) continue
    const k = `${c.viagem_id}|${c.data.slice(0, 4)}`
    const l = porChave.get(k) ?? { viagemId: c.viagem_id, data: c.data, anos: Number(hoje.slice(0, 4)) - Number(c.data.slice(0, 4)), lugares: [], soOMes: antiga.has(c.viagem_id) }
    if (!l.lugares.includes(c.nome)) l.lugares.push(c.nome)
    porChave.set(k, l)
  }
  return [...porChave.values()].sort((a, b) => a.anos - b.anos || b.lugares.length - a.lugares.length)
}

// "Floripa", "Floripa e Garopaba", "Floripa, Garopaba e mais 2"
export function juntarLugares(lugares: string[]): string {
  if (lugares.length <= 1) return lugares[0] ?? ''
  if (lugares.length === 2) return `${lugares[0]} e ${lugares[1]}`
  return `${lugares[0]}, ${lugares[1]} e mais ${lugares.length - 2}`
}

// O texto do aviso e do cartão. `sozinho`: só a pessoa carimbou na viagem (aí é "você", não "vocês")
export function textoDaLembranca(l: Lembranca, sozinho = false): { titulo: string; detalhe: string } {
  const tempo = l.anos === 1 ? 'Há 1 ano' : `Há ${l.anos} anos`
  const quem = sozinho ? 'você estava' : 'vocês estavam'
  const quando = l.soOMes ? `${MESES[Number(l.data.slice(5, 7)) - 1]} de ${l.data.slice(0, 4)}` : `${Number(l.data.slice(8, 10))} de ${MESES[Number(l.data.slice(5, 7)) - 1]} de ${l.data.slice(0, 4)}`
  return { titulo: `${tempo} ${quem} em ${juntarLugares(l.lugares)}`, detalhe: l.soOMes ? `Em ${quando}` : quando }
}

// Fotos da lembrança: as postadas naquele dia (mais curtidas primeiro); sem nenhuma, as 3 mais curtidas da viagem
export function fotosDaLembranca<P extends { criado_em: string; curtidas: unknown[] }>(posts: P[], dia: string, diaLocal: (iso: string) => string): P[] {
  const porCurtida = (a: P, b: P) => b.curtidas.length - a.curtidas.length || a.criado_em.localeCompare(b.criado_em)
  const doDia = posts.filter((p) => diaLocal(p.criado_em) === dia).sort(porCurtida)
  return doDia.length ? doDia : [...posts].sort(porCurtida).slice(0, 3)
}

// Tudo da tela da lembrança: a viagem, os carimbos daquele dia, as fotos e quem estava
export type DadosDaLembranca = { nome: string; lembranca: Lembranca | null; carimbos: Carimbo[]; posts: PostDaViagem[]; pessoas: string[] }

export async function buscarLembranca(cli: ClienteTogether, viagemId: string, dia: string, hoje: string): Promise<DadosDaLembranca> {
  const [viagem, carimbos, posts, membros] = await Promise.all([
    cli.from('viagens').select('nome, tipo').eq('id', viagemId).maybeSingle(),
    buscarCarimbos(cli, viagemId),
    buscarPostsDaViagem(cli, viagemId),
    cli.from('comboio_membros').select('usuario_id').eq('viagem_id', viagemId),
  ])
  if (viagem.error) throw viagem.error
  if (!viagem.data) throw new Error('Viagem não encontrada.')
  const ids = (membros.data ?? []).map((m) => m.usuario_id)
  const perfis = ids.length ? await cli.from('perfis').select('id, nome').in('id', ids) : { data: [] as { id: string; nome: string | null }[] }
  const doDia = carimbos.filter((c) => c.data === dia)
  // Abriu fora do aniversário (ex.: tocou no aviso no dia seguinte): monta a lembrança assim mesmo
  const ano = Number(dia.slice(0, 4))
  const anos = Math.max(1, Number(hoje.slice(0, 4)) - ano)
  const lembranca: Lembranca | null = doDia.length
    ? { viagemId, data: dia, anos, lugares: [...new Set(doDia.map((c) => c.nome))], soOMes: viagem.data.tipo === 'antiga' }
    : null
  return { nome: viagem.data.nome, lembranca, carimbos: doDia, posts, pessoas: (perfis.data ?? []).map((p) => p.nome ?? 'Alguém') }
}
