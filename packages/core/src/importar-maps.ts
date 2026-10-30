// Importar lista do Google Maps (spec 079). O Google Takeout exporta cada lista salva como CSV
// ("Title,Note,URL[,Comment]"). Aqui só a leitura (pura). Teste: apps/web/tests/importar-maps.test.mjs

export type LugarImportado = { nome: string; observacao: string | null; link: string | null }

// Divide uma linha de CSV respeitando aspas ("a, b" é um campo só; "" vira ")
function campos(linha: string): string[] {
  const saida: string[] = []
  let atual = ''
  let aspas = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') {
        atual += '"'
        i++
      } else if (c === '"') aspas = false
      else atual += c
    } else if (c === '"') aspas = true
    else if (c === ',') {
      saida.push(atual)
      atual = ''
    } else atual += c
  }
  saida.push(atual)
  return saida.map((s) => s.trim())
}

// Junta linhas quebradas dentro de aspas (nota com Enter)
function linhas(texto: string): string[] {
  const saida: string[] = []
  let atual = ''
  let aspas = 0
  for (const linha of texto.replace(/^﻿/, '').split(/\r?\n/)) {
    atual = atual ? `${atual}\n${linha}` : linha
    aspas += (linha.match(/"/g) ?? []).length
    if (aspas % 2 === 0) {
      saida.push(atual)
      atual = ''
      aspas = 0
    }
  }
  if (atual) saida.push(atual)
  return saida.filter((l) => l.trim())
}

export function lerListaDoGoogle(csv: string): LugarImportado[] {
  const todas = linhas(csv)
  if (todas.length === 0) return []
  const cab = campos(todas[0]).map((c) => c.toLowerCase())
  const iTitulo = cab.findIndex((c) => c === 'title' || c === 'título' || c === 'titulo' || c === 'nome')
  if (iTitulo === -1) return []
  const iNota = cab.findIndex((c) => c === 'note' || c === 'nota')
  const iUrl = cab.findIndex((c) => c === 'url' || c === 'link')
  const iComentario = cab.findIndex((c) => c === 'comment' || c === 'comentário' || c === 'comentario')
  const vistos = new Set<string>()
  const lista: LugarImportado[] = []
  for (const linha of todas.slice(1)) {
    const c = campos(linha)
    const nome = (c[iTitulo] ?? '').slice(0, 120)
    if (!nome || vistos.has(nome.toLowerCase())) continue
    vistos.add(nome.toLowerCase())
    const obs = [iNota >= 0 ? c[iNota] : '', iComentario >= 0 ? c[iComentario] : ''].filter(Boolean).join(' · ')
    const link = iUrl >= 0 && /^https:\/\//.test(c[iUrl] ?? '') ? c[iUrl] : null
    lista.push({ nome, observacao: obs ? obs.slice(0, 500) : null, link })
  }
  return lista.slice(0, 200)
}
