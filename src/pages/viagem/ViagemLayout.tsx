import { Link, NavLink, Outlet, useParams } from 'react-router'
import { Camera, Compass, LogOut, Plus, TrainFront, Users, Wallet } from 'lucide-react'
import { sair } from '../../features/auth/hooks'
import { useViagem } from '../../features/viagens/hooks'
import { formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import Perdido from '../Perdido'
import '../../components/ui/ui.css'
import './viagem.css'

// Abas da viagem. Pra criar uma aba nova: adicione aqui e no src/router.tsx
const ABAS = [
  { para: '', rotulo: 'Overview', icone: Compass },
  { para: 'transportes', rotulo: 'Transportes', icone: TrainFront },
  { para: 'financeiro', rotulo: 'Financeiro', icone: Wallet },
  { para: 'fotos', rotulo: 'Fotos', icone: Camera },
  { para: 'comboio', rotulo: 'Comboio', icone: Users },
]

// Moldura de todas as telas de uma viagem: menu + a aba escolhida.
// Carrega os dados da viagem uma vez e passa pras abas (veja useViagemAtual).
export default function ViagemLayout() {
  const { id } = useParams()
  const estado = useViagem(id)

  if (estado.status === 'carregando') return <div className="viagem-carregando" aria-busy="true" />
  if (estado.status === 'nao-encontrada') return <Perdido />

  const { viagem, membros } = estado.dados

  return (
    <div className="viagem">
      <aside className="viagem-menu">
        <Link to="/" className="viagem-logo">
          together
        </Link>

        <div className="viagem-atual">
          <span className="viagem-atual-rotulo">Viagem</span>
          <strong>{viagem.nome}</strong>
          <span>{formatarPeriodo(viagem.data_inicio, viagem.data_fim)}</span>
        </div>

        <nav className="viagem-abas" aria-label="Abas da viagem">
          {ABAS.map(({ para, rotulo, icone: Icone }) => (
            <NavLink key={rotulo} to={para} end={para === ''}>
              <Icone size={20} aria-hidden="true" />
              <span>{rotulo}</span>
            </NavLink>
          ))}
        </nav>

        <div className="viagem-menu-rodape">
          <div className="viagem-comboio-mini" aria-label={`${membros.length} pessoas no comboio`}>
            {membros.slice(0, 4).map((m) => (
              <Avatar key={m.id} nome={m.nome} url={m.avatarUrl} tamanho={30} />
            ))}
          </div>
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
    </div>
  )
}
