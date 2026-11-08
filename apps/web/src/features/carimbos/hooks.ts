import { useEffect, useState } from 'react'
import { buscarCarimbos, type Carimbo } from '@together/core'
import { supabase } from '../../lib/supabase'

// Carimbos da viagem só pra mostrar (retrospectiva e livro, spec 118c). Vazio enquanto carrega ou se falhar.
export function useCarimbos(viagemId: string): Carimbo[] {
  const [carimbos, setCarimbos] = useState<Carimbo[]>([])
  useEffect(() => {
    let ativo = true
    buscarCarimbos(supabase, viagemId)
      .then((c) => ativo && setCarimbos(c))
      .catch((e) => console.error('Erro ao buscar os carimbos:', e))
    return () => {
      ativo = false
    }
  }, [viagemId])
  return carimbos
}
