import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

// Diz se tem alguém logado. "carregando" fica true até o Supabase responder.
export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setCarregando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return { sessao, carregando }
}

export function entrarComGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/nova-viagem` },
  })
}

export function sair() {
  return supabase.auth.signOut()
}
