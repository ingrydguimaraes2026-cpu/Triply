import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BedDouble, CalendarDays, CircleCheck, Clock, ExternalLink, KeyRound, Luggage, MapPin, TrainFront, Wifi } from '../../components/ui/icones'
import {
  agoraEProximo,
  arquivoDeCada,
  destinoDoDia,
  diaDePassagem,
  lerDiasDoRoteiro,
  linkUltimoTrem,
  planoDoDia,
  quemChegaESaiHoje,
  voltaPraBase,
  diaNoFuso,
  faltaPara,
  horaNoFuso,
  linksDeGuardaVolumes,
  montarAgendaDoDia,
  registrarChegada,
  type Tables,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useSessao } from '../../features/auth/hooks'
import { buscarArquivos, type Arquivo } from '../../features/cofre/api'
import { PlanoDoDia, QuemChegaESai } from '../../features/hoje/ReservasDoDia'
import BilheteDoTrajeto from '../../features/cofre/BilheteDoTrajeto'
import { useTrajetos } from '../../features/transportes/hooks'
import { useEventosDaAgenda, diaPorExtenso } from '../../features/agenda/hooks'
import { hojeTexto } from '../../features/destinos/datas'
import BotaoIr from '../../components/ui/BotaoIr'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import Norti from '../../components/ui/Norti'
import FerramentasDoDia from '../../features/hoje/FerramentasDoDia'
import OndeEstaOComboio from '../../features/hoje/OndeEstaOComboio'
import CarimbosDaViagem, { type ChegadaNoDestino } from '../../features/carimbos/CarimbosDaViagem'
import './abas.css'
import './hoje.css'

type Hospedagem = Pick<
  Tables<'hospedagens'>,
  | 'id'
  | 'nome'
  | 'endereco'
  | 'destino_id'
  | 'hora_checkin'
  | 'hora_checkout'
  | 'checkin'
  | 'checkout'
  | 'guarda_malas'
  | 'guarda_malas_obs'
  | 'como_chegar'
  | 'codigo_porta'
  | 'wifi_rede'
  | 'wifi_senha'
  | 'contato_anfitriao'
>
type LugarDoRoteiro = Pick<Tables<'lugares'>, 'id' | 'nome' | 'endereco' | 'latitude' | 'longitude' | 'visitado_em'>
type GuardaVolumes = Pick<Tables<'lugares'>, 'id' | 'nome' | 'destino_id' | 'link' | 'horario'>
type Ponto = Pick<Tables<'pontos_de_encontro'>, 'id' | 'local' | 'quando' | 'latitude' | 'longitude'>

// Tela Hoje (spec 058 + 120a): agora e próximo, onde dormimos, quem chega e sai, plano do dia, encontro e as ferramentas do dia.
export default function Hoje() {
  const { viagem, destinos, membros, meuId } = useViagemAtual()
  const { estado } = useTrajetos(viagem.id)
  const { eventos } = useEventosDaAgenda(viagem.id)
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([])
  const [pontos, setPontos] = useState<Ponto[]>([])
  const [guardaVolumes, setGuardaVolumes] = useState<GuardaVolumes[]>([])
  const [roteiros, setRoteiros] = useState<{ destino_id: string; dias: string[][] }[]>([])
  const [lugares, setLugares] = useState<LugarDoRoteiro[]>([])
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [versaoDoCofre, setVersaoDoCofre] = useState(0) // sobe quando alguém anexa uma reserva
  const [agora, setAgora] = useState(() => new Date())
  // Spec 120c: o "Cheguei" (plano do dia ou casa) libera o carimbo do destino de hoje
  const [chegada, setChegada] = useState<ChegadaNoDestino>(null)
  const [chegueiNaCasa, setChegueiNaCasa] = useState(false)
  // Convidado pelo link vê o plano do dia, mas não o endereço, o código nem as reservas (spec 120a)
  const { ehConvidado } = useSessao()

  // Atualiza o "agora" a cada minuto
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase
        .from('hospedagens')
        .select('id, nome, endereco, destino_id, hora_checkin, hora_checkout, checkin, checkout, guarda_malas, guarda_malas_obs, como_chegar, codigo_porta, wifi_rede, wifi_senha, contato_anfitriao')
        .eq('viagem_id', viagem.id)
        .eq('escolhida', true),
      supabase.from('pontos_de_encontro').select('id, local, quando, latitude, longitude').eq('viagem_id', viagem.id),
      supabase.from('lugares').select('id, nome, destino_id, link, horario').eq('viagem_id', viagem.id).eq('tipo', 'guarda_volumes'),
      supabase.from('roteiros').select('destino_id, dias').eq('viagem_id', viagem.id),
      buscarArquivos(viagem.id).catch(() => [] as Arquivo[]),
    ])
      .then(async ([h, p, g, r, a]) => {
        const dosRoteiros = (r.data ?? []).map((x) => ({ destino_id: x.destino_id, dias: lerDiasDoRoteiro(x.dias) }))
        const ids = [...new Set(dosRoteiros.flatMap((x) => x.dias.flat()))]
        const l = ids.length ? await supabase.from('lugares').select('id, nome, endereco, latitude, longitude, visitado_em').in('id', ids) : null
        if (!ativo) return
        setHospedagens(h.data ?? [])
        setPontos(p.data ?? [])
        setGuardaVolumes(g.data ?? [])
        setRoteiros(dosRoteiros)
        setLugares(l?.data ?? [])
        setArquivos(a)
      })
      .catch((e) => console.error('Erro ao carregar o Hoje:', e))
    return () => {
      ativo = false
    }
  }, [viagem.id, versaoDoCofre])

  const hoje = hojeTexto(agora)
  const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
  const onde = destinoDoDia(hoje, destinos)
  const trajetos = useMemo(() => (estado.status === 'pronto' ? estado.trajetos : []), [estado])
  const itens = useMemo(() => montarAgendaDoDia(hoje, { destinos, trajetos, eventos: eventos ?? [] }), [hoje, destinos, trajetos, eventos])
  const { agora: itemAgora, proximo } = agoraEProximo(itens, horaAtual)
  const dormimos = onde ? hospedagens.find((h) => h.destino_id === onde.id) : undefined
  const encontrosDeHoje = pontos.filter((p) => p.quando && p.quando.slice(0, 10) <= hoje && new Date(p.quando).toDateString() === agora.toDateString())
  const naViagem = !!onde
  // Spec 060 (J5): dia de passagem ou de troca de cidade → lembrar das malas e da hora de sair
  const passagem = diaDePassagem(hoje, onde, trajetos, destinos, diaNoFuso, horaNoFuso)
  const guardaDaqui = onde ? guardaVolumes.filter((g) => g.destino_id === onde.id) : []
  const hospedagemDaqui = onde ? hospedagens.find((h) => h.destino_id === onde.id) : undefined
  // Spec 080 (D9): bate-e-volta hoje → hora da volta pra base (ou aviso de que falta)
  const bateEVolta = voltaPraBase(hoje, trajetos, diaNoFuso)
  const nomeDo = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  // Spec 120a: bilhetes de quem chega e sai hoje, e o plano do dia (roteiro + agenda)
  const movimentos = quemChegaESaiHoje(hoje, trajetos, destinos, membros, diaNoFuso, horaNoFuso)
  const plano = planoDoDia(hoje, { destinos, eventos: eventos ?? [], roteiros, lugares })
  const cofrePorTrajeto = arquivoDeCada(arquivos, 'trajeto_id')
  const cofrePorEvento = arquivoDeCada(arquivos, 'evento_id')
  const recarregarCofre = () => setVersaoDoCofre((v) => v + 1)

  function carimbarHoje() {
    if (onde) setChegada({ destinoId: onde.id, vez: Date.now() })
  }

  async function chegarNaCasa(nome: string) {
    setChegueiNaCasa(true)
    try {
      await registrarChegada(supabase, viagem.id, nome)
      carimbarHoje()
    } catch (e) {
      console.error('Erro ao registrar a chegada na casa:', e)
      setChegueiNaCasa(false)
    }
  }

  return (
    <div className="hoje">
      <CabecalhoPagina acima={viagem.nome} titulo={onde ? `Hoje em ${onde.nome}` : 'Hoje'} subtitulo={diaPorExtenso(hoje)} />

      {!naViagem && (
        <div className="hoje-fora">
          <Norti humor="dormindo" tamanho={52} sombra={false} />
          <p>Hoje não é dia de viagem no roteiro. Esta tela ganha vida nos dias da viagem; as ferramentas abaixo já funcionam.</p>
        </div>
      )}

      {naViagem && (
        <section className="hoje-agora" aria-label="Agora e próximo">
          {itemAgora && (
            <div className="hoje-item agora">
              <span className="hoje-rotulo">Agora</span>
              <strong>
                {itemAgora.hora} · {itemAgora.titulo}
              </strong>
              {itemAgora.detalhe && <small>{itemAgora.detalhe}</small>}
            </div>
          )}
          {proximo ? (
            <div className="hoje-item proximo">
              <span className="hoje-rotulo">
                <Clock size={13} aria-hidden="true" /> Próximo · {faltaPara(proximo.hora, horaAtual)}
              </span>
              <strong>
                {proximo.hora} · {proximo.titulo}
              </strong>
              {proximo.detalhe && <small>{proximo.detalhe}</small>}
            </div>
          ) : (
            !itemAgora && <p className="dica">Nada com horário marcado pra hoje. Dia livre!</p>
          )}
          <Link to="../agenda" relative="path" className="botao-texto alinhar-inicio">
            <CalendarDays size={15} aria-hidden="true" /> Ver o dia inteiro
          </Link>
        </section>
      )}

      {/* Cartões do dia e ferramentas em mosaico de 2 colunas (design Plataforma, spec 113) */}
      <div className="hoje-mosaico">
        {naViagem && !ehConvidado && (
          <Cartao titulo="Onde dormimos hoje" icone={BedDouble}>
            {dormimos ? (
              <div className="hoje-dormimos">
                <strong>{dormimos.nome}</strong>
                {dormimos.endereco && <small>{dormimos.endereco}</small>}
                {(dormimos.hora_checkin || dormimos.hora_checkout) && (
                  <small>
                    {[
                      dormimos.hora_checkin && `Check-in ${dormimos.checkin === hoje ? 'hoje ' : ''}a partir das ${dormimos.hora_checkin.slice(0, 5)}`,
                      dormimos.hora_checkout && `check-out ${dormimos.checkout === hoje ? 'hoje ' : ''}até ${dormimos.hora_checkout.slice(0, 5)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                )}
                {/* Spec 062: no dia da chegada, como chegar do aeroporto/estação */}
                {dormimos.como_chegar && onde?.chegada === hoje && (
                  <p className="hoje-como-chegar">
                    <strong>Como chegar:</strong> {dormimos.como_chegar}
                  </p>
                )}
                {dormimos.contato_anfitriao && <small>Anfitrião: {dormimos.contato_anfitriao}</small>}
                {dormimos.codigo_porta && (
                  <small className="hoje-dormimos-extra">
                    <KeyRound size={14} aria-hidden="true" /> Código de acesso: <strong>{dormimos.codigo_porta}</strong>
                  </small>
                )}
                {dormimos.wifi_rede && (
                  <small className="hoje-dormimos-extra">
                    <Wifi size={14} aria-hidden="true" /> {dormimos.wifi_rede}
                    {dormimos.wifi_senha && <strong> · {dormimos.wifi_senha}</strong>}
                  </small>
                )}
                {dormimos.endereco && <BotaoIr alvo={{ nome: dormimos.nome, endereco: dormimos.endereco }} rotulo="Ir / corrida" />}
                {/* Spec 120c: "Cheguei na casa" avisa o grupo e carimba o destino */}
                {naViagem &&
                  !ehConvidado &&
                  (chegueiNaCasa ? (
                    <span className="hoje-plano-chegou">
                      <CircleCheck size={15} aria-hidden="true" /> Chegamos na casa
                    </span>
                  ) : (
                    <button type="button" className="botao hoje-plano-cheguei" onClick={() => void chegarNaCasa(dormimos.nome)}>
                      <MapPin size={15} aria-hidden="true" /> Cheguei na casa
                    </button>
                  ))}
                {/* Spec 120a: ver (ou anexar) a reserva da casa */}
                <BilheteDoTrajeto
                  viagemId={viagem.id}
                  ligacao={{ hospedagem_id: dormimos.id }}
                  bilhete={arquivoDeCada(arquivos, 'hospedagem_id').get(dormimos.id)}
                  aoMudar={recarregarCofre}
                />
              </div>
            ) : (
              <p className="dica">
                Nenhuma hospedagem escolhida em {onde?.nome}. <Link to="../hospedagem" relative="path">Abrir Hospedagem</Link>
              </p>
            )}
          </Cartao>
        )}

        {naViagem && !ehConvidado && <QuemChegaESai movimentos={movimentos} linkDoCofre={(id) => cofrePorTrajeto.get(id)?.url ?? null} />}

        {naViagem && <PlanoDoDia
            viagemId={viagem.id}
            plano={plano}
            podeChegar={!ehConvidado}
            reservaDoEvento={(id) => cofrePorEvento.get(id)}
            aoMudarCofre={recarregarCofre}
            aoChegar={carimbarHoje}
          />}

        {bateEVolta && (
          <Cartao titulo={`Volta pra ${nomeDo(bateEVolta.ida.origem_id)}`} icone={TrainFront}>
            {bateEVolta.volta?.partida ? (
              <p className="hoje-volta">
                <strong>Saída {horaNoFuso(bateEVolta.volta.partida)}</strong> de {nomeDo(bateEVolta.ida.destino_id)} · {faltaPara(horaNoFuso(bateEVolta.volta.partida), horaAtual)}
              </p>
            ) : (
              <p className="hoje-volta alerta">Sem horário de volta marcado. Confira o último trem antes de sair!</p>
            )}
            <a href={linkUltimoTrem(nomeDo(bateEVolta.ida.destino_id), nomeDo(bateEVolta.ida.origem_id))} target="_blank" rel="noreferrer noopener" className="botao-texto alinhar-inicio">
              Último trem de {nomeDo(bateEVolta.ida.destino_id)} pra {nomeDo(bateEVolta.ida.origem_id)} <ExternalLink size={12} aria-hidden="true" />
            </a>
          </Cartao>
        )}

        {passagem && onde && (
          <Cartao titulo={passagem.tipo === 'passagem' ? 'Dia de passagem' : 'Dia de trocar de cidade'} icone={Luggage}>
            <div className="hoje-passagem">
              {passagem.saida && (
                <p>
                  <strong>Saída {passagem.saida.hora}</strong> pra {passagem.saida.para} · {faltaPara(passagem.saida.hora, horaAtual)}
                </p>
              )}
              {hospedagemDaqui?.guarda_malas === 'sim' && (
                <p>
                  {hospedagemDaqui.nome} guarda as malas{hospedagemDaqui.guarda_malas_obs ? ` (${hospedagemDaqui.guarda_malas_obs})` : ''}.
                </p>
              )}
              {guardaDaqui.length > 0 && (
                <ul>
                  {guardaDaqui.map((g) => (
                    <li key={g.id}>
                      {g.link ? (
                        <a href={g.link} target="_blank" rel="noreferrer noopener">
                          {g.nome} <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      ) : (
                        g.nome
                      )}
                      {g.horario && <small> · {g.horario}</small>}
                    </li>
                  ))}
                </ul>
              )}
              {guardaDaqui.length === 0 && hospedagemDaqui?.guarda_malas !== 'sim' && (
                <p className="dica">
                  Onde deixar as malas?{' '}
                  {linksDeGuardaVolumes(onde.nome).map((l, i) => (
                    <span key={l.url}>
                      {i > 0 && ' · '}
                      <a href={l.url} target="_blank" rel="noreferrer noopener">
                        {l.nome}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </Cartao>
        )}

        {/* Spec 118a: carimbo cai sozinho pela localização (com a permissão já dada) */}
        <CarimbosDaViagem chegada={chegada} />

        {/* Spec 107: localização ao vivo (só com mais gente no comboio) */}
        {membros.length > 1 && <OndeEstaOComboio viagemId={viagem.id} membros={membros} meuId={meuId} />}

        {encontrosDeHoje.length > 0 && (
          <Cartao titulo="Encontro" icone={MapPin}>
            {encontrosDeHoje.map((p) => (
              <p key={p.id} className="hoje-encontro">
                <strong>{horaNoFuso(p.quando!)}</strong> {p.local} <BotaoIr alvo={{ nome: p.local, latitude: p.latitude, longitude: p.longitude }} />
              </p>
            ))}
          </Cartao>
        )}

        <FerramentasDoDia destino={onde ?? destinos[0] ?? null} moedaViagem={viagem.moeda_principal} enderecoHospedagem={dormimos?.endereco ?? null} />
      </div>
    </div>
  )
}
