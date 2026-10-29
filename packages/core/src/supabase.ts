import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database'

// O client do Supabase tipado com o nosso banco. Web e mobile criam o deles com a MESMA
// função; o que muda é só de onde vêm a URL/chave e onde a sessão é guardada (localStorage
// no navegador, cofre seguro no celular). A lógica de dados fica igual nas duas plataformas.
export type ClienteTogether = SupabaseClient<Database>

// Onde a sessão de login é guardada. O navegador usa o padrão (localStorage); o mobile passa
// um adaptador (ex.: expo-secure-store). Pode ser síncrono ou assíncrono.
export type GuardaSessao = {
  getItem: (chave: string) => Promise<string | null> | string | null
  setItem: (chave: string, valor: string) => Promise<void> | void
  removeItem: (chave: string) => Promise<void> | void
}

export type OpcoesCliente = {
  url: string
  chave: string
  guarda?: GuardaSessao
  // No navegador, precisa ler a sessão que volta na URL do login do Google. No celular, não.
  detectarSessaoNaUrl?: boolean
}

export function criarClienteSupabase({ url, chave, guarda, detectarSessaoNaUrl = true }: OpcoesCliente): ClienteTogether {
  if (!url || !chave) {
    throw new Error('Supabase: faltam a URL e a chave pública (confira o .env).')
  }
  return createClient<Database>(url, chave, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: detectarSessaoNaUrl,
      ...(guarda ? { storage: guarda } : {}),
    },
  })
}
