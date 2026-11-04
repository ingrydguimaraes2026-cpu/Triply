import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Carrega algo do banco e devolve { status, dados, recarregar }. Ignora a resposta
// se a tela já mudou de assunto (evita piscar dado velho).
//
// Guarda a última resposta na memória (por tela + parâmetros): voltar pra uma tela já vista
// mostra na hora o que ela tinha e atualiza por trás, sem "Carregando…" toda vez.
export type Carga<T> =
  | { status: 'carregando'; recarregar: () => void }
  | { status: 'erro'; recarregar: () => void }
  | { status: 'pronto'; dados: T; recarregar: () => void }

const guardado = new Map<string, unknown>()
const LIMITE = 60 // respostas guardadas; a mais antiga sai primeiro

function chaveDe(buscar: (() => unknown) | null, deps: unknown[]): string | null {
  if (!buscar) return null
  try {
    return `${buscar.toString()}|${JSON.stringify(deps)}`
  } catch {
    return null // parâmetro que não vira texto: não guarda
  }
}

function guardar(chave: string, dados: unknown) {
  guardado.delete(chave)
  guardado.set(chave, dados)
  if (guardado.size > LIMITE) guardado.delete(guardado.keys().next().value as string)
}

// Trocou de conta (saiu, ou entrou outra): ninguém pode ver o que era da conta anterior
let ultimoUsuario: string | null | undefined
supabase.auth.onAuthStateChange((_evento, sessao) => {
  const usuario = sessao?.user.id ?? null
  if (ultimoUsuario !== undefined && usuario !== ultimoUsuario) guardado.clear()
  ultimoUsuario = usuario
})

export function useCarregar<T>(buscar: (() => Promise<T>) | null, deps: unknown[]): Carga<T> {
  const chave = chaveDe(buscar, deps)
  const [estado, setEstado] = useState<{ status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; dados: T }>(() =>
    chave && guardado.has(chave) ? { status: 'pronto', dados: guardado.get(chave) as T } : { status: 'carregando' },
  )
  const [vez, setVez] = useState(0)
  const recarregar = useCallback(() => setVez((v) => v + 1), [])

  useEffect(() => {
    if (!buscar) return
    let vivo = true
    // Parâmetro mudou: mostra o que já tinha desse novo assunto (ou "carregando")
    if (chave && guardado.has(chave)) setEstado({ status: 'pronto', dados: guardado.get(chave) as T })
    buscar()
      .then((dados) => {
        if (chave) guardar(chave, dados)
        if (vivo) setEstado({ status: 'pronto', dados })
      })
      .catch(() => {
        // Com algo guardado, um erro de rede não apaga a tela
        if (vivo && !(chave && guardado.has(chave))) setEstado({ status: 'erro' })
      })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, vez])

  return { ...estado, recarregar }
}
