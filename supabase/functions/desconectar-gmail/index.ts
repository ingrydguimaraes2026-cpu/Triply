// Função "desconectar-gmail" (spec 015): desliga o Gmail da pessoa.
// Revoga o token no Google (quando dá) e apaga a conexão. Opcionalmente apaga os movimentos
// importados, se o app mandar { apagar_movimentos: true }.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user) return json({ erro: 'Faça login.' }, 401)
  const usuario = quem.user.id

  const { apagar_movimentos } = await req.json().catch(() => ({}))

  // Revoga o token no Google (se falhar, tudo bem: apagamos localmente mesmo assim)
  const { data: conta } = await admin.from('gmail_contas').select('refresh_token').eq('usuario_id', usuario).maybeSingle()
  if (conta?.refresh_token) {
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: conta.refresh_token }),
      })
    } catch (e) {
      console.error('Não deu pra revogar no Google:', (e as Error).message)
    }
  }

  if (apagar_movimentos) {
    const { data: carteiras } = await admin.from('carteiras').select('id').eq('usuario_id', usuario)
    const ids = (carteiras ?? []).map((c) => c.id)
    if (ids.length > 0) await admin.from('movimentos_carteira').delete().in('carteira_id', ids)
  }

  const { error } = await admin.from('gmail_contas').delete().eq('usuario_id', usuario)
  if (error) return json({ erro: 'Não deu pra desconectar.' }, 500)
  return json({ ok: true })
})
