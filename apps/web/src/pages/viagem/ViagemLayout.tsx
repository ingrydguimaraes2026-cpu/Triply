import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams, useSearchParams } from 'react-router'
import { ArrowLeftRight, BedDouble, CalendarDays, Camera, ChevronRight, Compass, LifeBuoy, MapPinned, MoreHorizontal, PanelLeft, Plus, Printer, Route, Search, Settings, Sparkles, Sun, TrainFront, Users, Wallet } from '../../components/ui/icones'
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
import { abasVisiveis, CONGELADO, faseDaViagem, separarAbas } from '@together/core'
import { hojeTexto } from '../../features/destinos/datas'
import FormGasto from '../../features/financeiro/FormGasto'
import { formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import Norti from '../../components/ui/Norti'
import Gaveta from '../../components/ui/Gaveta'
import Perdido from '../Perdido'
import Overview from './Overview'
import Hospedagem from './Hospedagem'
import Transportes from './Transportes'
import '../../components/ui/ui.css'
import './viagem.css'
import { useCapas } from '../../features/viagens/capas'

// Abas da viagem. Pra criar uma aba nova: adicione aqui e no src/router.tsx
// `curto`: nome menor pro menu de baixo do celular (8 abas em 360px)
const ABAS = [
  { para: '', rotulo: 'Overview', curto: 'Início', icone: Compass },
  // Spec 115: o Explorar (escolher lugares e montar os dias) vira o "Roteiro" da viagem
  { para: 'explorar', rotulo: 'Roteiro', icone: Route },
  { para: 'hoje', rotulo: 'Hoje', icone: Sun },
  { para: 'agenda', rotulo: 'Agenda', icone: CalendarDays },
  { para: 'hospedagem', rotulo: 'Hospedagem', curto: 'Estadia', icone: BedDouble },
  { para: 'lugares', rotulo: 'Lugares', icone: MapPinned },
  { para: 'transportes', rotulo: 'Transportes', curto: 'Transp.', icone: TrainFront },
  { para: 'financeiro', rotulo: 'Financeiro', curto: 'Finanças', icone: Wallet },
  { para: 'fotos', rotulo: 'Fotos', icone: Camera },
  { para: 'comboio', rotulo: 'Comboio', icone: Users },
]

// "Depois da viagem" (spec 113): só no menu do computador. No celular ficam no Overview e no topo.
const ABAS_DEPOIS = [
  { para: 'retrospectiva', rotulo: 'Retrospectiva', icone: Sparkles },
  { para: 'imprimir', rotulo: 'Imprimir e PDF', icone: Printer },
  { para: 'configuracoes', rotulo: 'Configurações', icone: Settings },
]

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
  { para: 'hospedagem', Tela: Hospedagem },
  { para: 'transportes', Tela: Transportes },
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
  const [vendoMais, setVendoMais] = useState(false) // spec 115: "Mais" do menu no celular
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
  // Spec 115: o menu mostra o que serve na fase da viagem; o resto fica em "Mais".
  // Modo simples (spec 090) continua com as 5 abas dele, sem "Mais".
  const { principais, mais } = simples
    ? { principais: abasVisiveis(ABAS, true), mais: [] }
    : separarAbas(ABAS, faseDaViagem(hojeTexto(), viagem.data_inicio, viagem.data_fim))
  const abaEstaNoMais = mais.some((a) => a.para === aba)

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
        {euSouAdm && (
          <Link to="configuracoes" className="viagem-topo-icone" aria-label="Configurações da viagem">
            <Settings size={20} aria-hidden="true" />
          </Link>
        )}
        <Link to="/perfil" aria-label="Seu perfil">
          <Avatar nome={eu?.nome ?? '?'} url={eu?.avatarUrl} tamanho={32} />
        </Link>
      </header>

      <aside className="viagem-menu">
        <div className="viagem-menu-cabeca">
          <Link to="/viagens" className="viagem-logo" aria-label="Tripwave: ver todas as viagens">
            <span className="viagem-logo-norti">
              <Norti tamanho={34} sombra={false} />
            </span>
            <span className="viagem-menu-texto">Tripwave</span>
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
          {principais.map(({ para, rotulo, curto, icone: Icone }) => (
            <NavLink key={rotulo} to={para} end={para === ''} aria-label={rotulo} title={rotulo}>
              <Icone size={19} aria-hidden="true" />
              <span className="aba-nome" aria-hidden="true">{rotulo}</span>
              {curto && <span className="aba-curto" aria-hidden="true">{curto}</span>}
            </NavLink>
          ))}
          {mais.length > 0 && (
            <>
              {/* Celular: um botão "Mais" abre a lista. Computador: a lista fica embaixo, com título. */}
              <button
                type="button"
                className={abaEstaNoMais ? 'aba-mais so-celular active' : 'aba-mais so-celular'}
                onClick={() => setVendoMais(true)}
                aria-label="Mais abas"
              >
                <MoreHorizontal size={19} aria-hidden="true" />
                <span className="aba-nome" aria-hidden="true">
                  Mais
                </span>
              </button>
              <span className="viagem-abas-titulo so-computador" aria-hidden="true">
                Mais
              </span>
              {mais.map(({ para, rotulo, icone: Icone }) => (
                <NavLink key={para} to={para} className="so-computador" aria-label={rotulo} title={rotulo}>
                  <Icone size={19} aria-hidden="true" />
                  <span className="aba-nome" aria-hidden="true">{rotulo}</span>
                </NavLink>
              ))}
            </>
          )}
          {/* Modo simples (spec 090) esconde o "Depois da viagem", como no design */}
          {!simples && (
            <>
              <span className="viagem-abas-titulo so-computador" aria-hidden="true">
                Depois da viagem
              </span>
              {ABAS_DEPOIS.map(({ para, rotulo, icone: Icone }) => (
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

      {vendoMais && (
        <Gaveta titulo="Mais da viagem" aoFechar={() => setVendoMais(false)}>
          <nav className="mais-lista" aria-label="Mais abas da viagem">
            {[...mais, ...ABAS_DEPOIS].map(({ para, rotulo, icone: Icone }) => (
              <Link key={para} to={para} onClick={() => setVendoMais(false)}>
                <Icone size={20} aria-hidden="true" />
                {rotulo}
              </Link>
            ))}
          </nav>
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
