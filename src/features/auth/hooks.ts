import { useEffect, useState } from 'react'
import type { AuthError, Session } from '@supabase/supabase-js'
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

const voltarPara = (caminho: string) => `${window.location.origin}${caminho}`

// Pra onde ir depois do login: o endereço guardado (ex.: convite) ou criar viagem
export function destinoDepoisDoLogin() {
  return sessionStorage.getItem('voltarPara') ?? '/nova-viagem'
}

export function entrarComGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: voltarPara(destinoDepoisDoLogin()) },
  })
}

export function entrarComSenha(email: string, senha: string) {
  return supabase.auth.signInWithPassword({ email, password: senha })
}

// O nome vai em "full_name" pra o banco criar o perfil com ele
export function criarConta(nome: string, email: string, senha: string) {
  return supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { full_name: nome }, emailRedirectTo: voltarPara(destinoDepoisDoLogin()) },
  })
}

export function enviarLinkNovaSenha(email: string) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: voltarPara('/nova-senha') })
}

export function trocarSenha(novaSenha: string) {
  return supabase.auth.updateUser({ password: novaSenha })
}

export function sair() {
  return supabase.auth.signOut()
}

// Transforma os erros do Supabase (em inglês) em mensagens pra pessoa
export function mensagemDeErro(erro: AuthError): string {
  switch (erro.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos. Se você criou a conta com o Google, use o botão do Google.'
    case 'email_not_confirmed':
      return 'Falta confirmar seu e-mail. Procure o link que enviamos (veja também o spam).'
    case 'user_already_exists':
    case 'email_exists':
      return 'Já existe uma conta com esse e-mail. Tente entrar, ou use o botão do Google.'
    case 'weak_password':
      return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
    case 'same_password':
      return 'A nova senha precisa ser diferente da anterior.'
    default:
      return 'Algo deu errado. Tente de novo em instantes.'
  }
}
