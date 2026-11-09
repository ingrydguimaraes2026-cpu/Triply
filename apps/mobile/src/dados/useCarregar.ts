import { useCallback, useEffect, useState } from 'react'

// Carrega algo do banco e devolve { status, dados, recarregar, atualizando }. Ignora a resposta
// se a tela já mudou de assunto (evita piscar dado velho).
// `recarregar` busca de novo sem apagar o que está na tela; `atualizando` fica true enquanto isso
// (é o que a bolinha do "puxar pra atualizar" usa).
export type Carga<T> = { recarregar: () => void; atualizando: boolean } & (
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; dados: T }
)

export function useCarregar<T>(buscar: (() => Promise<T>) | null, deps: unknown[]): Carga<T> {
  const [estado, setEstado] = useState<{ status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; dados: T }>({ status: 'carregando' })
  const [vez, setVez] = useState(0)
  const [vezPronta, setVezPronta] = useState(0)
  const recarregar = useCallback(() => setVez((v) => v + 1), [])

  useEffect(() => {
    if (!buscar) return
    let vivo = true
    buscar()
      .then((dados) => vivo && setEstado({ status: 'pronto', dados }))
      .catch(() => vivo && setEstado({ status: 'erro' }))
      .finally(() => vivo && setVezPronta(vez))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, vez])

  return { ...estado, recarregar, atualizando: vezPronta < vez }
}
