import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker } from 'react-router'
import { AlertTriangle, BarChart3, BedDouble, MapPinned, CalendarRange, Camera, CircleCheck, ListChecks, Lock, Luggage, MapPin, Globe, Pencil, PiggyBank, Plus, ShoppingBasket, Sparkles, TrainFront, Users, Wallet } from 'lucide-react'
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
import { encontrarFuros, formatarDinheiro, prontidao, resumoDosTrajetos } from '@together/core'
import { progresso } from '../../features/documentos/checklist'
import { useTrajetos } from '../../features/transportes/hooks'
import { meio } from '../../features/transportes/api'
import { diaLocal, hora, proximoDeslocamento } from '../../features/transportes/avisos'
import { useFotos } from '../../features/fotos/hooks'
import { useDocumentos } from '../../features/documentos/hooks'
import ChecklistDocumentos from '../../features/documentos/ChecklistDocumentos'
import { useHospedagem } from '../../features/hospedagem/hooks'
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
import './abas.css'

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

// "12 – 15 nov · 3 noites", ou o país quando não tem data
function datasDoDestino(d: ItemRoteiro) {
  if (!d.chegada) return d.pais && d.pais !== d.nome ? d.pais : null
  if (!d.saida) return `Chega ${formatarData(d.chegada)}`
  const noites = contarNoites(d.chegada, d.saida)
  const periodo = d.chegada === d.saida ? formatarData(d.chegada) : `${formatarData(d.chegada)} – ${formatarData(d.saida)}`
  return noites === null ? periodo : `${periodo} · ${textoNoites(noites)}`
}

// Overview: resumo de tudo. Cada cartão leva pra aba dele.
export default function Overview() {
  const { viagem, destinos, membros, meuId, euSouAdm, atualizarDestinos, atualizarViagem } = useViagemAtual()
  const podeEditarRoteiro = euSouAdm || viagem.membro_edita_roteiro // spec 078
  useFocoDeItem() // destaca a enquete/ponto quando se chega por um link de compartilhar

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
  const areaLivre = useMemo(() => ({ esquerda: 24, topo: 120, direita: 24, baixo: 24 }), [])
  const falta = contagem(viagem.data_inicio, viagem.data_fim)
  // Spec 049: quanto da preparação já está pronto (antes da viagem começar)
  const comprados = trajetos.estado.status === 'pronto' ? resumoDosTrajetos(trajetos.estado.trajetos) : null
  const docsProgresso = progresso(docs.checklist.itens, docs.meus)
  const pronto =
    viagem.data_inicio && viagem.data_inicio > hojeTexto()
      ? prontidao([
          { nome: 'documentos', feitas: docsProgresso.feitas, total: docsProgresso.total },
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

  return (
    <div className="overview">
      {/* Spec 019: recados do ADM fixados no topo */}
      <FaixaAvisos viagemId={viagem.id} euSouAdm={euSouAdm} />
      {/* Spec 105: viagem acabou → retrospectiva */}
      {viagem.data_fim && viagem.data_fim < hojeTexto() && (
        <Link to="retrospectiva" className="faixa-retrospectiva">
          <Sparkles size={18} aria-hidden="true" /> A viagem acabou. Ver a retrospectiva →
        </Link>
      )}
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
      {/* Coluna larga: mapa, roteiro e fotos */}
      <div className="overview-principal">
        <section className="overview-mapa">
          <MapaMundi pontos={pontos} areaLivre={areaLivre} zoomMaximo={8} />
          {pontos.length > 1 && <p className="mapa-legenda">As linhas mostram só a ordem do roteiro, não o caminho real.</p>}
          <div className="overview-mapa-texto">
            {falta && (
              <span className="overview-contagem" title={pronto?.faltando.length ? `Falta: ${pronto.faltando.join(', ')}` : undefined}>
                {falta}
                {pronto && ` · ${pronto.porcento}% pronto`}
              </span>
            )}
            <h1>{viagem.nome}</h1>
            <p>{formatarPeriodo(viagem.data_inicio, viagem.data_fim)}</p>
          </div>
        </section>

        {/* Roteiro: destinos na ordem. O ADM pode editar (o banco também só deixa o ADM). */}
        <Cartao
          titulo={rascunho ? 'Editando roteiro' : 'Roteiro'}
          icone={MapPin}
          className={rascunho ? 'overview-roteiro editando' : 'overview-roteiro'}
          acao={
            podeEditarRoteiro &&
            !rascunho && (
              <button type="button" className="roteiro-editar" onClick={() => editar(false)}>
                <Pencil size={14} aria-hidden="true" /> Editar
              </button>
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
                  const detalhe = datasDoDestino(d)
                  return (
                    <li key={d.chave} className={i === indiceDeHoje ? 'hoje' : undefined}>
                      <span className="roteiro-numero">{i + 1}</span>
                      <span className="roteiro-nome">
                        <strong>
                          {d.nome}
                          {i === indiceDeHoje && <span className="selo-completar">hoje</span>}
                        </strong>
                        {detalhe && <small>{detalhe}</small>}
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

      {/* Coluna estreita: documentos e resumos */}
      <div className="overview-lateral">
        {furos.length > 0 && (
          <Cartao titulo={furos.length === 1 ? '1 furo no plano' : `${furos.length} furos no plano`} icone={AlertTriangle} className="overview-furos">
            <ul className="furos-lista">
              {(vendoTodosFuros ? furos : furos.slice(0, 4)).map((f) => (
                <li key={f.chave} className={f.gravidade === 'alta' ? 'furo-alto' : undefined}>
                  {f.aba ? <Link to={f.aba}>{f.texto}</Link> : f.texto}
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
        {/* Spec 010: checklist de documentos */}
        <ChecklistDocumentos
          docs={docs}
          membros={membros}
          className="overview-documentos"
          passaporte={{ viagemId: viagem.id, meuId, volta: viagem.data_fim ?? viagem.data_inicio, euSouAdm }}
        />

        {/* Roadmap #8: clima dia a dia de cada destino */}
        <ClimaDaViagem destinos={destinos} />

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

        {/* Spec 047: ficha do país + lembrete do eSIM */}
        <Cartao titulo="Ficha do país" icone={Globe} className="overview-ficha-pais">
          <FichaDoPais viagem={viagem} destinos={destinos} />
        </Cartao>

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

        {/* Spec 045: orçamento combinado em segredo */}
        <Cartao titulo="Orçamento combinado" icone={PiggyBank} className="overview-orcamento-combinado">
          <OrcamentoCombinado viagemId={viagem.id} meuId={meuId} moeda={viagem.moeda_principal} />
        </Cartao>

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
                {hospResumo.resolvidos} de {hospResumo.total}
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

        {/* Spec 020: tarefas com responsável */}
        <Cartao titulo="Tarefas" icone={ListChecks} className="overview-tarefas">
          <Checklist viagemId={viagem.id} membros={membros} meuId={meuId} euSouAdm={euSouAdm} />
        </Cartao>

        {/* Roadmap #7: ponto de encontro (onde e que horas se encontrar) */}
        <Cartao titulo="Ponto de encontro" icone={MapPin} className="overview-encontro">
          <PontoDeEncontro viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />
        </Cartao>

        {/* Spec 028: cofre (reservas, ingressos, PDFs) */}
        <Cartao titulo="Cofre" icone={Lock} className="overview-cofre">
          <Cofre />
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
      </div>
    </div>
  )
}
