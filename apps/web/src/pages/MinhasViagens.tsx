import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { descreverAtividade } from '@together/core'
import { Archive, ArchiveRestore, ChevronRight, Clock, History, Locate, Plus, Trash2 } from '../components/ui/icones'
import { arquivarViagem, buscarMinhasViagens, situacaoDaViagem, type ResumoDaViagem, type Situacao } from '../features/viagens/api'
import { carregarResumoDoInicio } from '../features/viagens/resumoDoInicio'
import { hojeTexto } from '../features/destinos/datas'
import { useSessao } from '../features/auth/hooks'
import FaixaConvidado from '../features/auth/FaixaConvidado'
import MapaDaGalera from '../features/carimbos/MapaDaGalera'
import ViagemAntiga from '../features/carimbos/ViagemAntiga'
import RoleHoje from '../features/carimbos/RoleHoje'
import { diasAte, formatarPeriodo } from '../lib/datas'
import ApagarViagem from '../features/viagens/ApagarViagem'
import Gaveta from '../components/ui/Gaveta'
import Norti from '../components/ui/Norti'
import Avatar from '../components/ui/Avatar'
import Carregando from '../components/ui/Carregando'
import ErroNaTela from '../components/ui/ErroNaTela'
import PilhaDeAvatares from '../components/ui/PilhaDeAvatares'
import './minhas-viagens.css'
import { useCapas } from '../features/viagens/capas'

type ViagemNaLista = ResumoDaViagem & { situacao: Situacao }
type Resumo = Awaited<ReturnType<typeof carregarResumoDoInicio>>

// Ordem da lista: acontecendo agora, próximas (da mais perto), sem data, concluídas
const PESO: Record<Situacao, number> = { agora: 0, proxima: 1, 'sem-data': 2, concluida: 3 }

// Spec 120a: num dia de viagem o "/" abre direto no Hoje. Só uma vez por abertura do site.
let jaAbriuNaViagem = false

// "Faltam 12 dias", "É amanhã!", "Acontecendo agora"... (igual ao cartão de destaque do app)
function etiquetaDaViagem(v: ViagemNaLista) {
  if (v.situacao === 'agora') return 'Acontecendo agora'
  if (v.situacao === 'concluida') return 'Já foi'
  if (!v.dataInicio) return 'Sem data ainda'
  const faltam = diasAte(v.dataInicio)
  if (faltam > 1) return `Faltam ${faltam} dias`
  return faltam === 1 ? 'É amanhã!' : 'É hoje!'
}

// "2 min", "1 h", "3 d"
function haQuanto(iso: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  return min < 60 ? `${min} min` : min < 1440 ? `${Math.round(min / 60)} h` : `${Math.round(min / 1440)} d`
}

// Início (spec 117), espelho do app (apps/mobile/app/index.tsx): saudação com o avatar (abre o Perfil),
// mapa da galera, cartão grande da próxima viagem com os carimbos, as outras viagens, Nova viagem,
// Rolê hoje e "Já fomos pra...". No computador o mapa fica numa coluna ao lado.
export default function MinhasViagens({ abrirAViagemDeHoje = false }: { abrirAViagemDeHoje?: boolean }) {
  const navegar = useNavigate()
  const [viagens, setViagens] = useState<ResumoDaViagem[] | null | 'erro'>(null)
  const { sessao, ehConvidado } = useSessao()
  const meuId = sessao?.user.id ?? ''
  // Viagem que a pessoa pediu pra apagar (abre a confirmação)
  const [paraApagar, setParaApagar] = useState<ResumoDaViagem | null>(null)
  const [gaveta, setGaveta] = useState<'role' | 'antiga' | null>(null)
  const [vezDoMapa, setVezDoMapa] = useState(0)
  const [acendeu, setAcendeu] = useState<string | null>(null)

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

  // Dia de viagem: abre direto no Hoje (como o app), uma vez só
  const deHoje = destaque?.situacao === 'agora' ? destaque.id : null
  useEffect(() => {
    if (!abrirAViagemDeHoje || jaAbriuNaViagem || !Array.isArray(viagens)) return
    jaAbriuNaViagem = true
    if (deHoje) navegar(`/viagem/${deHoje}/hoje`, { replace: true })
    // Spec 116: conta sem nenhuma viagem vai direto montar a primeira (em vez do Início vazio)
    else if (viagens.length === 0 && !ehConvidado) navegar('/nova-viagem', { replace: true })
  }, [abrirAViagemDeHoje, viagens, deHoje, ehConvidado, navegar])

  const eu = Array.isArray(viagens) ? viagens.flatMap((v) => v.membros).find((m) => m.id === meuId) : undefined
  const primeiroNome = eu?.nome.trim().split(/\s+/)[0]
  const hora = new Date().getHours()
  const saudacao = hora < 5 || hora >= 18 ? 'Boa noite' : hora < 12 ? 'Bom dia' : 'Boa tarde'

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

  // Rolê hoje e "Já fomos pra..." (spec 118f), lado a lado como no app
  const atalhos = !ehConvidado && (
    <div className="inicio-atalhos">
      <button type="button" onClick={() => setGaveta('role')}>
        <Locate size={18} aria-hidden="true" /> Rolê hoje
      </button>
      <button type="button" onClick={() => setGaveta('antiga')}>
        <History size={18} aria-hidden="true" /> Já fomos pra...
      </button>
    </div>
  )

  const vazia = Array.isArray(viagens) && ativas.length === 0 && arquivadas.length === 0

  return (
    <div className="pagina-solta inicio-pagina">
      <main className="inicio">
        <header className="inicio-topo">
          <div>
            <p>{saudacao},</p>
            <h1>{primeiroNome ?? 'Minhas viagens'}</h1>
          </div>
          {/* Spec 117: o Perfil abre pelo avatar */}
          <Link to="/perfil" className="inicio-avatar" aria-label="Abrir o perfil" title="Perfil">
            <Avatar nome={eu?.nome ?? 'Eu'} url={eu?.avatarUrl} indice={5} tamanho={44} />
          </Link>
        </header>

        <FaixaConvidado />

        {viagens === null && <Carregando texto="Arrumando a mala…" />}
        {viagens === 'erro' && <ErroNaTela aoTentar={carregar} />}

        {vazia && (
          <div className="viagens-vazio">
            <Norti humor="dormindo" tamanho={140} />
            <h2>A primeira viagem do grupo começa aqui</h2>
            <p>Crie a viagem, convide a turma e montem o roteiro juntos.</p>
            {!ehConvidado && (
              <Link to="/nova-viagem" className="botao">
                <Plus size={20} aria-hidden="true" /> Nova viagem
              </Link>
            )}
            {atalhos}
          </div>
        )}

        {Array.isArray(viagens) && !vazia && (
          <div className="inicio-colunas">
            {/* Spec 118b: o mapa da galera (convidado pelo link não tem). No celular vem em cima. */}
            {!ehConvidado && meuId && (
              <aside className="inicio-lado">
                <MapaDaGalera meuId={meuId} vez={vezDoMapa} aoAntigas={() => setGaveta('antiga')} />
                {acendeu && (
                  <p className="inicio-acendeu" role="status">
                    {acendeu} acendeu no mapa.
                  </p>
                )}
              </aside>
            )}

            <div className="inicio-principal">
              {destaque && <Destaque viagem={destaque} meuId={meuId} capa={capa(destaque.id, 1400)} etiqueta={etiquetaDaViagem(destaque)} acoes={acoes(destaque, true)} />}

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

              {/* Convidado cria conta antes de criar viagem (spec 018) */}
              {!ehConvidado && (
                <div>
                  <Link to="/nova-viagem" className="inicio-nova">
                    <Plus size={20} aria-hidden="true" /> Nova viagem
                  </Link>
                  {atalhos}
                </div>
              )}
            </div>
          </div>
        )}

        {paraApagar && (
          <Gaveta titulo={`Apagar "${paraApagar.nome}"?`} aoFechar={() => setParaApagar(null)}>
            <ApagarViagem id={paraApagar.id} nome={paraApagar.nome} aoApagar={() => apagou(paraApagar.id)} />
          </Gaveta>
        )}
        {gaveta === 'role' && (
          <Gaveta titulo="Rolê hoje" aoFechar={() => setGaveta(null)}>
            <RoleHoje />
          </Gaveta>
        )}
        {gaveta === 'antiga' && (
          <Gaveta titulo="A gente já foi pra..." aoFechar={() => setGaveta(null)}>
            <ViagemAntiga
              aoSalvar={(nome) => {
                setGaveta(null)
                setAcendeu(nome)
                setVezDoMapa((v) => v + 1)
              }}
            />
          </Gaveta>
        )}
      </main>
    </div>
  )
}

// Cartão grande da próxima viagem com a barra de carimbos + "No comboio agora" (spec 117)
function Destaque({ viagem, meuId, capa, etiqueta, acoes }: { viagem: ViagemNaLista; meuId: string; capa?: string; etiqueta: string; acoes: ReactNode }) {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  useEffect(() => {
    let vivo = true
    carregarResumoDoInicio(viagem, meuId)
      .then((r) => vivo && setResumo(r))
      .catch((e) => console.warn('Resumo do Início sem carimbos:', e))
    return () => {
      vivo = false
    }
  }, [viagem, meuId])

  const nome = (id: string | null) => (viagem.membros.find((m) => m.id === id)?.nome ?? 'Alguém').trim().split(/\s+/)[0]
  const pessoa = (id: string | null) => viagem.membros.find((m) => m.id === id)
  const indice = (id: string | null) => Math.max(0, viagem.membros.findIndex((m) => m.id === id))
  const linhaDeCima = [viagem.destinos.length > 1 ? `${viagem.destinos.length} destinos` : viagem.destinos[0], formatarPeriodo(viagem.dataInicio, viagem.dataFim)]
    .filter(Boolean)
    .join(' · ')
  const fracao = resumo ? resumo.carimbos / resumo.total : 0

  return (
    <>
      <div className="viagem-destaque">
        <Link to={`/viagem/${viagem.id}`} className="viagem-destaque-link">
          {capa && <img src={capa} alt="" />}
          <span className="viagem-destaque-etiqueta">
            <Clock size={16} aria-hidden="true" /> {etiqueta}
          </span>
          <span className="viagem-destaque-texto">
            <span className="viagem-destaque-acima">{linhaDeCima}</span>
            <strong>{viagem.nome}</strong>
            <span className="viagem-destaque-comboio">
              <span>
                {resumo
                  ? `${resumo.carimbos} de ${resumo.total} carimbos`
                  : `${viagem.membros.length} ${viagem.membros.length === 1 ? 'viajante' : 'viajantes'}`}
              </span>
              <PilhaDeAvatares pessoas={viagem.membros.map((m) => ({ nome: m.nome, url: m.avatarUrl }))} tamanho={28} />
            </span>
            {/* Barra de carimbos do passaporte (spec 117) */}
            <span className="viagem-destaque-barra" aria-hidden="true">
              <span style={{ transform: `scaleX(${fracao})` }} />
            </span>
          </span>
        </Link>
        {acoes}
      </div>

      {resumo && resumo.agora.length > 0 && (
        <section className="inicio-agora">
          <h2>No comboio agora</h2>
          <ul>
            {resumo.agora.map((a) => {
              const d = descreverAtividade(a)
              return (
                <li key={a.id}>
                  <Link to={`/viagem/${viagem.id}`}>
                    <Avatar nome={nome(a.autor)} url={pessoa(a.autor)?.avatarUrl} indice={indice(a.autor)} tamanho={30} />
                    <span className="inicio-agora-texto">
                      <strong>{nome(a.autor)}</strong> {d.verbo}
                      {d.titulo ? ` ${d.titulo}` : ''}
                    </span>
                    <small>{haQuanto(a.criado_em)}</small>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
