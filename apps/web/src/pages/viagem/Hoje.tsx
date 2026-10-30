import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BedDouble, CalendarDays, Clock, MapPin, Sun } from 'lucide-react'
import { agoraEProximo, destinoDoDia, faltaPara, horaNoFuso, montarAgendaDoDia, type Tables } from '@together/core'
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

type Hospedagem = Pick<Tables<'hospedagens'>, 'id' | 'nome' | 'endereco' | 'destino_id' | 'hora_checkin' | 'hora_checkout' | 'checkin' | 'checkout'>
type Ponto = Pick<Tables<'pontos_de_encontro'>, 'id' | 'local' | 'quando' | 'latitude' | 'longitude'>

// Tela Hoje (spec 058): o que está acontecendo agora, o próximo, onde dormimos, encontro e as ferramentas do dia.
export default function Hoje() {
  const { viagem, destinos } = useViagemAtual()
  const { estado } = useTrajetos(viagem.id)
  const { eventos } = useEventosDaAgenda(viagem.id)
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([])
  const [pontos, setPontos] = useState<Ponto[]>([])
  const [agora, setAgora] = useState(() => new Date())

  // Atualiza o "agora" a cada minuto
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase.from('hospedagens').select('id, nome, endereco, destino_id, hora_checkin, hora_checkout, checkin, checkout').eq('viagem_id', viagem.id).eq('escolhida', true),
      supabase.from('pontos_de_encontro').select('id, local, quando, latitude, longitude').eq('viagem_id', viagem.id),
    ])
      .then(([h, p]) => {
        if (!ativo) return
        setHospedagens(h.data ?? [])
        setPontos(p.data ?? [])
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
