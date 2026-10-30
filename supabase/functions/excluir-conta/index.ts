// Função "excluir-conta" (spec 089): exclui a conta de quem chamou.
// 1. Chama excluir_meus_dados() COMO a pessoa (o banco usa auth.uid()): sai das viagens,
//    passa o ADM, apaga o que é pessoal e troca o nome por "Conta excluída".
// 2. Desativa o login (exclusão "suave" do Supabase Auth: o e-mail é embaralhado e a conta
//    não entra mais; a linha fica porque gastos e fotos antigos do comboio apontam pra ela).
// O app manda { confirmar: 'EXCLUIR' } pra evitar exclusão por engano.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user) return json({ erro: 'Faça login.' }, 401)

  const { confirmar } = await req.json().catch(() => ({}))
  if (confirmar !== 'EXCLUIR') return json({ erro: 'Confirmação faltando.' }, 400)

  // Cliente "como a pessoa": as regras do banco valem e auth.uid() é ela
  const comoEla = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { error: erroDados } = await comoEla.rpc('excluir_meus_dados')
  if (erroDados) {
    console.error('excluir_meus_dados falhou:', erroDados.message)
    // Mensagem do banco é pensada pra pessoa ler (ex.: só sobram convidados)
    return json({ erro: erroDados.message }, 409)
  }

  const { error } = await admin.auth.admin.deleteUser(quem.user.id, true)
  if (error) {
    console.error('deleteUser falhou:', error.message)
    return json({ erro: 'Os dados foram apagados, mas não deu pra desativar o login. Tente de novo.' }, 500)
  }
  return json({ ok: true })
})
