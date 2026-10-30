// Zip simples, sem compressão (spec 099). Foto JPEG já vem comprimida: guardar como está é
// rápido e não aumenta o tamanho. Puro (só Uint8Array), pra dar pra testar.

export type ArquivoDoZip = { nome: string; bytes: Uint8Array; data?: Date }

const TABELA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// Nome em UTF-8 sem TextEncoder (o core não tem a lib DOM)
function utf8(texto: string): Uint8Array {
  const saida: number[] = []
  for (const ch of texto) {
    const c = ch.codePointAt(0)!
    if (c < 0x80) saida.push(c)
    else if (c < 0x800) saida.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    else if (c < 0x10000) saida.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    else saida.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
  }
  return new Uint8Array(saida)
}

function horaDos(data: Date) {
  const hora = (data.getHours() << 11) | (data.getMinutes() << 5) | Math.floor(data.getSeconds() / 2)
  const dia = ((Math.max(1980, data.getFullYear()) - 1980) << 9) | ((data.getMonth() + 1) << 5) | data.getDate()
  return { hora, dia }
}

export function montarZip(arquivos: ArquivoDoZip[]): Uint8Array {
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let posicao = 0
  for (const a of arquivos) {
    const nome = utf8(a.nome)
    const crc = crc32(a.bytes)
    const { hora, dia } = horaDos(a.data ?? new Date(2026, 0, 1))
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true) // versão
    local.setUint16(6, 0x0800, true) // nome em UTF-8
    local.setUint16(8, 0, true) // sem compressão
    local.setUint16(10, hora, true)
    local.setUint16(12, dia, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, a.bytes.length, true)
    local.setUint32(22, a.bytes.length, true)
    local.setUint16(26, nome.length, true)
    local.setUint16(28, 0, true)
    partes.push(new Uint8Array(local.buffer), nome, a.bytes)

    const c = new DataView(new ArrayBuffer(46))
    c.setUint32(0, 0x02014b50, true)
    c.setUint16(4, 20, true)
    c.setUint16(6, 20, true)
    c.setUint16(8, 0x0800, true)
    c.setUint16(10, 0, true)
    c.setUint16(12, hora, true)
    c.setUint16(14, dia, true)
    c.setUint32(16, crc, true)
    c.setUint32(20, a.bytes.length, true)
    c.setUint32(24, a.bytes.length, true)
    c.setUint16(28, nome.length, true)
    c.setUint32(42, posicao, true)
    central.push(new Uint8Array(c.buffer), nome)
    posicao += 30 + nome.length + a.bytes.length
  }
  const tamanhoCentral = central.reduce((s, p) => s + p.length, 0)
  const fim = new DataView(new ArrayBuffer(22))
  fim.setUint32(0, 0x06054b50, true)
  fim.setUint16(8, arquivos.length, true)
  fim.setUint16(10, arquivos.length, true)
  fim.setUint32(12, tamanhoCentral, true)
  fim.setUint32(16, posicao, true)
  const tudo = [...partes, ...central, new Uint8Array(fim.buffer)]
  const saida = new Uint8Array(tudo.reduce((s, p) => s + p.length, 0))
  let i = 0
  for (const p of tudo) {
    saida.set(p, i)
    i += p.length
  }
  return saida
}

// "2026-11-20_Nice_03.jpg": dá pra achar no computador depois
export function nomeDaFotoNoZip(dia: string, destino: string | null, numero: number): string {
  const lugar = (destino ?? 'viagem').replace(/[\\/:*?"<>|]/g, '').trim() || 'viagem'
  return `${dia}_${lugar}_${String(numero).padStart(2, '0')}.jpg`
}
