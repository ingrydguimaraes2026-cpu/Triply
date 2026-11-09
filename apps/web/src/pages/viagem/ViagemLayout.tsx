import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams, useSearchParams } from 'react-router'
import { ArrowLeftRight, ChevronRight, LifeBuoy, MoreHorizontal, PanelLeft, Plus, Search } from '../../components/ui/icones'
import { ABAS, TUDO_DA_VIAGEM } from '../../features/viagens/partes'
import FaixaConvidado from '../../features/auth/FaixaConvidado'
import { AbaAtivaContexto, useViagem, ViagemContexto } from '../../features/viagens/hooks'
import { avisarQueGastosMudaram, type DadosDoGasto } from '../../features/financeiro/api'
import { enviarFila } from '../../features/financeiro/fila'
import { enviarMarcacoes } from '../../features/offline/filaDeMarcacoes'
import LancamentoRapido from '../../features/financeiro/LancamentoRapido'
import { useNovidades } from '../../features/notificacoes/hooks'
import Novidades, { BotaoSino } from '../../features/notificacoes/Novidades'
import AvisosNoCelular from '../../features/notificacoes/AvisosNoCelular'
import Emergencia from '../../features/emergencia/Emergencia'
import FaixaOffline from '../../features/offline/FaixaOffline'
import BuscaNaViagem from '../../features/busca/BuscaNaViagem'
import { useTempoReal } from '../../features/tempo-real/useTempoReal'
import { useAcessibilidade } from '../../lib/acessibilidade'
import { abasVisiveis, CONGELADO } from '@together/core'
import FormGasto from '../../features/financeiro/FormGasto'
import { formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import Norti from '../../components/ui/Norti'
import Gaveta from '../../components/ui/Gaveta'
import Perdido from '../Perdido'
import Overview from './Overview'
import Reservas from './Reservas'
import '../../components/ui/ui.css'
import './viagem.css'
import { useCapas } from '../../features/viagens/capas'

// Menu recolhido (só ícones) fica lembrado neste navegador
const CHAVE_MENU = 'together:menu-recolhido'
function lerRecolhido() {
  try {
    return localStorage.getItem(CHAVE_MENU) === '1'
  } catch {
    return false
  }
}

// Abas com mapa ficam guardadas depois da primeira visita (escondidas, não destruídas):
// voltar nelas é instantâneo e o mapa não carrega de novo.
const ABAS_GUARDADAS = [
  { para: '', Tela: Overview },
  { para: 'reservas', Tela: Reservas },
]

type Lancamento = { modo: 'rapido' } | { modo: 'completo'; inicial: Partial<DadosDoGasto> } | null

// Moldura de todas as telas de uma viagem: menu + a aba escolhida (visual do app, spec 112).
// Carrega os dados da viagem uma vez e passa pras abas (veja useViagemAtual).
// Função vazia fixa (não muda a cada render), pra quando a viagem ainda não carregou
const semNada = async () => {}

export default function ViagemLayout() {
  const { id } = useParams()
  const capa = useCapas(id ? [id] : [])
  const estado = useViagem(id)
  const [recolhido, setRecolhido] = useState(lerRecolhido)
  function alternarMenu() {
    const novo = !recolhido
    setRecolhido(novo)
    try {
      localStorage.setItem(CHAVE_MENU, novo ? '1' : '0')
    } catch {
      // sem armazenamento: só não lembra na próxima vez
    }
  }
  const [busca, setBusca] = useSearchParams()
  const [lancamento, setLancamento] = useState<Lancamento>(() => (busca.get('lancar') ? { modo: 'rapido' } : null))
  const [recado, setRecado] = useState<string | null>(null)
  // Spec 031: sino de novidades (no topo do celular e no menu do computador)
  const [vendoNovidades, setVendoNovidades] = useState(false)
  const [vendoEmergencia, setVendoEmergencia] = useState(false) // spec 037
  const [buscando, setBuscando] = useState(false) // spec 053
  const novidades = useNovidades(id ?? '', estado.status === 'pronta' ? estado.dados.meuId : '')
  const { simples } = useAcessibilidade() // spec 090: modo simples mostra menos abas
  // Spec 085: mudança de outra pessoa aparece na hora (só escuta depois que a viagem carregou)
  useTempoReal(estado.status === 'pronta' ? id : undefined, estado.status === 'pronta' ? estado.dados.recarregar : semNada)

  // Qual aba está aberta ('' = Overview) e quais abas guardadas já foram visitadas nesta viagem
  const { pathname } = useLocation()
  const aba = pathname.split('/').slice(3).filter(Boolean).join('/') // /viagem/<id>/hospedagem → 'hospedagem'
  const abaGuardada = ABAS_GUARDADAS.some((a) => a.para === aba)
  const [visitadas, setVisitadas] = useState<string[]>([])
  const chaveDaAba = `${id}:${aba}`
  if (abaGuardada && !visitadas.includes(chaveDaAba)) setVisitadas([...visitadas, chaveDaAba])

  // Atalho do app instalado ("Lançar gasto"): abre o lançamento rápido e limpa o endereço
  useEffect(() => {
    if (busca.get('lancar')) setBusca({}, { replace: true })
  }, [busca, setBusca])

  // Gastos lançados sem internet: envia quando abrir a viagem e quando a conexão voltar
  useEffect(() => {
    const enviar = () =>
      enviarFila().then((n) => {
        if (n > 0) {
          avisarQueGastosMudaram()
          setRecado(n === 1 ? 'O gasto guardado sem internet foi enviado.' : `${n} gastos guardados sem internet foram enviados.`)
        }
        // Spec 086: marcações (listas, mala, tarefas) guardadas sem internet
        return enviarMarcacoes()
      })
    enviar()
    window.addEventListener('online', enviar)
    return () => window.removeEventListener('online', enviar)
  }, [])

  // Recado some sozinho
  useEffect(() => {
    if (!recado) return
    const timer = setTimeout(() => setRecado(null), 5000)
    return () => clearTimeout(timer)
  }, [recado])

  const fecharLancamento = useCallback(() => setLancamento(null), [])

  if (estado.status === 'carregando') return <div className="viagem-carregando" aria-busy="true" />
  if (estado.status === 'nao-encontrada') return <Perdido />

  const { viagem, destinos, membros, meuId, euSouAdm } = estado.dados
  const eu = membros.find((m) => m.id === meuId)
  // As 5 partes sempre iguais (como no app). Modo simples (spec 090): só as abas dele, sem "Tudo da viagem".
  const tudo = TUDO_DA_VIAGEM.filter((a) => !a.soAdm || euSouAdm)
  const principais = simples ? abasVisiveis([...ABAS, ...tudo], true) : ABAS

  return (
    <div className={recolhido ? 'viagem menu-recolhido' : 'viagem'}>
      <FaixaOffline />
      {/* Celular: barra de cima com a viagem (leva pra Minhas viagens) e o perfil */}
      <header className="viagem-topo-celular">
        <Link to="/viagens" className="viagem-topo-nome">
          <strong>{viagem.nome}</strong>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
        <button type="button" className="viagem-topo-icone botao-sos" onClick={() => setBuscando(true)} aria-label="Buscar na viagem">
          <Search size={20} aria-hidden="true" />
        </button>
        <button type="button" className="viagem-topo-icone botao-sos" onClick={() => setVendoEmergencia(true)} aria-label="Emergência">
          <LifeBuoy size={20} aria-hidden="true" />
        </button>
        {/* Sino de novidades (spec 031). ❄ congelado pelo RUMO (03/11/2026) */}
        {!CONGELADO.notificacoes && <BotaoSino novas={novidades.novas} aoAbrir={() => setVendoNovidades(true)} />}
        {/* "Tudo da viagem" (o "..." do app): o que não está nas 5 partes */}
        <Link to="tudo" className="viagem-topo-icone" aria-label="Tudo da viagem">
          <MoreHorizontal size={20} aria-hidden="true" />
        </Link>
        <Link to="/perfil" aria-label="Seu perfil">
          <Avatar nome={eu?.nome ?? '?'} url={eu?.avatarUrl} tamanho={32} />
        </Link>
      </header>

      <aside className="viagem-menu">
        <div className="viagem-menu-cabeca">
          <Link to="/viagens" className="viagem-logo" aria-label="Norti: ver todas as viagens">
            <span className="viagem-logo-norti">
              <Norti tamanho={34} sombra={false} />
            </span>
            <span className="viagem-menu-texto">Norti</span>
          </Link>
          <button type="button" className="viagem-menu-recolher" onClick={alternarMenu} aria-label={recolhido ? 'Abrir o menu' : 'Recolher o menu'} title={recolhido ? 'Abrir' : 'Recolher'}>
            <PanelLeft size={19} aria-hidden="true" />
          </button>
        </div>

        {/* Mini capa da viagem, a mesma foto do app. Toque troca de viagem. */}
        <Link to="/viagens" className="viagem-atual" aria-label={`${viagem.nome}: trocar de viagem`} title="Trocar de viagem">
          <img src={capa(viagem.id, 600)} alt="" />
          <span className="viagem-atual-rotulo">
            Viagem <ArrowLeftRight size={12} aria-hidden="true" />
          </span>
          <strong>{viagem.nome}</strong>
          <span>{formatarPeriodo(viagem.data_inicio, viagem.data_fim)}</span>
        </Link>

        <nav className={simples ? 'viagem-abas simples' : 'viagem-abas'} aria-label="Abas da viagem">
          {principais.map(({ para, rotulo, icone: Icone }) => (
            <NavLink key={rotulo} to={para} end={para === ''} aria-label={rotulo} title={rotulo}>
              <Icone size={19} aria-hidden="true" />
              <span className="aba-nome" aria-hidden="true">{rotulo}</span>
            </NavLink>
          ))}
          {!simples && (
            <>
              <NavLink to="tudo" className="viagem-abas-titulo so-computador" title="Ver tudo da viagem">
                Tudo da viagem
              </NavLink>
              {tudo.map(({ para, rotulo, icone: Icone }) => (
                <NavLink key={para} to={para} className="so-computador" aria-label={rotulo} title={rotulo}>
                  <Icone size={19} aria-hidden="true" />
                  <span className="aba-nome" aria-hidden="true">{rotulo}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="viagem-menu-rodape">
          {/* ❄ congelado pelo RUMO (03/11/2026) */}
          {!CONGELADO.notificacoes && <BotaoSino novas={novidades.novas} aoAbrir={() => setVendoNovidades(true)} menu />}
          <button type="button" className="viagem-menu-acao botao-sos" onClick={() => setBuscando(true)} aria-label="Buscar na viagem" title="Buscar">
            <Search size={19} aria-hidden="true" /> <span className="viagem-menu-texto">Buscar</span>
          </button>
          <button type="button" className="viagem-menu-acao botao-sos" onClick={() => setVendoEmergencia(true)} aria-label="Emergência" title="Emergência">
            <LifeBuoy size={19} aria-hidden="true" /> <span className="viagem-menu-texto">Emergência</span>
          </button>
          <Link to="/perfil" className="viagem-menu-perfil" aria-label="Seu perfil">
            <Avatar nome={eu?.nome ?? '?'} url={eu?.avatarUrl} tamanho={34} />
            <span className="viagem-menu-perfil-nome viagem-menu-texto">
              <strong>{eu?.nome ?? 'Você'}</strong>
              <span>Ver perfil</span>
            </span>
            <span className="viagem-comboio-mini viagem-menu-texto" aria-label={`${membros.length} pessoas no comboio`}>
              {membros.slice(0, 3).map((m) => (
                <Avatar key={m.id} nome={m.nome} url={m.avatarUrl} tamanho={26} />
              ))}
            </span>
          </Link>
        </div>
      </aside>

      <div className="viagem-conteudo">
        <FaixaConvidado />
        <ViagemContexto.Provider value={estado.dados}>
          {ABAS_GUARDADAS.filter((a) => visitadas.includes(`${viagem.id}:${a.para}`)).map(({ para, Tela }) => (
            <AbaAtivaContexto.Provider key={`${viagem.id}:${para}`} value={aba === para}>
              <div className="aba-guardada" hidden={aba !== para}>
                <Tela />
              </div>
            </AbaAtivaContexto.Provider>
          ))}
        </ViagemContexto.Provider>
        {!abaGuardada && <Outlet context={estado.dados} />}
      </div>

      {/* Spec 009: botão "+" pra lançar gasto rápido (celular) */}
      <button type="button" className="botao-flutuante" onClick={() => setLancamento({ modo: 'rapido' })} aria-label="Lançar gasto rápido">
        <Plus size={28} aria-hidden="true" />
      </button>

      {recado && (
        <p className="recado" role="status">
          {recado}
        </p>
      )}

      {buscando && (
        <Gaveta titulo="Buscar na viagem" aoFechar={() => setBuscando(false)}>
          <BuscaNaViagem viagemId={viagem.id} destinos={destinos} aoEscolher={() => setBuscando(false)} />
        </Gaveta>
      )}

      {vendoEmergencia && (
        <Gaveta titulo="Emergência" aoFechar={() => setVendoEmergencia(false)}>
          <Emergencia
            destinos={destinos}
            seguro={{ viagemId: viagem.id, meuId, euSouAdm, membros, inicio: viagem.data_inicio, fim: viagem.data_fim }}
          />
        </Gaveta>
      )}

      {vendoNovidades && (
        <Gaveta titulo="Novidades" aoFechar={() => setVendoNovidades(false)}>
          <AvisosNoCelular meuId={meuId} />
          <Novidades
            atividades={novidades.atividades}
            vistoEm={novidades.vistoEm}
            erro={novidades.erro}
            meuId={meuId}
            membros={membros}
            aoVer={novidades.marcarComoVistas}
            aoEscolher={() => setVendoNovidades(false)}
          />
        </Gaveta>
      )}

      {lancamento?.modo === 'rapido' && (
        <Gaveta titulo="Lançar gasto" aoFechar={fecharLancamento}>
          <LancamentoRapido
            viagemId={viagem.id}
            moedaViagem={viagem.moeda_principal}
            membros={membros}
            meuId={meuId}
            aoTerminar={(mensagem) => {
              setLancamento(null)
              setRecado(mensagem)
            }}
            aoDetalhar={(inicial) => setLancamento({ modo: 'completo', inicial })}
          />
        </Gaveta>
      )}
      {lancamento?.modo === 'completo' && (
        <Gaveta titulo="Lançar gasto" aoFechar={fecharLancamento}>
          <FormGasto
            viagemId={viagem.id}
            moedaViagem={viagem.moeda_principal}
            membros={membros}
            meuId={meuId}
            euSouAdm={euSouAdm}
            inicial={lancamento.inicial}
            aoTerminar={() => {
              setLancamento(null)
              setRecado('Gasto salvo.')
            }}
          />
        </Gaveta>
      )}
    </div>
  )
}
