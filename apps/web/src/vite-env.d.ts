/// <reference types="vite/client" />

// Variáveis do .env.local que o site usa
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}
