// Modo demonstração: o Playwright responde no lugar do Supabase com os dados de demo/dados.mjs.
// Nenhuma chamada sai do computador e nada é gravado no banco. A sessão é de mentira e só vale aqui.
import { DADOS, EU } from './dados.mjs'

export const SUPABASE = 'https://ltygqabtdbphtjscvuit.supabase.co'
const CHAVE_DA_SESSAO = 'sb-ltygqabtdbphtjscvuit-auth-token'

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
const usuario = {
  id: EU.id, aud: 'authenticated', role: 'authenticated', email: EU.email,
  app_metadata: { provider: 'email' }, user_metadata: { nome: EU.nome }, created_at: '2026-10-01T12:00:00Z',
}
const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: EU.id, role: 'authenticated', aud: 'authenticated', exp, email: EU.email })}.demo`
const sessao = { access_token: token, refresh_token: 'demo', token_type: 'bearer', expires_in: 2592000, expires_at: exp, user: usuario }

export const pedidos = [] // o que o app pediu (pra descobrir o que falta)

export async function instalarDemo(contexto, { registrar = false } = {}) {
  await contexto.addInitScript(([chave, valor]) => localStorage.setItem(chave, valor), [CHAVE_DA_SESSAO, JSON.stringify(sessao)])
  await contexto.route(`${SUPABASE}/**`, async (rota) => {
    const pedido = rota.request()
    const url = new URL(pedido.url())
    const metodo = pedido.method()
    if (metodo === 'OPTIONS') return rota.fulfill({ status: 204, headers: cors() })
    const resposta = responder(metodo, url, pedido)
    if (registrar) pedidos.push(`${metodo} ${url.pathname}${url.search ? '?' + decodeURIComponent(url.search.slice(1)) : ''}${resposta.vazio ? '   <- VAZIO' : ''}`)
    return rota.fulfill({ status: resposta.status ?? 200, headers: { ...cors(), 'content-type': 'application/json', ...(resposta.headers ?? {}) }, body: resposta.body === undefined ? '' : JSON.stringify(resposta.body) })
  })
}

function cors() {
  return { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': 'content-range' }
}

function responder(metodo, url, pedido) {
  const caminho = url.pathname
  if (caminho.startsWith('/auth/v1/')) {
    if (caminho.endsWith('/user')) return { body: usuario }
    if (caminho.endsWith('/token')) return { body: sessao }
    return { body: {} }
  }
  if (caminho.startsWith('/rest/v1/rpc/')) {
    const nome = caminho.split('/').pop()
    const f = DADOS.rpc?.[nome]
    return f ? { body: f(pedido.postDataJSON?.() ?? {}) } : { body: null, vazio: true }
  }
  if (caminho.startsWith('/rest/v1/')) {
    const tabela = caminho.split('/').pop()
    // Escrita (voto, escolha do Explorar, etc.): finge que deu certo e não guarda nada
    if (metodo !== 'GET' && metodo !== 'HEAD') return { status: metodo === 'POST' ? 201 : 200, body: [] }
    let linhas = typeof DADOS.tabelas[tabela] === 'function' ? DADOS.tabelas[tabela](url) : DADOS.tabelas[tabela]
    const vazio = linhas === undefined
    linhas = filtrar(linhas ?? [], url.searchParams)
    const headers = { 'content-range': `0-${Math.max(0, linhas.length - 1)}/${linhas.length}` }
    if (metodo === 'HEAD') return { headers, vazio }
    const umSo = (pedido.headers()['accept'] ?? '').includes('vnd.pgrst.object')
    if (umSo) return linhas[0] ? { body: linhas[0], headers } : { status: 406, body: { message: 'sem linha' }, vazio: true }
    return { body: linhas, headers, vazio }
  }
  if (caminho.startsWith('/functions/v1/')) return { body: DADOS.funcoes?.[caminho.split('/').pop()] ?? {}, vazio: !DADOS.funcoes?.[caminho.split('/').pop()] }
  return { body: {}, vazio: true }
}

// Filtros simples do PostgREST: coluna=eq.x, in.(a,b), is.null, order, limit
function filtrar(linhas, params) {
  let r = [...linhas]
  for (const [chave, valor] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(chave) || chave.includes('.')) continue
    const [op, ...resto] = valor.split('.')
    const alvo = resto.join('.')
    if (op === 'eq') r = r.filter((l) => !(chave in l) || String(l[chave]) === alvo)
    else if (op === 'neq') r = r.filter((l) => !(chave in l) || String(l[chave]) !== alvo)
    else if (op === 'in') { const lista = alvo.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/"/g, '')); r = r.filter((l) => !(chave in l) || lista.includes(String(l[chave]))) }
    else if (op === 'is' && alvo === 'null') r = r.filter((l) => !(chave in l) || l[chave] == null)
    else if (op === 'not' && valor.startsWith('not.is.null')) r = r.filter((l) => !(chave in l) || l[chave] != null)
  }
  // order=data.desc,criado_em.desc (só colunas da própria tabela)
  const ordem = (params.get('order') ?? '').split(',').filter(Boolean).map((o) => o.split('.'))
  if (ordem.length) {
    r.sort((a, b) => {
      for (const [col, dir] of ordem) {
        if (a[col] === b[col] || !(col in a)) continue
        const cmp = a[col] > b[col] ? 1 : -1
        return dir === 'desc' ? -cmp : cmp
      }
      return 0
    })
  }
  const limite = Number(params.get('limit'))
  return limite ? r.slice(0, limite) : r
}
