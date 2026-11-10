// Login de QA (mesmo esquema do humanav2 e do Dourado Ecowash): gera uma sessão de uma conta de TESTE
// sem ninguém digitar senha. Serve pro Playwright gravar o vídeo e pro Claude montar os dados de demonstração.
//
// Regras (a porta fica fechada se qualquer uma falhar):
// - só com QA_LOGIN=1 no passeio/.env.local, nunca com NODE_ENV=production nem na Vercel;
// - só pras contas da lista abaixo, do domínio de teste @norti.test;
// - a conta precisa já existir (quem cria é uma pessoa, no painel do Supabase): esta porta nunca cria usuário.
// Como funciona: com a chave secreta (SUPABASE_SECRET_KEY, só no passeio/.env.local, fora do git),
// gera um link mágico (auth.admin.generateLink) e troca ele por uma sessão (auth.verifyOtp).
// Cada chamada gera uma sessão nova: nada de token velho guardado.
//
// Uso: node passeio/login-qa.mjs   -> confere a porta e diz qual conta entrou (não mostra token)
import { createRequire } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '../../../..')
// O supabase-js já vem no pacote core do monorepo
const { createClient } = createRequire(path.join(RAIZ, 'packages/core/package.json'))('@supabase/supabase-js')

export const CONTAS_QA = ['demo@norti.test']
export const EMAIL_DEMO = CONTAS_QA[0]

// Lê um arquivo .env simples (CHAVE=valor por linha)
function lerEnv(arquivo) {
  if (!existsSync(arquivo)) return {}
  const env = {}
  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return env
}

// Ligado só em desenvolvimento local, com a flag, e nunca na Vercel (mesmo se a flag vazar pra lá)
export function loginQaLigado(env) {
  return env.QA_LOGIN === '1' && env.NODE_ENV !== 'production' && !env.VERCEL && !env.VERCEL_ENV
}

// Só as contas da lista, e só do domínio de teste
export function contaQaPermitida(email) {
  return typeof email === 'string' && email.endsWith('@norti.test') && CONTAS_QA.includes(email)
}

// Endereço e chave pública do Supabase (as mesmas que o app usa)
export function configDoSupabase() {
  const publico = lerEnv(path.join(RAIZ, 'apps/mobile/.env'))
  const url = publico.EXPO_PUBLIC_SUPABASE_URL
  const chave = publico.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !chave) throw new Error('Faltam EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY em apps/mobile/.env')
  const ref = new URL(url).hostname.split('.')[0]
  return { url, chave, ref, chaveDaSessao: `sb-${ref}-auth-token` }
}

const OPCOES = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

// Cliente com a chave secreta (passa por cima das regras do banco): só com a porta de QA aberta
export function clienteAdminDeQa() {
  const env = { ...lerEnv(path.join(AQUI, '.env.local')), ...process.env }
  if (!loginQaLigado(env)) throw new Error('Login de QA desligado: precisa de QA_LOGIN=1 em passeio/.env.local (e nada de produção/Vercel).')
  if (!env.SUPABASE_SECRET_KEY) throw new Error('Falta SUPABASE_SECRET_KEY em passeio/.env.local.')
  const { url } = configDoSupabase()
  return createClient(url, env.SUPABASE_SECRET_KEY, OPCOES)
}

// Acha a conta de QA (sem criar). Devolve o usuário ou null.
export async function contaDeQa(admin, email = EMAIL_DEMO) {
  if (!contaQaPermitida(email)) throw new Error(`Conta fora da lista de QA: ${email}`)
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 })
    if (error) throw new Error(`Não deu pra listar as contas: ${error.message}`)
    const achou = data.users.find((u) => u.email === email)
    if (achou) return achou
    if (data.users.length < 200) break
  }
  return null
}

// Gera a sessão da conta de QA. Devolve no mesmo formato que o supabase-js guarda no localStorage.
export async function sessaoDeQa(email = EMAIL_DEMO) {
  const admin = clienteAdminDeQa()
  // A porta nunca cria usuário: confere antes se a conta já existe
  if (!(await contaDeQa(admin, email))) {
    throw new Error(`A conta ${email} não existe. Crie no painel do Supabase (Authentication > Add user, Auto Confirm).`)
  }
  const { url, chave } = configDoSupabase()
  const opcoes = OPCOES

  const { data: link, error: erroLink } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (erroLink) throw new Error(`Não deu pra gerar o link: ${erroLink.message}`)
  const publico = createClient(url, chave, opcoes)
  const { data, error } = await publico.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
  if (error || !data.session) throw new Error(`Não deu pra abrir a sessão: ${error?.message ?? 'sem sessão'}`)
  const s = data.session
  return {
    access_token: s.access_token,
    token_type: s.token_type,
    expires_in: s.expires_in,
    expires_at: s.expires_at,
    refresh_token: s.refresh_token,
    user: s.user,
  }
}

// Rodando direto: só confere se a porta abre
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const s = await sessaoDeQa()
    console.log('Login de QA ok:', s.user.email, '| id:', s.user.id)
  } catch (e) {
    console.log(String(e.message ?? e))
    process.exitCode = 1
  }
}
