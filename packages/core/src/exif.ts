// Onde a foto foi tirada (spec 108, K4): lê o GPS do EXIF de um JPEG, antes de comprimir
// (a compressão apaga o EXIF). Puro (só Uint8Array/DataView), pra dar pra testar.

export function gpsDoJpeg(bytes: Uint8Array): { latitude: number; longitude: number } | null {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null // não é JPEG
  let i = 2
  while (i + 4 <= v.byteLength) {
    const marcador = v.getUint16(i)
    const tamanho = v.getUint16(i + 2)
    if (marcador === 0xffe1 && i + 10 <= v.byteLength && v.getUint32(i + 4) === 0x45786966) return lerTiff(v, i + 10) // "Exif"
    if ((marcador & 0xff00) !== 0xff00 || marcador === 0xffda) return null // começou a imagem: sem EXIF
    i += 2 + tamanho
  }
  return null
}

function lerTiff(v: DataView, base: number) {
  try {
    const le = v.getUint16(base) === 0x4949 // "II" = little endian
    const u16 = (o: number) => v.getUint16(base + o, le)
    const u32 = (o: number) => v.getUint32(base + o, le)
    const entradas = (ifd: number) => {
      const n = u16(ifd)
      return Array.from({ length: n }, (_, k) => {
        const e = ifd + 2 + k * 12
        return { tag: u16(e), tipo: u16(e + 2), qtd: u32(e + 4), valor: e + 8 }
      })
    }
    const gpsPtr = entradas(u32(4)).find((e) => e.tag === 0x8825)
    if (!gpsPtr) return null
    const gps = entradas(u32(gpsPtr.valor))
    const ref = (tag: number) => {
      const e = gps.find((x) => x.tag === tag)
      return e ? String.fromCharCode(v.getUint8(base + e.valor)) : null
    }
    const graus = (tag: number) => {
      const e = gps.find((x) => x.tag === tag)
      if (!e || e.tipo !== 5 || e.qtd !== 3) return null
      const o = u32(e.valor)
      const r = (k: number) => u32(o + k * 8) / (u32(o + k * 8 + 4) || 1)
      return r(0) + r(1) / 60 + r(2) / 3600
    }
    const lat = graus(2)
    const lng = graus(4)
    if (lat === null || lng === null) return null
    const latitude = ref(1) === 'S' ? -lat : lat
    const longitude = ref(3) === 'W' ? -lng : lng
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || (latitude === 0 && longitude === 0)) return null
    return { latitude: Math.round(latitude * 1e6) / 1e6, longitude: Math.round(longitude * 1e6) / 1e6 }
  } catch {
    return null // EXIF quebrado: segue sem localização
  }
}
