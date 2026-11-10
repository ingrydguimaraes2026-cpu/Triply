import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Archive, ArchiveRestore, ChevronRight, History, Locate, Plus, Trash2 } from '../components/ui/icones'
import { Selo } from '../components/ui/Icone'
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
import './suas-viagens.css'
import { useCapas } from '../features/viagens/capas'

type ViagemNaLista = ResumoDaViagem & { situacao: Situacao }
type Resumo = Awaited<ReturnType<typeof carregarResumoDoInicio>>

// Ordem da lista: acontecendo agora, próximas (da mais perto), sem data, concluídas
const PESO: Record<Situacao, number> = { agora: 0, proxima: 1, 'sem-data': 2, concluida: 3 }

// Spec 120a: num dia de viagem o "/" abre direto no Hoje. Só uma vez por abertura do site.
let jaAbriuNaViagem = false

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
  // Carteira: de trás pra frente, as antigas (a mais velha no fundo), as outras (a mais longe primeiro)
  // e a próxima na frente. Sem próxima, a antiga mais recente fica na frente.
  const pilha = [...[...passadas].reverse(), ...[...proximas].reverse(), ...(destaque ? [destaque] : [])]

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
        {/* Caminho B "Embarque" (10/11/2026), igual ao app: fora de uma viagem só existe "Suas viagens" */}
        <header className="sv-topo">
          <Link to="/perfil" aria-label="Abrir o seu perfil" title="Perfil">
            <Avatar nome={eu?.nome ?? 'Eu'} url={eu?.avatarUrl} indice={5} tamanho={36} />
          </Link>
          {!ehConvidado && (
            <Link to="/nova-viagem" className="sv-nova">
              <Plus size={14} aria-hidden="true" /> Nova viagem
            </Link>
          )}
        </header>
        <h1 className="sv-titulo">Suas viagens</h1>
        <p className="sv-sub">
          {saudacao}, {primeiroNome ?? 'tudo bem'}. Toque numa viagem pra abrir.
        </p>

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
          <>
            {pilha.length > 0 && <Carteira pilha={pilha} meuId={meuId} capa={capa} />}

            {/* Atalhos e o mapa da galera ficam embaixo da carteira: o principal é abrir a viagem */}
            {atalhos}
            {!ehConvidado && meuId && (
              <section className="sv-mapa">
                <MapaDaGalera meuId={meuId} vez={vezDoMapa} aoAntigas={() => setGaveta('antiga')} />
                {acendeu && (
                  <p className="inicio-acendeu" role="status">
                    {acendeu} acendeu no mapa.
                  </p>
                )}
              </section>
            )}

            {/* Arquivar (só some da sua lista) e apagar (só quem organiza) ficam guardados aqui */}
            <details className="viagens-arquivadas">
              <summary>Arquivar ou apagar viagens{arquivadas.length > 0 ? ` (${arquivadas.length} arquivadas)` : ''}</summary>
              <ul className="viagens-lista">{ativas.map(linha)}</ul>
              {arquivadas.length > 0 && (
                <>
                  <h2 className="viagens-secao">Arquivadas</h2>
                  <ul className="viagens-lista">{arquivadas.map(linha)}</ul>
                </>
              )}
            </details>
          </>
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

// ---------- Carteira de bilhetes (igual ao app: apps/mobile/app/index.tsx) ----------
// A próxima viagem fica na frente, inteira; as outras ficam atrás, só com a pontinha aparecendo.
function Carteira({ pilha, meuId, capa }: { pilha: ViagemNaLista[]; meuId: string; capa: (id: string, largura?: number) => string | undefined }) {
  const frente = pilha[pilha.length - 1]
  const [resumo, setResumo] = useState<Resumo | null>(null)
  useEffect(() => {
    let vivo = true
    carregarResumoDoInicio(frente, meuId)
      .then((r) => vivo && setResumo(r))
      .catch((e) => console.warn('Resumo do Início sem o próximo passo:', e))
    return () => {
      vivo = false
    }
  }, [frente, meuId])
  return (
    <div className="sv-carteira" style={{ ['--n' as string]: pilha.length }}>
      {pilha.map((v, i) => {
        const naFrente = i === pilha.length - 1
        const etiqueta = etiquetaDoBilhete(v)
        const foto = capa(v.id, 700)
        return (
          <Link
            key={v.id}
            to={`/viagem/${v.id}`}
            className={`sv-bilhete${naFrente ? ' frente' : ''}${etiqueta ? '' : ' antiga'}`}
            style={{ ['--i' as string]: i }}
            aria-label={`Abrir ${v.nome}${etiqueta ? `, ${etiqueta}` : ', viagem que já passou'}`}
          >
            <span className="sv-foto">
              {foto && <img src={foto} alt="" loading="lazy" />}
              <b>{v.nome}</b>
              {etiqueta ? <em>{etiqueta}</em> : <Selo nome="feito" tamanho={54} tom="escuro" className="sv-carimbo" />}
            </span>
            {naFrente && (
              <span className="sv-inf">
                <span>
                  <small>{formatarPeriodo(v.dataInicio, v.dataFim).toUpperCase()}</small>
                  <strong>{resumo ? (resumo.proximo ? `Próximo: ${resumo.proximo}` : 'Tudo pronto pra viagem') : ' '}</strong>
                </span>
                <PilhaDeAvatares pessoas={v.membros.map((m) => ({ nome: m.nome, url: m.avatarUrl }))} tamanho={26} max={4} />
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

// "em 23 dias", "amanhã", "agora", "Sem data"; null = já passou (ganha o carimbo)
function etiquetaDoBilhete(v: ViagemNaLista) {
  if (v.situacao === 'concluida') return null
  if (v.situacao === 'agora') return 'agora'
  if (!v.dataInicio) return 'Sem data'
  const faltam = diasAte(v.dataInicio)
  return faltam > 1 ? `em ${faltam} dias` : faltam === 1 ? 'amanhã' : 'agora'
}
