// Baixa um arquivo gerado na hora (calendário .ics, planilha .csv)
export function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const arquivo = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Baixa bytes prontos (ex.: o .zip das fotos, spec 099)
export function baixarBytes(nome: string, bytes: Uint8Array, tipo: string) {
  const arquivo = new Blob([bytes as BlobPart], { type: tipo })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
