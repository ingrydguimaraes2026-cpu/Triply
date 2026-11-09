import { useCallback, useEffect, useState } from 'react'
import { buscarArquivos, type Arquivo } from './api'

// Arquivos do cofre da viagem (cartão "Cofre" da Overview e bilhetes da aba Transportes)
export function useCofre(viagemId: string) {
  const [arquivos, setArquivos] = useState<Arquivo[] | null>(null)
  const [erro, setErro] = useState(false)

  const recarregar = useCallback(async () => {
    try {
      setArquivos(await buscarArquivos(viagemId))
      setErro(false)
    } catch (e) {
      console.error('Erro ao carregar o cofre:', e)
      setErro(true)
    }
  }, [viagemId])

  useEffect(() => {
    let ativo = true
    buscarArquivos(viagemId)
      .then((lista) => {
        if (ativo) setArquivos(lista)
      })
      .catch((e) => {
        console.error('Erro ao carregar o cofre:', e)
        if (ativo) setErro(true)
      })
    return () => {
      ativo = false
    }
  }, [viagemId])

  return { arquivos, erro, recarregar }
}
