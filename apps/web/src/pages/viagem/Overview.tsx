import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate } from 'react-router'
import { AlertTriangle, BarChart3, BedDouble, Car, ChevronRight, Clock, FileText, Image as ImageIcon, MapPinned, CalendarRange, Camera, CircleCheck, ListChecks, Lock, Luggage, MapPin, Globe, Pencil, PiggyBank, Plus, ReceiptText, Route, ShoppingBasket, Sparkles, Sun, TrainFront, Users, Wallet } from '../../components/ui/icones'
import MapaMundi from '../../features/mapa/MapaMundi'
import EditorRoteiro from '../../features/destinos/EditorRoteiro'
import {
  buscarDestinos,
  idsRemovidos,
  mensagemDeErroAoSalvar,
  paraItem,
  RoteiroDesatualizado,
  salvarRoteiro,
  type ItemRoteiro,
} from '../../features/destinos/api'
import { contarNoites, destinoDeHoje, hojeTexto, periodoDosDestinos, textoNoites } from '../../features/destinos/datas'
import { useResumoFinanceiro } from '../../features/financeiro/hooks'
import { CONGELADO, viagemAcontecendo, encontrarFuros, formatarDinheiro, prontidao, proximoPasso, resumoDosTrajetos } from '@together/core'
import { progresso } from '../../features/documentos/checklist'
import { useTrajetos } from '../../features/transportes/hooks'
import { meio } from '../../features/transportes/api'
import { diaLocal, hora, proximoDeslocamento } from '../../features/transportes/avisos'
import { useFotos } from '../../features/fotos/hooks'
import { useDocumentos } from '../../features/documentos/hooks'
import ChecklistDocumentos from '../../features/documentos/ChecklistDocumentos'
import { useHospedagem } from '../../features/hospedagem/hooks'
import { useLugares } from '../../features/lugares/hooks'
import FaixaAvisos from '../../features/avisos/FaixaAvisos'
import Checklist from '../../features/tarefas/Checklist'
import Enquetes from '../../features/enquetes/Enquetes'
import ClimaDaViagem from '../../features/clima/ClimaDaViagem'
import PontoDeEncontro from '../../features/encontro/PontoDeEncontro'
import Cofre from '../../features/cofre/Cofre'
import { useAbaAtiva, useViagemAtual } from '../../features/viagens/hooks'
import { useFocoDeItem } from '../../lib/foco'
import { editarViagem } from '../../features/viagens/api'
import OrcamentoCombinado from '../../features/orcamento-combinado/OrcamentoCombinado'
import FichaDoPais from '../../features/ficha-do-pais/FichaDoPais'
import ListasDoComboio from '../../features/listas/ListasDoComboio'
import ChegueiBem from '../../features/chegadas/ChegueiBem'
import DatasEmComum from '../../features/datas-em-comum/DatasEmComum'
import MinhaMala from '../../features/mala/MinhaMala'
import DestinosCandidatos from '../../features/candidatos/DestinosCandidatos'
import { diasAte, formatarData, formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import Cartao from '../../components/ui/Cartao'
import IconeQuadrado from '../../components/ui/IconeQuadrado'
import PilhaDeAvatares from '../../components/ui/PilhaDeAvatares'
import './abas.css'
import { useCapas } from '../../features/viagens/capas'

// Frase da contagem regressiva no topo do mapa
function contagem(inicio: string | null, fim: string | null) {
  if (!inicio) return null
  const faltam = diasAte(inicio)
  if (faltam > 1) return `Faltam ${faltam} dias`
  if (faltam === 1) return 'É amanhã!'
  if (faltam === 0) return 'É hoje!'
  if (fim && diasAte(fim) >= 0) return `Dia ${-faltam + 1} da viagem`
  return 'Viagem concluída'
}

// "hoje 09:10", "amanhã 09:10" ou "14 nov 09:10"
function quando(horario: string) {
  const dia = diaLocal(horario)
  const faltam = diasAte(dia)
  const prefixo = faltam === 0 ? 'hoje' : faltam === 1 ? 'amanhã' : formatarData(dia)
  return `${prefixo} ${hora(horario)}`
}

// Duas linhas embaixo do nome: "12 – 15 nov" e "3 noites" (ou o país quando não tem data)
function datasDoDestino(d: ItemRoteiro): { periodo: string | null; noites: string | null } {
  if (!d.chegada) return { periodo: d.pais && d.pais !== d.nome ? d.pais : null, noites: null }
  if (!d.saida) return { periodo: `Chega ${formatarData(d.chegada)}`, noites: null }
  const noites = contarNoites(d.chegada, d.saida)
  const periodo = d.chegada === d.saida ? formatarData(d.chegada) : `${formatarData(d.chegada)} – ${formatarData(d.saida)}`
  return { periodo, noites: noites === null ? null : textoNoites(noites) }
}

// Overview: resumo de tudo. Cada cartão leva pra aba dele.
export default function Overview() {
  const { viagem, destinos, membros, meuId, euSouAdm, atualizarDestinos, atualizarViagem } = useViagemAtual()
  const capa = useCapas([viagem.id])
  const podeEditarRoteiro = euSouAdm || viagem.membro_edita_roteiro // spec 078
  useFocoDeItem() // destaca a enquete/ponto quando se chega por um link de compartilhar

  // Spec 120a: num dia de viagem, abrir a viagem leva direto pro Hoje (uma vez por aba do navegador)
  const navegar = useNavigate()
  useEffect(() => {
    if (!viagemAcontecendo([{ dataInicio: viagem.data_inicio, dataFim: viagem.data_fim }], hojeTexto(new Date()))) return
    const chave = `together:hoje-aberto:${viagem.id}`
    try {
      if (sessionStorage.getItem(chave)) return
      sessionStorage.setItem(chave, '1')
    } catch {
      return
    }
    navegar('hoje')
  }, [viagem.id, viagem.data_inicio, viagem.data_fim, navegar])

  // Modo de edição do roteiro: enquanto edita, a lista E o mapa mostram o rascunho.
  // null = não está editando (mostra o que está salvo).
  const [rascunho, setRascunho] = useState<ItemRoteiro[] | null>(null)
  const [abrirBusca, setAbrirBusca] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null)
  const [conflito, setConflito] = useState(false)

  // Fonte única pra lista e mapa
  const roteiro = useMemo(() => rascunho ?? destinos.map(paraItem), [rascunho, destinos])

  // Spec 006: durante a viagem, o destino de hoje fica destacado na lista e no mapa
  const indiceDeHoje = rascunho ? -1 : destinoDeHoje(roteiro, hojeTexto())

  const pontos = useMemo(
    () =>
      roteiro
        .map((d, i) => ({ d, hoje: i === indiceDeHoje }))
        .filter(({ d }) => d.latitude !== null && d.longitude !== null)
        .map(({ d, hoje }) => ({ nome: d.nome, latitude: d.latitude!, longitude: d.longitude!, destaque: hoje })),
    [roteiro, indiceDeHoje],
  )

  // Spec 006: resumos das outras abas (as três buscas rodam em paralelo)
  const resumo = useResumoFinanceiro(viagem.id, viagem.moeda_principal)
  const trajetos = useTrajetos(viagem.id)
  const fotos = useFotos(viagem.id, 6)
  const proximo =
    trajetos.estado.status === 'pronto' ? proximoDeslocamento(trajetos.estado.trajetos, destinos.map((d) => d.id)) : null
  const ultimasFotos = fotos.estado.status === 'pronto' ? fotos.estado.fotos : []
  const nomeDoDestino = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? 'Sem destino'
  const docs = useDocumentos(viagem, destinos, meuId)
  const hospedagem = useHospedagem(viagem.id, destinos, meuId, membros.length)
  const hospResumo = hospedagem.resumo

  // A Overview fica guardada ao trocar de aba: ao voltar, atualiza o que pode ter mudado nas outras abas
  const ativa = useAbaAtiva()
  const primeiraVez = useRef(true)
  const { recarregar: recarregarTrajetos } = trajetos
  const { recarregar: recarregarFotos } = fotos
  const { recarregar: recarregarHospedagem } = hospedagem
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    if (!ativa) return
    recarregarTrajetos()
    recarregarFotos()
    recarregarHospedagem()
  }, [ativa, recarregarTrajetos, recarregarFotos, recarregarHospedagem])
  const proximaSemHospedagem = hospedagem.itens.find((i) => i.situacao === 'precisa' || i.situacao === 'sem-datas')

  // Spec 115: o cartão "Próximo passo" (uma ação só). Espera os lugares e os trajetos carregarem pra não piscar.
  const lugaresDaViagem = useLugares(viagem.id, destinos, meuId)
  const passo = useMemo(() => {
    if (lugaresDaViagem.estado !== 'pronto' || trajetos.estado.status !== 'pronto') return null
    const lugaresPorDestino: Record<string, number> = {}
    for (const l of lugaresDaViagem.lugares) if (l.destinoId) lugaresPorDestino[l.destinoId] = (lugaresPorDestino[l.destinoId] ?? 0) + 1
    const lista = trajetos.estado.trajetos
    const semTrajeto = destinos.slice(1).findIndex((d, i) => !lista.some((t) => t.origem_id === destinos[i].id && t.destino_id === d.id))
    const semHospedagem = hospedagem.itens.find((i) => i.situacao === 'precisa')
    return proximoPasso({
      hoje: hojeTexto(),
      dataInicio: viagem.data_inicio,
      dataFim: viagem.data_fim,
      destinos,
      lugaresPorDestino,
      pessoas: membros.length,
      euSouAdm,
      semHospedagem: semHospedagem ? { nome: semHospedagem.destino.nome } : null,
      trechoSemTransporte: semTrajeto >= 0 ? { de: destinos[semTrajeto].nome, para: destinos[semTrajeto + 1].nome } : null,
    })
  }, [lugaresDaViagem.estado, lugaresDaViagem.lugares, trajetos.estado, destinos, hospedagem.itens, viagem.data_inicio, viagem.data_fim, membros.length, euSouAdm])

  // Tem mudança no rascunho que ainda não foi salva?
  const assinatura = (lista: ItemRoteiro[]) => lista.map((i) => `${i.chave}|${i.chegada ?? ''}|${i.saida ?? ''}`).join()
  const alterado = rascunho !== null && assinatura(rascunho) !== assinatura(destinos.map(paraItem))

  // Spec 001: sugerir o período da viagem a partir das datas dos destinos
  const periodo = periodoDosDestinos(destinos)
  const sugerirPeriodo =
    euSouAdm &&
    !rascunho &&
    periodo &&
    (periodo.inicio !== viagem.data_inicio || periodo.fim !== viagem.data_fim) &&
    (!viagem.data_inicio || !viagem.data_fim || periodo.inicio < viagem.data_inicio || periodo.fim > viagem.data_fim)
  const [ajustando, setAjustando] = useState(false)

  async function ajustarPeriodo() {
    if (!periodo) return
    setAjustando(true)
    try {
      atualizarViagem(await editarViagem(viagem.id, { data_inicio: periodo.inicio, data_fim: periodo.fim }))
    } catch (erro) {
      console.error('Erro ao ajustar o período:', erro)
    } finally {
      setAjustando(false)
    }
  }

  // Avisa antes de perder alterações: trocando de aba dentro do site...
  const bloqueio = useBlocker(
    ({ currentLocation, nextLocation }) => ativa && alterado && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (bloqueio.state !== 'blocked') return
    if (window.confirm('Você tem alterações no roteiro que não foram salvas. Sair mesmo assim?')) bloqueio.proceed()
    else bloqueio.reset()
  }, [bloqueio])

  // ...e fechando ou recarregando a página
  useEffect(() => {
    if (!alterado) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [alterado])

  function editar(comBusca: boolean) {
    setRascunho(destinos.map(paraItem))
    setAbrirBusca(comBusca)
    setErroAoSalvar(null)
    setConflito(false)
  }

  // Cancelar = jogar o rascunho fora; nada foi pro banco
  function cancelar() {
    setRascunho(null)
    setErroAoSalvar(null)
    setConflito(false)
  }

  // Depois de um conflito: busca o roteiro atual do banco e sai da edição
  async function recarregarRoteiro() {
    try {
      atualizarDestinos(await buscarDestinos(viagem.id))
      cancelar()
    } catch {
      setErroAoSalvar('Não deu pra recarregar o roteiro. Atualize a página.')
    }
  }

  async function salvar() {
    if (!rascunho || rascunho.length === 0) return
    setSalvando(true)
    setErroAoSalvar(null)
    setConflito(false)
    try {
      // "Tudo ou nada": ou o roteiro inteiro é salvo, ou nada muda no banco.
      // Só são apagados os destinos que a pessoa removeu de propósito.
      const salvos = await salvarRoteiro(viagem.id, rascunho, idsRemovidos(destinos, rascunho))
      atualizarDestinos(salvos) // todas as abas recebem a lista nova
      setRascunho(null)
    } catch (erro) {
      if (erro instanceof RoteiroDesatualizado) {
        setConflito(true)
        setErroAoSalvar(
          'O roteiro foi alterado em outro lugar (outra aba, outro aparelho ou outra pessoa) desde que você começou a editar. Nada foi salvo. Recarregue o roteiro para ver a versão atual e refaça suas mudanças.',
        )
      } else {
        console.error('Erro ao salvar o roteiro:', erro)
        setErroAoSalvar(mensagemDeErroAoSalvar(erro))
      }
    } finally {
      setSalvando(false)
    }
  }
  const areaLivre = useMemo(() => ({ esquerda: 24, topo: 24, direita: 24, baixo: 24 }), [])
  const falta = contagem(viagem.data_inicio, viagem.data_fim)
  // Spec 049: quanto da preparação já está pronto (antes da viagem começar)
  const comprados = trajetos.estado.status === 'pronto' ? resumoDosTrajetos(trajetos.estado.trajetos) : null
  const docsProgresso = progresso(docs.checklist.itens, docs.meus)
  const pronto =
    viagem.data_inicio && viagem.data_inicio > hojeTexto()
      ? prontidao([
          // Congelado pelo RUMO (03/11/2026): documentos de entrada saem da conta
          ...(CONGELADO.documentos ? [] : [{ nome: 'documentos', feitas: docsProgresso.feitas, total: docsProgresso.total }]),
          { nome: 'hospedagem', feitas: hospResumo.resolvidos, total: hospResumo.total },
          { nome: 'trajetos comprados', feitas: comprados?.comprados ?? 0, total: comprados?.total ?? 0 },
        ])
      : null

  // Spec 092: furos no plano (até o fim da viagem)
  const furos =
    destinos.length > 0 && trajetos.estado.status === 'pronto' && hospedagem.estado === 'pronto' && !(viagem.data_fim && viagem.data_fim < hojeTexto())
      ? encontrarFuros({
          destinos,
          trajetos: trajetos.estado.trajetos,
          escolhidas: hospedagem.itens.flatMap((i) =>
            i.escolhida ? [{ destinoId: i.destino.id, nome: i.escolhida.nome, checkin: i.escolhida.checkin, checkout: i.escolhida.checkout }] : [],
          ),
        })
      : []
  const [vendoTodosFuros, setVendoTodosFuros] = useState(false)

  // Na fase de planejar (sem destino ou sem datas), o orçamento combinado sobe pro começo do mosaico
  const planejando = destinos.length === 0 || !viagem.data_inicio

  // Atalhos do app (tela "1g" do design): um quadradinho pra cada parte da viagem
  const qtdTrajetos = trajetos.estado.status === 'pronto' ? trajetos.estado.trajetos.length : null
  const atalhos = [
    { para: 'hoje', Icone: Sun, titulo: 'Hoje', sub: 'Agora e próximo' },
    { para: 'explorar', Icone: Route, titulo: 'Roteiro', sub: 'Escolher e montar os dias' },
    { para: 'agenda', Icone: CalendarRange, titulo: 'Agenda', sub: `${destinos.length} ${destinos.length === 1 ? 'destino' : 'destinos'}` },
    {
      para: 'transportes',
      Icone: Car,
      titulo: 'Transporte',
      sub: qtdTrajetos ? `${qtdTrajetos} ${qtdTrajetos === 1 ? 'trajeto' : 'trajetos'}` : 'Nada ainda',
    },
    { para: 'hospedagem', Icone: BedDouble, titulo: 'Hospedagem', sub: hospResumo.total ? `${hospResumo.resolvidos} de ${hospResumo.total} fechadas` : 'Opções e votos' },
    { para: 'lugares', Icone: MapPinned, titulo: 'Lugares', sub: 'Ideias e votos' },
    {
      para: 'financeiro',
      Icone: ReceiptText,
      titulo: 'Contas',
      sub: resumo && resumo !== 'erro' && resumo.gasto > 0 ? formatarDinheiro(resumo.gasto, viagem.moeda_principal) : 'Gastos e acertos',
    },
    { para: 'fotos', Icone: ImageIcon, titulo: 'Fotos', sub: 'Feed do comboio' },
    { para: 'comboio', Icone: Users, titulo: 'Comboio', sub: `${membros.length} ${membros.length === 1 ? 'pessoa' : 'pessoas'}` },
    { para: 'retrospectiva', Icone: Sparkles, titulo: 'Retrospectiva', sub: 'A viagem em números' },
    { para: 'imprimir', Icone: FileText, titulo: 'PDF', sub: 'Roteiro e livro' },
  ]

  return (
    <div className="overview">
      {/* Capa da viagem, igual à do app (mesma foto): datas, nome e o comboio */}
      <section className="overview-capa">
        <img src={capa(viagem.id, 1600)} alt="" />
        {falta && (
          <span className="overview-contagem" title={pronto?.faltando.length ? `Falta: ${pronto.faltando.join(', ')}` : undefined}>
            <Clock size={16} aria-hidden="true" />
            {falta}
            {pronto && (
              <>
                <span className="overview-contagem-divisoria" aria-hidden="true" />
                {pronto.porcento}% pronto
              </>
            )}
          </span>
        )}
        <div className="overview-capa-texto">
          <div>
            <p>{[formatarPeriodo(viagem.data_inicio, viagem.data_fim), destinos[0]?.nome].filter(Boolean).join(' · ')}</p>
            <h1>{viagem.nome}</h1>
            {/* Spec 007: tocar no comboio abre quem vai, papéis e convites */}
            <Link to="comboio" className="overview-capa-comboio" aria-label="Ver o comboio">
              <PilhaDeAvatares pessoas={membros.map((m) => ({ nome: m.nome, url: m.avatarUrl }))} tamanho={30} />
              {membros.length} {membros.length === 1 ? 'viajante' : 'viajantes'}
            </Link>
          </div>
          <Link to="comboio" className="overview-capa-convidar">
            <Plus size={17} aria-hidden="true" /> Convidar
          </Link>
        </div>
      </section>

      {passo && (
        <section className="proximo-passo" aria-label="Próximo passo">
          <span className="proximo-passo-rotulo">Próximo passo</span>
          <strong>{passo.titulo}</strong>
          <Link to={passo.link} className="proximo-passo-botao">
            {passo.botao} <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}

      <nav className="overview-atalhos" aria-label="Partes da viagem">
        {atalhos.map(({ para, Icone, titulo, sub }) => (
          <Link key={para} to={para} className="overview-atalho">
            <IconeQuadrado icone={Icone} />
            <span>
              <strong>{titulo}</strong>
              <small>{sub}</small>
            </span>
          </Link>
        ))}
      </nav>

      {/* Spec 019: recados do ADM fixados no topo */}
      <FaixaAvisos viagemId={viagem.id} euSouAdm={euSouAdm} />
      {/* Spec 046: viagem ainda sem destino ("sonhando") */}
      {destinos.length === 0 && (
        <section className="faixa-sonhando" aria-label="Modo sonhando">
          <Sparkles size={20} aria-hidden="true" />
          <div>
            <strong>Modo sonhando: a viagem ainda não tem destino.</strong>
            <ol>
              <li>Crie uma enquete "Pra onde vamos?" com as ideias do comboio.</li>
              <li>Cada um põe, em segredo, quanto topa gastar (Orçamento combinado).</li>
              <li>Decidiram? {euSouAdm ? 'Adicione os destinos no Roteiro, aqui embaixo.' : 'O ADM adiciona os destinos no Roteiro.'}</li>
            </ol>
          </div>
        </section>
      )}
      {/* Design Plataforma (spec 113): coluna larga (mapa, roteiro, clima, fotos) + coluna estreita
          (furos e documentos). No celular as duas viram uma só. */}
      <div className="overview-colunas">
        <div className="overview-principal">
          <section className="overview-mapa">
            <MapaMundi pontos={pontos} areaLivre={areaLivre} zoomMaximo={8} />
            {pontos.length > 1 && <p className="mapa-legenda">As linhas mostram só a ordem do roteiro, não o caminho real.</p>}
          </section>

          {/* Roteiro: destinos na ordem. O ADM pode editar (o banco também só deixa o ADM). */}
          <Cartao
            titulo={rascunho ? 'Editando roteiro' : 'Roteiro'}
            icone={MapPin}
            className={rascunho ? 'overview-roteiro editando' : 'overview-roteiro'}
            acao={
              !rascunho && (
                <span className="overview-roteiro-acoes">
                  {podeEditarRoteiro && (
                    <button type="button" className="roteiro-editar" onClick={() => editar(false)}>
                      <Pencil size={14} aria-hidden="true" /> Editar
                    </button>
                  )}
                  <Link to="agenda">Abrir</Link>
                </span>
              )
            }
          >
            {rascunho ? (
              <EditorRoteiro
                itens={rascunho}
                aoMudar={setRascunho}
                aoSalvar={salvar}
                aoCancelar={cancelar}
                salvando={salvando}
                erro={erroAoSalvar}
                acaoDoErro={conflito ? { rotulo: 'Recarregar roteiro', aoClicar: recarregarRoteiro } : undefined}
                abrirBusca={abrirBusca}
                periodo={{ inicio: viagem.data_inicio, fim: viagem.data_fim }}
              />
            ) : (
              <>
                <ol className="roteiro-lista">
                  {roteiro.map((d, i) => {
                    const { periodo: quandoVai, noites } = datasDoDestino(d)
                    return (
                      <li key={d.chave} className={i === indiceDeHoje ? 'hoje' : undefined}>
                        <span className="roteiro-numero">{i + 1}</span>
                        <span className="roteiro-nome">
                          <strong>
                            {d.nome}
                            {i === indiceDeHoje && <span className="selo-completar">hoje</span>}
                          </strong>
                          {quandoVai && <small>{quandoVai}</small>}
                          {noites && <small className="roteiro-noites">{noites}</small>}
                        </span>
                      </li>
                    )
                  })}
                </ol>
                {sugerirPeriodo && (
                  <div className="editor-aviso roteiro-periodo">
                    <span>
                      As datas dos destinos vão de {formatarPeriodo(periodo.inicio, periodo.fim)}
                      {viagem.data_inicio ? ', fora do período da viagem.' : '.'}
                    </span>
                    <button type="button" className="botao secundario pequeno" onClick={ajustarPeriodo} disabled={ajustando}>
                      {ajustando ? 'Ajustando…' : 'Usar como período da viagem'}
                    </button>
                  </div>
                )}
                {euSouAdm && (
                  <button type="button" className="editor-adicionar roteiro-adicionar" onClick={() => editar(true)}>
                    <Plus size={16} aria-hidden="true" /> Adicionar lugar
                  </button>
                )}
              </>
            )}
          </Cartao>

          {/* Roadmap #8: clima dia a dia de cada destino */}
          <ClimaDaViagem destinos={destinos} />

          {/* Spec 006: as fotos mais recentes */}
          <Cartao titulo="Fotos" icone={Camera} acao={<Link to="fotos">Abrir</Link>} className="overview-fotos">
            {ultimasFotos.length > 0 ? (
              <ul className="resumo-fotos">
                {ultimasFotos.map((f) => (
                  <li key={f.id}>
                    <Link to="fotos" aria-label={f.legenda ?? 'Ver fotos'}>
                      {f.url && <img src={f.url} alt="" loading="lazy" />}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="resumo-vazio">
                As 5 melhores fotos de cada lugar aparecem aqui. <Link to="fotos">Enviar foto</Link>
              </p>
            )}
          </Cartao>
        </div>

        <div className="overview-lateral">
          {furos.length > 0 && (
            <Cartao titulo={furos.length === 1 ? '1 furo no plano' : `${furos.length} furos no plano`} icone={AlertTriangle} className="overview-furos">
              <ul className="furos-lista">
                {(vendoTodosFuros ? furos : furos.slice(0, 4)).map((f) => (
                  <li key={f.chave} className={f.gravidade === 'alta' ? 'furo-alto' : undefined}>
                    {f.aba ? (
                      <Link to={f.aba}>
                        <span>{f.texto}</span>
                        <ChevronRight size={15} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span>{f.texto}</span>
                    )}
                  </li>
                ))}
              </ul>
              {furos.length > 4 && (
                <button type="button" className="botao-texto" onClick={() => setVendoTodosFuros(!vendoTodosFuros)}>
                  {vendoTodosFuros ? 'Ver menos' : `Ver os ${furos.length}`}
                </button>
              )}
            </Cartao>
          )}
          {/* Spec 010: checklist de documentos. Congelado pelo RUMO (03/11/2026) */}
          {!CONGELADO.documentos && (
            <ChecklistDocumentos
              docs={docs}
              membros={membros}
              className="overview-documentos"
              passaporte={{ viagemId: viagem.id, meuId, volta: viagem.data_fim ?? viagem.data_inicio, euSouAdm }}
            />
          )}
        </div>
      </div>

      {/* O resto em mosaico de até 3 colunas (cada cartão com a altura do conteúdo) */}
      <div className="overview-mosaico">
        {/* Spec 045: orçamento combinado (ao planejar, o modo sonhando pede ele primeiro) */}
        {planejando && (
          <Cartao titulo="Orçamento combinado" icone={PiggyBank} className="overview-orcamento-combinado">
            <OrcamentoCombinado viagemId={viagem.id} meuId={meuId} moeda={viagem.moeda_principal} />
          </Cartao>
        )}

        {/* Spec 075: destinos candidatos (no modo sonhando, ou enquanto houver roteiro curto) */}
        {destinos.length <= 1 && (
          <Cartao titulo="Pra onde vamos?" icone={MapPinned} className="overview-candidatos">
            <DestinosCandidatos />
          </Cartao>
        )}

        {/* Spec 065: datas em comum (mais útil antes de fechar as datas) */}
        {(!viagem.data_inicio || destinos.length === 0) && (
          <Cartao titulo="Datas em comum" icone={CalendarRange} className="overview-datas-comum">
            <DatasEmComum />
          </Cartao>
        )}

        {/* Spec 011: quantos destinos já têm onde ficar */}
        <Cartao titulo="Hospedagem" icone={BedDouble} acao={<Link to="hospedagem">Abrir</Link>} className="overview-hospedagem">
          {hospedagem.estado === 'carregando' ? (
            <p className="carregando-texto">Carregando…</p>
          ) : hospedagem.estado === 'erro' ? (
            <p className="carregando-texto">Não deu pra carregar agora.</p>
          ) : hospResumo.total === 0 ? (
            <p className="resumo-vazio">Nenhum destino com pernoite ainda.</p>
          ) : (
            <Link to="hospedagem" className="resumo-orcamento">
              <span className="numero">
                {hospResumo.resolvidos} <small>de {hospResumo.total}</small>
              </span>
              <span className="numero-legenda">
                {hospResumo.resolvidos === hospResumo.total
                  ? 'destinos com hospedagem: tudo fechado'
                  : `destinos com hospedagem${proximaSemHospedagem ? ` · falta ${proximaSemHospedagem.destino.nome}` : ''}`}
              </span>
              <span className="categoria-barra">
                <span style={{ width: `${(hospResumo.resolvidos / hospResumo.total) * 100}%` }} />
              </span>
            </Link>
          )}
        </Cartao>

        {/* Spec 006: gasto até agora × orçamento */}
        <Cartao titulo="Orçamento" icone={Wallet} acao={<Link to="financeiro">Abrir</Link>} className="overview-orcamento">
          {resumo === null ? (
            <p className="carregando-texto">Carregando…</p>
          ) : resumo === 'erro' ? (
            <p className="carregando-texto">Não deu pra carregar agora.</p>
          ) : resumo.gasto === 0 && resumo.meta === 0 ? (
            <p className="resumo-vazio">
              Nenhum gasto ainda. <Link to="financeiro">Lançar gasto</Link>
            </p>
          ) : (
            <Link to="financeiro" className="resumo-orcamento">
              <span className="numero">{formatarDinheiro(resumo.gasto, viagem.moeda_principal)}</span>
              {resumo.meta > 0 ? (
                <>
                  <span className="numero-legenda">
                    de {formatarDinheiro(resumo.meta, viagem.moeda_principal)} · {Math.round((resumo.gasto / resumo.meta) * 100)}%
                  </span>
                  <span className={resumo.gasto > resumo.meta ? 'categoria-barra estourou' : 'categoria-barra'}>
                    <span style={{ width: `${Math.min(100, (resumo.gasto / resumo.meta) * 100)}%` }} />
                  </span>
                </>
              ) : (
                <span className="numero-legenda">gasto pelo comboio até agora</span>
              )}
            </Link>
          )}
        </Cartao>

        {/* Spec 006: o próximo trajeto (o mesmo que aparece em Transportes) */}
        <Cartao titulo="Próximo trajeto" icone={TrainFront} acao={<Link to="transportes">Abrir</Link>} className="overview-trajeto">
          {proximo ? (
            <Link to="transportes" className="resumo-trajeto">
              <strong>
                {nomeDoDestino(proximo.origem_id)} → {nomeDoDestino(proximo.destino_id)}
              </strong>
              <span>
                {meio(proximo.meio).nome} · {proximo.partida ? quando(proximo.partida) : 'horário a definir'}
              </span>
            </Link>
          ) : (
            <p className="resumo-vazio">
              {trajetos.estado.status === 'pronto' && trajetos.estado.trajetos.length > 0 ? 'Nenhum trajeto pela frente.' : 'Nenhum trajeto ainda.'}{' '}
              {euSouAdm && <Link to="transportes">Adicionar trajeto</Link>}
            </p>
          )}
        </Cartao>

        <Cartao titulo="Comboio" icone={Users} acao={<Link to="comboio">Abrir</Link>} className="overview-comboio-cartao">
          <ul className="overview-comboio">
            {membros.map((m) => (
              <li key={m.id}>
                <Avatar nome={m.nome} url={m.avatarUrl} tamanho={32} />
                <span>{m.nome}</span>
                {m.papel === 'adm' && <span className="selo">ADM</span>}
              </li>
            ))}
          </ul>
        </Cartao>

        {!planejando && (
          <Cartao titulo="Orçamento combinado" icone={PiggyBank} className="overview-orcamento-combinado">
            <OrcamentoCombinado viagemId={viagem.id} meuId={meuId} moeda={viagem.moeda_principal} />
          </Cartao>
        )}

        {/* Spec 021: enquetes rápidas pra decidir junto */}
        <Cartao titulo="Enquetes" icone={BarChart3} className="overview-enquetes">
          <Enquetes viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />
        </Cartao>

        {/* Spec 051: "cheguei bem" com um toque */}
        <Cartao titulo="Cheguei bem" icone={CircleCheck} className="overview-cheguei">
          <ChegueiBem />
        </Cartao>

        {/* Spec 069: mala individual (só a pessoa vê) */}
        <Cartao titulo="Minha mala" icone={Luggage} className="overview-mala">
          <MinhaMala />
        </Cartao>

        {/* Spec 048: quem leva o quê + lista de compras */}
        <Cartao titulo="Listas do comboio" icone={ShoppingBasket} className="overview-listas">
          <ListasDoComboio />
        </Cartao>

        {/* Spec 047: ficha do país + lembrete do eSIM. Congelado pelo RUMO (03/11/2026) */}
        {!CONGELADO.fichaDoPais && (
          <Cartao titulo="Ficha do país" icone={Globe} className="overview-ficha-pais">
            <FichaDoPais viagem={viagem} destinos={destinos} />
          </Cartao>
        )}

        {/* Roadmap #7: ponto de encontro (onde e que horas se encontrar) */}
        <Cartao titulo="Ponto de encontro" icone={MapPin} className="overview-encontro">
          <PontoDeEncontro viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />
        </Cartao>

        {/* Spec 020: tarefas com responsável */}
        <Cartao titulo="Tarefas" icone={ListChecks} className="overview-tarefas">
          <Checklist viagemId={viagem.id} membros={membros} meuId={meuId} euSouAdm={euSouAdm} />
        </Cartao>

        {/* Spec 028: cofre (reservas, ingressos, PDFs) */}
        <Cartao titulo="Cofre" icone={Lock} className="overview-cofre">
          <Cofre />
        </Cartao>
      </div>
    </div>
  )
}
