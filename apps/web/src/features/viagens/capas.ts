import { useEffect, useState } from 'react'
import { capaDaViagem, fotosDasCapas } from '@together/core'
import { supabase } from '../../lib/supabase'

// Capa de cada viagem: a foto do destino (catálogo do Explorar) ou, sem ela, a capa genérica.
// Igual ao app. Enquanto busca, devolve undefined (fica só a cor de fundo, sem trocar de foto na frente da pessoa).
const guardadas: Record<string, string> = {}

export function useCapas(viagemIds: string[]) {
  const chave = viagemIds.join(',')
  const [, setVersao] = useState(0)
  useEffect(() => {
    const faltam = chave ? chave.split(',').filter((id) => !(id in guardadas)) : []
    if (faltam.length === 0) return
    let vivo = true
    fotosDasCapas(supabase, faltam)
      .then((fotos) => {
        for (const id of faltam) guardadas[id] = fotos[id] ?? ''
        if (vivo) setVersao((v) => v + 1)
      })
      .catch((e) => console.warn('Capas sem foto do destino:', e))
    return () => {
      vivo = false
    }
  }, [chave])
  return (viagemId: string, largura = 900): string | undefined =>
    viagemId in guardadas ? guardadas[viagemId] || capaDaViagem(viagemId, largura) : undefined
}
