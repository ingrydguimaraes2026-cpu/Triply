// Regras do feed de fotos (spec 014). Funções puras, testadas em tests/feed.test.mjs.

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// "agora", "5 min", "3 h", "2 d" e, depois de uma semana, a data ("12 out", ou "12 out 2025" se for de outro ano)
export function tempoAtras(iso: string, agora = new Date()) {
  const quando = new Date(iso)
  const segundos = Math.max(0, (agora.getTime() - quando.getTime()) / 1000)
  if (segundos < 60) return 'agora'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `${dias} d`
  const data = `${quando.getDate()} ${MESES[quando.getMonth()]}`
  return quando.getFullYear() === agora.getFullYear() ? data : `${data} ${quando.getFullYear()}`
}

// "Curtido por você", "Curtido por Ingryd e mais 2". Sem curtida → null.
export function textoDasCurtidas(curtidas: string[], meuId: string, nomeDe: (id: string) => string) {
  if (curtidas.length === 0) return null
  const primeiro = curtidas.includes(meuId) ? 'você' : nomeDe(curtidas[0])
  const outros = curtidas.length - 1
  return outros === 0 ? `Curtido por ${primeiro}` : `Curtido por ${primeiro} e mais ${outros}`
}

// Curtir/descurtir sem esperar o servidor: devolve a lista nova
export function alternarCurtida(curtidas: string[], meuId: string) {
  return curtidas.includes(meuId) ? curtidas.filter((id) => id !== meuId) : [...curtidas, meuId]
}

// Apaga o comentário: quem comentou, quem postou ou o ADM (o banco confere de novo)
export function podeApagarComentario(autorDoComentario: string, autorDoPost: string, meuId: string, euSouAdm: boolean) {
  return autorDoComentario === meuId || autorDoPost === meuId || euSouAdm
}
