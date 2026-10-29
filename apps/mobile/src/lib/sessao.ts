import { useEffect, useState } from 'react'
import type { Session } from '@together/core'
import { supabase } from './supabase'

// Diz se tem alguém logado. "carregando" fica true até o Supabase responder.
// (Mesma ideia do useSessao da web, mas sem window — aqui a sessão vem do cofre do aparelho.)
export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setCarregando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, nova) => setSessao(nova))
    return () => data.subscription.unsubscribe()
  }, [])

  // Spec 018: convidado = entrou pelo link só com o nome (login anônimo)
  return { sessao, carregando, ehConvidado: !!sessao?.user.is_anonymous }
}
