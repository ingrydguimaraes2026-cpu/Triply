// Cria uma conta de teste nova (e-mail e senha gerados) + uma viagem com destino (Rio de Janeiro),
// e guarda tudo em apps/mobile/e2e/.contas-teste.local.json (fora do git). Não imprime a senha.
//   node apps/mobile/e2e/conta-de-teste.mjs
// Precisa da "Confirm email" desligada no Supabase (Authentication > Sign In / Providers > Email).
// O roteiro explorar.mjs usa a última conta deste arquivo quando não recebe TRIPWAVE_EMAIL.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { createRequire } from 'node:module'

const pasta = new URL('.', import.meta.url)
const arquivo = new URL('.contas-teste.local.json', pasta)
const require = createRequire(new URL('../../../packages/core/package.json', pasta))
const { createClient } = require('@supabase/supabase-js')

// Lê apps/mobile/.env (sem dependência extra)
const env = Object.fromEntries(
  readFileSync(new URL('../.env', pasta), 'utf8')
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
)
const cli = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })

const agora = new Date()
const p = (n) => String(n).padStart(2, '0')
const horario = `${agora.getFullYear()}${p(agora.getMonth() + 1)}${p(agora.getDate())}-${p(agora.getHours())}${p(agora.getMinutes())}${p(agora.getSeconds())}`
const email = `teste+${horario}@teste.norti.app`
const senha = randomBytes(15).toString('base64url')

const { data, error } = await cli.auth.signUp({ email, password: senha, options: { data: { full_name: `Teste ${horario}` } } })
if (error) throw error
if (!data.session) {
  console.error('Conta criada, mas o Supabase pediu confirmação de e-mail. Desligue "Confirm email" no painel e rode de novo.')
  process.exit(1)
}

const dia = (d) => new Date(agora.getTime() + d * 86400000).toISOString().slice(0, 10)
const { data: viagem, error: erroViagem } = await cli
  .from('viagens')
  .insert({ nome: 'Rio de teste', data_inicio: dia(30), data_fim: dia(32), moeda_principal: 'BRL' })
  .select('id')
  .single()
if (erroViagem) throw erroViagem
const { error: erroDestino } = await cli
  .from('destinos')
  .insert({ viagem_id: viagem.id, ordem: 0, nome: 'Rio de Janeiro', pais: 'BR', latitude: -22.9068, longitude: -43.1729, dias: 3 })
if (erroDestino) throw erroDestino

const contas = existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, 'utf8')) : []
contas.unshift({ email, senha, viagemId: viagem.id, criadaEm: agora.toISOString() })
writeFileSync(arquivo, JSON.stringify(contas, null, 2))
console.log(`Conta de teste pronta: ${email} (viagem ${viagem.id}). Senha em apps/mobile/e2e/.contas-teste.local.json`)
