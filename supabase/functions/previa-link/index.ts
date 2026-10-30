// Função "previa-link" (spec 072): busca a página do link (Airbnb, Booking, hotel…) do lado do servidor
// e devolve título, foto e descrição (meta tags Open Graph). O navegador não consegue: o site bloqueia (CORS).
// Só pra quem está logado. Alguns sites bloqueiam robôs: aí volta tudo vazio e o app segue sem prévia.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...cors } })

// ---- Cópia de packages/core/src/previa.ts. Mudou lá, muda aqui. ----
type Previa = { titulo: string | null; imagem: string | null; descricao: string | null; site: string | null }

function decodificar(texto: string): string {
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

function meta(html: string, nomes: string[]): string | null {
  for (const nome of nomes) {
    // property="og:title" content="..."  ou  content="..." property="og:title"
    const a = new RegExp(`<meta[^>]+(?:property|name)=["']${nome}["'][^>]*content=["']([^"']+)["']`, 'i').exec(html)
    const b = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${nome}["']`, 'i').exec(html)
    const achado = a?.[1] ?? b?.[1]
    if (achado) return decodificar(achado)
  }
  return null
}

// "/foto.jpg" + "https://hotel.fr/quarto" → "https://hotel.fr/foto.jpg" (sem URL(): o core não tem a lib DOM)
function absoluta(caminho: string, base: string): string | null {
  const origem = /^(https?:\/\/[^/]+)/i.exec(base)?.[1]
  if (!origem) return null
  if (caminho.startsWith('//')) return `https:${caminho}`
  if (caminho.startsWith('/')) return `${origem}${caminho}`
  return `${base.replace(/[^/]*$/, '')}${caminho}`
}

function lerPrevia(html: string, url: string): Previa {
  const titulo = meta(html, ['og:title', 'twitter:title']) ?? (/<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1] ? decodificar(/<title[^>]*>([^<]+)<\/title>/i.exec(html)![1]) : null)
  let imagem = meta(html, ['og:image', 'og:image:url', 'twitter:image'])
  if (imagem && !/^https?:\/\//i.test(imagem)) imagem = absoluta(imagem, url)
  if (imagem && !/^https:\/\//i.test(imagem)) imagem = null // só https (o app é https)
  return {
    titulo: titulo ? titulo.slice(0, 200) : null,
    imagem,
    descricao: meta(html, ['og:description', 'description', 'twitter:description'])?.slice(0, 300) ?? null,
    site: meta(html, ['og:site_name']),
  }
}
// ---- fim da cópia ----

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user) return json({ erro: 'Faça login.' }, 401)

  const corpo = await req.json().catch(() => ({}))
  const url = typeof corpo?.url === 'string' ? corpo.url.trim() : ''
  // Só https público (nada de endereço interno)
  if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(url) || /^https:\/\/(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(url)) {
    return json({ erro: 'Link inválido.' }, 400)
  }
  try {
    const resposta = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TogetherPrevia/1.0)', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    if (!resposta.ok) return json({ titulo: null, imagem: null, descricao: null, site: null })
    // Só o começo da página (as meta tags ficam no <head>)
    const html = (await resposta.text()).slice(0, 300000)
    return json(lerPrevia(html, resposta.url || url))
  } catch {
    return json({ titulo: null, imagem: null, descricao: null, site: null })
  }
})
