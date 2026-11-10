import { useState } from 'react'

// Spec 121 (etapa 1): o tempo até o embarque escolhido à mão fica só neste navegador (sem banco na 1ª versão).
const CHAVE = 'together:tempos-ate-embarque'

function lerTempos(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '{}')
  } catch {
    return {}
  }
}

export function useTemposAteOEmbarque() {
  const [tempos, setTempos] = useState<Record<string, number>>(lerTempos)
  function escolher(trajetoId: string, minutos: number) {
    const novo = { ...tempos, [trajetoId]: minutos }
    setTempos(novo)
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novo))
    } catch {
      // Sem espaço ou navegador bloqueando: vale só enquanto a página estiver aberta
    }
  }
  return { tempos, escolher }
}
