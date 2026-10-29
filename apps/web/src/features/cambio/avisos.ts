// Boletim do câmbio no celular, 12h e 20h (spec 013): pedido no banco + inscrição do aparelho no Web Push.
import { supabase } from '../../lib/supabase'

// Chave pública do Web Push (a privada fica só no servidor, como segredo da função avisos-cambio)
export const VAPID_PUBLICA = 'BMT3M0-HThNnW4fGo8UHb2WQkWYQIx6kYd1rSlUQzJt9yyGBDprocMC0zQc5kbUXcKWvqvXoW_6Fnsvr1D_olUI'

// ---------- Boletim ----------
// Uma linha em metas_cambio = "quero o boletim desta moeda nesta viagem" (12h e 20h).

export type Boletim = { avisar: boolean; meta: number | null }

export async function buscarBoletim(viagemId: string, moeda: string): Promise<Boletim | null> {
  const { data, error } = await supabase.from('metas_cambio').select('meta, avisar').eq('viagem_id', viagemId).eq('moeda', moeda).maybeSingle()
  if (error) throw error
  return data ? { avisar: data.avisar, meta: data.meta === null ? null : Number(data.meta) } : null
}

// Liga ou desliga o boletim
export async function marcarBoletim(viagemId: string, meuId: string, moeda: string, avisar: boolean) {
  const { error } = await supabase
    .from('metas_cambio')
    .upsert({ usuario_id: meuId, viagem_id: viagemId, moeda, avisar, atualizado_em: new Date().toISOString() }, { onConflict: 'usuario_id,viagem_id,moeda' })
  if (error) throw error
}

// ---------- Aparelho (Web Push) ----------

export type SituacaoAviso =
  | 'sem-suporte' // navegador sem notificação
  | 'iphone-instalar' // iPhone: só funciona com o app instalado na tela de início
  | 'sem-app' // rodando sem o service worker (ex.: npm run dev)
  | 'negado' // a pessoa bloqueou as notificações
  | 'desligado'
  | 'ligado'

export function ehIphone() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}

export function estaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

function temSuporte() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

async function registro() {
  return navigator.serviceWorker.getRegistration()
}

export async function situacaoDoAviso(): Promise<SituacaoAviso> {
  if (!temSuporte()) return ehIphone() && !estaInstalado() ? 'iphone-instalar' : 'sem-suporte'
  if (Notification.permission === 'denied') return 'negado'
  const reg = await registro()
  if (!reg) return 'sem-app'
  return (await reg.pushManager.getSubscription()) ? 'ligado' : 'desligado'
}

// "BMT3..." (base64url) → bytes, o formato que o navegador pede
function paraBytes(base64url: string) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const texto = atob(base64)
  return Uint8Array.from(texto, (c) => c.charCodeAt(0))
}

// Pede permissão, inscreve o aparelho e grava no banco
export async function ligarAvisos() {
  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') throw new Error('negado')
  const reg = await registro()
  if (!reg) throw new Error('sem-app')
  const inscricao =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: paraBytes(VAPID_PUBLICA) }))
  const { endpoint, keys } = inscricao.toJSON()
  if (!endpoint || !keys?.p256dh || !keys?.auth) throw new Error('O navegador não devolveu a inscrição completa.')
  const { error } = await supabase.rpc('registrar_push', { p_endpoint: endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth })
  if (error) throw error
}

export async function desligarAvisos() {
  const inscricao = await (await registro())?.pushManager.getSubscription()
  if (!inscricao) return
  await supabase.from('push_inscricoes').delete().eq('endpoint', inscricao.endpoint)
  await inscricao.unsubscribe()
}

// Manda o boletim de agora pros meus aparelhos (sem contar como boletim de verdade)
export async function testarAviso() {
  const { data, error } = await supabase.functions.invoke('avisos-cambio', { body: { teste: true } })
  if (error) throw error
  return (data as { enviados?: number })?.enviados ?? 0
}
