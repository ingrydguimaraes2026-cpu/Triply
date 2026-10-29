import 'react-native-url-polyfill/auto' // o React Native não tem URL nativo; o Supabase precisa
import * as SecureStore from 'expo-secure-store'
import { criarClienteSupabase } from '@together/core'

// No celular não existe localStorage. Guardamos a sessão no cofre seguro do aparelho.
// (Obs.: SecureStore tem limite ~2KB por chave; se a sessão crescer, trocar por um storage maior.)
const cofre = {
  getItem: (chave: string) => SecureStore.getItemAsync(chave),
  setItem: (chave: string, valor: string) => SecureStore.setItemAsync(chave, valor),
  removeItem: (chave: string) => SecureStore.deleteItemAsync(chave),
}

// Valores vêm das variáveis EXPO_PUBLIC_* (equivalente mobile do VITE_* da web).
export const supabase = criarClienteSupabase({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  chave: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  guarda: cofre,
  detectarSessaoNaUrl: false, // no app não há redirect de OAuth na URL
})
