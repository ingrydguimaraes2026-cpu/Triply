import { useEffect, useMemo, useState } from 'react'
import { Link, useBlocker } from 'react-router'
import { MapPin, Pencil, Plus, Sparkles } from '../../components/ui/icones'
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
import { useAbaAtiva, useViagemAtual } from '../../features/viagens/hooks'
import { editarViagem } from '../../features/viagens/api'
import { formatarData, formatarPeriodo } from '../../lib/datas'
import Cartao from '../../components/ui/Cartao'
import TituloDaTela from '../../components/ui/TituloDaTela'
import './abas.css'
import './viagem-tela.css'

// Duas linhas embaixo do nome: "12 – 15 nov" e "3 noites" (ou o país quando não tem data)
function datasDoDestino(d: ItemRoteiro): { periodo: string | null; noites: string | null } {
  if (!d.chegada) return { periodo: d.pais && d.pais !== d.nome ? d.pais : null, noites: null }
  if (!d.saida) return { periodo: `Chega ${formatarData(d.chegada)}`, noites: null }
  const noites = contarNoites(d.chegada, d.saida)
  const periodo = d.chegada === d.saida ? formatarData(d.chegada) : `${formatarData(d.chegada)} – ${formatarData(d.saida)}`
  return { periodo, noites: noites === null ? null : textoNoites(noites) }
}

// Cidades (como a tela "Cidades do roteiro" do app): o mapa e as cidades na ordem, com as datas.
// O ADM edita (o banco também só deixa o ADM). Antes isso ficava na tela da viagem (Overview).
export default function Cidades() {
  const { viagem, destinos, euSouAdm, atualizarDestinos, atualizarViagem } = useViagemAtual()
  const podeEditarRoteiro = euSouAdm || viagem.membro_edita_roteiro // spec 078
  const ativa = useAbaAtiva()

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

  return (
    <div className="overview cidades">
      <TituloDaTela titulo="Cidades" voltar="../tudo" acima={destinos.length > 0 ? `${destinos.length} ${destinos.length === 1 ? 'cidade' : 'cidades'}` : undefined} />
      {/* Spec 046: viagem ainda sem destino ("sonhando") */}
      {destinos.length === 0 && (
        <section className="faixa-sonhando" aria-label="Modo sonhando">
          <Sparkles size={20} aria-hidden="true" />
          <div>
            <strong>Modo sonhando: a viagem ainda não tem destino.</strong>
            <ol>
              <li>Crie uma enquete "Pra onde vamos?" com as ideias do comboio.</li>
              <li>Cada um informa, em segredo, quanto topa gastar (Orçamento combinado, em Tudo da viagem).</li>
              <li>Decidiram? {euSouAdm ? 'Adicione as cidades aqui embaixo.' : 'O ADM adiciona as cidades aqui.'}</li>
            </ol>
          </div>
        </section>
      )}
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
                  <Link to="../agenda">Agenda</Link>
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

      </div>
    </div>
  )
}
