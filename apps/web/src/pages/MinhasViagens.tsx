import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, LogOut, Plus, Trash2, UserRound } from 'lucide-react'
import { buscarMinhasViagens, situacaoDaViagem, type ResumoDaViagem, type Situacao } from '../features/viagens/api'
import { hojeTexto } from '../features/destinos/datas'
import { sair } from '../features/auth/hooks'
import { formatarPeriodo } from '../lib/datas'
import ApagarViagem from '../features/viagens/ApagarViagem'
import Avatar from '../components/ui/Avatar'
import Gaveta from '../components/ui/Gaveta'
import '../components/ui/ui.css'
import './minhas-viagens.css'

const SELOS: Record<Situacao, string | null> = {
  agora: 'Acontecendo agora',
  proxima: 'Próxima',
  concluida: 'Concluída',
  'sem-data': null,
}

// Ordem da lista: acontecendo agora, próximas (da mais perto), sem data, concluídas
const PESO: Record<Situacao, number> = { agora: 0, proxima: 1, 'sem-data': 2, concluida: 3 }

// "/viagens" (spec 008): todas as viagens da pessoa
export default function MinhasViagens() {
  const [viagens, setViagens] = useState<ResumoDaViagem[] | null | 'erro'>(null)
  // Viagem que a pessoa pediu pra apagar (abre a confirmação)
  const [paraApagar, setParaApagar] = useState<ResumoDaViagem | null>(null)

  // Depois de apagar no banco: tira o cartão da lista, sem recarregar a página
  function apagou(id: string) {
    setViagens((atual) => (Array.isArray(atual) ? atual.filter((v) => v.id !== id) : atual))
    setParaApagar(null)
  }

  useEffect(() => {
    buscarMinhasViagens()
      .then(setViagens)
      .catch((e) => {
        console.error('Erro ao buscar viagens:', e)
        setViagens('erro')
      })
  }, [])

  const hoje = hojeTexto()
  const ordenadas =
    Array.isArray(viagens) &&
    [...viagens]
      .map((v) => ({ ...v, situacao: situacaoDaViagem(v.dataInicio, v.dataFim, hoje) }))
      .sort((a, b) => PESO[a.situacao] - PESO[b.situacao] || (a.dataInicio ?? '').localeCompare(b.dataInicio ?? ''))

  return (
    <div className="pagina-solta">
      <header className="pagina-solta-topo">
        <Link to="/" className="pagina-solta-logo">
          together
        </Link>
        <nav>
          <Link to="/perfil" className="botao-texto">
            <UserRound size={18} aria-hidden="true" /> Perfil
          </Link>
          <button type="button" className="botao-texto" onClick={() => sair()}>
            <LogOut size={18} aria-hidden="true" /> Sair
          </button>
        </nav>
      </header>

      <main className="pagina-solta-conteudo">
        <div className="cabecalho-pagina">
          <div>
            <h1>Minhas viagens</h1>
            {Array.isArray(viagens) && (
              <p>
                {viagens.length} {viagens.length === 1 ? 'viagem' : 'viagens'}
              </p>
            )}
          </div>
          <Link to="/nova-viagem" className="botao">
            <Plus size={18} aria-hidden="true" /> Nova viagem
          </Link>
        </div>

        {viagens === null && <p className="carregando-texto">Carregando…</p>}
        {viagens === 'erro' && <p className="aviso-erro">Não deu pra carregar as viagens. Atualize a página.</p>}
        {ordenadas && ordenadas.length === 0 && (
          <div className="vazio">
            <p className="vazio-titulo">Nenhuma viagem ainda</p>
            <p className="vazio-texto">Crie a primeira e convide o comboio.</p>
            <Link to="/nova-viagem" className="botao">
              Criar viagem
            </Link>
          </div>
        )}

        {ordenadas && ordenadas.length > 0 && (
          <ul className="lista-viagens">
            {ordenadas.map((v) => (
              <li key={v.id} className="lista-viagens-item">
                <Link to={`/viagem/${v.id}`} className={`cartao-viagem ${v.situacao}${v.souAdm ? ' com-apagar' : ''}`}>
                  {SELOS[v.situacao] && <span className="cartao-viagem-selo">{SELOS[v.situacao]}</span>}
                  <strong>{v.nome}</strong>
                  <span className="cartao-viagem-periodo">{formatarPeriodo(v.dataInicio, v.dataFim)}</span>
                  {v.destinos.length > 0 && <span className="cartao-viagem-destinos">{v.destinos.join(' → ')}</span>}
                  <span className="cartao-viagem-comboio">
                    {v.membros.slice(0, 5).map((m) => (
                      <Avatar key={m.id} nome={m.nome} url={m.avatarUrl} tamanho={28} />
                    ))}
                    {v.membros.length > 5 && <small>+{v.membros.length - 5}</small>}
                    <span className="cartao-viagem-abrir">
                      Abrir <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
                {/* Fora do link de propósito: botão dentro de link não funciona direito. Só o ADM pode apagar. */}
                {v.souAdm && (
                  <button
                    type="button"
                    className="cartao-viagem-apagar"
                    onClick={() => setParaApagar(v)}
                    aria-label={`Apagar a viagem ${v.nome}`}
                    title="Apagar viagem"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {paraApagar && (
          <Gaveta titulo={`Apagar "${paraApagar.nome}"?`} aoFechar={() => setParaApagar(null)}>
            <ApagarViagem id={paraApagar.id} nome={paraApagar.nome} aoApagar={() => apagou(paraApagar.id)} />
          </Gaveta>
        )}
      </main>
    </div>
  )
}
