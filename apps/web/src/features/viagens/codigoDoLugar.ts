// "Lisboa" → "LIS": sem acento, 3 letras, como o código de um aeroporto
export function codigoDoLugar(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase()
}
