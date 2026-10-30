// Função "cheguei-bem" (spec 051): avisa o comboio no celular que a pessoa chegou bem.
// O app chama logo depois de gravar, com { "chegada_id": "..." }. Só a própria pessoa dispara.
// Segredos: VAPID_PRIVATE_KEY (o mesmo das outras funções de aviso).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLICA = 'BMT3M0-HThNnW4fGo8UHb2WQkWYQIx6kYd1rSlUQzJt9yyGBDprocMC0zQc5kbUXcKWvqvXoW_6Fnsvr1D_olUI'
const CONTATO = 'https://github.com/ingrydguimaraes2026-cpu/Triply'

type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string }
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...cors } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!privada) return json({ erro: 'Falta o segredo VAPID_PRIVATE_KEY na função.' }, 500)
  webpush.setVapidDetails(CONTATO, VAPID_PUBLICA, privada)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user) return json({ erro: 'Faça login.' }, 401)
  const corpo = await req.json().catch(() => ({}))
  if (typeof corpo?.chegada_id !== 'string') return json({ erro: 'Mande chegada_id.' }, 400)

  const { data: c } = await admin.from('chegadas').select('id, viagem_id, usuario_id, onde').eq('id', corpo.chegada_id).maybeSingle()
  if (!c) return json({ erro: 'Chegada não encontrada.' }, 404)
  if (c.usuario_id !== quem.user.id) return json({ erro: 'Só quem chegou avisa.' }, 403)

  const { data: perfil } = await admin.from('perfis').select('nome').eq('id', c.usuario_id).maybeSingle()
  const nome = perfil?.nome ?? 'Alguém do comboio'
  const { data: membros } = await admin.from('comboio_membros').select('usuario_id').eq('viagem_id', c.viagem_id)
  const outros = (membros ?? []).map((m) => m.usuario_id).filter((id) => id !== c.usuario_id)
  if (outros.length === 0) return json({ enviados: 0 })

  const dados = JSON.stringify({
    titulo: `✅ ${nome} chegou bem`,
    corpo: c.onde ? `Em ${c.onde}.` : 'Pode ficar tranquilo(a).',
    url: `/viagem/${c.viagem_id}`,
    tag: `chegada-${c.usuario_id}`,
  })
  const { data: aparelhos } = await admin.from('push_inscricoes').select('id, endpoint, p256dh, auth').in('usuario_id', outros)
  let enviados = 0
  for (const a of (aparelhos ?? []) as Inscricao[]) {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, dados, { TTL: 60 * 60 * 6 })
      enviados++
    } catch (erro) {
      const status = (erro as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', a.id)
      else console.error('Falha ao enviar push:', status, (erro as Error).message)
    }
  }
  return json({ enviados })
})
