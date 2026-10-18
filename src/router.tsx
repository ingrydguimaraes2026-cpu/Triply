import { createBrowserRouter } from 'react-router'
import RotaProtegida from './features/auth/RotaProtegida'
import Convite from './pages/Convite'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import NovaSenha from './pages/NovaSenha'
import NovaViagem from './pages/NovaViagem'
import Perdido, { ErroNaTela } from './pages/Perdido'
import ViagemLayout from './pages/viagem/ViagemLayout'
import Overview from './pages/viagem/Overview'
import Transportes from './pages/viagem/Transportes'
import Financeiro from './pages/viagem/Financeiro'
import Fotos from './pages/viagem/Fotos'
import Comboio from './pages/viagem/Comboio'
import Configuracoes from './pages/viagem/Configuracoes'
import MinhasViagens from './pages/MinhasViagens'
import Perfil from './pages/Perfil'

// Cada endereço do site aponta pra uma tela em src/pages/
export const router = createBrowserRouter([
  {
    // Se qualquer tela quebrar, mostra a página de erro no estilo do app
    errorElement: <ErroNaTela />,
    children: [
      { path: '/login', element: <Login /> },
      {
        // Daqui pra baixo só entra quem fez login
        element: <RotaProtegida />,
        children: [
          { path: '/', element: <Inicio /> },
          { path: '/viagens', element: <MinhasViagens /> },
          { path: '/perfil', element: <Perfil /> },
          { path: '/nova-viagem', element: <NovaViagem /> },
          { path: '/nova-senha', element: <NovaSenha /> },
          { path: '/convite/:codigo', element: <Convite /> },
          {
            path: '/viagem/:id',
            element: <ViagemLayout />,
            children: [
              { index: true, element: <Overview /> },
              { path: 'transportes', element: <Transportes /> },
              { path: 'financeiro', element: <Financeiro /> },
              { path: 'fotos', element: <Fotos /> },
              { path: 'comboio', element: <Comboio /> },
              { path: 'configuracoes', element: <Configuracoes /> },
            ],
          },
        ],
      },
      // Qualquer endereço que não existe
      { path: '*', element: <Perdido /> },
    ],
  },
])
