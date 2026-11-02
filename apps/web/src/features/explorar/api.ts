import { supabase } from '../../lib/supabase'
import { chaveDaCidade, codigoDoPais, type Escolha, type EstiloId, type LugarDoCatalogo, type Tables, type TipoDoCatalogo } from '@together/core'

// Explorar (spec 114): catálogo da cidade, minhas escolhas e "montar".
// Regra de ouro: o navegador nunca chama Wikidata/Nominatim. Cidade pronta vem direto do banco;
// cidade nova pede pra função "explorar-cidade", que monta uma vez e guarda pra todo mundo.

type Destino = Pick<Tables<'destinos'>, 'id' | 'nome' | 'pais'>

export type Catalogo = { lugares: LugarDoCatalogo[]; regiao: boolean }

const deLinha = (r: Tables<'catalogo_lugares'>): LugarDoCatalogo => ({
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

async function lerDoBanco(cidadeId: string, regiao: boolean): Promise<Catalogo> {
  const { data, error } = await supabase.from('catalogo_lugares').select('*').eq('cidade_id', cidadeId).order('fama', { ascending: false }).limit(80)
  if (error) throw error
  return { lugares: (data ?? []).map(deLinha), regiao }
}

// `aoPreparar` avisa a tela quando a cidade é nova (pode levar até ~30 s)
export async function carregarCatalogo(destino: Destino, aoPreparar?: () => void): Promise<Catalogo> {
  const pais = codigoDoPais(destino.pais)
  const { data: cidade } = await supabase.from('catalogo_cidades').select('id, situacao, regiao').eq('chave', chaveDaCidade(destino.nome, pais)).maybeSingle()
  if (cidade?.situacao === 'pronta') return lerDoBanco(cidade.id, cidade.regiao)

  aoPreparar?.()
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const { data, error } = await supabase.functions.invoke('explorar-cidade', {
      body: { nome: destino.nome, pais, busca: [destino.nome, destino.pais].filter(Boolean).join(', ') },
    })
    if (error) {
      // A função manda a mensagem no corpo (ex.: limite de 5 cidades por dia)
      const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null)
      throw new Error(corpo?.erro ?? 'Não deu pra carregar os lugares agora.')
    }
    if (data?.situacao === 'pronta') return { lugares: (data.lugares ?? []).map(deLinha), regiao: !!data.cidade?.regiao }
    // Alguém já está preparando essa cidade: espera e pergunta de novo
    await new Promise((r) => setTimeout(r, 5000))
  }
  throw new Error('A cidade ainda está sendo preparada. Tente de novo em um minuto.')
}

// ---------- Minhas escolhas (só eu vejo) ----------
export async function buscarMinhasEscolhas(destinoId: string, meuId: string): Promise<Record<string, Escolha>> {
  const { data, error } = await supabase.from('explorar_escolhas').select('catalogo_lugar_id, escolha').eq('destino_id', destinoId).eq('usuario_id', meuId)
  if (error) throw error
  return Object.fromEntries((data ?? []).map((e) => [e.catalogo_lugar_id, e.escolha as Escolha]))
}

export async function salvarEscolha(viagemId: string, destinoId: string, meuId: string, catalogoId: string, escolha: Escolha) {
  const { error } = await supabase
    .from('explorar_escolhas')
    .upsert(
      { viagem_id: viagemId, destino_id: destinoId, usuario_id: meuId, catalogo_lugar_id: catalogoId, escolha },
      { onConflict: 'destino_id,usuario_id,catalogo_lugar_id' },
    )
  if (error) throw error
}

export async function apagarEscolha(destinoId: string, meuId: string, catalogoId: string) {
  const { error } = await supabase.from('explorar_escolhas').delete().eq('destino_id', destinoId).eq('usuario_id', meuId).eq('catalogo_lugar_id', catalogoId)
  if (error) throw error
}

// "Não abro mão" que eu já tenho nesse destino e que NÃO vieram do Explorar (contam no limite de 3)
export async function prioridadesForaDoExplorar(destinoId: string, meuId: string, qidsDoExplorar: string[]): Promise<number> {
  const { data, error } = await supabase.from('lugar_prioridades').select('lugares!inner (destino_id, wikidata)').eq('usuario_id', meuId).eq('lugares.destino_id', destinoId)
  if (error) throw error
  const qids = new Set(qidsDoExplorar)
  return (data ?? []).filter((p) => {
    const l = p.lugares as unknown as { wikidata: string | null }
    return !l.wikidata || !qids.has(l.wikidata)
  }).length
}

// "Montar": quero e não abro mão viram lugares da viagem, curtidas e prioridades (sem duplicar). Devolve os ids.
export async function criarLugaresDoExplorar(destinoId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('explorar_criar_lugares', { p_destino: destinoId })
  if (error) throw error
  return (data ?? []) as string[]
}
