import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, CalendarPlus, Clock, LogIn, LogOut, MapPin, Pencil, Plus } from 'lucide-react'
import { destinoDoDia, diasDoPeriodo, editarEventoDaAgenda, montarAgendaDoDia, type EventoDaAgenda, type ItemDaAgenda } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useTrajetos } from '../../features/transportes/hooks'
import { meio } from '../../features/transportes/api'
import { hojeTexto, periodoDosDestinos } from '../../features/destinos/datas'
import { diaCurtinho, diaPorExtenso, useEventosDaAgenda } from '../../features/agenda/hooks'
import FormEvento from '../../features/agenda/FormEvento'
import { baixarCalendario } from '../../features/agenda/calendario'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import EstadoVazio from '../../components/ui/EstadoVazio'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './agenda.css'

type Janela = { tipo: 'novo' } | { tipo: 'editar'; evento: EventoDaAgenda } | null

// Agenda do dia (spec 029): o que acontece em cada dia, com horário.
// Junta sozinha os trajetos e as chegadas/saídas; o comboio acrescenta os eventos livres.
export default function Agenda() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  const { estado } = useTrajetos(viagem.id)
  const { eventos, erro, recarregar } = useEventosDaAgenda(viagem.id)
  const [janela, setJanela] = useState<Janela>(null)
  const [recadoCalendario, setRecadoCalendario] = useState<string | null>(null)

  // Spec 036: baixa o .ics com tudo que tem data
  async function calendario() {
    setRecadoCalendario(null)
    try {
      const n = await baixarCalendario(viagem, destinos)
      setRecadoCalendario(n ? `Arquivo com ${n} ${n === 1 ? 'item' : 'itens'} baixado. Abra ele pra pôr na sua agenda.` : 'Ainda não há nada com data pra pôr na agenda.')
    } catch (e) {
      console.error('Erro ao montar o calendário:', e)
      setRecadoCalendario('Não deu pra montar o calendário agora.')
    }
  }

  // Datas dos destinos; sem elas, as datas da viagem (nome, datas e moeda)
  const periodo =
    periodoDosDestinos(destinos) ?? (viagem.data_inicio ? { inicio: viagem.data_inicio, fim: viagem.data_fim ?? viagem.data_inicio } : null)
  const dias = useMemo(() => diasDoPeriodo(periodo?.inicio ?? null, periodo?.fim ?? null), [periodo?.inicio, periodo?.fim])
  const hoje = hojeTexto()
  const [escolhido, setEscolhido] = useState<string | null>(null)
  // Sem escolha: hoje, se estiver na viagem; senão o primeiro dia
  const dia = escolhido && dias.includes(escolhido) ? escolhido : dias.includes(hoje) ? hoje : dias[0]

  const trajetos = useMemo(() => (estado.status === 'pronto' ? estado.trajetos : []), [estado])
  const itens = useMemo(
    () => (dia ? montarAgendaDoDia(dia, { destinos, trajetos, eventos: eventos ?? [] }) : []),
    [dia, destinos, trajetos, eventos],
  )
  const onde = dia ? destinoDoDia(dia, destinos) : undefined
  // Quantos itens cada dia tem (bolinha no botão do dia)
  const temAlgo = useMemo(
    () => new Set(dias.filter((d) => montarAgendaDoDia(d, { destinos, trajetos, eventos: eventos ?? [] }).length > 0)),
    [dias, destinos, trajetos, eventos],
  )

  const fechar = () => setJanela(null)

  // Spec 071: passa o evento pro dia anterior/seguinte (sem sair do período da viagem) e vai junto pro dia novo
  async function mover(evento: EventoDaAgenda, direcao: -1 | 1) {
    const i = dias.indexOf(evento.dia)
    const novo = dias[i + direcao]
    if (i === -1 || !novo) return
    try {
      await editarEventoDaAgenda(supabase, evento.id, {
        dia: novo,
        hora: evento.hora?.slice(0, 5) ?? null,
        titulo: evento.titulo,
        local: evento.local,
        observacao: evento.observacao,
      })
      setEscolhido(novo)
      recarregar()
    } catch (e) {
      console.error('Erro ao mover o evento:', e)
    }
  }
  const podeEditar = (e: EventoDaAgenda) => e.criado_por === meuId || euSouAdm

  if (dias.length === 0) {
    return (
      <div className="agenda">
        <CabecalhoPagina titulo="Agenda" subtitulo="O que acontece em cada dia, com horário." />
        <EstadoVazio
          icone={CalendarDays}
          titulo="Sem datas no roteiro"
          texto="Coloque as datas da viagem (ou de cada destino) na Overview pra montar a agenda."
        />
      </div>
    )
  }

  return (
    <div className="agenda">
      <CabecalhoPagina
        titulo="Agenda"
        subtitulo="Trajetos e chegadas entram sozinhos. Acrescente o resto: jantar, passeio, reserva."
        acao={
          <span className="agenda-acoes">
            <button type="button" className="botao secundario" onClick={calendario} title="Baixar pro Google Agenda, iPhone ou Outlook">
              <CalendarPlus size={16} aria-hidden="true" /> Calendário
            </button>
            <button type="button" className="botao" onClick={() => setJanela({ tipo: 'novo' })}>
              <Plus size={16} aria-hidden="true" /> Evento
            </button>
          </span>
        }
      />
      {recadoCalendario && (
        <p className="recado" role="status">
          {recadoCalendario}
        </p>
      )}

      <nav className="agenda-dias" aria-label="Dias da viagem">
        {dias.map((d) => {
          const { semana, numero } = diaCurtinho(d)
          return (
            <button
              key={d}
              type="button"
              aria-pressed={d === dia}
              className={d === hoje ? 'hoje' : undefined}
              onClick={() => setEscolhido(d)}
              title={diaPorExtenso(d)}
            >
              <span>{semana}</span>
              <strong>{numero}</strong>
              {temAlgo.has(d) && <i aria-label="tem coisa marcada" />}
            </button>
          )
        })}
      </nav>

      <section className="agenda-dia">
        <header>
          <h2>
            {diaPorExtenso(dia)}
            {dia === hoje && <span className="selo-completar">hoje</span>}
          </h2>
          {onde && (
            <p>
              <MapPin size={14} aria-hidden="true" /> em {onde.nome}
            </p>
          )}
        </header>

        {erro && <p className="form-erro">Não deu pra carregar os eventos agora.</p>}
        {itens.length === 0 ? (
          <EstadoVazio icone={CalendarPlus} titulo="Nada marcado nesse dia" texto="Adicione um evento ou um trajeto com horário." />
        ) : (
          <ol className="agenda-linha">
            {itens.map((item) => (
              <LinhaDaAgenda
                key={item.chave}
                item={item}
                aoEditar={(e) => setJanela({ tipo: 'editar', evento: e })}
                podeEditar={podeEditar}
                aoMover={mover}
                nomes={(ids) => ids.map((id) => (id === meuId ? 'você' : (membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? '?'))).join(', ')}
              />
            ))}
          </ol>
        )}
        {onde && (
          <Link to="../lugares" className="agenda-lugares">
            Ideias do que fazer em {onde.nome} →
          </Link>
        )}
      </section>

      {janela && (
        <Gaveta titulo={janela.tipo === 'novo' ? 'Novo evento' : 'Editar evento'} aoFechar={fechar}>
          <FormEvento
            viagemId={viagem.id}
            dias={dias}
            diaInicial={dia}
            evento={janela.tipo === 'editar' ? janela.evento : undefined}
            membros={membros}
            aoTerminar={() => {
              fechar()
              recarregar()
            }}
          />
        </Gaveta>
      )}
    </div>
  )
}

function LinhaDaAgenda({
  item,
  aoEditar,
  podeEditar,
  nomes,
  aoMover,
}: {
  item: ItemDaAgenda
  aoEditar: (e: EventoDaAgenda) => void
  podeEditar: (e: EventoDaAgenda) => boolean
  nomes: (ids: string[]) => string
  aoMover?: (e: EventoDaAgenda, direcao: -1 | 1) => void // spec 071
}) {
  const Icone =
    item.tipo === 'trajeto' ? meio(item.meio).icone : item.tipo === 'chegada' ? LogIn : item.tipo === 'saida' ? LogOut : Clock
  const editavel = item.tipo === 'evento' && podeEditar(item.evento)
  return (
    <li className={`agenda-item agenda-${item.tipo}`}>
      <span className="agenda-hora">{item.hora || '—'}</span>
      <span className="agenda-icone">
        <Icone size={16} aria-hidden="true" />
      </span>
      <span className="agenda-texto">
        <strong>{item.titulo}</strong>
        {item.detalhe && <small>{item.detalhe}</small>}
        {/* Spec 070: evento só de parte do comboio */}
        {item.tipo === 'evento' && (item.evento.participantes?.length ?? 0) > 0 && (
          <small className="agenda-participantes">só {nomes(item.evento.participantes)}</small>
        )}
      </span>
      {item.tipo === 'trajeto' && (
        <Link to="../transportes" className="botao-texto" aria-label="Ver em Transportes">
          →
        </Link>
      )}
      {editavel && aoMover && (
        <span className="agenda-mover">
          <button type="button" className="botao-texto" onClick={() => aoMover(item.evento, -1)} aria-label={`Passar ${item.titulo} pro dia anterior`} title="Dia anterior">
            ‹
          </button>
          <button type="button" className="botao-texto" onClick={() => aoMover(item.evento, 1)} aria-label={`Passar ${item.titulo} pro dia seguinte`} title="Dia seguinte">
            ›
          </button>
        </span>
      )}
      {editavel && (
        <button type="button" className="botao-texto" onClick={() => aoEditar(item.evento)} aria-label={`Editar ${item.titulo}`}>
          <Pencil size={15} aria-hidden="true" />
        </button>
      )}
    </li>
  )
}
