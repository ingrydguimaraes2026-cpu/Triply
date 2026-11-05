import { supabase } from './supabase'
import { guardar, lerGuardado } from './guardado'

// Contas de teste (QA/dev): cria um usuário novo de verdade no Supabase com e-mail e senha
// gerados, sem precisar de conta Google. Só aparece em modo dev (nunca no build de loja).
// Precisa da "Confirm email" desligada no Supabase (Authentication > Sign In / Providers > Email).

export const MODO_TESTE = __DEV__ || process.env.EXPO_PUBLIC_MODO_TESTE === '1'

export type ContaDeTeste = { email: string; senha: string; criadaEm: string }

const CHAVE = 'together.contas-de-teste' // fica só neste aparelho/navegador

export async function contasDeTesteGuardadas(): Promise<ContaDeTeste[]> {
  return (await lerGuardado<ContaDeTeste[]>(CHAVE)) ?? []
}

function senhaAleatoria() {
  const letras = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 20; i++) s += letras[Math.floor(Math.random() * letras.length)]
  return s
}

// Ex.: teste+20261105-143012@teste.norti.app (domínio que não recebe e-mail: é só um nome)
function emailNovo() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const horario = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  return `teste+${horario}@teste.norti.app`
}

export async function criarContaDeTeste(): Promise<ContaDeTeste> {
  const conta: ContaDeTeste = { email: emailNovo(), senha: senhaAleatoria(), criadaEm: new Date().toISOString() }
  const nome = `Teste ${conta.email.slice(6, 21)}`
  const { data, error } = await supabase.auth.signUp({ email: conta.email, password: conta.senha, options: { data: { full_name: nome } } })
  if (error) throw error
  // Guarda antes de checar a sessão: se a confirmação estiver ligada, dá pra entrar depois de desligar
  await guardar(CHAVE, [conta, ...(await contasDeTesteGuardadas())].slice(0, 20))
  if (!data.session) throw new Error('A conta foi criada, mas o Supabase pediu confirmação de e-mail. Desligue "Confirm email" no painel.')
  return conta
}

export async function entrarNaUltimaContaDeTeste(): Promise<ContaDeTeste> {
  const [ultima] = await contasDeTesteGuardadas()
  if (!ultima) throw new Error('Ainda não tem conta de teste neste aparelho.')
  const { error } = await supabase.auth.signInWithPassword({ email: ultima.email, password: ultima.senha })
  if (error) throw error
  return ultima
}
