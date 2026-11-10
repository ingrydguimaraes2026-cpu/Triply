import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { supabase } from './supabase'

// Memória das abas da viagem (igual ao useCarregar do app): guarda o último resultado de cada
// busca (por chave, ex.: 'contas:<viagem>'). Voltar pra uma aba já vista mostra na hora o que ela
// tinha, sem "Carregando", e a busca nova atualiza por trás. Some ao recarregar a página.
const guardado = new Map<string, unknown>()
const LIMITE = 60 // respostas guardadas; a mais antiga sai primeiro

export function lembrar<T>(chave: string): T | undefined {
  return guardado.get(chave) as T | undefined
}

export function guardar(chave: string, valor: unknown) {
  guardado.delete(chave)
  guardado.set(chave, valor)
  if (guardado.size > LIMITE) guardado.delete(guardado.keys().next().value as string)
}

// Trocou de conta (saiu, ou entrou outra): ninguém pode ver o que era da conta anterior
let ultimoUsuario: string | null | undefined
supabase.auth.onAuthStateChange((_evento, sessao) => {
  const usuario = sessao?.user.id ?? null
  if (ultimoUsuario !== undefined && usuario !== ultimoUsuario) guardado.clear()
  ultimoUsuario = usuario
})

type ComStatus = { status: string }

// useState com memória, pros hooks no formato { status: 'carregando' | 'erro' | 'pronto' }.
// - começa no que estava guardado (ou em "carregando");
// - cada estado "pronto" fica guardado;
// - um erro numa busca nova não apaga o que já estava na tela.
export function useEstadoGuardado<E extends ComStatus>(chave: string, inicial: E): [E, Dispatch<SetStateAction<E>>] {
  const [estado, setEstadoReal] = useState<E>(() => lembrar<E>(chave) ?? inicial)
  // Mudou de assunto (outra viagem): mostra o que já tinha dela, se tiver
  const [chaveVista, setChaveVista] = useState(chave)
  if (chaveVista !== chave) {
    setChaveVista(chave)
    setEstadoReal(lembrar<E>(chave) ?? inicial)
  }
  useEffect(() => {
    if (estado.status === 'pronto') guardar(chave, estado)
  }, [chave, estado])
  const setEstado = useCallback<Dispatch<SetStateAction<E>>>((novo) => {
    setEstadoReal((antes) => {
      const proximo = typeof novo === 'function' ? (novo as (a: E) => E)(antes) : novo
      return proximo.status === 'erro' && antes.status === 'pronto' ? antes : proximo
    })
  }, [])
  return [estado, setEstado]
}
