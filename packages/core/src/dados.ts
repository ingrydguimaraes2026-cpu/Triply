import type { ClienteTogether } from './supabase'
import type { Tables, TablesUpdate } from './database'
import type { Divisao } from './acertos'
import { deBanco, paraBanco } from './dinheiro'

// Consultas ao banco compartilhadas. Recebem o client (cada plataforma passa o seu),
// então web e mobile leem os mesmos dados do mesmo jeito. O RLS do banco já filtra:
// a pessoa só enxerga as viagens do próprio comboio.

export type ViagemResumo = {
  id: string
  nome: string
  moeda: string
  dataInicio: string | null
  dataFim: string | null
}

// Todas as viagens da pessoa, mais recente primeiro.
export async function listarMinhasViagens(cli: ClienteTogether): Promise<ViagemResumo[]> {
  const { data, error } = await cli
    .from('viagens')
    .select('id, nome, moeda_principal, data_inicio, data_fim, criado_em')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map((v) => ({
    id: v.id,
    nome: v.nome,
    moeda: v.moeda_principal,
    dataInicio: v.data_inicio,
    dataFim: v.data_fim,
  }))
}

// Quantas pessoas estão no comboio desta viagem.
export async function contarMembros(cli: ClienteTogether, viagemId: string): Promise<number> {
  const { count, error } = await cli
    .from('comboio_membros')
    .select('*', { count: 'exact', head: true })
    .eq('viagem_id', viagemId)
  if (error) throw error
  return count ?? 0
}

// Meu saldo em euro nesta viagem (carteira do spec 015). 0 se ainda não tenho carteira.
export async function saldoDaCarteira(cli: ClienteTogether, viagemId: string, usuarioId: string): Promise<number> {
  const { data, error } = await cli
    .from('carteiras_com_saldo')
    .select('saldo_atual')
    .eq('viagem_id', viagemId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw error
  return data?.saldo_atual == null ? 0 : Number(data.saldo_atual)
}

// Soma do euro de todo o comboio (função do banco que confere se sou do comboio).
export async function saldoEuroDoComboio(cli: ClienteTogether, viagemId: string): Promise<number> {
  const { data, error } = await cli.rpc('saldo_euro_do_comboio', { p_viagem_id: viagemId })
  if (error) throw error
  return Number(data ?? 0)
}

// ---------- Telas do app mobile (redesign "Malinha") ----------
// Mesmas consultas que a web faz em src/features, agora no core pra servir os dois.

export type Pessoa = { id: string; nome: string; avatarUrl: string | null; papel: string }

export type ViagemComDetalhes = ViagemResumo & {
  destinos: string[] // nomes, na ordem do roteiro
  membros: Pessoa[]
}

const CAMPOS_DETALHE =
  'id, nome, moeda_principal, data_inicio, data_fim, criado_em, destinos(nome, ordem), comboio_membros(papel, perfis(id, nome, avatar_url))'

type LinhaDetalhe = {
  id: string
  nome: string
  moeda_principal: string
  data_inicio: string | null
  data_fim: string | null
  destinos: { nome: string; ordem: number }[]
  comboio_membros: { papel: string; perfis: { id: string; nome: string | null; avatar_url: string | null } | null }[]
}

function montarDetalhe(v: LinhaDetalhe): ViagemComDetalhes {
  return {
    id: v.id,
    nome: v.nome,
    moeda: v.moeda_principal,
    dataInicio: v.data_inicio,
    dataFim: v.data_fim,
    destinos: [...v.destinos].sort((a, b) => a.ordem - b.ordem).map((d) => d.nome),
    membros: v.comboio_membros.flatMap((m) =>
      m.perfis ? [{ id: m.perfis.id, nome: m.perfis.nome ?? 'Sem nome', avatarUrl: m.perfis.avatar_url, papel: m.papel }] : [],
    ),
  }
}

// Minhas viagens com os destinos e o comboio de cada uma (cartões da home).
export async function listarViagensComDetalhes(cli: ClienteTogether): Promise<ViagemComDetalhes[]> {
  const { data, error } = await cli.from('viagens').select(CAMPOS_DETALHE).order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map(montarDetalhe)
}

// Uma viagem com o que as abas precisam no topo (nome, datas, comboio).
export async function buscarViagemComDetalhes(cli: ClienteTogether, viagemId: string): Promise<ViagemComDetalhes | null> {
  const { data, error } = await cli.from('viagens').select(CAMPOS_DETALHE).eq('id', viagemId).maybeSingle()
  if (error) throw error
  return data ? montarDetalhe(data) : null
}

export type Destino = Tables<'destinos'>
export type Lugar = Tables<'lugares'>
export type Trajeto = Tables<'trajetos'>

export async function buscarDestinos(cli: ClienteTogether, viagemId: string): Promise<Destino[]> {
  const { data, error } = await cli.from('destinos').select('*').eq('viagem_id', viagemId).order('ordem')
  if (error) throw error
  return data ?? []
}

// Lugares do roteiro (passeios, restaurantes...) em ordem de horário.
export async function buscarLugares(cli: ClienteTogether, viagemId: string): Promise<Lugar[]> {
  const { data, error } = await cli
    .from('lugares')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('horario', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

// Trajetos em ordem de partida (os sem horário no fim).
export async function buscarTrajetos(cli: ClienteTogether, viagemId: string): Promise<Trajeto[]> {
  const { data, error } = await cli
    .from('trajetos')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('partida', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

// Gasto com valores em centavos (igual a web).
export type GastoDaViagem = Omit<Tables<'gastos'>, 'valor'> & { valor: number; divisoes: Divisao[] }

export async function buscarGastos(cli: ClienteTogether, viagemId: string): Promise<GastoDaViagem[]> {
  const { data, error } = await cli
    .from('gastos')
    .select('*, gasto_divisoes(usuario_id, valor)')
    .eq('viagem_id', viagemId)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map(({ gasto_divisoes, ...g }) => ({
    ...g,
    valor: deBanco(g.valor),
    divisoes: gasto_divisoes.map((d) => ({ usuarioId: d.usuario_id, valor: deBanco(d.valor) })),
  }))
}

export type NovoGasto = {
  id: string // gerado no aparelho (evita duplicar ao reenviar)
  descricao: string
  valor: number // centavos
  moeda: string
  categoria: string
  data: string // AAAA-MM-DD
  pagoPor: string
  pessoal: boolean
  divisoes: Divisao[]
}

// Cria o gasto com as divisões numa tacada só (função salvar_gasto do banco).
export async function salvarGasto(cli: ClienteTogether, viagemId: string, gasto: NovoGasto): Promise<string> {
  const { data, error } = await cli.rpc('salvar_gasto', {
    p_viagem: viagemId,
    p_gasto: {
      id: gasto.id,
      descricao: gasto.descricao,
      valor: paraBanco(gasto.valor),
      moeda: gasto.moeda,
      categoria: gasto.categoria,
      data: gasto.data,
      pago_por: gasto.pagoPor,
      pessoal: gasto.pessoal,
      rascunho: false,
    },
    p_divisoes: gasto.pessoal ? [] : gasto.divisoes.map((d) => ({ usuario_id: d.usuarioId, valor: paraBanco(d.valor) })),
  })
  if (error) throw error
  return data
}

export type FotoDaViagem = Tables<'fotos'> & { url: string | null }

// Fotos da viagem (mais novas primeiro) com link temporário de 1 hora (bucket privado "fotos").
export async function buscarFotos(cli: ClienteTogether, viagemId: string): Promise<FotoDaViagem[]> {
  const { data, error } = await cli.from('fotos').select('*').eq('viagem_id', viagemId).order('criado_em', { ascending: false })
  if (error) throw error
  if (!data?.length) return []
  const { data: links, error: erroLinks } = await cli.storage.from('fotos').createSignedUrls(
    data.map((f) => f.caminho),
    60 * 60,
  )
  if (erroLinks) throw erroLinks
  const porCaminho = new Map(links.map((l) => [l.path, l.signedUrl]))
  return data.map((f) => ({ ...f, url: porCaminho.get(f.caminho) ?? null }))
}

export type NovaViagem = {
  nome: string
  dataInicio: string | null // AAAA-MM-DD
  dataFim: string | null
  moeda: string
  destinos: { nome: string; pais: string | null; latitude: number | null; longitude: number | null }[]
}

// Cria a viagem e os destinos (igual à web: quem cria vira ADM pelo banco). Devolve o id.
export async function criarViagem(cli: ClienteTogether, dados: NovaViagem): Promise<string> {
  const { data: viagem, error } = await cli
    .from('viagens')
    .insert({ nome: dados.nome, data_inicio: dados.dataInicio, data_fim: dados.dataFim, moeda_principal: dados.moeda })
    .select('id')
    .single()
  if (error) throw error
  if (dados.destinos.length) {
    const { error: erroDestinos } = await cli
      .from('destinos')
      .insert(dados.destinos.map((d, ordem) => ({ viagem_id: viagem.id, ordem, ...d })))
    if (erroDestinos) throw erroDestinos
  }
  return viagem.id
}

// Gera um código de convite (vale 7 dias). Cada plataforma monta o link com o próprio endereço.
export async function criarCodigoDeConvite(cli: ClienteTogether, viagemId: string): Promise<string> {
  const { data, error } = await cli.from('convites').insert({ viagem_id: viagemId }).select('codigo').single()
  if (error) throw error
  return data.codigo
}

// ---------- Convite (spec 018: convidado sem conta) ----------

export type PreviaDoConvite = {
  viagemId: string
  nome: string
  dataInicio: string | null
  dataFim: string | null
  destinos: string[]
  membros: string[]
  jaSouMembro: boolean
}

// Prévia da viagem pelo código do convite. Funciona até sem login.
// Devolve null quando o convite não existe ou expirou.
export async function verConvite(cli: ClienteTogether, codigo: string): Promise<PreviaDoConvite | null> {
  const { data, error } = await cli.rpc('ver_convite', { p_codigo: codigo })
  if (error) throw error
  if (!data) return null
  const d = data as {
    viagem_id: string
    nome: string
    data_inicio: string | null
    data_fim: string | null
    destinos: string[]
    membros: string[]
    ja_sou_membro: boolean
  }
  return {
    viagemId: d.viagem_id,
    nome: d.nome,
    dataInicio: d.data_inicio,
    dataFim: d.data_fim,
    destinos: d.destinos,
    membros: d.membros,
    jaSouMembro: d.ja_sou_membro,
  }
}

// Entra no comboio pelo convite. Se a pessoa entrou como convidado, sem conta,
// o nome é obrigatório: é ele que aparece pro comboio.
export async function aceitarConvite(cli: ClienteTogether, codigo: string, nome?: string): Promise<string> {
  const { data, error } = await cli.rpc('aceitar_convite', { p_codigo: codigo, p_nome: nome })
  if (error) throw error
  return data
}

// Entra como convidado (login anônimo do Supabase) e já aceita o convite.
// Se já tiver alguém logado, só aceita o convite.
export async function entrarComoConvidado(cli: ClienteTogether, codigo: string, nome: string): Promise<string> {
  const { data: atual } = await cli.auth.getSession()
  if (!atual.session) {
    const { error } = await cli.auth.signInAnonymously({ options: { data: { full_name: nome } } })
    if (error) throw error
  }
  return aceitarConvite(cli, codigo, nome)
}

// Convidado é quem entrou pelo link sem criar conta
export function ehConvidado(usuario: { is_anonymous?: boolean } | null | undefined): boolean {
  return !!usuario?.is_anonymous
}

// ---------- Avisos do ADM (spec 019) ----------

export type Aviso = Tables<'avisos'>

// Avisos da viagem, o mais novo primeiro (o topo da lista é o que fica fixado).
export async function buscarAvisos(cli: ClienteTogether, viagemId: string): Promise<Aviso[]> {
  const { data, error } = await cli
    .from('avisos')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Cria um aviso. Só o ADM consegue (o banco confere); devolve o aviso criado.
export async function criarAviso(cli: ClienteTogether, viagemId: string, texto: string): Promise<Aviso> {
  const { data, error } = await cli
    .from('avisos')
    .insert({ viagem_id: viagemId, texto: texto.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Edita o texto de um aviso (só o ADM).
export async function editarAviso(cli: ClienteTogether, id: string, texto: string): Promise<void> {
  const { error } = await cli.from('avisos').update({ texto: texto.trim() }).eq('id', id)
  if (error) throw error
}

// Apaga um aviso (só o ADM).
export async function apagarAviso(cli: ClienteTogether, id: string): Promise<void> {
  const { error } = await cli.from('avisos').delete().eq('id', id)
  if (error) throw error
}

// ---------- Tarefas com responsável (spec 020) ----------

export type Tarefa = Tables<'tarefas'>

export type NovaTarefa = {
  titulo: string
  responsavelId?: string | null
  prazo?: string | null // AAAA-MM-DD
}

// Tarefas da viagem: as pendentes primeiro, depois por prazo (sem prazo no fim) e por criação.
export async function buscarTarefas(cli: ClienteTogether, viagemId: string): Promise<Tarefa[]> {
  const { data, error } = await cli
    .from('tarefas')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('feita', { ascending: true })
    .order('prazo', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Cria uma tarefa (qualquer um do comboio). Devolve a tarefa criada.
export async function criarTarefa(cli: ClienteTogether, viagemId: string, dados: NovaTarefa): Promise<Tarefa> {
  const { data, error } = await cli
    .from('tarefas')
    .insert({
      viagem_id: viagemId,
      titulo: dados.titulo.trim(),
      responsavel_id: dados.responsavelId ?? null,
      prazo: dados.prazo || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Edita título, responsável e/ou prazo (quem criou, o responsável ou o ADM).
export async function editarTarefa(
  cli: ClienteTogether,
  id: string,
  mudancas: Partial<{ titulo: string; responsavelId: string | null; prazo: string | null }>,
): Promise<void> {
  const patch: TablesUpdate<'tarefas'> = {}
  if (mudancas.titulo !== undefined) patch.titulo = mudancas.titulo.trim()
  if (mudancas.responsavelId !== undefined) patch.responsavel_id = mudancas.responsavelId
  if (mudancas.prazo !== undefined) patch.prazo = mudancas.prazo || null
  const { error } = await cli.from('tarefas').update(patch).eq('id', id)
  if (error) throw error
}

// Marca/desmarca a tarefa como feita.
export async function alternarTarefa(cli: ClienteTogether, id: string, feita: boolean): Promise<void> {
  const { error } = await cli.from('tarefas').update({ feita }).eq('id', id)
  if (error) throw error
}

// Apaga a tarefa (quem criou ou o ADM).
export async function apagarTarefa(cli: ClienteTogether, id: string): Promise<void> {
  const { error } = await cli.from('tarefas').delete().eq('id', id)
  if (error) throw error
}
