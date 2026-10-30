// Lugares da viagem com os votos do comboio (specs 016 e 022), pro app mobile.
// A web tem a versão dela em apps/web/src/features/lugares; aqui fica o mínimo que o mobile usa.
// Testado em apps/web/tests/lugares-core.test.mjs.
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

export type TipoDoLugar = 'passeio' | 'comida' | 'guarda_volumes' | 'outro'

// Mesmos tipos da tabela `lugares`, na ordem em que aparecem na tela
export const TIPOS_DO_LUGAR: { chave: TipoDoLugar; nome: string }[] = [
  { chave: 'passeio', nome: 'Passeio' },
  { chave: 'comida', nome: 'Comida' },
  { chave: 'guarda_volumes', nome: 'Guarda-volumes' },
  { chave: 'outro', nome: 'Outro' },
]

export type LugarComVotos = Tables<'lugares'> & { votos: string[]; prioridades: string[] }

export async function buscarLugaresComVotos(cli: ClienteTogether, viagemId: string): Promise<LugarComVotos[]> {
  const { data, error } = await cli
    .from('lugares')
    .select('*, lugar_votos (usuario_id), lugar_prioridades (usuario_id)')
    .eq('viagem_id', viagemId)
    .order('criado_em')
  if (error) throw error
  return (data ?? []).map(({ lugar_votos, lugar_prioridades, ...l }) => ({
    ...l,
    votos: (lugar_votos ?? []).map((v) => v.usuario_id),
    prioridades: (lugar_prioridades ?? []).map((p) => p.usuario_id),
  }))
}

// Curtir ou descurtir. Voto repetido não é erro.
export async function votarNoLugar(cli: ClienteTogether, lugarId: string, meuId: string, sim: boolean) {
  const { error } = sim
    ? await cli.from('lugar_votos').insert({ lugar_id: lugarId, usuario_id: meuId })
    : await cli.from('lugar_votos').delete().eq('lugar_id', lugarId).eq('usuario_id', meuId)
  if (error && error.code !== '23505') throw error
}

export async function criarLugar(
  cli: ClienteTogether,
  viagemId: string,
  dados: { destinoId: string | null; tipo: TipoDoLugar; nome: string; observacao: string | null; moeda: string },
) {
  const { error } = await cli.from('lugares').insert({
    viagem_id: viagemId,
    destino_id: dados.destinoId,
    tipo: dados.tipo,
    nome: dados.nome.trim(),
    observacao: dados.observacao?.trim() || null,
    moeda: dados.moeda,
  })
  if (error) throw error
}

// Agrupa por destino na ordem do roteiro. Dentro do destino: mais votados primeiro, empate pela ordem em que foram anotados.
// Lugares sem destino (ou de um destino que saiu do roteiro) vão pro grupo "Outros", no fim.
export function agruparLugares<D extends { id: string; nome: string }>(destinos: D[], lugares: LugarComVotos[]) {
  const ordenar = (lista: LugarComVotos[]) =>
    lista.map((l, i) => ({ l, i })).sort((a, b) => b.l.votos.length - a.l.votos.length || a.i - b.i).map(({ l }) => l)
  const grupos = destinos
    .map((d) => ({ chave: d.id, titulo: d.nome, lugares: ordenar(lugares.filter((l) => l.destino_id === d.id)) }))
    .filter((g) => g.lugares.length > 0)
  const soltos = lugares.filter((l) => !l.destino_id || !destinos.some((d) => d.id === l.destino_id))
  if (soltos.length) grupos.push({ chave: 'soltos', titulo: 'Outros', lugares: ordenar(soltos) })
  return grupos
}

// Google Maps com a busca "Nome do lugar, Cidade" (sem chave de API)
export function lugarNoMapa(nome: string, cidade?: string | null) {
  const busca = cidade ? `${nome}, ${cidade}` : nome
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}`
}
