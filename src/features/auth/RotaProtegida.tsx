import { Navigate, Outlet } from 'react-router'
import { useSessao } from './hooks'

// Telas dentro desta rota só abrem pra quem fez login.
export default function RotaProtegida() {
  const { sessao, carregando } = useSessao()

  if (carregando) return null
  if (!sessao) return <Navigate to="/login" replace />
  return <Outlet />
}
