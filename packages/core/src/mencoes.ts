// Menções @nome (spec 043). Sem imports de propósito: a função do servidor (avisar-mencao) tem uma cópia
// de `acharMencoes`. Testado em apps/web/tests/mencoes.test.mjs.

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
export function acharMencoes(texto: string, pessoas: Pessoa[]): string[] {
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

// Pedaços do texto pra pintar as menções na tela
export function partesComMencoes(texto: string, pessoas: Pessoa[]): { texto: string; pessoaId?: string }[] {
  const t = normalizar(texto)
  const partes: { texto: string; pessoaId?: string }[] = []
  let desde = 0
  for (let i = t.indexOf('@'); i !== -1; i = t.indexOf('@', i + 1)) {
    if (i > 0 && LETRA.test(t[i - 1])) continue
    const resto = t.slice(i + 1)
    let melhor: { id: string; tam: number } | null = null
    for (const p of pessoas) {
      for (const a of apelidos(p)) {
        if (resto.startsWith(a) && !LETRA.test(resto[a.length] ?? '') && (!melhor || a.length > melhor.tam)) melhor = { id: p.id, tam: a.length }
      }
    }
    if (!melhor) continue
    if (i > desde) partes.push({ texto: texto.slice(desde, i) })
    partes.push({ texto: texto.slice(i, i + 1 + melhor.tam), pessoaId: melhor.id })
    desde = i + 1 + melhor.tam
    i = desde - 1
  }
  if (desde < texto.length) partes.push({ texto: texto.slice(desde) })
  return partes
}

// Sugestões enquanto digita: o texto termina em "@in" → pessoas cujo nome começa com "in"
export function sugerirMencoes<P extends Pessoa>(texto: string, pessoas: P[]): { busca: string; pessoas: P[] } | null {
  const m = /(^|\s)@([^\s@]*)$/.exec(texto)
  if (!m) return null
  const busca = normalizar(m[2])
  const lista = pessoas.filter((p) => apelidos(p).some((a) => a.startsWith(busca))).slice(0, 5)
  return lista.length ? { busca: m[2], pessoas: lista } : null
}

// Completa a menção: "oi @in" + Ingryd → "oi @Ingryd "
export function completarMencao(texto: string, pessoa: Pessoa): string {
  const primeiro = pessoa.nome.trim().split(/\s+/)[0]
  return texto.replace(/@([^\s@]*)$/, `@${primeiro} `)
}
