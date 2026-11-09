import 'react-native-url-polyfill/auto' // o React Native não tem URL nativo; o Supabase precisa
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { criarClienteSupabase, type GuardaSessao } from '@together/core'

// Onde guardar a sessão. No celular, cofre seguro do aparelho. No navegador (expo web),
// o SecureStore não existe, então deixamos o Supabase usar o padrão (localStorage).
// (Obs.: SecureStore tem limite ~2KB por chave; se a sessão crescer, trocar por um storage maior.)
const cofre: GuardaSessao = {
  getItem: (chave) => SecureStore.getItemAsync(chave),
  setItem: (chave, valor) => SecureStore.setItemAsync(chave, valor),
  removeItem: (chave) => SecureStore.deleteItemAsync(chave),
}

// Valores vêm das variáveis EXPO_PUBLIC_* (equivalente mobile do VITE_* da web).
export const supabase = criarClienteSupabase({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  chave: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  guarda: Platform.OS === 'web' ? undefined : cofre,
  // No navegador, a volta do Google traz a sessão na URL (igual a web). No celular, o login
  // volta pelo link "together://" com um código, que entrarComGoogle troca pela sessão.
  detectarSessaoNaUrl: Platform.OS === 'web',
  fluxo: Platform.OS === 'web' ? undefined : 'pkce',
})
