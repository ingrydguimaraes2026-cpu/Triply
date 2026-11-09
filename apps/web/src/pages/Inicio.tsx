import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { buscarUltimaViagem } from '../features/viagens/hooks'
import MinhasViagens from './MinhasViagens'

// Endereço "/": o Início, igual ao app (saudação, mapa da galera, próxima viagem).
// Num dia de viagem abre direto no Hoje, uma vez só (spec 120a, como o app).
// "/?lancar=1" (atalho do app instalado) abre a viagem já no lançamento rápido de gasto.
export default function Inicio() {
  const { search } = useLocation()
  const lancar = new URLSearchParams(search).has('lancar')
  if (lancar) return <LancarGasto />
  return <MinhasViagens abrirAViagemDeHoje />
}

function LancarGasto() {
  const [destino, setDestino] = useState<string | null>(null)
  useEffect(() => {
    buscarUltimaViagem().then((id) => setDestino(id ? `/viagem/${id}?lancar=1` : '/nova-viagem'))
  }, [])
  if (!destino) return null
  return <Navigate to={destino} replace />
}
