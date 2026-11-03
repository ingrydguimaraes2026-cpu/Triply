import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Archive, ArchiveRestore, ArrowRight, ChevronRight, Clock, LogOut, Plus, Trash2, UserRound } from '../components/ui/icones'
import { arquivarViagem, buscarMinhasViagens, situacaoDaViagem, type ResumoDaViagem, type Situacao } from '../features/viagens/api'
import { hojeTexto } from '../features/destinos/datas'
import { sair, useSessao } from '../features/auth/hooks'
import FaixaConvidado from '../features/auth/FaixaConvidado'
import { diasAte, formatarPeriodo } from '../lib/datas'
import ApagarViagem from '../features/viagens/ApagarViagem'
import Gaveta from '../components/ui/Gaveta'
import Agulha from '../components/ui/Agulha'
import Carregando from '../components/ui/Carregando'
import ErroNaTela from '../components/ui/ErroNaTela'
import PilhaDeAvatares from '../components/ui/PilhaDeAvatares'
import './minhas-viagens.css'
import { useCapas } from '../features/viagens/capas'

type ViagemNaLista = ResumoDaViagem & { situacao: Situacao }

// Ordem da lista: acontecendo agora, próximas (da mais perto), sem data, concluídas
const PESO: Record<Situacao, number> = { agora: 0, proxima: 1, 'sem-data': 2, concluida: 3 }

// "Faltam 12 dias", "É amanhã!", "Acontecendo agora"... (igual ao cartão de destaque do app)
function etiquetaDaViagem(v: ViagemNaLista) {
  if (v.situacao === 'agora') return 'Acontecendo agora'
  if (v.situacao === 'concluida') return 'Já foi'
  if (!v.dataInicio) return 'Sem data ainda'
  const faltam = diasAte(v.dataInicio)
  if (faltam > 1) return `Faltam ${faltam} dias`
  return faltam === 1 ? 'É amanhã!' : 'É hoje!'
}

// "/viagens" (spec 008), no design Plataforma (spec 113): a viagem mais perto em destaque com a capa,
// e as outras em cartões com miniatura.
export default function MinhasViagens() {
  const [viagens, setViagens] = useState<ResumoDaViagem[] | null | 'erro'>(null)
  const { sessao, ehConvidado } = useSessao()
  // Viagem que a pessoa pediu pra apagar (abre a confirmação)
  const [paraApagar, setParaApagar] = useState<ResumoDaViagem | null>(null)

  // Depois de apagar no banco: tira o cartão da lista, sem recarregar a página
  function apagou(id: string) {
    setViagens((atual) => (Array.isArray(atual) ? atual.filter((v) => v.id !== id) : atual))
    setParaApagar(null)
  }

  // Spec 054: arquivar só na minha lista (sem recarregar a página)
  async function arquivar(v: ResumoDaViagem, arquivar: boolean) {
    setViagens((atual) => (Array.isArray(atual) ? atual.map((x) => (x.id === v.id ? { ...x, arquivada: arquivar } : x)) : atual))
    try {
      await arquivarViagem(v.id, arquivar)
    } catch (e) {
      console.error('Erro ao arquivar:', e)
      setViagens((atual) => (Array.isArray(atual) ? atual.map((x) => (x.id === v.id ? { ...x, arquivada: !arquivar } : x)) : atual))
    }
  }

  function carregar() {
    setViagens(null)
    buscarMinhasViagens()
      .then(setViagens)
      .catch((e) => {
        console.error('Erro ao buscar viagens:', e)
        setViagens('erro')
      })
  }

  useEffect(carregar, [])

  const hoje = hojeTexto()
  const todas: ViagemNaLista[] = Array.isArray(viagens)
    ? [...viagens]
        .map((v) => ({ ...v, situacao: situacaoDaViagem(v.dataInicio, v.dataFim, hoje) }))
        .sort((a, b) => PESO[a.situacao] - PESO[b.situacao] || (a.dataInicio ?? '').localeCompare(b.dataInicio ?? ''))
    : []
  const ativas = todas.filter((v) => !v.arquivada)
  const arquivadas = todas.filter((v) => v.arquivada)
  // Destaque: a que está acontecendo ou a próxima. Só concluídas? Nenhuma em destaque.
  const destaque = ativas[0] && ativas[0].situacao !== 'concluida' ? ativas[0] : null
  const proximas = ativas.filter((v) => v !== destaque && v.situacao !== 'concluida')
  const passadas = ativas.filter((v) => v.situacao === 'concluida')
  const capa = useCapas(todas.map((v) => v.id))

  const meuNome = Array.isArray(viagens) ? viagens.flatMap((v) => v.membros).find((m) => m.id === sessao?.user.id)?.nome : undefined
  const ola = meuNome ? `Olá, ${meuNome.trim().split(/\s+/)[0]}` : 'Olá'

  // Apagar (só ADM) e arquivar: fora do link de propósito, porque botão dentro de link não funciona direito
  const acoes = (v: ViagemNaLista, claro?: boolean) => (
    <span className={claro ? 'viagem-acoes claro' : 'viagem-acoes'}>
      <button
        type="button"
        onClick={() => arquivar(v, !v.arquivada)}
        aria-label={v.arquivada ? `Voltar ${v.nome} pra lista` : `Arquivar ${v.nome}`}
        title={v.arquivada ? 'Voltar pra lista' : 'Arquivar (só some da sua lista)'}
      >
        {v.arquivada ? <ArchiveRestore size={16} aria-hidden="true" /> : <Archive size={16} aria-hidden="true" />}
      </button>
      {v.souAdm && (
        <button type="button" onClick={() => setParaApagar(v)} aria-label={`Apagar a viagem ${v.nome}`} title="Apagar viagem">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      )}
    </span>
  )

  const linha = (v: ViagemNaLista) => (
    <li key={v.id} className="viagem-linha">
      <Link to={`/viagem/${v.id}`} className="viagem-linha-link">
        <img src={capa(v.id, 200)} alt="" loading="lazy" />
        <span className="viagem-linha-texto">
          <strong>{v.nome}</strong>
          <span>
            {formatarPeriodo(v.dataInicio, v.dataFim) || 'Sem data'} · {v.membros.length} {v.membros.length === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </span>
        <ChevronRight size={20} aria-hidden="true" className="viagem-linha-seta" />
      </Link>
      {acoes(v)}
    </li>
  )

  return (
    <div className="pagina-solta viagens-pagina">
      <header className="pagina-solta-topo">
        <Link to="/" className="pagina-solta-logo">
          <span className="pagina-solta-agulha">
            <Agulha tamanho={34} sombra={false} />
          </span>
          Tripwave
        </Link>
        <nav>
          <Link to="/perfil" className="botao-texto">
            <UserRound size={18} aria-hidden="true" /> Perfil
          </Link>
          <button
            type="button"
            className="botao-texto"
            onClick={() => {
              if (ehConvidado && !window.confirm('Você está como convidado. Se sair, perde o acesso às viagens. Sair mesmo assim?')) return
              sair()
            }}
          >
            <LogOut size={18} aria-hidden="true" /> Sair
          </button>
        </nav>
      </header>

      <main className="pagina-solta-conteudo">
        <div className="cabecalho-pagina">
          <div>
            <p className="cabecalho-pagina-acima">{ola}</p>
            <h1>Minhas viagens</h1>
          </div>
          {/* Convidado cria conta antes de criar viagem (spec 018) */}
          {!ehConvidado && (
            <Link to="/nova-viagem" className="botao">
              <Plus size={18} aria-hidden="true" /> Nova viagem
            </Link>
          )}
        </div>

        <FaixaConvidado />

        {viagens === null && <Carregando texto="Arrumando a mala…" />}
        {viagens === 'erro' && <ErroNaTela aoTentar={carregar} />}

        {Array.isArray(viagens) && ativas.length === 0 && arquivadas.length === 0 && (
          <div className="viagens-vazio">
            <Agulha humor="dormindo" tamanho={140} />
            <h2>A primeira viagem do grupo começa aqui</h2>
            <p>Crie a viagem, convide a turma e montem o roteiro juntos.</p>
            {!ehConvidado && (
              <Link to="/nova-viagem" className="botao">
                <Plus size={20} aria-hidden="true" /> Nova viagem
              </Link>
            )}
          </div>
        )}

        {destaque && (
          <div className="viagem-destaque">
            <Link to={`/viagem/${destaque.id}`} className="viagem-destaque-link">
              <img src={capa(destaque.id, 1400)} alt="" />
              <span className="viagem-destaque-etiqueta">
                <Clock size={16} aria-hidden="true" /> {etiquetaDaViagem(destaque)}
              </span>
              <span className="viagem-destaque-texto">
                <span className="viagem-destaque-info">
                  <span className="viagem-destaque-acima">
                    {[destaque.destinos.length > 1 ? `${destaque.destinos.length} destinos` : destaque.destinos[0], formatarPeriodo(destaque.dataInicio, destaque.dataFim)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <strong>{destaque.nome}</strong>
                  <span className="viagem-destaque-comboio">
                    <PilhaDeAvatares pessoas={destaque.membros.map((m) => ({ nome: m.nome, url: m.avatarUrl }))} tamanho={30} />
                    {destaque.membros.length} {destaque.membros.length === 1 ? 'viajante' : 'viajantes'}
                  </span>
                </span>
                <span className="viagem-destaque-seta" aria-hidden="true">
                  <ArrowRight size={22} />
                </span>
              </span>
            </Link>
            {acoes(destaque, true)}
          </div>
        )}

        {proximas.length > 0 && (
          <section>
            <h2 className="viagens-secao">Próximas</h2>
            <ul className="viagens-lista">{proximas.map(linha)}</ul>
          </section>
        )}

        {passadas.length > 0 && (
          <section>
            <h2 className="viagens-secao">Viagens passadas</h2>
            <ul className="viagens-lista">{passadas.map(linha)}</ul>
          </section>
        )}

        {arquivadas.length > 0 && (
          <details className="viagens-arquivadas">
            <summary>Arquivadas ({arquivadas.length})</summary>
            <ul className="viagens-lista">{arquivadas.map(linha)}</ul>
          </details>
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
