import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { diasDoPeriodo } from '@together/core'
import { useViagemAtual } from '../../features/viagens/hooks'
import { periodoDosDestinos } from '../../features/destinos/datas'
import { diaCurtinho } from '../../features/agenda/hooks'
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
  const [dia, setDia] = useState<string | null>(null) // null = Matches

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
        <button type="button" aria-pressed={dia === null} onClick={() => setDia(null)}>
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
        {dias.length === 0 && (
          <Link to="../cidades" relative="path" className="roteiro-sem-datas">
            Definir as datas
          </Link>
        )}
      </nav>

      {dia ? (
        <Agenda key={dia} diaDoRoteiro={dia} />
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
          <Link to={principal ? `../explorar?destino=${principal}` : '../explorar'} relative="path" className="roteiro-montar">
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
      <Link to={`../explorar?destino=${m.destinoId}`} relative="path" className="roteiro-linha">
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
