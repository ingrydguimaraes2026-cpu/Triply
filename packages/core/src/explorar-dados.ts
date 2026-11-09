// Explorar (specs 114 e 115): acesso ao banco, igual pro app e pro site (recebe o cliente do Supabase).
// Regra de ouro: o app nunca chama Wikidata/Open-Meteo. Cidade pronta vem direto do banco;
// cidade nova pede pra função "explorar-cidade", que monta uma vez e guarda pra todo mundo.
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'
import { chaveDaCidade, type Escolha, type EstiloId, type LugarDoCatalogo, type TipoDoCatalogo } from './explorar'
import { ehPontoDePartida } from './explorar-cidades'
import { codigoDoPais } from './paises'
import { lerDiasDoRoteiro, type DiasDoRoteiro } from './roteiro'

type DestinoDoExplorar = Pick<Tables<'destinos'>, 'id' | 'nome' | 'pais'>
export type CatalogoDaCidade = { lugares: LugarDoCatalogo[]; regiao: boolean }

export const lugarDoCatalogo = (r: Tables<'catalogo_lugares'>): LugarDoCatalogo => ({
  id: r.id,
  wikidata: r.wikidata,
  nome: r.nome,
  bairro: r.bairro,
  tipo: r.tipo as TipoDoCatalogo,
  estilos: (r.estilos ?? []) as EstiloId[],
  fama: r.fama,
  latitude: r.latitude,
  longitude: r.longitude,
  porQue: r.por_que,
  sobre: r.sobre,
  tempoMin: r.tempo_min,
  gratis: r.gratis,
  melhorHora: r.melhor_hora,
  fotoUrl: r.foto_url,
  fotoAutor: r.foto_autor,
  fotoLicenca: r.foto_licenca,
  fotoPagina: r.foto_pagina,
  linkWikipedia: r.link_wikipedia,
})

// `aoPreparar` avisa a tela quando a cidade é nova (pode levar até ~30 s)
export async function carregarCatalogoDaCidade(cli: ClienteTogether, destino: DestinoDoExplorar, aoPreparar?: () => void): Promise<CatalogoDaCidade> {
  const pais = codigoDoPais(destino.pais)
  const { data: cidade } = await cli.from('catalogo_cidades').select('id, situacao, regiao').eq('chave', chaveDaCidade(destino.nome, pais)).maybeSingle()
  if (cidade?.situacao === 'pronta') {
    const { data, error } = await cli.from('catalogo_lugares').select('*').eq('cidade_id', cidade.id).order('fama', { ascending: false }).limit(80)
    if (error) throw error
    return { lugares: (data ?? []).map(lugarDoCatalogo), regiao: cidade.regiao }
  }
  aoPreparar?.()
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const { data, error } = await cli.functions.invoke('explorar-cidade', {
      body: { nome: destino.nome, pais, busca: [destino.nome, destino.pais].filter(Boolean).join(', ') },
    })
    if (error) {
      // A função manda a mensagem no corpo (ex.: limite de 5 cidades por dia)
      const corpo = await (error as { context?: { json?: () => Promise<{ erro?: string }> } }).context?.json?.().catch(() => null)
      throw new Error(corpo?.erro ?? 'Não deu pra carregar os lugares agora.')
    }
    if (data?.situacao === 'pronta') return { lugares: (data.lugares ?? []).map(lugarDoCatalogo), regiao: !!data.cidade?.regiao }
    // Alguém já está preparando essa cidade: espera e pergunta de novo
    await new Promise<void>((r) => setTimeout(() => r(), 5000))
  }
  throw new Error('A cidade ainda está sendo preparada. Tente de novo em um minuto.')
}

// ---------- Capa da viagem ----------
// Foto do lugar mais famoso do primeiro destino que tem catálogo do Explorar. Viagem sem catálogo fica fora
// (a tela usa a capa genérica de `capaDaViagem`).
export async function fotosDasCapas(cli: ClienteTogether, viagemIds: string[]): Promise<Record<string, string>> {
  if (viagemIds.length === 0) return {}
  const { data: destinos, error } = await cli.from('destinos').select('viagem_id, nome, pais, ordem').in('viagem_id', viagemIds).order('ordem')
  if (error) throw error
  const chavesDe = new Map<string, string[]>() // viagem → chaves das cidades, na ordem dos destinos
  for (const d of (destinos ?? []).filter((d) => !ehPontoDePartida(d.nome))) chavesDe.set(d.viagem_id, [...(chavesDe.get(d.viagem_id) ?? []), chaveDaCidade(d.nome, codigoDoPais(d.pais))])
  const todas = [...new Set([...chavesDe.values()].flat())]
  const { data: cidades } = await cli.from('catalogo_cidades').select('id, chave').in('chave', todas).eq('situacao', 'pronta')
  if (!cidades?.length) return {}
  const { data: lugares } = await cli
    .from('catalogo_lugares')
    .select('cidade_id, foto_url')
    .in('cidade_id', cidades.map((c) => c.id))
    .not('foto_url', 'is', null)
    .order('fama', { ascending: false })
    .limit(cidades.length * 60)
  const fotoDaCidade = new Map<string, string>()
  for (const l of lugares ?? []) if (l.foto_url && !fotoDaCidade.has(l.cidade_id)) fotoDaCidade.set(l.cidade_id, l.foto_url)
  const cidadeDaChave = new Map(cidades.map((c) => [c.chave, c.id]))
  const capas: Record<string, string> = {}
  // Primeiro destino com foto (pula aeroporto e cidade sem catálogo)
  for (const [viagem, chaves] of chavesDe) {
    const foto = chaves.map((c) => fotoDaCidade.get(cidadeDaChave.get(c) ?? '')).find(Boolean)
    if (foto) capas[viagem] = foto
  }
  return capas
}

// ---------- Minhas escolhas (só eu vejo) ----------
export async function buscarMinhasEscolhas(cli: ClienteTogether, destinoId: string, meuId: string): Promise<Record<string, Escolha>> {
  const { data, error } = await cli.from('explorar_escolhas').select('catalogo_lugar_id, escolha').eq('destino_id', destinoId).eq('usuario_id', meuId)
  if (error) throw error
  return Object.fromEntries((data ?? []).map((e) => [e.catalogo_lugar_id, e.escolha as Escolha]))
}

export async function salvarEscolhaDoExplorar(cli: ClienteTogether, viagemId: string, destinoId: string, meuId: string, catalogoId: string, escolha: Escolha) {
  const { error } = await cli
    .from('explorar_escolhas')
    .upsert({ viagem_id: viagemId, destino_id: destinoId, usuario_id: meuId, catalogo_lugar_id: catalogoId, escolha }, { onConflict: 'destino_id,usuario_id,catalogo_lugar_id' })
  if (error) throw error
}

export async function apagarEscolhaDoExplorar(cli: ClienteTogether, destinoId: string, meuId: string, catalogoId: string) {
  const { error } = await cli.from('explorar_escolhas').delete().eq('destino_id', destinoId).eq('usuario_id', meuId).eq('catalogo_lugar_id', catalogoId)
  if (error) throw error
}

// "Não abro mão" que eu já tenho nesse destino e que NÃO vieram do Explorar (contam no limite de 3)
export async function prioridadesForaDoExplorar(cli: ClienteTogether, destinoId: string, meuId: string, qidsDoExplorar: string[]): Promise<number> {
  const { data, error } = await cli.from('lugar_prioridades').select('lugares!inner (destino_id, wikidata)').eq('usuario_id', meuId).eq('lugares.destino_id', destinoId)
  if (error) throw error
  const qids = new Set(qidsDoExplorar)
  return (data ?? []).filter((p) => {
    const l = p.lugares as unknown as { wikidata: string | null }
    return !l.wikidata || !qids.has(l.wikidata)
  }).length
}

// Quero e não abro mão viram lugares da viagem, curtidas e prioridades (sem duplicar)
export async function criarLugaresDoExplorar(cli: ClienteTogether, destinoId: string): Promise<string[]> {
  const { data, error } = await cli.rpc('explorar_criar_lugares', { p_destino: destinoId })
  if (error) throw error
  return (data ?? []) as string[]
}

// ---------- Roteiro do destino (spec 115 v2) ----------
// null = ainda não montou
export async function buscarRoteiroDoDestino(cli: ClienteTogether, destinoId: string): Promise<DiasDoRoteiro | null> {
  const { data, error } = await cli.from('roteiros').select('dias').eq('destino_id', destinoId).maybeSingle()
  if (error) throw error
  return data ? lerDiasDoRoteiro(data.dias) : null
}

export async function salvarRoteiroDoDestino(cli: ClienteTogether, viagemId: string, destinoId: string, dias: DiasDoRoteiro) {
  const { error } = await cli.from('roteiros').upsert({ viagem_id: viagemId, destino_id: destinoId, dias })
  if (error) throw error
}
