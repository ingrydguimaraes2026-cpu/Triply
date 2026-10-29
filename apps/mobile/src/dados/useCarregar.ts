import { useCallback, useEffect, useState } from 'react'

// Carrega algo do banco e devolve { status, dados, recarregar }. Ignora a resposta
// se a tela já mudou de assunto (evita piscar dado velho).
export type Carga<T> =
  | { status: 'carregando'; recarregar: () => void }
  | { status: 'erro'; recarregar: () => void }
  | { status: 'pronto'; dados: T; recarregar: () => void }

export function useCarregar<T>(buscar: (() => Promise<T>) | null, deps: unknown[]): Carga<T> {
  const [estado, setEstado] = useState<{ status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; dados: T }>({ status: 'carregando' })
  const [vez, setVez] = useState(0)
  const recarregar = useCallback(() => setVez((v) => v + 1), [])

  useEffect(() => {
    if (!buscar) return
    let vivo = true
    buscar()
      .then((dados) => vivo && setEstado({ status: 'pronto', dados }))
      .catch(() => vivo && setEstado({ status: 'erro' }))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, vez])

  return { ...estado, recarregar }
}
