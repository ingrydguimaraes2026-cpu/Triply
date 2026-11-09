import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AlertTriangle, ArrowLeft, ChevronRight, Plus, Route, Trash2 } from '../../components/ui/icones'
import {
  diaNoFuso,
  formatarDinheiro,
  meioComCaminho,
  meioComMotorista,
  nomeDaSituacao,
  nomeDaSituacaoDoDeslocamento,
  passagensDaViagem,
  textoDoDia,
  type CasaDoDia,
  type ItemDaPassagem,
  type Tables,
} from '@together/core'
import { useViagemAtual, type Membro } from '../../features/viagens/hooks'
import { useTrajetos } from '../../features/transportes/hooks'
import { useCofre } from '../../features/cofre/hooks'
import BilheteDoTrajeto from '../../features/cofre/BilheteDoTrajeto'
import { apagarTrajeto, meio, vouBuscar, type Trajeto } from '../../features/transportes/api'
import FormDeslocamento from '../../features/transportes/FormDeslocamento'
import CompararOpcoes from '../../features/transportes/CompararOpcoes'
import CaminhoDoTrajeto from '../../features/transportes/CaminhoDoTrajeto'
import { buscarOpcoes } from '../../features/hospedagem/api'
import BotaoIr from '../../components/ui/BotaoIr'
import BotaoRedondo from '../../components/ui/BotaoRedondo'
import Carregando from '../../components/ui/Carregando'
import ErroNaTela from '../../components/ui/ErroNaTela'
import Norti from '../../components/ui/Norti'
import RotuloDeSecao from '../../components/ui/RotuloDeSecao'
import TituloDaTela from '../../components/ui/TituloDaTela'
import './transportes.css'

// Passagens (spec 122d), espelho do app (apps/mobile/app/transportes.tsx, novo-deslocamento.tsx,
// comparar.tsx e caminho.tsx). O que falta decidir, o que falta comprar e o que já está garantido,
// os avisos sérios da viagem toda e quanto custa o transporte. A chegada e a volta de cada um ficam no fim.
// Celular: a lista OU o painel aberto (?passagem=). Computador: lista à esquerda, painel à direita.
// ?passagem=novo | opcoes:<grupo> | caminho:<id> | <id do deslocamento>

type Destino = Tables<'destinos'>
type Prefill = { grupo: string | null; dia: string | null; de: string; para: string }

function diaDeHoje() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Transportes({ naAba = false }: { naAba?: boolean }) {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  // Spec 078/122: decidir e comprar é do ADM ou de quem ele liberou; membro sugere
  const podeDecidir = euSouAdm || viagem.membro_edita_transportes
  const { estado, recarregar } = useTrajetos(viagem.id, true)
  const cofre = useCofre(viagem.id)
  const [casas, setCasas] = useState<CasaDoDia[]>([]) // casas escolhidas: avisos de check-in
  useEffect(() => {
    buscarOpcoes(viagem.id)
      .then((ops) => setCasas(ops.filter((o) => o.escolhida)))
      .catch(() => setCasas([]))
  }, [viagem.id])
  const [busca, setBusca] = useSearchParams()
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  const cabecalho = naAba ? null : <TituloDaTela titulo="Passagens" />

  if (estado.status === 'carregando')
    return (
      <>
        {cabecalho}
        <Carregando texto="Carregando as passagens…" compacto />
      </>
    )
  if (estado.status === 'erro')
    return (
      <>
        {cabecalho}
        <ErroNaTela titulo="Não deu pra carregar as passagens" aoTentar={recarregar} />
      </>
    )

  const trajetos = estado.trajetos
  const pessoais = trajetos.filter((t) => t.tipo === 'chegada' || t.tipo === 'saida')
  const p = passagensDaViagem(
    trajetos.filter((t) => t.tipo !== 'chegada' && t.tipo !== 'saida'),
    destinos,
    casas,
  )
  const nada = trajetos.length === 0
  const moedas = Object.keys(p.total)

  // Painel aberto (da URL)
  const passagem = busca.get('passagem')
  function abrir(valor: string | null, novoPrefill: Prefill | null = null) {
    setPrefill(novoPrefill)
    // Mantém o resto da URL (a aba Reservas usa ?parte=transporte)
    setBusca(
      (atual) => {
        const nova = new URLSearchParams(atual)
        if (valor) nova.set('passagem', valor)
        else nova.delete('passagem')
        return nova
      },
      { replace: !!passagem && !!valor },
    )
  }
  const abrirItem = (i: ItemDaPassagem) => abrir(i.grupo && i.opcoes > 1 ? `opcoes:${i.grupo}` : i.id)
  const abrirNovo = () => abrir('novo')
  const outraOpcao = (grupo: string, dia: string, de: string, para: string) => abrir('novo', { grupo, dia: dia || null, de, para })
  async function depoisDeSalvar(grupo: string | null) {
    await recarregar()
    if (grupo) abrir(`opcoes:${grupo}`)
    else abrir(null)
  }

  const painel = (() => {
    if (!passagem) return null
    if (passagem === 'novo')
      return (
        <FormDeslocamento
          key={`novo-${prefill?.grupo ?? ''}`}
          viagemId={viagem.id}
          moeda={viagem.moeda_principal}
          destinos={destinos}
          trajetos={trajetos}
          trajeto={null}
          grupo={prefill?.grupo ?? null}
          diaInicial={prefill?.dia ?? viagem.data_inicio ?? diaDeHoje()}
          deInicial={prefill?.de}
          paraInicial={prefill?.para}
          podeDecidir={podeDecidir}
          meuId={meuId}
          aoSalvar={(g) => void depoisDeSalvar(g)}
          aoOutraOpcao={outraOpcao}
          aoComparar={(g) => abrir(`opcoes:${g}`)}
        />
      )
    if (passagem.startsWith('opcoes:'))
      return (
        <CompararOpcoes
          grupo={passagem.slice(7)}
          trajetos={trajetos}
          podeDecidir={podeDecidir}
          aoMudar={recarregar}
          aoEditar={(id) => abrir(id)}
          aoOutraOpcao={(dia, de, para) => outraOpcao(passagem.slice(7), dia, de, para)}
        />
      )
    const id = passagem.startsWith('caminho:') ? passagem.slice(8) : passagem
    const t = trajetos.find((x) => x.id === id)
    if (!t) return <p className="ps-nota">Esse deslocamento não existe mais.</p>
    if (passagem.startsWith('caminho:')) return <CaminhoDoTrajeto key={t.id} trajeto={t} destinos={destinos} />
    return (
      <FormDeslocamento
        key={t.id}
        viagemId={viagem.id}
        moeda={viagem.moeda_principal}
        destinos={destinos}
        trajetos={trajetos}
        trajeto={t}
        grupo={null}
        diaInicial={viagem.data_inicio ?? diaDeHoje()}
        podeDecidir={podeDecidir}
        meuId={meuId}
        aoSalvar={(g) => void depoisDeSalvar(g)}
        aoOutraOpcao={outraOpcao}
        aoComparar={(g) => abrir(`opcoes:${g}`)}
      />
    )
  })()

  return (
    <>
      {cabecalho}
      <div className={painel ? 'ps com-painel' : 'ps'}>
        <section className="ps-lista" aria-label="Passagens">
          {nada ? (
            <div className="ps-vazio">
              <Norti humor="dormindo" tamanho={110} />
              <h2>Nenhum deslocamento ainda</h2>
              <p>Clique em "Novo deslocamento", diga de onde e pra onde e veja as opções.</p>
            </div>
          ) : (
            <div className="ps-contadores">
              <Contador numero={p.decidir.length} rotulo="pra decidir" tipo="decidir" />
              <Contador numero={p.comprar.length} rotulo="pra comprar" tipo="comprar" />
              <Contador numero={p.compradas.length} rotulo={p.compradas.length === 1 ? 'comprada' : 'compradas'} tipo="compradas" />
            </div>
          )}

          {p.avisos.length > 0 && (
            <div className="ps-avisos">
              <p className="ps-avisos-titulo">
                <AlertTriangle size={17} aria-hidden="true" /> {p.avisos.length === 1 ? '1 coisa pra olhar' : `${p.avisos.length} coisas pra olhar`}
              </p>
              {p.avisos.map((a) => (
                <button key={`${a.dia}-${a.chave}`} type="button" className="ps-aviso" onClick={() => a.trajetoId && abrir(a.trajetoId)} disabled={!a.trajetoId}>
                  <b>
                    {textoDoDia(a.dia)} · {a.titulo}
                  </b>
                  <small>{a.texto}</small>
                </button>
              ))}
            </div>
          )}

          <Lista titulo="Pra decidir" itens={p.decidir} aberto={passagem} aoAbrir={abrirItem} />
          <Lista titulo="Pra comprar" itens={p.comprar} aberto={passagem} aoAbrir={abrirItem} />
          <Lista titulo="Compradas" itens={p.compradas} aberto={passagem} aoAbrir={abrirItem} />

          {moedas.length > 0 && (
            <div className="ps-total">
              <RotuloDeSecao>Transporte da viagem</RotuloDeSecao>
              {moedas.map((m) => (
                <div key={m} className="ps-total-linha">
                  <strong>{formatarDinheiro(Math.round(p.total[m] * 100), m)}</strong>
                  <small>{formatarDinheiro(Math.round((p.pago[m] ?? 0) * 100), m)} já pago</small>
                </div>
              ))}
              <small>Soma do preço de cada deslocamento (a opção escolhida). Não entra nos gastos sozinho.</small>
            </div>
          )}

          {pessoais.length > 0 && <RotuloDeSecao>Chegada e volta de cada um</RotuloDeSecao>}
          {pessoais.map((t) => (
            <Passagem
              key={t.id}
              trajeto={t}
              destinos={destinos}
              membros={membros}
              meuId={meuId}
              podeMexer={podeDecidir || t.criado_por === meuId}
              bilhete={cofre.arquivos?.find((a) => a.trajeto_id === t.id)}
              viagemId={viagem.id}
              aoMudarBilhete={cofre.recarregar}
              aoMudar={recarregar}
              aoVerCaminho={() => abrir(`caminho:${t.id}`)}
            />
          ))}

          <div className="ps-novo">
            <button type="button" className="botao" onClick={abrirNovo}>
              <Plus size={18} aria-hidden="true" /> Novo deslocamento
            </button>
          </div>
        </section>

        <section className="ps-painel" aria-label="Deslocamento">
          {painel ? (
            <>
              <div className="ps-painel-topo">
                <BotaoRedondo rotulo="Voltar" aoClicar={() => abrir(null)}>
                  <ArrowLeft size={20} />
                </BotaoRedondo>
              </div>
              {painel}
            </>
          ) : (
            <div className="ps-vazio">
              <Norti humor="apontando" tamanho={96} />
              <p>Escolha um deslocamento ao lado pra ver, comparar as opções ou mudar. Ou crie um novo.</p>
              <button type="button" className="botao secundario" onClick={abrirNovo}>
                <Plus size={18} aria-hidden="true" /> Novo deslocamento
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function Contador({ numero, rotulo, tipo }: { numero: number; rotulo: string; tipo: 'decidir' | 'comprar' | 'compradas' }) {
  return (
    <div className={`ps-contador ${tipo}`}>
      <strong>{numero}</strong>
      <span>{rotulo}</span>
    </div>
  )
}

function Lista({ titulo, itens, aberto, aoAbrir }: { titulo: string; itens: ItemDaPassagem[]; aberto: string | null; aoAbrir: (i: ItemDaPassagem) => void }) {
  if (!itens.length) return null
  return (
    <div className="ps-grupo">
      <RotuloDeSecao>{titulo}</RotuloDeSecao>
      <ul className="ps-itens">
        {itens.map((i) => {
          const { icone: Icone, nome } = meio(i.meio)
          const atual = aberto === i.id || (!!i.grupo && aberto === `opcoes:${i.grupo}`)
          const linha = [
            i.dia ? textoDoDia(i.dia) : 'Sem data',
            i.hora,
            i.situacao === 'comparando' ? `${i.opcoes} opções` : nome,
            i.situacao === 'reservado' ? nomeDaSituacaoDoDeslocamento(i.situacao) : null,
            i.naHora ? 'compra na hora' : null,
          ]
            .filter(Boolean)
            .join(' · ')
          return (
            <li key={i.id}>
              <button type="button" className={atual ? 'ps-item atual' : 'ps-item'} onClick={() => aoAbrir(i)} aria-current={atual || undefined}>
                <span className="ps-icone">
                  <Icone size={19} aria-hidden="true" />
                </span>
                <span className="ps-texto">
                  <b>{i.titulo}</b>
                  <small>{linha}</small>
                </span>
                {i.preco != null && i.moeda && <b className="ps-item-preco">{formatarDinheiro(Math.round(i.preco * 100), i.moeda)}</b>}
                <ChevronRight size={16} aria-hidden="true" className="ps-seta" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Chegada ou volta de alguém (lançada pela reserva), com o cartão completo como no app
function Passagem({
  trajeto: t,
  destinos,
  membros,
  meuId,
  podeMexer,
  bilhete,
  viagemId,
  aoMudarBilhete,
  aoMudar,
  aoVerCaminho,
}: {
  trajeto: Trajeto
  destinos: Destino[]
  membros: Membro[]
  meuId: string
  podeMexer: boolean
  bilhete: Parameters<typeof BilheteDoTrajeto>[0]['bilhete']
  viagemId: string
  aoMudarBilhete: () => void
  aoMudar: () => Promise<void> | void
  aoVerCaminho: () => void
}) {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const { icone: Icone, nome } = meio(t.meio)
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? null
  const nomeDo = (id: string | null) => membros.find((m) => m.id === id)?.nome ?? null
  const primeiro = (n: string | null) => (n ?? '').split(' ')[0]
  const origem = t.estacao_partida ?? nomeDe(t.origem_id) ?? 'De fora'
  const destino = t.estacao_chegada ?? nomeDe(t.destino_id) ?? 'Pra casa'
  const ehChegada = t.tipo === 'chegada'
  const euBusco = t.quem_busca_id === meuId
  const quemBusca = nomeDo(t.quem_busca_id)
  const gente = t.passageiros.map((id) => primeiro(nomeDo(id))).filter(Boolean)
  const detalhe = [t.partida ? textoDoDia(diaNoFuso(t.partida)) : null, t.observacao, t.situacao !== 'sugestao' ? nomeDaSituacao(t.situacao) : null].filter(Boolean).join(' · ')
  const hora = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—')

  async function buscar() {
    setOcupado(true)
    setErro(null)
    try {
      await vouBuscar(t.id, !euBusco)
      await aoMudar()
    } catch {
      setErro('Não deu. Confira a internet e tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  async function apagar() {
    if (!window.confirm('Apagar este transporte? Some pra todo mundo do comboio.')) return
    try {
      await apagarTrajeto(t.id)
      await aoMudar()
    } catch {
      setErro('Não deu pra apagar. Só quem lançou ou o ADM apaga.')
    }
  }

  return (
    <article className="ps-passagem">
      <div className="ps-passagem-topo">
        <span className="ps-icone">
          <Icone size={19} aria-hidden="true" />
        </span>
        <span className="ps-texto">
          <b>
            {nome}
            {t.bate_e_volta ? ' · bate e volta' : ''}
          </b>
          {detalhe && <small>{detalhe}</small>}
        </span>
        {podeMexer && (
          <button type="button" className="ps-editar" onClick={() => void apagar()} aria-label="Apagar transporte" title="Apagar transporte">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="ps-trecho">
        <div>
          <strong>{origem}</strong>
          <small>{hora(t.partida)}</small>
        </div>
        <span className="ps-tracinho" aria-hidden="true">
          <i />
          <Icone size={16} />
          <i />
        </span>
        <div className="fim">
          <strong>{destino}</strong>
          <small>{hora(t.chegada)}</small>
        </div>
      </div>
      {gente.length > 0 && <small className="ps-suave">Vão: {gente.join(', ')}</small>}
      {meioComMotorista(t.meio) && (t.motorista_id || t.lugares_livres != null) && (
        <small className="ps-suave">
          {[t.motorista_id ? `Dirige: ${primeiro(nomeDo(t.motorista_id))}` : null, t.lugares_livres != null ? `${t.lugares_livres} ${t.lugares_livres === 1 ? 'lugar sobrando' : 'lugares sobrando'}` : null]
            .filter(Boolean)
            .join(' · ')}
        </small>
      )}
      {ehChegada && quemBusca && !euBusco && <small className="ps-verde">{primeiro(quemBusca)} vai buscar</small>}
      <div className="ps-acoes">
        <BilheteDoTrajeto viagemId={viagemId} trajetoId={t.id} bilhete={bilhete} aoMudar={aoMudarBilhete} />
        {t.estacao_partida && <BotaoIr alvo={{ nome: t.estacao_partida, cidade: nomeDe(t.origem_id) }} rotulo="Como chegar na estação" />}
        {meioComCaminho(t.meio) && (
          <button type="button" className="ps-chip" onClick={aoVerCaminho}>
            <Route size={15} aria-hidden="true" /> Ver o caminho
          </button>
        )}
        {ehChegada && t.criado_por !== meuId && !t.passageiros.includes(meuId) && (
          <button type="button" className={euBusco ? 'ps-chip verde' : 'ps-chip'} onClick={() => void buscar()} disabled={ocupado}>
            {euBusco ? 'Você vai buscar' : 'Eu busco'}
          </button>
        )}
      </div>
      {erro && <p className="form-erro" role="alert">{erro}</p>}
    </article>
  )
}
