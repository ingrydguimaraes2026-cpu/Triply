import { useCallback, useEffect, useState } from 'react'
import { contarComentariosDaViagem } from '@together/core'
import { supabase } from '../../lib/supabase'

// Quantos comentários cada item da viagem tem (spec 027). Chave = id do gasto, lugar ou hospedagem.
export function useContagemDeComentarios(viagemId: string) {
  const [contagem, setContagem] = useState<Record<string, number>>({})

  const recarregar = useCallback(async () => {
    try {
      setContagem(await contarComentariosDaViagem(supabase, viagemId))
    } catch (erro) {
      // Sem o número, o botão só aparece sem contagem: não vale travar a tela
      console.error('Erro ao contar comentários:', erro)
    }
  }, [viagemId])

  useEffect(() => {
    let ativo = true
    contarComentariosDaViagem(supabase, viagemId)
      .then((c) => {
        if (ativo) setContagem(c)
      })
      .catch((erro) => console.error('Erro ao contar comentários:', erro))
    return () => {
      ativo = false
    }
  }, [viagemId])

  return { contagem, recarregar }
}
