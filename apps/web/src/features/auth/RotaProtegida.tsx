import { Navigate, Outlet, useLocation } from 'react-router'
import { useSessao } from './hooks'

// Telas dentro desta rota só abrem pra quem fez login.
// Sem login, guarda o endereço (ex.: link de convite) pra voltar nele depois.
export default function RotaProtegida() {
  const { sessao, carregando } = useSessao()
  const local = useLocation()

  if (carregando) return null
  if (!sessao) {
    sessionStorage.setItem('voltarPara', local.pathname)
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
