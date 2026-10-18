import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useParams, useSearchParams } from 'react-router'
import { Camera, ChevronRight, Compass, FileCheck, LogOut, Plus, Settings, TrainFront, Users, Wallet } from 'lucide-react'
import { sair } from '../../features/auth/hooks'
import { useViagem } from '../../features/viagens/hooks'
import { avisarQueGastosMudaram, type DadosDoGasto } from '../../features/financeiro/api'
import { enviarFila } from '../../features/financeiro/fila'
import LancamentoRapido from '../../features/financeiro/LancamentoRapido'
import FormGasto from '../../features/financeiro/FormGasto'
import { formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import Gaveta from '../../components/ui/Gaveta'
import Perdido from '../Perdido'
import '../../components/ui/ui.css'
import './viagem.css'

// Abas da viagem. Pra criar uma aba nova: adicione aqui e no src/router.tsx
const ABAS: { para: string; rotulo: string; curto?: string; icone: typeof Compass }[] = [
  { para: '', rotulo: 'Overview', icone: Compass },
  { para: 'transportes', rotulo: 'Transportes', curto: 'Transp.', icone: TrainFront },
  { para: 'financeiro', rotulo: 'Financeiro', icone: Wallet },
  { para: 'documentos', rotulo: 'Documentos', curto: 'Docs', icone: FileCheck },
  { para: 'fotos', rotulo: 'Fotos', icone: Camera },
  { para: 'comboio', rotulo: 'Comboio', icone: Users },
]

type Lancamento = { modo: 'rapido' } | { modo: 'completo'; inicial: Partial<DadosDoGasto> } | null

// Moldura de todas as telas de uma viagem: menu + a aba escolhida.
// Carrega os dados da viagem uma vez e passa pras abas (veja useViagemAtual).
export default function ViagemLayout() {
  const { id } = useParams()
  const estado = useViagem(id)
  const [busca, setBusca] = useSearchParams()
  const [lancamento, setLancamento] = useState<Lancamento>(() => (busca.get('lancar') ? { modo: 'rapido' } : null))
  const [recado, setRecado] = useState<string | null>(null)

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

  const { viagem, membros, meuId, euSouAdm } = estado.dados
  const eu = membros.find((m) => m.id === meuId)

  return (
    <div className="viagem">
      {/* Celular: barra de cima com a viagem (leva pra Minhas viagens) e o perfil */}
      <header className="viagem-topo-celular">
        <Link to="/viagens" className="viagem-topo-nome">
          <strong>{viagem.nome}</strong>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
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
        <Link to="/viagens" className="viagem-logo">
          together
        </Link>

        <Link to="/viagens" className="viagem-atual" aria-label={`${viagem.nome}: ver todas as viagens`}>
          <span className="viagem-atual-rotulo">
            Viagem <ChevronRight size={12} aria-hidden="true" />
          </span>
          <strong>{viagem.nome}</strong>
          <span>{formatarPeriodo(viagem.data_inicio, viagem.data_fim)}</span>
        </Link>

        <nav className="viagem-abas" aria-label="Abas da viagem">
          {ABAS.map(({ para, rotulo, curto, icone: Icone }) => (
            <NavLink key={rotulo} to={para} end={para === ''} aria-label={curto ? rotulo : undefined}>
              <Icone size={20} aria-hidden="true" />
              {curto ? (
                <>
                  <span className="rotulo-longo">{rotulo}</span>
                  <span className="rotulo-curto">{curto}</span>
                </>
              ) : (
                <span>{rotulo}</span>
              )}
            </NavLink>
          ))}
          {euSouAdm && (
            <NavLink to="configuracoes" className="so-computador">
              <Settings size={20} aria-hidden="true" />
              <span>Configurações</span>
            </NavLink>
          )}
        </nav>

        <div className="viagem-menu-rodape">
          <div className="viagem-comboio-mini" aria-label={`${membros.length} pessoas no comboio`}>
            {membros.slice(0, 4).map((m) => (
              <Avatar key={m.id} nome={m.nome} url={m.avatarUrl} tamanho={30} />
            ))}
          </div>
          <Link to="/perfil" className="viagem-menu-acao">
            <Avatar nome={eu?.nome ?? '?'} url={eu?.avatarUrl} tamanho={22} /> Seu perfil
          </Link>
          <Link to="/nova-viagem" className="viagem-menu-acao">
            <Plus size={18} aria-hidden="true" /> Nova viagem
          </Link>
          <button type="button" className="viagem-menu-acao" onClick={() => sair()}>
            <LogOut size={18} aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>

      <div className="viagem-conteudo">
        <Outlet context={estado.dados} />
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
