import { supabase } from '../../lib/supabase'

// Lista de espera (página /espera). Os e-mails ficam na tabela lista_espera:
// o site só consegue inserir, ninguém lê pelo app (só no painel do Supabase).

export type Resultado = 'entrou' | 'ja-estava' | 'erro'

// Guarda o e-mail. Se já estava na lista, conta como sucesso (não é erro da pessoa).
export async function entrarNaLista(email: string, origem: string | null): Promise<Resultado> {
  const { error } = await supabase
    .from('lista_espera')
    .insert({ email: email.trim().toLowerCase(), origem: origem?.slice(0, 40) || null })
  if (!error) return 'entrou'
  if (error.code === '23505') return 'ja-estava' // 23505 = e-mail repetido
  console.error('Lista de espera:', error.message)
  return 'erro'
}

// Conferência simples do e-mail antes de mandar (a tabela confere de novo)
export function emailValido(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
}
