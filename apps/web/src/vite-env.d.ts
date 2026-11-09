/// <reference types="vite/client" />

// Variáveis do .env.local que o site usa
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  // Domínio público do app, pros links de compartilhar (cai pro window.location.origin se vazio)
  readonly VITE_APP_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
}
