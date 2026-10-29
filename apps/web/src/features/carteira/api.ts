// Carteira de euro por e-mail (spec 015): conexão do Gmail, saldo e movimentos.
import { supabase } from '../../lib/supabase'

// O endereço de volta do Google. TEM que ser idêntico ao cadastrado no Google Cloud
// (Authorized redirect URIs) e ao segredo GOOGLE_REDIRECT_URI da Edge Function.
export const REDIRECT_GMAIL = 'https://together-viagem.vercel.app/carteira/conectado'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export type Conexao = { email: string; status: 'ativo' | 'expirado' | 'erro'; expira_em: string | null; ultimo_sync: string | null }
export type Carteira = { id: string; moeda: string; saldo_inicial: number; ajuste: number; saldo_atual: number }
export type Movimento = { id: string; tipo: 'entrada' | 'gasto'; valor: number; moeda: string; descricao: string | null; data: string; provedor: string }

// ---------- Conexão do Gmail ----------

// Monta o endereço do consentimento do Google. `state` leva o id da viagem, pra voltar pra ela.
export function urlDeConsentimento(viagemId: string): string {
  if (!CLIENT_ID) throw new Error('Falta VITE_GOOGLE_CLIENT_ID no .env.local / Vercel')
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_GMAIL,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly email',
    access_type: 'offline', // pra receber o refresh token
    prompt: 'consent', // força vir o refresh token mesmo se já autorizou antes
    include_granted_scopes: 'true',
    state: viagemId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`
}

// Status da minha conexão (sem o token — vem da função minha_conexao_gmail)
export async function minhaConexao(): Promise<Conexao | null> {
  const { data, error } = await supabase.rpc('minha_conexao_gmail')
  if (error) throw error
  const linha = (data ?? [])[0]
  return linha ? (linha as Conexao) : null
}

// Troca o code do Google pelo acesso (a Edge Function guarda o refresh token e cria a carteira)
export async function conectarComCodigo(code: string, viagemId: string): Promise<Conexao> {
  const { data, error } = await supabase.functions.invoke('conectar-gmail', { body: { code, viagem_id: viagemId } })
  if (error) throw error
  if (data?.erro) throw new Error(data.erro)
  return data as Conexao
}

// Pede pro servidor ler os e-mails agora (sem esperar o cron de 15 min)
export async function sincronizar(): Promise<void> {
  const { error } = await supabase.functions.invoke('ler-carteiras', { body: {} })
  if (error) throw error
}

// Diagnóstico: lista os e-mails do Wise/Nomad pra ver quais têm valor (pra descobrir o formato da Nomad).
export type ItemDiagnostico = { provedor: 'wise' | 'nomad'; data: string | null; assunto: string; euro: boolean; palavra: string | null; trecho: string }
export async function diagnosticoEmails(): Promise<ItemDiagnostico[]> {
  const { data, error } = await supabase.functions.invoke('diagnostico-emails', { body: {} })
  if (error) throw error
  if (data?.erro) throw new Error(data.erro)
  return (data?.itens ?? []) as ItemDiagnostico[]
}

export async function desconectar(apagarMovimentos: boolean): Promise<void> {
  const { data, error } = await supabase.functions.invoke('desconectar-gmail', { body: { apagar_movimentos: apagarMovimentos } })
  if (error) throw error
  if (data?.erro) throw new Error(data.erro)
}

// ---------- Carteira e movimentos ----------

export async function minhaCarteira(viagemId: string, meuId: string): Promise<Carteira | null> {
  const { data, error } = await supabase
    .from('carteiras_com_saldo')
    .select('id, moeda, saldo_inicial, ajuste, saldo_atual')
    .eq('viagem_id', viagemId)
    .eq('usuario_id', meuId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id as string,
    moeda: data.moeda as string,
    saldo_inicial: Number(data.saldo_inicial),
    ajuste: Number(data.ajuste),
    saldo_atual: Number(data.saldo_atual),
  }
}

// Cria a carteira (ou atualiza o saldo inicial) da pessoa nesta viagem
export async function salvarSaldoInicial(viagemId: string, meuId: string, saldoInicial: number, moeda: string): Promise<void> {
  const { error } = await supabase
    .from('carteiras')
    .upsert({ viagem_id: viagemId, usuario_id: meuId, saldo_inicial: saldoInicial, moeda }, { onConflict: 'viagem_id,usuario_id' })
  if (error) throw error
}

// Ajuste manual: corrige o saldo atual somando/subtraindo uma diferença
export async function ajustarSaldo(carteiraId: string, ajuste: number): Promise<void> {
  const { error } = await supabase.from('carteiras').update({ ajuste }).eq('id', carteiraId)
  if (error) throw error
}

export async function movimentos(carteiraId: string): Promise<Movimento[]> {
  const { data, error } = await supabase
    .from('movimentos_carteira')
    .select('id, tipo, valor, moeda, descricao, data, provedor')
    .eq('carteira_id', carteiraId)
    .order('data', { ascending: false })
  if (error) throw error
  return (data ?? []).map((m) => ({ ...m, valor: Number(m.valor) })) as Movimento[]
}

// Soma do euro de todo o comboio (só o número; vem de uma função que confere se sou do comboio)
export async function saldoDoComboio(viagemId: string): Promise<number> {
  const { data, error } = await supabase.rpc('saldo_euro_do_comboio', { p_viagem_id: viagemId })
  if (error) throw error
  return Number(data ?? 0)
}
