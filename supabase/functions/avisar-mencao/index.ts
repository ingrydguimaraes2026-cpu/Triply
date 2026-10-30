// Função "avisar-mencao" (spec 043): avisa no celular quem foi chamado com @nome num comentário.
// O app chama logo depois de comentar, com { "comentario_id": "..." }. Só quem escreveu dispara.
// Só avisa quem é do comboio (e não o próprio autor).
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
const curto = (texto: string, max = 120) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto)

// ---- Cópia de packages/core/src/mencoes.ts (acharMencoes). Mudou lá, muda aqui. ----
type Pessoa = { id: string; nome: string }

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Jeitos de chamar a pessoa: nome inteiro e primeiro nome (sem acento, minúsculo)
function apelidos(p: Pessoa): string[] {
  const inteiro = normalizar(p.nome.trim())
  const primeiro = inteiro.split(/\s+/)[0]
  return [...new Set([inteiro, primeiro].filter(Boolean))]
}

const LETRA = /[a-z0-9À-ɏ]/i

// Quem foi mencionado no texto ("@Ingryd", "@ana paula"). Nome inteiro ganha do primeiro nome.
function acharMencoes(texto: string, pessoas: Pessoa[]): string[] {
  const t = normalizar(texto)
  const achados = new Set<string>()
  for (let i = t.indexOf('@'); i !== -1; i = t.indexOf('@', i + 1)) {
    if (i > 0 && LETRA.test(t[i - 1])) continue // e-mail, não menção
    const resto = t.slice(i + 1)
    let melhor: { id: string; tam: number } | null = null
    for (const p of pessoas) {
      for (const a of apelidos(p)) {
        if (resto.startsWith(a) && !LETRA.test(resto[a.length] ?? '') && (!melhor || a.length > melhor.tam)) melhor = { id: p.id, tam: a.length }
      }
    }
    if (melhor) achados.add(melhor.id)
  }
  return [...achados]
}

// ---- fim da cópia ----

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
  if (typeof corpo?.comentario_id !== 'string') return json({ erro: 'Mande comentario_id.' }, 400)

  const { data: c } = await admin
    .from('comentarios_item')
    .select('id, viagem_id, autor, texto, gasto_id, lugar_id, hospedagem_id')
    .eq('id', corpo.comentario_id)
    .maybeSingle()
  if (!c) return json({ erro: 'Comentário não encontrado.' }, 404)
  if (c.autor !== quem.user.id) return json({ erro: 'Só quem comentou avisa.' }, 403)

  const { data: membros } = await admin.from('comboio_membros').select('usuario_id, perfis (nome)').eq('viagem_id', c.viagem_id)
  const pessoas = (membros ?? []).map((m) => ({ id: m.usuario_id as string, nome: ((m.perfis as unknown as { nome: string | null } | null)?.nome ?? '').trim() }))
  const destinatarios = acharMencoes(c.texto, pessoas.filter((p) => p.nome)).filter((id) => id !== c.autor)
  if (destinatarios.length === 0) return json({ enviados: 0 })

  const autor = pessoas.find((p) => p.id === c.autor)?.nome || 'Alguém do comboio'
  const caminho = c.gasto_id
    ? `/viagem/${c.viagem_id}/financeiro?foco=${c.gasto_id}`
    : c.lugar_id
      ? `/viagem/${c.viagem_id}/lugares?foco=${c.lugar_id}`
      : `/viagem/${c.viagem_id}/hospedagem`
  const dados = JSON.stringify({ titulo: `💬 ${autor} te chamou`, corpo: curto(c.texto), url: caminho, tag: `mencao-${c.id}` })

  const { data: aparelhos } = await admin.from('push_inscricoes').select('id, endpoint, p256dh, auth').in('usuario_id', destinatarios)
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
