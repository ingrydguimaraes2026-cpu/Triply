import { useEffect, useMemo, useState } from 'react'
import { guardar, lembrar } from '../../lib/memoria'
import { Link, useSearchParams } from 'react-router'
import { diasDoPeriodo } from '@together/core'
import { useViagemAtual } from '../../features/viagens/hooks'
import { hojeTexto, periodoDosDestinos } from '../../features/destinos/datas'
import { diaCurtinho, diaPorExtenso } from '../../features/agenda/hooks'
import { useLugaresDosDias } from '../../features/roteiro/lugaresDoDia'
import { buscarMatches, type Match } from '../../features/roteiro/matches'
import type { Membro } from '../../features/viagens/hooks'
import Avatar from '../../components/ui/Avatar'
import { Icone, Selo } from '../../components/ui/Icone'
import { CalendarDays, MapPin, Route } from '../../components/ui/icones'
import Agenda from './Agenda'
import './roteiro.css'

// Roteiro no caminho B "Embarque" (10/11/2026), igual ao app (apps/mobile/app/viagem/[id]/(abas)/roteiro.tsx).
// Régua: docs/design/direcao-redesenho/embarque.html, tela "Roteiro": título grande, os dias em chips,
// o dia em cartões (a Agenda), as ideias da galera com fotos e um botão só pra adicionar.
// Antes abria em "Matches" e o dia ficava escondido atrás de uma pílula.
export default function Roteiro() {
  const { viagem, destinos, membros } = useViagemAtual()
  const [matches, setMatches] = useState<Match[] | null>(() => lembrar<Match[]>(`ideias:${viagem.id}`) ?? null)
  const [menu, setMenu] = useState(false)
  const [novo, setNovo] = useState(false)
  // O dia fica no endereço (?dia=2027-06-04): o "voltar" do navegador volta pro mesmo dia
  const [busca, setBusca] = useSearchParams()
  const setDia = (d: string) => setBusca({ dia: d }, { replace: true })

  useEffect(() => {
    let vivo = true
    // Sem internet (ou antes da migration do match) as ideias ficam vazias, sem quebrar a tela
    buscarMatches(viagem.id)
      .catch(() => [])
      .then((m) => {
        guardar(`ideias:${viagem.id}`, m)
        if (vivo) setMatches(m)
      })
    return () => {
      vivo = false
    }
  }, [viagem.id])

  // Datas das cidades; sem elas, as datas da viagem
  const periodo = periodoDosDestinos(destinos) ?? (viagem.data_inicio ? { inicio: viagem.data_inicio, fim: viagem.data_fim ?? viagem.data_inicio } : null)
  const dias = useMemo(() => diasDoPeriodo(periodo?.inicio ?? null, periodo?.fim ?? null), [periodo?.inicio, periodo?.fim])
  const pedido = busca.get('dia')
  const hoje = hojeTexto()
  // Sem dia no endereço: hoje, se estiver na viagem; senão o primeiro dia
  const dia = pedido && dias.includes(pedido) ? pedido : dias.includes(hoje) ? hoje : (dias[0] ?? null)
  // Viagem sem datas: os dias montados no Explorar viram "Dia 1", "Dia 2"... (como no app). ?dia=1, ?dia=2...
  const montados = useLugaresDosDias(viagem.id).semDatas(dias.length ? [] : destinos)
  const montado = montados.find((m) => String(m.numero) === pedido) ?? montados[0] ?? null
  // Ideias da galera: o que alguém quer e ainda não entrou num dia (o mais querido primeiro)
  const ideias = (matches ?? []).filter((m) => m.querem > 0 && !m.noDia)

  return (
    <div className="roteiro rt">
      <header className="rt-topo">
        <span>
          <small className="rt-rotulo">{dias.length ? `${dias.length} ${dias.length === 1 ? 'dia' : 'dias'}` : 'Sem datas ainda'}</small>
          <h1>Roteiro</h1>
        </span>
        <Link to="../cidades" relative="path" className="rt-cidades">
          <MapPin size={14} aria-hidden="true" /> Cidades
        </Link>
      </header>

      {dias.length > 0 && (
        <nav className="rt-dias" aria-label="Dias da viagem" data-tour="roteiro-dias">
          {dias.map((d, i) => {
            const { semana, numero } = diaCurtinho(d)
            return (
              <button key={d} type="button" aria-pressed={d === dia} onClick={() => setDia(d)} aria-label={`Dia ${i + 1}, ${diaPorExtenso(d)}`}>
                <span>{semana.toUpperCase()}</span>
                <b>{numero}</b>
              </button>
            )
          })}
        </nav>
      )}

      {dia ? (
        <Agenda diaDoRoteiro={dia} aoTrocarDia={setDia} novoPedido={novo} aoFecharNovo={() => setNovo(false)} />
      ) : (
        <>
          <div className="rt-cartao rt-sem-datas">
            <CalendarDays size={26} aria-hidden="true" />
            <p>Com as datas, cada dia mostra os deslocamentos, os eventos e onde vocês dormem.</p>
            <Link to="../cidades" relative="path" className="rt-botao">
              Definir as datas
            </Link>
          </div>
          {montados.length > 0 && (
            <>
              <nav className="rt-dias" aria-label="Dias montados no Explorar" data-tour="roteiro-dias">
                {montados.map((m) => (
                  <button key={m.numero} type="button" aria-pressed={montado?.numero === m.numero} onClick={() => setDia(String(m.numero))} title={m.destino.nome}>
                    <span>DIA</span>
                    <b>{m.numero}</b>
                  </button>
                ))}
              </nav>
              {montado && <DiaSemData numero={montado.numero} cidade={montado.destino.nome} destinoId={montado.destino.id} lugares={montado.lugares} />}
            </>
          )}
        </>
      )}

      {/* Ideias da galera (spec 117): o que o grupo quer fazer */}
      <section className="rt-ideias-secao">
        <div className="rt-secao-t">
          <small className="rt-rotulo">Ideias da galera</small>
          <Link to="../explorar" relative="path">
            Descobrir lugares
          </Link>
        </div>
        {matches === null ? null : ideias.length ? (
          <div className="rt-ideias">
            {ideias.map((m) => (
              <Ideia key={m.catalogoId} m={m} membros={membros} />
            ))}
          </div>
        ) : (
          <Link to="../explorar" relative="path" className="rt-cartao rt-ideia-vazia">
            <Selo nome="museu" tamanho={40} />
            <span>
              <strong>Ninguém escolheu lugar ainda</strong>
              <small>Veja os lugares de cada cidade e diga o que você quer.</small>
            </span>
          </Link>
        )}
      </section>

      {/* Um botão só pra adicionar, acima da barra de vidro */}
      {dia && (
        <>
          {menu && <button type="button" className="rt-fundo-menu" aria-label="Fechar" onClick={() => setMenu(false)} />}
          <div className="rt-fab-lugar">
            {menu && (
              <div className="rt-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false)
                    setNovo(true)
                  }}
                >
                  <span className="rt-quad">
                    <CalendarDays size={17} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>Passeio ou evento</strong>
                    <small>{diaPorExtenso(dia)}</small>
                  </span>
                </button>
                <Link to="../transportes" relative="path" role="menuitem">
                  <span className="rt-quad">
                    <Route size={17} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>Ida pra outro lugar</strong>
                    <small>Voo, ônibus, carro...</small>
                  </span>
                </Link>
              </div>
            )}
            <button type="button" className="rt-fab" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <Icone nome={menu ? 'fechar' : 'mais'} size={20} aria-hidden="true" /> {menu ? 'Fechar' : 'Adicionar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Ideia({ m, membros }: { m: Match; membros: Membro[] }) {
  const quem = m.quem.map((id) => membros.findIndex((p) => p.id === id)).filter((i) => i >= 0)
  const texto = membros.length >= 2 && m.querem >= membros.length ? 'Todo mundo quer' : m.querem === 1 ? '1 quer' : `${m.querem} querem`
  return (
    <Link to={`../explorar?destino=${m.destinoId}`} relative="path" className="rt-ideia" aria-label={`${m.nome}, ${texto}`}>
      <span className="rt-ideia-foto">
        {m.foto ? <img src={m.foto} alt="" loading="lazy" /> : <Selo nome="museu" tamanho={44} />}
        <span className="rt-ideia-rostos">
          {quem.slice(0, 4).map((i) => (
            <Avatar key={i} nome={membros[i].nome} url={membros[i].avatarUrl} indice={i} tamanho={24} />
          ))}
        </span>
      </span>
      <strong>{m.nome}</strong>
      <small>{texto}</small>
    </Link>
  )
}

// Dia montado no Explorar numa viagem sem datas: a cidade e os lugares, sem horários
function DiaSemData({ numero, cidade, destinoId, lugares }: { numero: number; cidade: string; destinoId: string; lugares: { id: string; nome: string; horario: string | null }[] }) {
  return (
    <section className="roteiro-dia-sem-data">
      <header>
        <h2>Dia {numero}</h2>
        <p>
          <MapPin size={14} aria-hidden="true" /> em {cidade}
        </p>
      </header>
      <ol>
        {lugares.map((l, i) => (
          <li key={l.id}>
            <span className="roteiro-dia-numero">{i + 1}</span>
            <span>
              <strong>{l.nome}</strong>
              {l.horario && <small>{l.horario}</small>}
            </span>
          </li>
        ))}
      </ol>
      <div className="roteiro-dia-acoes">
        <Link to={`../explorar?destino=${destinoId}`} relative="path" className="agenda-botao-pequeno">
          Mudar os dias
        </Link>
      </div>
    </section>
  )
}
