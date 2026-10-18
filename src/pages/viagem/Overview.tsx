import { useEffect, useMemo, useState } from 'react'
import { Link, useBlocker } from 'react-router'
import { Camera, MapPin, Pencil, Plus, TrainFront, Users, Wallet } from 'lucide-react'
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
import { contarNoites, periodoDosDestinos, textoNoites } from '../../features/destinos/datas'
import { useViagemAtual } from '../../features/viagens/hooks'
import { editarViagem } from '../../features/viagens/api'
import { diasAte, formatarData, formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import Cartao from '../../components/ui/Cartao'
import EstadoVazio from '../../components/ui/EstadoVazio'
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

// "12 – 15 nov · 3 noites", ou o país quando não tem data
function datasDoDestino(d: ItemRoteiro) {
  if (!d.chegada) return d.pais
  if (!d.saida) return `Chega ${formatarData(d.chegada)}`
  const noites = contarNoites(d.chegada, d.saida)
  const periodo = d.chegada === d.saida ? formatarData(d.chegada) : `${formatarData(d.chegada)} – ${formatarData(d.saida)}`
  return noites === null ? periodo : `${periodo} · ${textoNoites(noites)}`
}

// Overview: resumo de tudo. Cada cartão leva pra aba dele.
export default function Overview() {
  const { viagem, destinos, membros, euSouAdm, atualizarDestinos, atualizarViagem } = useViagemAtual()

  // Modo de edição do roteiro: enquanto edita, a lista E o mapa mostram o rascunho.
  // null = não está editando (mostra o que está salvo).
  const [rascunho, setRascunho] = useState<ItemRoteiro[] | null>(null)
  const [abrirBusca, setAbrirBusca] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null)
  const [conflito, setConflito] = useState(false)

  // Fonte única pra lista e mapa
  const roteiro = useMemo(() => rascunho ?? destinos.map(paraItem), [rascunho, destinos])

  const pontos = useMemo(
    () =>
      roteiro
        .filter((d) => d.latitude !== null && d.longitude !== null)
        .map((d) => ({ nome: d.nome, latitude: d.latitude!, longitude: d.longitude! })),
    [roteiro],
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
    ({ currentLocation, nextLocation }) => alterado && currentLocation.pathname !== nextLocation.pathname,
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

  return (
    <div className="overview">
      {/* Mapa grande com o nome da viagem */}
      <section className="overview-mapa">
        <MapaMundi pontos={pontos} areaLivre={areaLivre} zoomMaximo={8} />
        <div className="overview-mapa-texto">
          {falta && <span className="overview-contagem">{falta}</span>}
          <h1>{viagem.nome}</h1>
          <p>{formatarPeriodo(viagem.data_inicio, viagem.data_fim)}</p>
        </div>
      </section>

      {/* Roteiro: destinos na ordem. O ADM pode editar (o banco também só deixa o ADM). */}
      <Cartao
        titulo={rascunho ? 'Editando roteiro' : 'Roteiro'}
        icone={MapPin}
        className="overview-roteiro"
        acao={
          euSouAdm &&
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
              {roteiro.map((d, i) => (
                <li key={d.chave}>
                  <span className="roteiro-numero">{i + 1}</span>
                  <span className="roteiro-nome">
                    <strong>{d.nome}</strong>
                    <small>{datasDoDestino(d)}</small>
                  </span>
                </li>
              ))}
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
        {roteiro.length > 1 && (
          <p className="roteiro-legenda">No mapa, as linhas mostram só a ordem do roteiro, não o caminho real.</p>
        )}
      </Cartao>

      {/* TODO (Ingryd): quando o Financeiro existir, mostrar aqui o total gasto × orçamento */}
      <Cartao titulo="Orçamento" icone={Wallet} acao={<Link to="financeiro">Abrir</Link>}>
        <EstadoVazio
          compacto
          icone={Wallet}
          titulo="Sem orçamento ainda"
          texto="Defina quanto querem gastar por categoria."
        />
      </Cartao>

      {/* TODO (Ingryd): mostrar aqui o próximo trajeto (o mais perto de hoje) */}
      <Cartao titulo="Próximo trajeto" icone={TrainFront} acao={<Link to="transportes">Abrir</Link>}>
        <EstadoVazio
          compacto
          icone={TrainFront}
          titulo="Nenhum trajeto"
          texto="Adicione como vocês vão de um destino pro outro."
        />
      </Cartao>

      <Cartao titulo="Comboio" icone={Users} acao={<Link to="comboio">Abrir</Link>}>
        <ul className="overview-comboio">
          {membros.map((m) => (
            <li key={m.id}>
              <Avatar nome={m.nome} url={m.avatarUrl} tamanho={36} />
              <span>{m.nome}</span>
              {m.papel === 'adm' && <span className="selo">ADM</span>}
            </li>
          ))}
        </ul>
      </Cartao>

      {/* TODO (Ingryd): mostrar aqui as últimas fotos postadas */}
      <Cartao titulo="Fotos" icone={Camera} acao={<Link to="fotos">Abrir</Link>} className="overview-fotos">
        <EstadoVazio
          compacto
          icone={Camera}
          titulo="Nenhuma foto ainda"
          texto="As melhores fotos de cada lugar aparecem aqui."
        />
      </Cartao>
    </div>
  )
}
