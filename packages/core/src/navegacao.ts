// Ir até o lugar (spec 040): links pros apps de navegação e de corrida, com o destino pronto.
// Puro, testado em apps/web/tests/navegacao.test.mjs.

export type Alvo = {
  nome: string // "Le Safari" / "Recepção do hotel"
  endereco?: string | null // "Cours Saleya 1, Nice" (quando tem)
  cidade?: string | null // ajuda a busca quando só tem o nome
  latitude?: number | null
  longitude?: number | null
}

export type LinkDeApp = { chave: string; nome: string; url: string; preenche: boolean }

const temPonto = (a: Alvo) => typeof a.latitude === 'number' && typeof a.longitude === 'number'

// Texto de busca: endereço, ou "nome, cidade"
export function textoDoAlvo(a: Alvo): string {
  if (a.endereco?.trim()) return a.endereco.trim()
  return [a.nome.trim(), a.cidade?.trim()].filter(Boolean).join(', ')
}

export function linksDeNavegacao(a: Alvo): LinkDeApp[] {
  const texto = textoDoAlvo(a)
  const coord = temPonto(a) ? `${a.latitude},${a.longitude}` : null
  const q = encodeURIComponent
  return [
    {
      chave: 'google',
      nome: 'Google Maps',
      url: `https://www.google.com/maps/dir/?api=1&destination=${q(coord ?? texto)}`,
      preenche: true,
    },
    {
      chave: 'waze',
      nome: 'Waze',
      url: coord ? `https://waze.com/ul?ll=${q(coord)}&navigate=yes` : `https://waze.com/ul?q=${q(texto)}&navigate=yes`,
      preenche: true,
    },
    {
      chave: 'apple',
      nome: 'Apple Mapas',
      url: `https://maps.apple.com/?daddr=${q(coord ?? texto)}`,
      preenche: true,
    },
    {
      chave: 'citymapper',
      nome: 'Citymapper',
      url: coord
        ? `https://citymapper.com/directions?endcoord=${q(coord)}&endname=${q(a.nome)}`
        : `https://citymapper.com/directions?endaddress=${q(texto)}&endname=${q(a.nome)}`,
      preenche: true,
    },
  ]
}

// Corrida: só o Uber aceita o destino no link. Bolt e Free Now abrem o app; o endereço vai copiado.
export function linksDeCorrida(a: Alvo): LinkDeApp[] {
  const texto = textoDoAlvo(a)
  // Montado na mão: o core não tem URLSearchParams (roda na web e no React Native)
  const partes: [string, string][] = [
    ['action', 'setPickup'],
    ['pickup', 'my_location'],
  ]
  if (temPonto(a)) {
    partes.push(['dropoff[latitude]', String(a.latitude)], ['dropoff[longitude]', String(a.longitude)])
  }
  partes.push(['dropoff[nickname]', a.nome], ['dropoff[formatted_address]', texto])
  const query = partes.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  return [
    { chave: 'uber', nome: 'Uber', url: `https://m.uber.com/ul/?${query}`, preenche: true },
    { chave: 'bolt', nome: 'Bolt', url: 'https://bolt.eu/', preenche: false },
    { chave: 'freenow', nome: 'FREENOW', url: 'https://www.free-now.com/', preenche: false },
  ]
}

// ---------- Indicar lugares pra um amigo (N8, spec 103) ----------
// Texto pronto pro WhatsApp com os lugares de um destino. Links do Google Maps (o amigo não
// precisa ter o app). Fomos e recomendamos primeiro, depois os mais curtidos.

type LugarParaIndicar = {
  nome: string
  tipo: string
  votos: number
  visitado: boolean
  latitude?: number | null
  longitude?: number | null
  link?: string | null
  observacao?: string | null
}

const EMOJI: Record<string, string> = { comida: '🍽️', passeio: '📍', guarda_volumes: '🧳', outro: '⭐' }

export function textoParaIndicar(destino: string, lugares: LugarParaIndicar[]): string {
  const lista = lugares
    .filter((l) => l.tipo !== 'guarda_volumes' || l.visitado)
    .sort((a, b) => Number(b.visitado) - Number(a.visitado) || b.votos - a.votos || a.nome.localeCompare(b.nome))
  const linhas = lista.map((l) => {
    const onde =
      l.latitude != null && l.longitude != null
        ? `https://www.google.com/maps/search/?api=1&query=${l.latitude},${l.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.nome} ${destino}`)}`
    const dica = l.observacao?.trim() ? ` (${l.observacao.trim().slice(0, 80)})` : ''
    return `${EMOJI[l.tipo] ?? '📍'} ${l.nome}${l.visitado ? ' ✓ fomos e recomendo' : ''}${dica}\n${onde}`
  })
  return [`Minhas dicas em ${destino}:`, '', ...linhas.flatMap((l) => [l, '']), 'Montado no Together'].join('\n')
}
