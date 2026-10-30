import { useState } from 'react'
import { AlertTriangle, ArrowRight, ArrowRightLeft, Check, ExternalLink, Maximize2, Pencil, Plane, Plus, Route, Wallet } from 'lucide-react'
import { conexoes, formatarDinheiro, kmEstimados, lerEscalas, textoDaConexao, nomeDaSituacao, resumoDosTrajetos, rodizio, type Tables } from '@together/core'
import FormGasto from '../../features/financeiro/FormGasto'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useTrajetos } from '../../features/transportes/hooks'
import { useCofre } from '../../features/cofre/hooks'
import BilheteDoTrajeto from '../../features/cofre/BilheteDoTrajeto'
import { meio, vouNesse, type Trajeto } from '../../features/transportes/api'
import { avisosDoTrajeto, diaLocal, hora, proximoDeslocamento } from '../../features/transportes/avisos'
import {
  agruparPasseios,
  linkDeVoo,
  linkDoMapaRota,
  linksDoTrecho,
  modoDoMeio,
  MODOS_NO_MAPA,
  parteTerrestre,
  trechoLongo,
  trechosDaRota,
  type ModoNoMapa,
  type Passeio,
} from '../../features/transportes/rota'
import MapaMundi from '../../features/mapa/MapaMundi'
import MapaGoogle from '../../features/mapa/MapaGoogle'
import FormTrajeto from '../../features/transportes/FormTrajeto'
import { formatarData } from '../../lib/datas'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './hospedagem.css'
import './transportes.css'

type Destino = Tables<'destinos'>
type Janela = { trajeto?: Trajeto; origemId?: string; destinoId?: string } | null
type GastoDoTrajeto = Trajeto | null
type Selecao = { tipo: 'tudo' } | { tipo: 'trecho'; indice: number } | { tipo: 'passeio'; id: string }

// Transportes (spec 004): mapa do Google com o caminho, a rota cidade a cidade e os passeios (bate-e-volta).
export default function Transportes() {
  const { viagem, destinos, membros, meuId, euSouAdm: souAdmDeVerdade } = useViagemAtual()
  // Spec 078: com transportes liberados, o membro edita trajetos como o ADM
  const euSouAdm = souAdmDeVerdade || viagem.membro_edita_transportes
  const [gastoDe, setGastoDe] = useState<GastoDoTrajeto>(null) // spec 035: lançar o trajeto como gasto
  const { estado, recarregar } = useTrajetos(viagem.id)
  const cofre = useCofre(viagem.id) // spec 028: bilhetes dos trajetos
  const [janela, setJanela] = useState<Janela>(null)
  const [selecao, setSelecao] = useState<Selecao>({ tipo: 'tudo' })
  // Viagem com voo (ex.: Galeão → Paris) abre no modo avião, que mostra a rota inteira no mapa-múndi
  const [modo, setModo] = useState<ModoNoMapa>(() =>
    trechosDaRota(destinos).some(({ de, para }) => trechoLongo(de, para)) ? 'aviao' : 'transporte',
  )

  const [soOsMeus, setSoOsMeus] = useState(false) // spec 067: "meu itinerário"
  const todosTrajetos = estado.status === 'pronto' ? estado.trajetos : []
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

  // Seleção atual (se o trecho/passeio sumiu, volta pra viagem inteira)
  const trechoSel = selecao.tipo === 'trecho' ? trechos[selecao.indice] : undefined
  const passeioSel = selecao.tipo === 'passeio' ? passeios.find((p) => p.ida.id === selecao.id) : undefined
  const atual: Selecao = (selecao.tipo === 'trecho' && !trechoSel) || (selecao.tipo === 'passeio' && !passeioSel) ? { tipo: 'tudo' } : selecao

  // Modo do mapa ao trocar de seleção: o meio do trajeto cadastrado; sem trajeto, avião se for longe
  function selecionar(nova: Selecao, meioPadrao?: string, lugares?: Destino[]) {
    setSelecao(nova)
    if (meioPadrao) return setModo(modoDoMeio(meioPadrao))
    const pares = trechosDaRota(lugares ?? destinos)
    setModo(pares.some(({ de, para }) => trechoLongo(de, para)) ? 'aviao' : 'transporte')
  }

  const lugaresNoMapa: Destino[] =
    atual.tipo === 'trecho' && trechoSel
      ? [trechoSel.de, trechoSel.para]
      : atual.tipo === 'passeio' && passeioSel
        ? [destinoDe(passeioSel.ida.origem_id), destinoDe(passeioSel.ida.destino_id)].filter((d): d is Destino => d !== null)
        : destinos
  // Por terra, o Google não atravessa o oceano: na viagem inteira, mostra só a parte da Europa (sem os voos das pontas)
  const lugaresPorTerra = atual.tipo === 'tudo' ? parteTerrestre(lugaresNoMapa) : lugaresNoMapa
  // O mapa do Google fica montado mesmo no modo avião (escondido), pra alternar sem recarregar
  const mapa = linkDoMapaRota(lugaresPorTerra, modo === 'aviao' ? 'transporte' : modo)
  const pontosDoVoo = lugaresNoMapa
    .filter((d) => d.latitude !== null && d.longitude !== null)
    .map((d) => ({ nome: d.nome, latitude: d.latitude!, longitude: d.longitude! }))
  const linkVooAtual = lugaresNoMapa.length === 2 && atual.tipo !== 'tudo' ? linkDeVoo(lugaresNoMapa[0], lugaresNoMapa[1], lugaresNoMapa[0].saida) : null

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
    <section className="hosp-painel" aria-label="Viagem inteira">
      <header className="hosp-painel-topo">
        <div>
          <h2>Viagem inteira</h2>
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
      {trechos.length === 0 ? (
        <p className="hosp-vazio">Quando a viagem tiver mais de um destino, a rota aparece aqui.</p>
      ) : (
        <ol className="rota-lista">
          {trechos.map(({ de, para }, indice) => {
            const lista = doTrecho(de, para)
            const passeio = passeioDoTrecho(de, para)
            const primeiro = lista[0] ?? passeio?.ida
            const longo = trechoLongo(de, para)
            const Icone = primeiro ? meio(primeiro.meio).icone : longo ? Plane : Route
            return (
              <li key={`${de.id}-${para.id}`}>
                <button type="button" onClick={() => selecionar({ tipo: 'trecho', indice }, primeiro?.meio, [de, para])}>
                  <span className={primeiro ? 'rota-icone feito' : 'rota-icone'}>
                    <Icone size={16} aria-hidden="true" />
                  </span>
                  <span className="rota-texto">
                    <strong>
                      {de.nome} <ArrowRight size={13} aria-hidden="true" /> {para.nome}
                    </strong>
                    <small>
                      {lista.length > 0
                        ? `${meio(lista[0].meio).nome}${lista[0].partida ? ` · ${formatarData(diaLocal(lista[0].partida))} ${hora(lista[0].partida)}` : ''}${lista.length > 1 ? ` + ${lista.length - 1}` : ''}`
                        : passeio
                          ? 'Feito como passeio (bate-e-volta)'
                          : longo
                            ? 'Provavelmente voo · ainda sem trajeto'
                            : 'Como vocês vão? Ainda sem trajeto'}
                    </small>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" className="rota-seta" />
                </button>
              </li>
            )
          })}
        </ol>
      )}
      {porDia.size > 0 && (
        <details className="rota-agenda">
          <summary>Agenda por dia ({porDia.size})</summary>
          <ol className="linha-do-tempo">
            {[...porDia].map(([d, lista]) => (
              <li key={d}>
                <h3>{formatarData(d, true)}</h3>
                <ul className="trajetos">{lista.map((t) => linha(t))}</ul>
              </li>
            ))}
          </ol>
          <p className="form-dica">Horários no fuso do seu celular.</p>
        </details>
      )}
    </section>
  )

  const painelTrecho = (de: Destino, para: Destino) => {
    const lista = doTrecho(de, para)
    const passeio = passeioDoTrecho(de, para)
    return (
      <section className="hosp-painel" aria-label={`${de.nome} para ${para.nome}`}>
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
          <button type="button" className="rota-aviso-passeio" onClick={() => selecionar({ tipo: 'passeio', id: passeio.ida.id }, passeio.ida.meio)}>
            <ArrowRightLeft size={15} aria-hidden="true" /> Esse trecho está como passeio (bate-e-volta). Ver passeio
          </button>
        )}
        {lista.length > 0 ? (
          <ul className="trajetos">{lista.map((t) => linha(t))}</ul>
        ) : (
          !passeio && <p className="hosp-vazio">Ainda sem trajeto. Compare as opções abaixo e cadastre o escolhido.</p>
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

  const painel =
    atual.tipo === 'trecho' && trechoSel ? painelTrecho(trechoSel.de, trechoSel.para) : atual.tipo === 'passeio' && passeioSel ? painelPasseio(passeioSel) : painelTudo()

  return (
    <>
      <CabecalhoPagina
        titulo="Transportes"
        subtitulo="A rota cidade a cidade e os passeios de ida e volta, com o caminho no mapa."
        acao={
          euSouAdm &&
          destinos.length > 0 && (
            <button type="button" className="botao" onClick={() => setJanela({})}>
              <Plus size={18} aria-hidden="true" /> Adicionar trajeto
            </button>
          )
        }
      />

      {estado.status === 'carregando' && <p className="carregando-texto">Carregando os trajetos…</p>}
      {estado.status === 'erro' && (
        <div className="aviso-erro">
          <p>Não deu pra carregar os trajetos.</p>
          <button type="button" className="botao secundario pequeno" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
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

      {destinos.length === 0 ? (
        <p className="hosp-vazio">Adicione destinos no roteiro (na Overview) pra montar a rota.</p>
      ) : (
        <>
          <nav className="hosp-seletor" aria-label="Escolha o trecho">
            <button type="button" aria-pressed={atual.tipo === 'tudo'} onClick={() => selecionar({ tipo: 'tudo' })}>
              <span className="hosp-seletor-marca" aria-hidden="true">
                <Route size={14} />
              </span>
              Viagem inteira
            </button>
            {trechos.map(({ de, para }, indice) => {
              const feito = doTrecho(de, para).length > 0 || Boolean(passeioDoTrecho(de, para))
              return (
                <button
                  key={`${de.id}-${para.id}`}
                  type="button"
                  aria-pressed={atual.tipo === 'trecho' && atual.indice === indice}
                  className={feito ? 'seletor-resolvido' : 'seletor-precisa'}
                  onClick={() => selecionar({ tipo: 'trecho', indice }, doTrecho(de, para)[0]?.meio, [de, para])}
                >
                  <span className="hosp-seletor-marca" aria-hidden="true">
                    {feito ? <Check size={12} /> : indice + 1}
                  </span>
                  {de.nome} → {para.nome}
                </button>
              )
            })}
            {passeios.map((p) => (
              <button
                key={p.ida.id}
                type="button"
                aria-pressed={atual.tipo === 'passeio' && atual.id === p.ida.id}
                className="seletor-passeio"
                onClick={() => selecionar({ tipo: 'passeio', id: p.ida.id }, p.ida.meio)}
              >
                <span className="hosp-seletor-marca" aria-hidden="true">
                  <ArrowRightLeft size={12} />
                </span>
                {nomeDe(p.ida.origem_id)} ⇄ {nomeDe(p.ida.destino_id)}
              </button>
            ))}
          </nav>

          <div className="hosp-palco">
            {(mapa || modo === 'aviao') && (
              <section className={modo === 'aviao' ? 'hosp-mapa mapa-voo' : 'hosp-mapa'} aria-label="Mapa do caminho">
                {mapa && (
                  <div className="mapa-camada" hidden={modo === 'aviao'}>
                    <MapaGoogle url={mapa.embed} titulo="Google Maps: caminho da viagem" />
                  </div>
                )}
                {modo === 'aviao' && <MapaMundi pontos={pontosDoVoo} zoomMaximo={6} />}
                {lugaresNoMapa.length > 1 && (
                  <div className="hosp-mapa-filtros" role="group" aria-label="Como ir">
                    {MODOS_NO_MAPA.map((m) => (
                      <button key={m.chave} type="button" aria-pressed={modo === m.chave} onClick={() => setModo(m.chave)}>
                        {m.nome}
                      </button>
                    ))}
                  </div>
                )}
                {lugaresNoMapa.length > 1 && (
                  <p className="mapa-legenda mapa-legenda-topo">
                    {modo === 'aviao'
                      ? 'Linha reta só pra mostrar o trecho: não é a rota do voo.'
                      : 'Caminho sugerido pelo Google: não é a passagem nem o horário reservado.'}
                  </p>
                )}
                {modo === 'aviao' ? (
                  linkVooAtual && (
                    <a className="hosp-mapa-abrir" href={linkVooAtual} target="_blank" rel="noreferrer noopener">
                      <Plane size={14} aria-hidden="true" /> Ver voos no Google
                    </a>
                  )
                ) : (
                  mapa && (
                    <a className="hosp-mapa-abrir" href={mapa.abrir} target="_blank" rel="noreferrer noopener">
                      <Maximize2 size={14} aria-hidden="true" /> Abrir no Google Maps
                    </a>
                  )
                )}
              </section>
            )}
            {painel}
          </div>
        </>
      )}

      {outros.length > 0 && (
        <Cartao titulo="Outros trajetos">
          <p className="form-dica">Trajetos que não ligam dois destinos seguidos do roteiro, ou que ficaram sem destino.</p>
          <ul className="trajetos">{outros.map((t) => linha(t))}</ul>
        </Cartao>
      )}

      {janela && (
        <Gaveta titulo={janela.trajeto ? 'Editar trajeto' : 'Adicionar trajeto'} aoFechar={fechar}>
          <FormTrajeto
            viagemId={viagem.id}
            moedaViagem={viagem.moeda_principal}
            membros={membros}
            destinos={destinos}
            trajeto={janela.trajeto}
            origemId={janela.origemId}
            destinoId={janela.destinoId}
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
