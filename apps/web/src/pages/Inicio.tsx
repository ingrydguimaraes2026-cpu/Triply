import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { buscarUltimaViagem } from '../features/viagens/hooks'

// Endereço "/": abre a viagem que está acontecendo agora (ou a mais recente),
// ou o onboarding se ainda não tiver nenhuma.
// "/?lancar=1" (atalho do app instalado) abre a viagem já no lançamento rápido de gasto.
export default function Inicio() {
  const { search } = useLocation()
  const [destino, setDestino] = useState<string | null>(null)

  useEffect(() => {
    const lancar = new URLSearchParams(search).has('lancar') ? '?lancar=1' : ''
    buscarUltimaViagem().then((id) => setDestino(id ? `/viagem/${id}${lancar}` : '/nova-viagem'))
  }, [search])

  if (!destino) return null
  return <Navigate to={destino} replace />
}
