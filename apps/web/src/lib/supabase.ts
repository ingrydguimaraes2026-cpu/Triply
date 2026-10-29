import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Conexão com o Supabase (banco, login e fotos). Os valores vêm do arquivo .env.local.
const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !chave) {
  throw new Error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local')
}

export const supabase = createClient<Database>(url, chave)
