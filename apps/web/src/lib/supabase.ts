import { criarClienteSupabase } from '@together/core'

// Conexão com o Supabase (banco, login e fotos). A criação é a mesma do mobile (vem do core);
// aqui só passamos os valores do .env.local. No navegador o storage padrão (localStorage) serve.
export const supabase = criarClienteSupabase({
  url: import.meta.env.VITE_SUPABASE_URL,
  chave: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
})
