import { useState } from 'react'
import { AlertTriangle, ArrowRight, ArrowRightLeft, ExternalLink, Pencil, Plus, Wallet } from '../../components/ui/icones'
import { conexoes, formatarDinheiro, linkDoCaminho, meioComCaminho, kmEstimados, lerEscalas, textoDaConexao, nomeDaSituacao, resumoDosTrajetos, rodizio, type Tables } from '@together/core'
import FormGasto from '../../features/financeiro/FormGasto'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useTrajetos } from '../../features/transportes/hooks'
import { useCofre } from '../../features/cofre/hooks'
import BilheteDoTrajeto from '../../features/cofre/BilheteDoTrajeto'
import { meio, vouNesse, type Trajeto } from '../../features/transportes/api'
import { avisosDoTrajeto, diaLocal, hora, proximoDeslocamento } from '../../features/transportes/avisos'
import {
  agruparPasseios,
  linksDoTrecho,
  trechosDaRota,
  type Passeio,
} from '../../features/transportes/rota'
import FormTrajeto from '../../features/transportes/FormTrajeto'
import ChegadasESaidas from '../../features/transportes/ChegadasESaidas'
import { formatarData } from '../../lib/datas'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Carregando from '../../components/ui/Carregando'
import ErroNaTela from '../../components/ui/ErroNaTela'
import Cartao from '../../components/ui/Cartao'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './hospedagem.css'
import './transportes.css'

type Destino = Tables<'destinos'>
type Janela = { trajeto?: Trajeto; origemId?: string; destinoId?: string; tipo?: 'chegada' | 'saida' } | null
type GastoDoTrajeto = Trajeto | null

// Transportes (spec 004): mapa do Google com o caminho, a rota cidade a cidade e os passeios (bate-e-volta).
export default function Transportes() {
  const { viagem, destinos, membros, meuId, euSouAdm: souAdmDeVerdade } = useViagemAtual()
  // Spec 078: com transportes liberados, o membro edita trajetos como o ADM
  const euSouAdm = souAdmDeVerdade || viagem.membro_edita_transportes
  const [gastoDe, setGastoDe] = useState<GastoDoTrajeto>(null) // spec 035: lançar o trajeto como gasto
  const { estado, recarregar } = useTrajetos(viagem.id)
  const cofre = useCofre(viagem.id) // spec 028: bilhetes dos trajetos
  const [janela, setJanela] = useState<Janela>(null)

  const [soOsMeus, setSoOsMeus] = useState(false) // spec 067: "meu itinerário"
  const carregados = estado.status === 'pronto' ? estado.trajetos : []
  // Spec 121: chegadas e saídas de cada um ficam na seção própria; o resto da tela é dos trechos do grupo
  const todosTrajetos = carregados.filter((t) => (t.tipo ?? 'trecho') === 'trecho')
  const trajetos = soOsMeus ? todosTrajetos.filter((t) => vouNesse(t, meuId)) : todosTrajetos
  const destinoDe = (id: string | null) => destinos.find((d) => d.id === id) ?? null
  const nomeDe = (id: string | null) => destinoDe(id)?.nome ?? 'Sem destino'

  const trechos = trechosDaRota(destinos)
  const passeios = agruparPasseios(trajetos, diaLocal)
  const doTrecho = (de: Destino, para: Destino) => trajetos.filter((t) => !t.bate_e_volta && t.origem_id === de.id && t.destino_id === para.id)
  // Trecho feito como passeio (ex.: Nice → Mônaco, voltando pra Nice no mesmo dia)
  const passeioDoTrecho = (de: Destino, para: Destino) =>
    passeios.find((p) => (p.ida.origem_id === de.id && p.ida.destino_id === para.id) || (p.ida.origem_id === para.id && p.ida.destino_id === de.id))
  const usados = new Set(trechos.flatMap(({ de, para }) => doTrecho(de, para).map((t) => t.id)))
  const outros = trajetos.filter((t) => !t.bate_e_volta && !usados.has(t.id))

  const todosAvisos = trajetos.flatMap((t) => avisosDoTrajeto(t, destinos, trajetos).map((texto) => ({ texto, trajeto: t })))
  const avisos = todosAvisos.filter((a, i) => todosAvisos.findIndex((b) => b.texto === a.texto) === i)
  const resumo = resumoDosTrajetos(trajetos)
  // Spec 073: km estimados de cada trecho de carro e o rodízio de motoristas
  const kmDoTrajeto = (t: Trajeto) => {
    const de = destinoDe(t.origem_id)
    const para = destinoDe(t.destino_id)
    return de && para ? kmEstimados(de, para) : null
  }
  const motoristas = rodizio(trajetos.filter((t) => t.meio === 'carro').map((t) => ({ motorista_id: t.motorista_id ?? null, km: kmDoTrajeto(t) })))
  const proximo = proximoDeslocamento(trajetos, destinos.map((d) => d.id))

  const porDia = new Map<string, Trajeto[]>()
  for (const t of trajetos) if (t.partida) porDia.set(diaLocal(t.partida), [...(porDia.get(diaLocal(t.partida)) ?? []), t])

  const fechar = () => setJanela(null)

  const linha = (t: Trajeto, rotulo?: string) => {
    const { icone: Icone, nome } = meio(t.meio)
    return (
      <li key={t.id} className={proximo?.id === t.id ? 'trajeto proximo' : 'trajeto'}>
        <span className="trajeto-icone" title={nome}>
          <Icone size={18} aria-hidden="true" />
        </span>
        <span className="trajeto-texto">
          <strong>
            {rotulo && <span className="selo-suave">{rotulo}</span>}
            {nomeDe(t.origem_id)} <ArrowRight size={14} aria-hidden="true" /> {nomeDe(t.destino_id)}
            {proximo?.id === t.id && <span className="selo-completar">próximo</span>}
          </strong>
          <small>
            {nome}
            {t.partida ? ` · ${formatarData(diaLocal(t.partida))} ${hora(t.partida)}` : ' · sem horário'}
            {t.chegada && ` → ${diaLocal(t.chegada) !== (t.partida && diaLocal(t.partida)) ? `${formatarData(diaLocal(t.chegada))} ` : ''}${hora(t.chegada)}`}
          </small>
          <span className="trajeto-situacao">
            {/* Spec 067: quem vai */}
            {t.passageiros.length > 0 && (
              <span className={t.passageiros.includes(meuId) ? 'selo-passageiros meu' : 'selo-passageiros'}>
                {t.passageiros.map((id) => (id === meuId ? 'você' : (membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? '?'))).join(', ')}
              </span>
            )}
            <span className={`selo-situacao situacao-${t.situacao}`}>{nomeDaSituacao(t.situacao)}</span>
            {/* Spec 073: carro, quem dirige e km estimados */}
            {t.meio === 'carro' && (t.motorista_id || kmDoTrajeto(t)) && (
              <span className="trajeto-carro">
                {t.motorista_id && `${t.motorista_id === meuId ? 'Você dirige' : `${membros.find((m) => m.id === t.motorista_id)?.nome.split(' ')[0] ?? '?'} dirige`}`}
                {t.motorista_id && kmDoTrajeto(t) && ' · '}
                {kmDoTrajeto(t) && `~${kmDoTrajeto(t)} km`}
              </span>
            )}
            {t.preco !== null && t.moeda && <span className="trajeto-preco">{formatarDinheiro(Math.round(Number(t.preco) * 100), t.moeda)}</span>}
            {t.preco !== null && t.moeda && t.situacao !== 'sugestao' && (
              <button type="button" className="botao-texto" onClick={() => setGastoDe(t)}>
                <Wallet size={14} aria-hidden="true" /> Lançar como gasto
              </button>
            )}
          </span>
          {/* Spec 074: estações e escalas */}
          {(t.estacao_partida || t.estacao_chegada) && (
            <small>
              {t.estacao_partida ?? '?'} → {t.estacao_chegada ?? '?'}
            </small>
          )}
          {conexoes(lerEscalas(t.escalas), t.meio).map((c) => (
            <small key={c.local} className={c.curta ? 'trajeto-conexao curta' : 'trajeto-conexao'}>
              Escala em {c.local}
              {c.minutos !== null && ` · ${textoDaConexao(c.minutos)} de conexão`}
              {c.curta && ' · conexão curta!'}
            </small>
          ))}
          {t.observacao && <small className="trajeto-obs">{t.observacao}</small>}
          {meioComCaminho(t.meio) && (
            <a
              href={linkDoCaminho(t.estacao_partida ?? nomeDe(t.origem_id), t.estacao_chegada ?? nomeDe(t.destino_id))}
              target="_blank"
              rel="noreferrer noopener"
              className="trajeto-link"
            >
              Ver o caminho <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
          {t.link_reserva && (
            <a href={t.link_reserva} target="_blank" rel="noreferrer noopener" className="trajeto-link">
              Reserva <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
          <BilheteDoTrajeto
            viagemId={viagem.id}
            trajetoId={t.id}
            bilhete={cofre.arquivos?.find((a) => a.trajeto_id === t.id)}
            aoMudar={cofre.recarregar}
          />
        </span>
        {euSouAdm && (
          <button type="button" className="botao-texto" onClick={() => setJanela({ trajeto: t })} aria-label="Editar trajeto">
            <Pencil size={16} aria-hidden="true" />
          </button>
        )}
      </li>
    )
  }

  const comparar = (de: Destino, para: Destino) => (
    <div className="rota-comparar">
      {linksDoTrecho(de, para, de.saida).map((l) => (
        <a key={l.chave} href={l.url} target="_blank" rel="noreferrer noopener" className={`rota-link link-${l.chave}`}>
          {l.nome} <ExternalLink size={12} aria-hidden="true" />
        </a>
      ))}
    </div>
  )

  // ---------- Painéis ----------
  const painelTudo = () => (
    <section className="hosp-painel" aria-label="Entre cidades">
      <header className="hosp-painel-topo">
        <div>
          <h2>Entre cidades</h2>
          <p>
            {destinos.length} {destinos.length === 1 ? 'parada' : 'paradas'} · {trajetos.length}{' '}
            {trajetos.length === 1 ? 'trajeto cadastrado' : 'trajetos cadastrados'}
          </p>
          {todosTrajetos.some((t) => t.passageiros.length > 0) && (
            <label className="interruptor trajeto-meus">
              <span>
                <strong>Meu itinerário</strong>
                <small>Só os trajetos em que você vai</small>
              </span>
              <input type="checkbox" checked={soOsMeus} onChange={(e) => setSoOsMeus(e.target.checked)} />
            </label>
          )}
          {motoristas.length > 0 && (
            <p className="trajeto-resumo">
              Rodízio no volante:{' '}
              {motoristas
                .map((m) => `${m.motoristaId === meuId ? 'você' : (membros.find((x) => x.id === m.motoristaId)?.nome.split(' ')[0] ?? '?')} ~${m.km} km`)
                .join(' · ')}
            </p>
          )}
          {trajetos.length > 0 && (
            <p className="trajeto-resumo">
              {resumo.comprados} de {resumo.total} {resumo.total === 1 ? 'comprado' : 'comprados'}
              {resumo.aPagar.length > 0 && ` · falta pagar ${resumo.aPagar.map((p) => formatarDinheiro(p.valor, p.moeda)).join(' + ')}`}
              {resumo.semPreco > 0 && ` · ${resumo.semPreco} sem preço`}
            </p>
          )}
        </div>
      </header>
      {trechos.length === 0 && <p className="hosp-vazio">Quando a viagem tiver mais de um destino, os trechos aparecem aqui.</p>}
    </section>
  )

  const painelTrecho = (de: Destino, para: Destino) => {
    const lista = doTrecho(de, para)
    const passeio = passeioDoTrecho(de, para)
    const vazio = lista.length === 0 && !passeio
    return (
      <section className={vazio ? 'hosp-painel trecho-compacto' : 'hosp-painel'} aria-label={`${de.nome} para ${para.nome}`}>
        <header className="hosp-painel-topo">
          <div>
            <h2 className="rota-titulo">
              {de.nome} <ArrowRight size={20} aria-hidden="true" /> {para.nome}
            </h2>
            <p>
              {de.saida ? `Saída de ${de.nome}: ${formatarData(de.saida, true)}` : 'Data a definir no roteiro'}
            </p>
          </div>
          <span className={lista.length || passeio ? 'hosp-selo selo-resolvido' : 'hosp-selo selo-precisa'}>
            {lista.length || passeio ? 'Definido' : 'Falta definir'}
          </span>
        </header>
        {passeio && (
          <p className="rota-aviso-passeio">
            <ArrowRightLeft size={15} aria-hidden="true" /> Esse trecho está como passeio (bate-e-volta): veja logo abaixo.
          </p>
        )}
        {lista.length > 0 ? (
          <ul className="trajetos">{lista.map((t) => linha(t))}</ul>
        ) : (
          null
        )}
        {comparar(de, para)}
        {euSouAdm && (
          <button type="button" className="hosp-adicionar" onClick={() => setJanela({ origemId: de.id, destinoId: para.id })}>
            <Plus size={16} aria-hidden="true" /> {lista.length ? 'Outro trajeto' : 'Adicionar trajeto'}
          </button>
        )}
      </section>
    )
  }

  const painelPasseio = (p: Passeio<Trajeto>) => {
    const base = destinoDe(p.ida.origem_id)
    const alvo = destinoDe(p.ida.destino_id)
    return (
      <section className="hosp-painel" aria-label="Passeio">
        <header className="hosp-painel-topo">
          <div>
            <h2 className="rota-titulo">
              {nomeDe(p.ida.origem_id)} <ArrowRightLeft size={20} aria-hidden="true" /> {nomeDe(p.ida.destino_id)}
            </h2>
            <p>Passeio de ida e volta{p.ida.partida ? ` · ${formatarData(diaLocal(p.ida.partida), true)}` : ''}</p>
          </div>
          <span className={p.volta ? 'hosp-selo selo-resolvido' : 'hosp-selo selo-precisa'}>{p.volta ? 'Ida e volta' : 'Falta a volta'}</span>
        </header>
        <ul className="trajetos">
          {linha(p.ida, 'Ida')}
          {p.volta && linha(p.volta, 'Volta')}
        </ul>
        {!p.volta && <p className="hosp-vazio">A volta ainda não foi cadastrada. Sem ela, vocês ficam em {nomeDe(p.ida.destino_id)}.</p>}
        {base && alvo && comparar(base, alvo)}
        {euSouAdm && !p.volta && (
          <button type="button" className="hosp-adicionar" onClick={() => setJanela({ origemId: p.ida.destino_id ?? undefined, destinoId: p.ida.origem_id ?? undefined })}>
            <Plus size={16} aria-hidden="true" /> Cadastrar a volta
          </button>
        )}
      </section>
    )
  }

  return (
    <>
      <CabecalhoPagina
        acima={viagem.nome}
        titulo="Transportes"
        subtitulo="Quem chega quando e como vocês vão de uma cidade pra outra."
        acao={
          euSouAdm &&
          destinos.length > 0 && (
            <button type="button" className="botao" onClick={() => setJanela({})}>
              <Plus size={18} aria-hidden="true" /> Adicionar trajeto
            </button>
          )
        }
      />

      {estado.status === 'carregando' && <Carregando texto="Carregando os trajetos…" compacto />}
      {estado.status === 'erro' && (
        <ErroNaTela titulo="Não deu pra carregar os trajetos" aoTentar={recarregar} />
      )}

      {avisos.length > 0 && (
        <section className="avisos-logistica" aria-label="Avisos de logística">
          {avisos.map((a) => (
            <p key={a.texto}>
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                <strong>
                  {nomeDe(a.trajeto.origem_id)} → {nomeDe(a.trajeto.destino_id)}:
                </strong>{' '}
                {a.texto}
              </span>
            </p>
          ))}
        </section>
      )}

      {estado.status === 'pronto' && (
        <ChegadasESaidas
          trajetos={carregados}
          membros={membros}
          destinos={destinos}
          meuId={meuId}
          euSouAdm={souAdmDeVerdade}
          aoAdicionar={(tipo) => setJanela({ tipo })}
          aoEditar={(t) => setJanela({ trajeto: t })}
          aoMudar={recarregar}
        />
      )}

      {destinos.length === 0 ? (
        <p className="hosp-vazio">Adicione destinos no roteiro (na Overview) pra montar a rota.</p>
      ) : (
        <>
          {painelTudo()}
          {trechos.map(({ de, para }) => (
            <div key={`${de.id}-${para.id}`}>{painelTrecho(de, para)}</div>
          ))}
          {passeios.map((p) => (
            <div key={p.ida.id}>{painelPasseio(p)}</div>
          ))}
        </>
      )}

      {outros.length > 0 && (
        <Cartao titulo="Outros trajetos">
          <p className="form-dica">Trajetos que não ligam dois destinos seguidos do roteiro, ou que ficaram sem destino.</p>
          <ul className="trajetos">{outros.map((t) => linha(t))}</ul>
        </Cartao>
      )}

      {janela && (
        <Gaveta titulo={janela.trajeto ? 'Editar trajeto' : janela.tipo === 'chegada' ? 'Adicionar sua chegada' : janela.tipo === 'saida' ? 'Adicionar sua volta' : 'Adicionar trajeto'} aoFechar={fechar}>
          <FormTrajeto
            viagemId={viagem.id}
            moedaViagem={viagem.moeda_principal}
            membros={membros}
            destinos={destinos}
            trajeto={janela.trajeto}
            origemId={janela.origemId}
            destinoId={janela.destinoId}
            tipo={janela.tipo}
            aoTerminar={() => {
              fechar()
              recarregar()
            }}
          />
        </Gaveta>
      )}

      {gastoDe && (
        <Gaveta titulo="Lançar trajeto como gasto" aoFechar={() => setGastoDe(null)}>
          <FormGasto
            viagemId={viagem.id}
            moedaViagem={viagem.moeda_principal}
            membros={membros}
            meuId={meuId}
            euSouAdm={souAdmDeVerdade}
            inicial={{
              descricao: `${meio(gastoDe.meio).nome}: ${nomeDe(gastoDe.origem_id)} → ${nomeDe(gastoDe.destino_id)}`.slice(0, 200),
              valor: gastoDe.preco !== null ? Math.round(Number(gastoDe.preco) * 100) : undefined,
              moeda: gastoDe.moeda ?? undefined,
              categoria: 'transporte',
              ...(gastoDe.partida ? { data: diaLocal(gastoDe.partida) } : {}),
            }}
            aoTerminar={() => setGastoDe(null)}
          />
        </Gaveta>
      )}
    </>
  )
}
