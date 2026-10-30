// Função "avisos-feed" (spec 014): avisa o comboio no celular quando alguém posta ou comenta.
// O app chama logo depois de postar/comentar, com { "post_id": "..." } ou { "comentario_id": "..." }.
// - Post novo → todo mundo do comboio, menos quem postou.
// - Comentário → quem postou e quem já comentou naquele post, menos quem comentou.
// Só quem é o autor do post/comentário consegue disparar o aviso dele.
// Segredos: VAPID_PRIVATE_KEY (o mesmo da função avisos-cambio).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLICA = 'BMT3M0-HThNnW4fGo8UHb2WQkWYQIx6kYd1rSlUQzJt9yyGBDprocMC0zQc5kbUXcKWvqvXoW_6Fnsvr1D_olUI'
const CONTATO = 'https://github.com/ingrydguimaraes2026-cpu/Triply'

type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string }

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...cors } })

// Corta o texto pra caber na notificação
const curto = (texto: string, max = 120) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!privada) return json({ erro: 'Falta o segredo VAPID_PRIVATE_KEY na função.' }, 500)
  webpush.setVapidDetails(CONTATO, VAPID_PUBLICA, privada)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user) return json({ erro: 'Faça login.' }, 401)
  const eu = quem.user.id
  const corpo = await req.json().catch(() => ({}))

  let postId: string
  let destinatarios: string[]
  let aviso: { titulo: string; corpo: string }

  const nomeDe = async (id: string) => (await admin.from('perfis').select('nome').eq('id', id).maybeSingle()).data?.nome ?? 'Alguém do comboio'

  if (typeof corpo?.post_id === 'string') {
    // ---------- Post novo ----------
    const { data: post } = await admin
      .from('posts')
      .select('id, viagem_id, autor, legenda, viagens (nome), destinos (nome), fotos (id)')
      .eq('id', corpo.post_id)
      .maybeSingle()
    if (!post) return json({ erro: 'Post não encontrado.' }, 404)
    if (post.autor !== eu) return json({ erro: 'Só quem postou avisa o comboio.' }, 403)
    postId = post.id
    const { data: membros } = await admin.from('comboio_membros').select('usuario_id').eq('viagem_id', post.viagem_id)
    destinatarios = (membros ?? []).map((m) => m.usuario_id).filter((id) => id !== eu)
    const viagem = (post.viagens as unknown as { nome: string } | null)?.nome ?? 'a viagem'
    const lugar = (post.destinos as unknown as { nome: string } | null)?.nome
    const quantas = (post.fotos as unknown as { id: string }[] | null)?.length ?? 1
    aviso = {
      titulo: `📸 ${await nomeDe(eu)} postou em ${viagem}`,
      corpo: post.legenda
        ? curto(post.legenda)
        : `${quantas === 1 ? 'Uma foto nova' : `${quantas} fotos novas`}${lugar ? ` de ${lugar}` : ''}. Toque pra ver.`,
    }
    corpo.viagem_id = post.viagem_id
  } else if (typeof corpo?.comentario_id === 'string') {
    // ---------- Comentário ----------
    const { data: comentario } = await admin
      .from('comentarios')
      .select('id, autor, texto, post_id, posts (autor, viagem_id)')
      .eq('id', corpo.comentario_id)
      .maybeSingle()
    if (!comentario) return json({ erro: 'Comentário não encontrado.' }, 404)
    if (comentario.autor !== eu) return json({ erro: 'Só quem comentou avisa.' }, 403)
    const post = comentario.posts as unknown as { autor: string; viagem_id: string }
    postId = comentario.post_id
    const { data: outros } = await admin.from('comentarios').select('autor').eq('post_id', postId)
    destinatarios = [...new Set([post.autor, ...(outros ?? []).map((o) => o.autor)])].filter((id) => id !== eu)
    // Só quem ainda está no comboio
    const { data: membros } = await admin.from('comboio_membros').select('usuario_id').eq('viagem_id', post.viagem_id)
    const noComboio = new Set((membros ?? []).map((m) => m.usuario_id))
    destinatarios = destinatarios.filter((id) => noComboio.has(id))
    aviso = { titulo: `💬 ${await nomeDe(eu)} comentou`, corpo: curto(comentario.texto) }
    corpo.viagem_id = post.viagem_id
  } else {
    return json({ erro: 'Mande post_id ou comentario_id.' }, 400)
  }

  // Quem desligou os avisos de fotos (spec 033) não recebe
  if (destinatarios.length > 0) {
    const { data: desligados } = await admin
      .from('preferencias_aviso')
      .select('usuario_id')
      .eq('tipo', 'fotos')
      .eq('ligado', false)
      .in('usuario_id', destinatarios)
    const fora = new Set((desligados ?? []).map((d) => d.usuario_id))
    destinatarios = destinatarios.filter((id) => !fora.has(id))
  }

  if (destinatarios.length === 0) return json({ enviados: 0 })

  const { data: aparelhos } = await admin.from('push_inscricoes').select('id, endpoint, p256dh, auth').in('usuario_id', destinatarios)
  const dados = JSON.stringify({ ...aviso, url: `/viagem/${corpo.viagem_id}/fotos?post=${postId}`, tag: `feed-${postId}` })

  let enviados = 0
  for (const a of (aparelhos ?? []) as Inscricao[]) {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, dados, { TTL: 60 * 60 * 24 })
      enviados++
    } catch (erro) {
      const status = (erro as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', a.id)
      else console.error('Falha ao enviar push:', status, (erro as Error).message)
    }
  }
  return json({ enviados })
})
