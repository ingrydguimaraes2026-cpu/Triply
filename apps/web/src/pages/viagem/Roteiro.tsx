import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { diasDoPeriodo } from '@together/core'
import { useViagemAtual } from '../../features/viagens/hooks'
import { periodoDosDestinos } from '../../features/destinos/datas'
import { diaCurtinho } from '../../features/agenda/hooks'
import { useLugaresDosDias } from '../../features/roteiro/lugaresDoDia'
import { agruparMatches, buscarMatches, ehMatch, limiteDoMatch, quemFazMatch, type Match } from '../../features/roteiro/matches'
import type { Membro } from '../../features/viagens/hooks'
import TituloDaTela from '../../components/ui/TituloDaTela'
import Avatar from '../../components/ui/Avatar'
import { Selo } from '../../components/ui/Icone'
import { Check, Compass, MapPin, Wand2 } from '../../components/ui/icones'
import Agenda from './Agenda'
import './roteiro.css'

// Roteiro (spec 117), espelho do app (apps/mobile/app/viagem/[id]/(abas)/roteiro.tsx):
// abre em Matches (o que o comboio quer). As pílulas "Dia 1", "Dia 2"... mostram o dia com os horários
// (a antiga Agenda). O baralho do Explorar fica em "Descobrir mais lugares".
export default function Roteiro() {
  const { viagem, destinos, membros, meuId } = useViagemAtual()
  const [matches, setMatches] = useState<Match[] | null>(null)
  // O dia fica no endereço (?dia=2027-06-04): o "voltar" do navegador volta pro mesmo dia. Sem dia = Matches.
  const [busca, setBusca] = useSearchParams()
  const setDia = (d: string | null) => setBusca(d ? { dia: d } : {}, { replace: true })

  useEffect(() => {
    let vivo = true
    // Sem internet (ou antes da migration do match) a lista fica vazia, sem quebrar a tela
    buscarMatches(viagem.id)
      .catch(() => [])
      .then((m) => vivo && setMatches(m))
    return () => {
      vivo = false
    }
  }, [viagem.id])

  // Datas das cidades; sem elas, as datas da viagem
  const periodo = periodoDosDestinos(destinos) ?? (viagem.data_inicio ? { inicio: viagem.data_inicio, fim: viagem.data_fim ?? viagem.data_inicio } : null)
  const dias = useMemo(() => diasDoPeriodo(periodo?.inicio ?? null, periodo?.fim ?? null), [periodo?.inicio, periodo?.fim])
  const pedido = busca.get('dia')
  const dia = pedido && dias.includes(pedido) ? pedido : null
  // Viagem sem datas: os dias montados no Explorar viram "Dia 1", "Dia 2"... (como no app). ?dia=1, ?dia=2...
  const montados = useLugaresDosDias(viagem.id).semDatas(dias.length ? [] : destinos)
  const montado = montados.find((m) => String(m.numero) === pedido) ?? null

  const pessoas = membros.length
  const lista = matches ?? []
  const novos = lista.filter((m) => ehMatch(m.querem, pessoas) && !m.noDia).length
  const principal = lista.find((m) => ehMatch(m.querem, pessoas))?.destinoId

  return (
    <div className="roteiro">
      <TituloDaTela
        titulo="Roteiro"
        acao={
          <Link to="../cidades" relative="path" className="roteiro-cidades">
            <MapPin size={15} aria-hidden="true" /> Cidades
          </Link>
        }
      />

      <nav className="roteiro-pilulas" aria-label="Matches e dias">
        <button type="button" aria-pressed={dia === null && !montado} onClick={() => setDia(null)}>
          Matches
          {novos > 0 && <span className="roteiro-novos">{novos}</span>}
        </button>
        {dias.map((d, i) => {
          const { semana, numero } = diaCurtinho(d)
          return (
            <button key={d} type="button" aria-pressed={dia === d} onClick={() => setDia(d)} title={`${semana} ${numero}`}>
              Dia {i + 1}
            </button>
          )
        })}
        {montados.map((m) => (
          <button key={m.numero} type="button" aria-pressed={montado?.numero === m.numero} onClick={() => setDia(String(m.numero))} title={m.destino.nome}>
            Dia {m.numero}
          </button>
        ))}
        {dias.length === 0 && (
          <Link to="../cidades" relative="path" className="roteiro-sem-datas">
            Definir as datas
          </Link>
        )}
      </nav>

      {dia ? (
        <Agenda diaDoRoteiro={dia} aoTrocarDia={setDia} />
      ) : montado ? (
        <DiaSemData numero={montado.numero} cidade={montado.destino.nome} destinoId={montado.destino.id} lugares={montado.lugares} />
      ) : (
        <>
          <p className="roteiro-dica">{`O que ${quemFazMatch(pessoas)} vira match e entra no dia.`}</p>
          {matches === null ? (
            <div className="roteiro-carregando" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <Matches matches={lista} membros={membros} meuId={meuId} principal={principal} />
          )}
        </>
      )}
    </div>
  )
}

// Os 3 grupos (Todo mundo quer, Deu match, Quase), "Montar os dias" e "Descobrir mais lugares"
function Matches({ matches, membros, meuId, principal }: { matches: Match[]; membros: Membro[]; meuId: string; principal?: string }) {
  const pessoas = membros.length
  const { todos, match, quase } = agruparMatches(matches, pessoas)
  const grupos = [
    { titulo: `Todo mundo quer · ${pessoas} de ${pessoas}`, lista: todos },
    { titulo: `Deu match · ${limiteDoMatch(pessoas)} ou mais`, lista: match },
    { titulo: 'Quase · 2 querem', lista: quase, opinar: true },
  ].filter((g) => g.lista.length)

  return (
    <div className="roteiro-matches">
      {pessoas < 2 ? (
        <Vazio texto="Match é coisa de grupo: chame a galera e cada um desliza do seu jeito." />
      ) : !grupos.length ? (
        <Vazio
          texto={`Ainda nada em comum. Quando ${limiteDoMatch(pessoas) >= pessoas ? 'todo mundo der' : `${limiteDoMatch(pessoas)} pessoas derem`} "quero" no mesmo lugar, ele aparece aqui.`}
        />
      ) : (
        grupos.map((g) => (
          <section key={g.titulo} className="roteiro-grupo">
            <h2>{g.titulo}</h2>
            <ul>
              {g.lista.map((m) => (
                <Linha key={m.catalogoId} m={m} membros={membros} meuId={meuId} opinar={!!g.opinar} />
              ))}
            </ul>
          </section>
        ))
      )}

      <div className="roteiro-botoes">
        {match.length + todos.length > 0 && (
          <Link to={principal ? `../explorar?destino=${principal}&roteiro=1` : '../explorar'} relative="path" className="roteiro-montar">
            <Wand2 size={18} aria-hidden="true" /> Montar os dias com os matches
          </Link>
        )}
        <Link to="../explorar" relative="path" className="roteiro-descobrir">
          <Compass size={18} aria-hidden="true" /> Descobrir mais lugares
        </Link>
      </div>
    </div>
  )
}

function Linha({ m, membros, meuId, opinar }: { m: Match; membros: Membro[]; meuId: string; opinar: boolean }) {
  const quem = m.quem.map((id) => membros.findIndex((p) => p.id === id)).filter((i) => i >= 0)
  const faltam = membros.filter((p) => !m.quem.includes(p.id))
  const nome = (p: Membro) => (p.id === meuId ? 'você' : p.nome.trim().split(/\s+/)[0])
  const falta = faltam.length
    ? `falta ${faltam
        .map(nome)
        .join(', ')
        .replace(/, ([^,]*)$/, ' e $1')}`
    : 'todo mundo quer'
  return (
    <li>
      {/* Opinar: abre o baralho daquele destino. Adicionar ao dia / No dia: abre os dias montados (como "Montar os dias") */}
      <Link to={`../explorar?destino=${m.destinoId}${opinar ? '' : '&roteiro=1'}`} relative="path" className="roteiro-linha">
        {m.foto ? (
          <img src={m.foto} alt="" loading="lazy" />
        ) : (
          <span className="roteiro-linha-sem-foto">
            <Selo nome="museu" tamanho={34} />
          </span>
        )}
        <span className="roteiro-linha-texto">
          <strong>{m.nome}</strong>
          <span className="roteiro-linha-quem">
            <span className="roteiro-linha-avatares">
              {quem.slice(0, 5).map((i) => (
                <Avatar key={i} nome={membros[i].nome} url={membros[i].avatarUrl} indice={i} tamanho={20} />
              ))}
            </span>
            <small>{falta}</small>
          </span>
        </span>
        {m.noDia ? (
          <span className="roteiro-selo no-dia">
            <Check size={13} aria-hidden="true" /> No dia
          </span>
        ) : opinar ? (
          <span className="roteiro-selo opinar">Opinar</span>
        ) : (
          <span className="roteiro-selo adicionar">Adicionar ao dia</span>
        )}
      </Link>
    </li>
  )
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div className="roteiro-vazio">
      <Selo nome="coracoes" tamanho={52} />
      <p>{texto}</p>
    </div>
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
        <Link to="../cidades" relative="path" className="agenda-botao-pequeno sem-borda">
          Definir as datas pra ver horários e eventos
        </Link>
      </div>
    </section>
  )
}
