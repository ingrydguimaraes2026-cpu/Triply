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

// ---------- Agenda do dia (spec 029) ----------

export type DadosDoEvento = {
  dia: string // AAAA-MM-DD
  hora: string | null // HH:MM
  titulo: string
  local: string | null
  observacao: string | null
  participantes?: string[] // spec 070: vazio = o comboio inteiro
}

// Eventos livres da viagem, por dia e hora (sem hora no fim do dia)
export async function buscarEventosDaAgenda(cli: ClienteTogether, viagemId: string): Promise<Tables<'eventos_agenda'>[]> {
  const { data, error } = await cli
    .from('eventos_agenda')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('dia', { ascending: true })
    .order('hora', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

// Cria um evento (qualquer um do comboio)
export async function criarEventoDaAgenda(cli: ClienteTogether, viagemId: string, dados: DadosDoEvento): Promise<void> {
  const { error } = await cli.from('eventos_agenda').insert({
    viagem_id: viagemId,
    dia: dados.dia,
    hora: dados.hora || null,
    titulo: dados.titulo.trim(),
    local: dados.local?.trim() || null,
    observacao: dados.observacao?.trim() || null,
    participantes: dados.participantes ?? [],
  })
  if (error) throw error
}

// Edita (quem criou ou o ADM). Sem permissão, o banco não muda nada: aqui vira erro.
export async function editarEventoDaAgenda(cli: ClienteTogether, id: string, dados: DadosDoEvento): Promise<void> {
  const { data, error } = await cli
    .from('eventos_agenda')
    .update({
      dia: dados.dia,
      hora: dados.hora || null,
      titulo: dados.titulo.trim(),
      local: dados.local?.trim() || null,
      observacao: dados.observacao?.trim() || null,
      ...(dados.participantes ? { participantes: dados.participantes } : {}),
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Só quem criou ou o ADM pode editar este evento.')
}

// Apaga (quem criou ou o ADM)
export async function apagarEventoDaAgenda(cli: ClienteTogether, id: string): Promise<void> {
  const { data, error } = await cli.from('eventos_agenda').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Só quem criou ou o ADM pode apagar este evento.')
}

// ---------- Enquetes rápidas (spec 021) ----------

export type OpcaoDeEnquete = {
  id: string
  texto: string
  ordem: number
  votos: string[] // ids de quem votou nessa opção
}

export type Enquete = {
  id: string
  pergunta: string
  multipla: boolean
  fechada: boolean
  fechadaEm?: string | null // spec 044: quando virou decisão
  criadoPor: string
  criadoEm: string
  opcoes: OpcaoDeEnquete[]
}

// Enquetes da viagem (mais novas primeiro), com as opções e quem votou em cada uma.
export async function buscarEnquetes(cli: ClienteTogether, viagemId: string): Promise<Enquete[]> {
  const { data, error } = await cli
    .from('enquetes')
    .select('id, pergunta, multipla, fechada, fechada_em, criado_por, criado_em, enquete_opcoes(id, texto, ordem, enquete_votos(usuario_id))')
    .eq('viagem_id', viagemId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map((e) => ({
    id: e.id,
    pergunta: e.pergunta,
    multipla: e.multipla,
    fechada: e.fechada,
    fechadaEm: e.fechada_em,
    criadoPor: e.criado_por,
    criadoEm: e.criado_em,
    opcoes: [...(e.enquete_opcoes ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map((o) => ({ id: o.id, texto: o.texto, ordem: o.ordem, votos: (o.enquete_votos ?? []).map((v) => v.usuario_id) })),
  }))
}

export type NovaEnquete = { pergunta: string; multipla: boolean; opcoes: string[] }

// Cria a enquete e as opções numa chamada só (função criar_enquete do banco). Devolve o id.
export async function criarEnquete(cli: ClienteTogether, viagemId: string, dados: NovaEnquete): Promise<string> {
  const { data, error } = await cli.rpc('criar_enquete', {
    p_viagem: viagemId,
    p_pergunta: dados.pergunta.trim(),
    p_multipla: dados.multipla,
    p_opcoes: dados.opcoes.map((o) => o.trim()).filter(Boolean),
  })
  if (error) throw error
  return data
}

// Marca (ou tira) o meu voto numa opção. Escolha única troca o voto; múltipla soma.
export async function votarEnquete(cli: ClienteTogether, opcaoId: string, marcar: boolean): Promise<void> {
  const { error } = await cli.rpc('votar_enquete', { p_opcao: opcaoId, p_marcar: marcar })
  if (error) throw error
}

// Fecha (ou reabre) a enquete: parar de receber votos (quem criou ou o ADM).
export async function fecharEnquete(cli: ClienteTogether, id: string, fechar: boolean): Promise<void> {
  const { error } = await cli.from('enquetes').update({ fechada: fechar }).eq('id', id)
  if (error) throw error
}

// Apaga a enquete (quem criou ou o ADM). As opções e votos vão junto.
export async function apagarEnquete(cli: ClienteTogether, id: string): Promise<void> {
  const { error } = await cli.from('enquetes').delete().eq('id', id)
  if (error) throw error
}

// ---------- Ponto de encontro (spec 024 / roadmap #7) ----------

export type PontoDeEncontro = Tables<'pontos_de_encontro'>

export type NovoPonto = {
  local: string
  quando?: string | null // ISO (data + hora), ou null
  observacao?: string | null
  latitude?: number | null
  longitude?: number | null
}

// Pontos de encontro da viagem, por horário combinado (sem horário no fim), depois por criação.
export async function buscarPontosDeEncontro(cli: ClienteTogether, viagemId: string): Promise<PontoDeEncontro[]> {
  const { data, error } = await cli
    .from('pontos_de_encontro')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('quando', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Cria um ponto de encontro (qualquer um do comboio). Devolve o criado.
export async function criarPontoDeEncontro(cli: ClienteTogether, viagemId: string, dados: NovoPonto): Promise<PontoDeEncontro> {
  const { data, error } = await cli
    .from('pontos_de_encontro')
    .insert({
      viagem_id: viagemId,
      local: dados.local.trim(),
      quando: dados.quando || null,
      observacao: dados.observacao?.trim() || null,
      latitude: dados.latitude ?? null,
      longitude: dados.longitude ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Edita um ponto de encontro (quem criou ou o ADM).
export async function editarPontoDeEncontro(
  cli: ClienteTogether,
  id: string,
  mudancas: Partial<NovoPonto>,
): Promise<void> {
  const patch: TablesUpdate<'pontos_de_encontro'> = {}
  if (mudancas.local !== undefined) patch.local = mudancas.local.trim()
  if (mudancas.quando !== undefined) patch.quando = mudancas.quando || null
  if (mudancas.observacao !== undefined) patch.observacao = mudancas.observacao?.trim() || null
  if (mudancas.latitude !== undefined) patch.latitude = mudancas.latitude ?? null
  if (mudancas.longitude !== undefined) patch.longitude = mudancas.longitude ?? null
  const { error } = await cli.from('pontos_de_encontro').update(patch).eq('id', id)
  if (error) throw error
}

// Apaga um ponto de encontro (quem criou ou o ADM).
export async function apagarPontoDeEncontro(cli: ClienteTogether, id: string): Promise<void> {
  const { error } = await cli.from('pontos_de_encontro').delete().eq('id', id)
  if (error) throw error
}

// Link pro mapa: usa as coordenadas quando houver, senão busca pelo nome do local.
export function linkDoMapa(ponto: { local: string; latitude: number | null; longitude: number | null }): string {
  if (ponto.latitude != null && ponto.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${ponto.latitude},${ponto.longitude}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ponto.local)}`
}

// ---------- Comentários em itens (spec 027 / roadmap #16) ----------

export type AlvoDoComentario = { tipo: 'gasto' | 'lugar' | 'hospedagem'; id: string }
export type ComentarioDeItem = Tables<'comentarios_item'>

const COLUNA_DO_ALVO = { gasto: 'gasto_id', lugar: 'lugar_id', hospedagem: 'hospedagem_id' } as const

// Comentários de um item, do mais antigo pro mais novo (como uma conversa).
export async function buscarComentariosDoItem(cli: ClienteTogether, alvo: AlvoDoComentario): Promise<ComentarioDeItem[]> {
  const { data, error } = await cli
    .from('comentarios_item')
    .select('*')
    .eq(COLUNA_DO_ALVO[alvo.tipo], alvo.id)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Quantos comentários cada item da viagem tem (pra mostrar o número no botão). Chave = id do item.
export async function contarComentariosDaViagem(cli: ClienteTogether, viagemId: string): Promise<Record<string, number>> {
  const { data, error } = await cli.from('comentarios_item').select('gasto_id, lugar_id, hospedagem_id').eq('viagem_id', viagemId)
  if (error) throw error
  const contagem: Record<string, number> = {}
  for (const c of data ?? []) {
    const id = c.gasto_id ?? c.lugar_id ?? c.hospedagem_id
    if (id) contagem[id] = (contagem[id] ?? 0) + 1
  }
  return contagem
}

// Comenta num item. Devolve o criado. (O banco confere que o item é mesmo desta viagem.)
export async function comentarNoItem(
  cli: ClienteTogether,
  viagemId: string,
  alvo: AlvoDoComentario,
  texto: string,
): Promise<ComentarioDeItem> {
  const { data, error } = await cli
    .from('comentarios_item')
    .insert({
      viagem_id: viagemId,
      gasto_id: alvo.tipo === 'gasto' ? alvo.id : null,
      lugar_id: alvo.tipo === 'lugar' ? alvo.id : null,
      hospedagem_id: alvo.tipo === 'hospedagem' ? alvo.id : null,
      texto: texto.trim(),
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Apaga um comentário (quem escreveu ou o ADM).
export async function apagarComentarioDoItem(cli: ClienteTogether, id: string): Promise<void> {
  const { error } = await cli.from('comentarios_item').delete().eq('id', id)
  if (error) throw error
}
