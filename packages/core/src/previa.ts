// Prévia do link (spec 072): título, foto e descrição das meta tags (Open Graph) de uma página.
// Sem imports de propósito: a função do servidor (previa-link) tem uma cópia. Teste: apps/web/tests/previa.test.mjs

export type Previa = { titulo: string | null; imagem: string | null; descricao: string | null; site: string | null }

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

export function lerPrevia(html: string, url: string): Previa {
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

// ---------- Link de rede social → lugar (spec 097, C6) ----------
// Instagram, TikTok e YouTube: o texto do post costuma ter "📍 Nome do lugar".

export type Rede = 'instagram' | 'tiktok' | 'youtube'

export function redeDoLink(link: string): Rede | null {
  const host = /^https?:\/\/([^/?#]+)/i.exec(link.trim())?.[1]?.toLowerCase().replace(/^www\.|^m\./, '') ?? ''
  if (host === 'instagram.com' || host === 'instagr.am') return 'instagram'
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok'
  if (host === 'youtube.com' || host === 'youtu.be') return 'youtube'
  return null
}

const NOMES_DAS_REDES: Record<Rede, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' }

// O que dá pra tirar da prévia do post: o nome do lugar (se tiver 📍) e de quem é o post
export function lugarDoPost(previa: Pick<Previa, 'titulo' | 'descricao'>, rede: Rede): { nome: string | null; observacao: string } {
  const texto = `${previa.descricao ?? ''}\n${previa.titulo ?? ''}`
  // "📍 Café de Flore, Paris" → "Café de Flore, Paris"
  const pino = /📍\s*([^\n#@|•·]{2,80})/u.exec(texto)?.[1]
  const nome = pino ? pino.replace(/[\s.,;:!-]+$/u, '').trim().slice(0, 120) : null
  // "Fulano (@fulano) on Instagram" / "@fulano on TikTok"
  const perfil = /@([a-z0-9._]{2,30})/i.exec(previa.titulo ?? '')?.[1]
  return { nome: nome || null, observacao: `Visto no ${NOMES_DAS_REDES[rede]}${perfil ? ` de @${perfil}` : ''}` }
}
