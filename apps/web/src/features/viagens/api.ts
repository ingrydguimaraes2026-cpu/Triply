import { supabase } from '../../lib/supabase'
import type { Cidade } from '../destinos/buscarCidades'
import { apagarArquivosDaViagem } from '../fotos/api'
import { apagarArquivosDoCofre } from '../cofre/api'

type NovaViagem = {
  nome: string
  dataInicio: string | null
  dataFim: string | null
  moeda: string
  destinos: Cidade[]
}

// Cria a viagem (quem cria vira ADM sozinho) e salva os destinos na ordem
export async function criarViagem(dados: NovaViagem) {
  const { data: viagem, error } = await supabase
    .from('viagens')
    .insert({
      nome: dados.nome,
      data_inicio: dados.dataInicio,
      data_fim: dados.dataFim,
      moeda_principal: dados.moeda,
    })
    .select('id')
    .single()
  if (error) throw error

  // Spec 046: viagem "sonhando" nasce sem destino
  if (dados.destinos.length === 0) return viagem.id

  const { error: erroDestinos } = await supabase.from('destinos').insert(
    dados.destinos.map((d, ordem) => ({
      viagem_id: viagem.id,
      nome: d.nome,
      pais: d.pais,
      latitude: d.latitude,
      longitude: d.longitude,
      ordem,
    })),
  )
  if (erroDestinos) throw erroDestinos

  return viagem.id
}


// Muda nome, datas ou moeda da viagem (só o ADM consegue: regra do banco)
export async function editarViagem(
  id: string,
  campos: { nome?: string; data_inicio?: string | null; data_fim?: string | null; moeda_principal?: string },
) {
  const { data, error } = await supabase.from('viagens').update(campos).eq('id', id).select('*').single()
  if (error) throw error
  return data
}
// Apaga a viagem inteira (só o ADM). Primeiro os arquivos das fotos e do cofre, que o banco não apaga sozinho.
export async function apagarViagem(id: string) {
  await apagarArquivosDaViagem(id)
  await apagarArquivosDoCofre(id)
  const { error, count } = await supabase.from('viagens').delete({ count: 'exact' }).eq('id', id)
  if (error) throw error
  if (count === 0) throw new Error('Sem permissão pra apagar a viagem')
}
export type ResumoDaViagem = {
  id: string
  nome: string
  dataInicio: string | null
  dataFim: string | null
  destinos: string[]
  membros: { id: string; nome: string; avatarUrl: string | null; papel: 'adm' | 'membro' }[]
  souAdm: boolean // quem está usando é ADM desta viagem (só o ADM pode apagar)
  arquivada: boolean // spec 054: eu tirei da minha lista
}

// Todas as viagens da pessoa (o RLS do banco já filtra: só as que ela está no comboio)
export async function buscarMinhasViagens(): Promise<ResumoDaViagem[]> {
  const [{ data, error }, { data: sessao }] = await Promise.all([
    supabase
      .from('viagens')
      .select('id, nome, data_inicio, data_fim, criado_em, destinos(nome, ordem), comboio_membros(papel, arquivada_em, perfis(id, nome, avatar_url))')
      .order('criado_em', { ascending: false }),
    supabase.auth.getUser(),
  ])
  if (error) throw error
  const meuId = sessao.user?.id
  return data.map((v) => {
    const membros = v.comboio_membros.flatMap((m) =>
      m.perfis
        ? [{ id: m.perfis.id, nome: m.perfis.nome ?? 'Sem nome', avatarUrl: m.perfis.avatar_url, papel: m.papel as 'adm' | 'membro' }]
        : [],
    )
    return {
      id: v.id,
      nome: v.nome,
      dataInicio: v.data_inicio,
      dataFim: v.data_fim,
      destinos: [...v.destinos].sort((a, b) => a.ordem - b.ordem).map((d) => d.nome),
      membros,
      souAdm: membros.some((m) => m.id === meuId && m.papel === 'adm'),
      arquivada: v.comboio_membros.some((m) => m.perfis?.id === meuId && m.arquivada_em !== null),
    }
  })
}

export type Situacao = 'agora' | 'proxima' | 'concluida' | 'sem-data'

// "acontecendo agora", "próxima" ou "concluída", comparando as datas com hoje (texto "2026-11-12")
export function situacaoDaViagem(inicio: string | null, fim: string | null, hoje: string): Situacao {
  if (!inicio && !fim) return 'sem-data'
  if (fim && fim < hoje) return 'concluida'
  if (inicio && inicio > hoje) return 'proxima'
  return 'agora'
}

// Arquiva (ou volta) a viagem só na MINHA lista (spec 054)
export async function arquivarViagem(viagemId: string, arquivar: boolean) {
  const { error } = await supabase.rpc('arquivar_viagem', { p_viagem: viagemId, p_arquivar: arquivar })
  if (error) throw error
}
