import { Platform } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from './supabase'

// Fecha a janelinha do Google quando o app volta a abrir (no web não faz nada)
WebBrowser.maybeCompleteAuthSession()

// Endereço pra onde o Google devolve a pessoa. Precisa estar na lista "Redirect URLs"
// do Supabase (Authentication → URL Configuration):
//   navegador: http://localhost:8089 (e o endereço do site, quando publicar)
//   celular:   together://** (no Expo Go aparece como exp://…, ver o aviso no README)
export function enderecoDeVolta() {
  return Platform.OS === 'web' ? window.location.origin : Linking.createURL('/login')
}

// Entra com Google. Devolve 'cancelado' se a pessoa fechar a janela.
export async function entrarComGoogle(): Promise<'ok' | 'cancelado'> {
  const volta = enderecoDeVolta()

  // Navegador: igual à web — vai pro Google e volta com a sessão na URL
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: volta } })
    if (error) throw error
    return 'ok'
  }

  // Celular: abre o Google numa janela do sistema e pega o código na volta
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: volta, skipBrowserRedirect: true },
  })
  if (error || !data.url) throw error ?? new Error('Sem link do Google')
  const resultado = await WebBrowser.openAuthSessionAsync(data.url, volta)
  if (resultado.type !== 'success') return 'cancelado'
  const codigo = new URL(resultado.url).searchParams.get('code')
  if (!codigo) throw new Error('O Google não devolveu o código')
  const { error: erroTroca } = await supabase.auth.exchangeCodeForSession(codigo)
  if (erroTroca) throw erroTroca
  return 'ok'
}

// Spec 018: o convidado liga o Google à conta que já tem (o id não muda, nada se perde).
// Precisa de "Manual linking" ligado no Supabase.
export async function ligarGoogle(): Promise<'ok' | 'cancelado'> {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: window.location.href } })
    if (error) throw error
    return 'ok'
  }

  const volta = enderecoDeVolta()
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: volta, skipBrowserRedirect: true },
  })
  if (error || !data.url) throw error ?? new Error('Sem link do Google')
  const resultado = await WebBrowser.openAuthSessionAsync(data.url, volta)
  if (resultado.type !== 'success') return 'cancelado'
  const codigo = new URL(resultado.url).searchParams.get('code')
  if (!codigo) throw new Error('O Google não devolveu o código')
  const { error: erroTroca } = await supabase.auth.exchangeCodeForSession(codigo)
  if (erroTroca) throw erroTroca
  return 'ok'
}
