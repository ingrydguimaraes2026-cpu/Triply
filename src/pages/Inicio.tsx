import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { buscarUltimaViagem } from '../features/viagens/hooks'

// Endereço "/": abre a viagem mais recente, ou o onboarding se ainda não tiver nenhuma.
export default function Inicio() {
  const [destino, setDestino] = useState<string | null>(null)

  useEffect(() => {
    buscarUltimaViagem().then((id) => setDestino(id ? `/viagem/${id}` : '/nova-viagem'))
  }, [])

  if (!destino) return null
  return <Navigate to={destino} replace />
}
