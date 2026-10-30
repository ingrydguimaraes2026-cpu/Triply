import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BedDouble, CalendarDays, Clock, ExternalLink, Luggage, MapPin, Sun } from 'lucide-react'
import { agoraEProximo, destinoDoDia, diaDePassagem, diaNoFuso, faltaPara, horaNoFuso, linksDeGuardaVolumes, montarAgendaDoDia, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useTrajetos } from '../../features/transportes/hooks'
import { useEventosDaAgenda, diaPorExtenso } from '../../features/agenda/hooks'
import { hojeTexto } from '../../features/destinos/datas'
import BotaoIr from '../../components/ui/BotaoIr'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import FerramentasDoDia from '../../features/hoje/FerramentasDoDia'
import './abas.css'
import './hoje.css'

type Hospedagem = Pick<
  Tables<'hospedagens'>,
  'id' | 'nome' | 'endereco' | 'destino_id' | 'hora_checkin' | 'hora_checkout' | 'checkin' | 'checkout' | 'guarda_malas' | 'guarda_malas_obs'
>
type GuardaVolumes = Pick<Tables<'lugares'>, 'id' | 'nome' | 'destino_id' | 'link' | 'horario'>
type Ponto = Pick<Tables<'pontos_de_encontro'>, 'id' | 'local' | 'quando' | 'latitude' | 'longitude'>

// Tela Hoje (spec 058): o que está acontecendo agora, o próximo, onde dormimos, encontro e as ferramentas do dia.
export default function Hoje() {
  const { viagem, destinos } = useViagemAtual()
  const { estado } = useTrajetos(viagem.id)
  const { eventos } = useEventosDaAgenda(viagem.id)
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([])
  const [pontos, setPontos] = useState<Ponto[]>([])
  const [guardaVolumes, setGuardaVolumes] = useState<GuardaVolumes[]>([])
  const [agora, setAgora] = useState(() => new Date())

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
        .select('id, nome, endereco, destino_id, hora_checkin, hora_checkout, checkin, checkout, guarda_malas, guarda_malas_obs')
        .eq('viagem_id', viagem.id)
        .eq('escolhida', true),
      supabase.from('pontos_de_encontro').select('id, local, quando, latitude, longitude').eq('viagem_id', viagem.id),
      supabase.from('lugares').select('id, nome, destino_id, link, horario').eq('viagem_id', viagem.id).eq('tipo', 'guarda_volumes'),
    ])
      .then(([h, p, g]) => {
        if (!ativo) return
        setHospedagens(h.data ?? [])
        setPontos(p.data ?? [])
        setGuardaVolumes(g.data ?? [])
      })
      .catch((e) => console.error('Erro ao carregar o Hoje:', e))
    return () => {
      ativo = false
    }
  }, [viagem.id])

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

  return (
    <div className="hoje">
      <CabecalhoPagina titulo={onde ? `Hoje em ${onde.nome}` : 'Hoje'} subtitulo={diaPorExtenso(hoje)} />

      {!naViagem && (
        <p className="hoje-fora">
          <Sun size={16} aria-hidden="true" /> Hoje não é dia de viagem no roteiro. Esta tela ganha vida nos dias da viagem; as ferramentas abaixo já funcionam.
        </p>
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

      {encontrosDeHoje.length > 0 && (
        <Cartao titulo="Encontro" icone={MapPin}>
          {encontrosDeHoje.map((p) => (
            <p key={p.id} className="hoje-encontro">
              <strong>{horaNoFuso(p.quando!)}</strong> {p.local} <BotaoIr alvo={{ nome: p.local, latitude: p.latitude, longitude: p.longitude }} />
            </p>
          ))}
        </Cartao>
      )}

      {naViagem && (
        <Cartao titulo="Onde dormimos hoje" icone={BedDouble}>
          {dormimos ? (
            <div className="hoje-dormimos">
              <strong>{dormimos.nome}</strong>
              {dormimos.endereco && <small>{dormimos.endereco}</small>}
              <small>
                {dormimos.checkin === hoje && dormimos.hora_checkin && `Check-in a partir das ${dormimos.hora_checkin.slice(0, 5)} · `}
                {dormimos.checkout === hoje && dormimos.hora_checkout && `Check-out até ${dormimos.hora_checkout.slice(0, 5)} · `}
              </small>
              {dormimos.endereco && <BotaoIr alvo={{ nome: dormimos.nome, endereco: dormimos.endereco }} rotulo="Ir / corrida" />}
            </div>
          ) : (
            <p className="dica">
              Nenhuma hospedagem escolhida em {onde?.nome}. <Link to="../hospedagem" relative="path">Abrir Hospedagem</Link>
            </p>
          )}
        </Cartao>
      )}

      <FerramentasDoDia destino={onde ?? destinos[0] ?? null} moedaViagem={viagem.moeda_principal} enderecoHospedagem={dormimos?.endereco ?? null} />
    </div>
  )
}
