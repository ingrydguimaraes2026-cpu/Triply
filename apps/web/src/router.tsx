import { createBrowserRouter } from 'react-router'
import RotaProtegida from './features/auth/RotaProtegida'
import Convite, { ConviteAntigo } from './pages/Convite'
import Inicio from './pages/Inicio'
import ListaDeEspera from './pages/ListaDeEspera'
import Login from './pages/Login'
import NovaSenha from './pages/NovaSenha'
import NovaViagem from './pages/NovaViagem'
import Perdido, { ErroNaTela } from './pages/Perdido'
import ViagemLayout from './pages/viagem/ViagemLayout'
import Overview from './pages/viagem/Overview'
import Lugares from './pages/viagem/Lugares'
import Explorar from './pages/viagem/Explorar'
import Agenda from './pages/viagem/Agenda'
import Reservas from './pages/viagem/Reservas'
import Redirecionar from './pages/viagem/Redirecionar'
import Cidades from './pages/viagem/Cidades'
import TudoDaViagem from './pages/viagem/TudoDaViagem'
import Financeiro from './pages/viagem/Financeiro'
import Fotos from './pages/viagem/Fotos'
import Comboio from './pages/viagem/Comboio'
import Configuracoes from './pages/viagem/Configuracoes'
import Hoje from './pages/viagem/Hoje'
import Imprimir from './pages/viagem/Imprimir'
import Retrospectiva from './pages/viagem/Retrospectiva'
import Livro from './pages/viagem/Livro'
import MinhasViagens from './pages/MinhasViagens'
import Perfil from './pages/Perfil'
import CarteiraConectado from './pages/CarteiraConectado'

// Cada endereço do site aponta pra uma tela em src/pages/
export const router = createBrowserRouter([
  {
    // Se qualquer tela quebrar, mostra a página de erro no estilo do app
    errorElement: <ErroNaTela />,
    children: [
      { path: '/login', element: <Login /> },
      // Lista de espera: página pública, sem login (docs/marketing/ESTRATEGIA-REDES.md)
      { path: '/espera', element: <ListaDeEspera /> },
      // Web leve do convite (spec 018, FILA 0.8): abre até sem login, o convidado topa, vota e vê o plano
      { path: '/v/:codigo', element: <Convite /> },
      // Link antigo do convite: cai na mesma página
      { path: '/convite/:codigo', element: <ConviteAntigo /> },
      {
        // Daqui pra baixo só entra quem fez login
        element: <RotaProtegida />,
        children: [
          { path: '/', element: <Inicio /> },
          { path: '/viagens', element: <MinhasViagens /> },
          { path: '/perfil', element: <Perfil /> },
          { path: '/nova-viagem', element: <NovaViagem /> },
          { path: '/nova-senha', element: <NovaSenha /> },
          { path: '/carteira/conectado', element: <CarteiraConectado /> },
          {
            path: '/viagem/:id',
            element: <ViagemLayout />,
            children: [
              { index: true, element: <Overview /> },
              { path: 'hoje', element: <Hoje /> },
              // Reservas = Passagens + Hospedagem (como no app). Os endereços antigos continuam abrindo.
              { path: 'reservas', element: <Reservas /> },
              { path: 'hospedagem', element: <Redirecionar para="reservas" parte="hospedagem" /> },
              { path: 'transportes', element: <Redirecionar para="reservas" parte="transporte" /> },
              { path: 'cidades', element: <Cidades /> }, // ordem e datas das cidades (saiu da tela da viagem)
              { path: 'tudo', element: <TudoDaViagem /> }, // "Tudo da viagem", como no app
              { path: 'agenda', element: <Agenda /> },
              { path: 'lugares', element: <Lugares /> },
              { path: 'explorar', element: <Explorar /> }, // spec 114
              { path: 'contas', element: <Financeiro /> },
              { path: 'financeiro', element: <Redirecionar para="contas" /> },
              { path: 'fotos', element: <Fotos /> },
              { path: 'comboio', element: <Comboio /> },
              { path: 'configuracoes', element: <Configuracoes /> },
              { path: 'imprimir', element: <Imprimir /> }, // spec 088
              { path: 'retrospectiva', element: <Retrospectiva /> }, // spec 105
              { path: 'livro', element: <Livro /> }, // spec 106
            ],
          },
        ],
      },
      // Qualquer endereço que não existe
      { path: '*', element: <Perdido /> },
    ],
  },
])

