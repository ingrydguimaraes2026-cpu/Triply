// Aba Viagem (spec 117): o que a tela principal da viagem mostra, igual no app e no site.
// Antes ficava só no app (apps/mobile/src/dados/abaViagem.ts, contas.ts e ui/PassosDaViagem.tsx);
// veio pro core quando o site virou espelho do app (09/11/2026).
import type { ClienteTogether } from './supabase'
import type { NomeDoSelo } from './icones'
import { buscarGastos, buscarTrajetos, buscarViagemComDetalhes, type GastoDaViagem } from './dados'
import { buscarAtividades, buscarVistoEm } from './notificacoes'
import { buscarOpcoesDeHospedagem } from './hospedagem'
import { buscarAlertasDePassaporte } from './passaporte'
import { buscarSeguros, semSeguro } from './seguro'
import { lerDiasDoRoteiro } from './roteiro'
import { opcoesNoDia } from './agenda'
import { passagensDaViagem } from './passagens'
import { calcularAcertos, calcularSaldos } from './acertos'

// ---------- Os 6 passos = os 6 carimbos do passaporte do comboio ----------

export type EstadoDosPassos = {
  lugares: number
  pessoas: number
  temDatas: boolean
  hospedagens: number
  trajetos: number
  gastos: number
  euSouAdm: boolean
}

export type ChaveDoPasso = 'roteiro' | 'galera' | 'datas' | 'hospedagem' | 'transporte' | 'gastos'
export type DestinoDoPasso = 'explorar' | 'convidar' | 'configuracoes' | 'hospedagem' | 'transportes' | 'contas'
export type Passo = { chave: ChaveDoPasso; selo: NomeDoSelo; rotulo: string; titulo: string; sub: string; feito: boolean; destino: DestinoDoPasso; soAdm?: boolean }

// Os 6 passos, na ordem certa.
// `soAdm`: só o ADM resolve (datas); pra quem não é ADM ele não vira o "próximo".
export function montarPassos(estado: EstadoDosPassos): Passo[] {
  return [
    { chave: 'roteiro', selo: 'mapa', rotulo: 'Roteiro', titulo: 'Montar o roteiro', sub: 'Deslize os lugares e o app monta os dias', feito: estado.lugares > 0, destino: 'explorar' },
    { chave: 'galera', selo: 'galera', rotulo: 'Galera', titulo: 'Chamar a galera', sub: 'Cada um escolhe o que quer fazer', feito: estado.pessoas > 1, destino: 'convidar' },
    { chave: 'datas', selo: 'calendario', rotulo: 'Datas', titulo: 'Definir as datas', sub: 'Quando vocês vão e voltam', feito: estado.temDatas, destino: 'configuracoes', soAdm: true },
    { chave: 'hospedagem', selo: 'barraca', rotulo: 'Dormir', titulo: 'Onde dormir', sub: 'Juntem opções e votem', feito: estado.hospedagens > 0, destino: 'hospedagem' },
    { chave: 'transporte', selo: 'passagem', rotulo: 'Chegar', titulo: 'Como chegar', sub: 'Voos, ônibus e carro de todo mundo', feito: estado.trajetos > 0, destino: 'transportes' },
    { chave: 'gastos', selo: 'moedas', rotulo: 'Contas', titulo: 'Dividir as contas', sub: 'Lance um gasto e o app faz a conta', feito: estado.gastos > 0, destino: 'contas' },
  ]
}

// O próximo carimbo a conquistar. Comboio de 1 pessoa: chamar a galera vem primeiro (spec 117).
export function proximoCarimbo(estado: EstadoDosPassos): Passo | null {
  const abertos = montarPassos(estado).filter((p) => !p.feito && (!p.soAdm || estado.euSouAdm))
  return abertos.find((p) => p.chave === 'galera') ?? abertos[0] ?? null
}

// Texto do botão do cartão "Próximo carimbo"
export function textoDoBotaoDoPasso(chave: ChaveDoPasso): string {
  const textos: Record<ChaveDoPasso, string> = {
    roteiro: 'Começar a deslizar',
    galera: 'Chamar a galera',
    datas: 'Definir as datas',
    hospedagem: 'Juntar opções',
    transporte: 'Adicionar o transporte',
    gastos: 'Lançar o primeiro gasto',
  }
  return textos[chave]
}

// ---------- Contas ----------

// Categorias dos gastos (mesmas chaves do banco) com a cor da barrinha do design.
export const CATEGORIAS = [
  { chave: 'hospedagem', nome: 'Hospedagem', cor: '#4A2E14' },
  { chave: 'transporte', nome: 'Transporte', cor: '#7B542F' },
  { chave: 'alimentacao', nome: 'Comida', cor: '#B97A22' },
  { chave: 'passeios', nome: 'Passeios', cor: '#DDB97E' },
  { chave: 'comprinhas', nome: 'Compras', cor: '#C99257' },
  { chave: 'outros', nome: 'Outros', cor: '#D9C3A2' },
] as const

export function categoria(chave: string) {
  return CATEGORIAS.find((c) => c.chave === chave) ?? CATEGORIAS[5]
}

// Resumo das contas na moeda principal da viagem: total do grupo, por categoria,
// saldo de cada um (+ recebe / − deve) e os acertos sugeridos.
export function resumoDasContas(gastos: GastoDaViagem[], moeda: string) {
  const doGrupo = gastos.filter((g) => !g.pessoal && !g.rascunho && g.moeda === moeda)
  const total = doGrupo.reduce((s, g) => s + g.valor, 0)
  const porCategoria = CATEGORIAS.map((c) => ({
    ...c,
    valor: doGrupo.filter((g) => categoria(g.categoria).chave === c.chave).reduce((s, g) => s + g.valor, 0),
  })).filter((c) => c.valor > 0)
  const paraConta = doGrupo.map((g) => ({ pagoPor: g.pago_por, moeda: g.moeda, valor: g.valor, pessoal: g.pessoal, divisoes: g.divisoes }))
  const saldos = calcularSaldos(paraConta).get(moeda) ?? new Map<string, number>()
  const acertos = calcularAcertos(paraConta)
  return { total, porCategoria, saldos, acertos, quantidade: doGrupo.length }
}

// ---------- Tudo da aba Viagem, numa ida só ao banco ----------

export type DiaDoCarrossel = { numero: number; titulo: string; foto: string | null; destinoId: string }

export async function carregarAbaViagem(cli: ClienteTogether, id: string) {
  const [viagem, gastos, comOpcoes, lugares, opcoes, atividades, vistoEm, roteiros, alertas, seguros, fotos, visitados] = await Promise.all([
    buscarViagemComDetalhes(cli, id),
    buscarGastos(cli, id),
    buscarTrajetos(cli, id, { comOpcoes: true }),
    cli.from('lugares').select('id', { count: 'exact', head: true }).eq('viagem_id', id),
    buscarOpcoesDeHospedagem(cli, id),
    buscarAtividades(cli, id, 30).catch(() => []),
    buscarVistoEm(cli, id).catch(() => null),
    cli.from('roteiros').select('destino_id, dias, destinos!inner (ordem)').eq('viagem_id', id),
    buscarAlertasDePassaporte(cli, id).catch(() => []),
    buscarSeguros(cli, id).catch(() => []),
    // Pros números das Lembranças (fase "voltou")
    cli.from('fotos').select('id', { count: 'exact', head: true }).eq('viagem_id', id),
    cli.from('lugares').select('id', { count: 'exact', head: true }).eq('viagem_id', id).not('visitado_em', 'is', null),
  ])
  if (!viagem) return null
  const trajetos = opcoesNoDia(comOpcoes) // das opções de um deslocamento, só a que vale
  // Spec 122d: o cartão Passagens (pra decidir, pra comprar, compradas e o aviso mais sério)
  const doGrupo = comOpcoes.filter((t) => t.tipo !== 'chegada' && t.tipo !== 'saida')
  const passagens = passagensDaViagem(doGrupo, [], opcoes.filter((o) => o.escolhida))

  // Carrossel do roteiro: um cartão por dia montado, com a foto do 1º lugar do dia
  const porDestino = (roteiros.data ?? [])
    .map((r) => ({ destinoId: r.destino_id, ordem: (r.destinos as unknown as { ordem: number }).ordem, dias: lerDiasDoRoteiro(r.dias) }))
    .sort((a, b) => a.ordem - b.ordem)
  const ids = [...new Set(porDestino.flatMap((r) => r.dias.flatMap((d) => d.slice(0, 2))))]
  // Os dias guardam ids de `lugares`; a foto vem do catálogo do Explorar (mesmo item da Wikidata)
  const { data: doRoteiro } = ids.length ? await cli.from('lugares').select('id, nome, wikidata').in('id', ids) : { data: [] }
  const qids = [...new Set((doRoteiro ?? []).map((l) => l.wikidata).filter((q): q is string => !!q))]
  const { data: fotosDoCatalogo } = qids.length ? await cli.from('catalogo_lugares').select('wikidata, foto_url').in('wikidata', qids).not('foto_url', 'is', null) : { data: [] }
  const fotoDo = new Map((fotosDoCatalogo ?? []).map((f) => [f.wikidata as string, f.foto_url as string]))
  const doCatalogo = new Map((doRoteiro ?? []).map((l) => [l.id, { nome: l.nome, foto_url: (l.wikidata && fotoDo.get(l.wikidata)) || null }]))
  const dias: DiaDoCarrossel[] = []
  for (const r of porDestino)
    for (const d of r.dias) {
      const doDia = d.slice(0, 2).map((x) => doCatalogo.get(x)).filter((c): c is NonNullable<typeof c> => !!c)
      if (!doDia.length) continue
      dias.push({ numero: dias.length + 1, titulo: doDia.map((c) => c.nome).join(' e '), foto: doDia.find((c) => c.foto_url)?.foto_url ?? null, destinoId: r.destinoId })
    }

  const comProblemaNoPassaporte = new Set(alertas.map((a) => a.usuarioId)).size
  return {
    viagem,
    gastos,
    trajetos,
    lugares: lugares.count ?? 0,
    fotos: fotos.count ?? 0,
    visitados: visitados.count ?? 0,
    opcoes,
    passagens,
    atividades,
    vistoEm,
    dias,
    passaportesOk: viagem.membros.length - comProblemaNoPassaporte,
    semSeguro: seguros.length ? semSeguro(seguros, viagem.membros).length : null, // null = ninguém cadastrou seguro
  }
}

export type DadosDaAbaViagem = NonNullable<Awaited<ReturnType<typeof carregarAbaViagem>>>

// Estado dos passos a partir dos dados da aba (o mesmo no app e no site)
export function estadoDosPassos(d: DadosDaAbaViagem, meuId: string): EstadoDosPassos {
  return {
    lugares: d.lugares,
    pessoas: d.viagem.membros.length,
    temDatas: !!d.viagem.dataInicio,
    // O carimbo "Dormir" só cai quando o lugar foi escolhido (a decisão foi resolvida)
    hospedagens: d.opcoes.some((o) => o.escolhida) ? 1 : 0,
    trajetos: d.trajetos.length,
    gastos: d.gastos.length,
    euSouAdm: d.viagem.membros.some((m) => m.id === meuId && m.papel === 'adm'),
  }
}
