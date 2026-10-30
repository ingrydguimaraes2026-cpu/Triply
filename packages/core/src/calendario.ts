// Calendário da viagem (spec 036): gera um arquivo .ics (padrão do Google, Apple e Outlook)
// com trajetos, pontos de encontro, eventos da agenda, check-in/out e os dias em cada destino.
// Puro, testado em apps/web/tests/calendario.test.mjs.

export type ItemDoCalendario = {
  uid: string // único e estável (re-importar atualiza em vez de duplicar)
  titulo: string
  // Com hora: instante ISO ("2026-11-10T08:30:00Z") ou hora local sem fuso ("2026-11-10T08:30").
  // Dia inteiro: só a data ("2026-11-10").
  inicio: string
  fim?: string | null
  local?: string | null
  descricao?: string | null
}

// Texto do .ics: escapa \ ; , e quebras de linha
function escapar(texto: string): string {
  return texto.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

// Linhas do .ics têm no máximo 75 bytes; o resto continua na linha de baixo começando com espaço
function dobrar(linha: string): string {
  const partes: string[] = []
  let atual = ''
  let bytes = 0
  for (const ch of linha) {
    const tam = new TextEncoder().encode(ch).length
    if (bytes + tam > (partes.length ? 74 : 75)) {
      partes.push(atual)
      atual = ''
      bytes = 0
    }
    atual += ch
    bytes += tam
  }
  partes.push(atual)
  return partes.join('\r\n ')
}

const soDia = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

// "2026-11-10" → VALUE=DATE:20261110 · "2026-11-10T08:30" → 20261110T083000 (hora local) · ISO com Z → UTC
function data(valor: string): { param: string; texto: string } {
  if (soDia(valor)) return { param: ';VALUE=DATE', texto: valor.replace(/-/g, '') }
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(valor)) {
    const d = new Date(valor)
    const p = (n: number) => String(n).padStart(2, '0')
    return { param: '', texto: `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z` }
  }
  const [dia, hora = '00:00'] = valor.split('T')
  const [h, m = '00', s = '00'] = hora.split(':')
  return { param: '', texto: `${dia.replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}${s.slice(0, 2).padStart(2, '0')}` }
}

// Dia seguinte (o fim de um evento de dia inteiro no .ics é exclusivo)
function diaSeguinte(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function gerarIcs(nomeDaViagem: string, itens: ItemDoCalendario[], agora: Date = new Date()): string {
  const carimbo = data(agora.toISOString()).texto
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Together//Viagem em grupo//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapar(nomeDaViagem)}`,
  ]
  for (const item of itens) {
    const inicio = data(item.inicio)
    let fim = item.fim ? data(item.fim) : null
    // Dia inteiro: o fim é o dia seguinte ao último
    if (soDia(item.inicio)) fim = data(diaSeguinte(item.fim && soDia(item.fim) ? item.fim : item.inicio))
    linhas.push(
      'BEGIN:VEVENT',
      `UID:${item.uid}@together`,
      `DTSTAMP:${carimbo}`,
      `DTSTART${inicio.param}:${inicio.texto}`,
      ...(fim ? [`DTEND${fim.param}:${fim.texto}`] : []),
      `SUMMARY:${escapar(item.titulo)}`,
      ...(item.local ? [`LOCATION:${escapar(item.local)}`] : []),
      ...(item.descricao ? [`DESCRIPTION:${escapar(item.descricao)}`] : []),
      'END:VEVENT',
    )
  }
  linhas.push('END:VCALENDAR')
  return linhas.map(dobrar).join('\r\n') + '\r\n'
}

// Nome do arquivo: "Riviera 2026" → "riviera-2026.ics"
export function nomeDoArquivoIcs(nomeDaViagem: string): string {
  const base = nomeDaViagem
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'viagem'}.ics`
}
