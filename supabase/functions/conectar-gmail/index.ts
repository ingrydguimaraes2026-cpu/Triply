// Função "conectar-gmail" (spec 015): liga o Gmail de uma pessoa ao Together.
// O app manda o `code` que o Google devolveu depois do consentimento; aqui a gente troca
// esse code pelo refresh token (precisa do client secret, por isso é no servidor) e guarda.
//
// Segredos (Supabase → Edge Functions → Secrets): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase coloca sozinho.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')
  if (!clientId || !clientSecret || !redirectUri) {
    return json({ erro: 'Faltam os segredos GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI na função.' }, 500)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Quem está pedindo (tem que estar logado no Together)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user) return json({ erro: 'Faça login pra conectar o Gmail.' }, 401)

  const { code, viagem_id } = await req.json().catch(() => ({}))
  if (!code) return json({ erro: 'Faltou o code do Google.' }, 400)

  // Troca o code pelos tokens
  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tok = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    console.error('Troca do code falhou:', tok?.error, tok?.error_description)
    return json({ erro: 'O Google recusou a conexão. Tente conectar de novo.', detalhe: tok?.error }, 400)
  }

  // Descobre o e-mail da conta com o access token
  let email = 'conta Google'
  try {
    const ui = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    })
    if (ui.ok) email = (await ui.json()).email ?? email
  } catch (e) {
    console.error('Não deu pra ler o e-mail da conta:', (e as Error).message)
  }

  // No modo "Testing" do Google o acesso cai em ~7 dias. Guardamos a data pra avisar de reconectar.
  const expiraEm = new Date(Date.now() + 7 * 86_400_000).toISOString()

  // O refresh token só vem no primeiro consentimento (ou com prompt=consent). Se não vier, mantém o atual.
  const linha: Record<string, unknown> = {
    usuario_id: quem.user.id,
    email,
    expira_em: expiraEm,
    status: 'ativo',
    erro: null,
  }
  if (tok.refresh_token) linha.refresh_token = tok.refresh_token

  const { error } = await admin.from('gmail_contas').upsert(linha, { onConflict: 'usuario_id' })
  if (error) {
    console.error('Erro ao guardar a conexão:', error.message)
    return json({ erro: 'Não deu pra guardar a conexão.' }, 500)
  }

  // Cria a carteira desta viagem (saldo começa em 0; os e-mails somam). Não mexe se já existir.
  if (viagem_id) {
    await admin
      .from('carteiras')
      .upsert({ viagem_id, usuario_id: quem.user.id, saldo_inicial: 0, moeda: 'EUR' }, { onConflict: 'viagem_id,usuario_id', ignoreDuplicates: true })
  }

  return json({ email, status: 'ativo', expira_em: expiraEm })
})
