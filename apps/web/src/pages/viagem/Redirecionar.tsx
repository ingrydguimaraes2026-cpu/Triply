import { Navigate, useLocation } from 'react-router'

// Endereço antigo da viagem que mudou de nome (link salvo, aviso antigo).
// Ex.: /viagem/<id>/hospedagem → /viagem/<id>/reservas?parte=hospedagem. Mantém o resto do endereço (?… e #…).
export default function Redirecionar({ para, parte }: { para: string; parte?: string }) {
  const { search, hash } = useLocation()
  const busca = new URLSearchParams(search)
  if (parte) busca.set('parte', parte)
  const resto = busca.toString()
  return <Navigate to={`../${para}${resto ? `?${resto}` : ''}${hash}`} relative="path" replace />
}
