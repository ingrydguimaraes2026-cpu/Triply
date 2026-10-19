// Rota e passeios (spec 004, layout com mapa). Funções puras, testadas em tests/rota.test.mjs.

type Lugar = { id: string; nome: string; pais: string | null }
type TrajetoBase = {
  id: string
  origem_id: string | null
  destino_id: string | null
  meio: string
  partida: string | null
  bate_e_volta: boolean
}

// "Nice, França" (só o nome se o país vier vazio ou repetido)
export function nomeNoMapa(lugar: Pick<Lugar, 'nome' | 'pais'>) {
  return lugar.pais && lugar.pais !== lugar.nome ? `${lugar.nome}, ${lugar.pais}` : lugar.nome
}

// Cada par de destinos seguidos é um trecho (Paris → Nice, Nice → Mônaco...)
export function trechosDaRota<D>(destinos: D[]) {
  return destinos.slice(1).map((para, i) => ({ de: destinos[i], para }))
}

export type ModoNoMapa = 'transporte' | 'carro' | 'a_pe'

export const MODOS_NO_MAPA: { chave: ModoNoMapa; nome: string; flag: string }[] = [
  { chave: 'transporte', nome: 'Trem e ônibus', flag: 'r' },
  { chave: 'carro', nome: 'Carro', flag: 'd' },
  { chave: 'a_pe', nome: 'A pé', flag: 'w' },
]

// Meio do trajeto → modo do mapa (avião e barco: o mapa mostra o caminho de carro, só pra ter a ideia)
export function modoDoMeio(meio: string): ModoNoMapa {
  if (meio === 'carro' || meio === 'aviao' || meio === 'barco') return 'carro'
  if (meio === 'a_pe') return 'a_pe'
  return 'transporte'
}

/**
 * Mapa do Google com o caminho passando pelos lugares, na ordem.
 * `embed` vai no iframe (sem chave de API); `abrir` abre o Google Maps completo com a rota.
 * Um lugar só: mostra o lugar.
 */
export function linkDoMapaRota(lugares: Pick<Lugar, 'nome' | 'pais'>[], modo: ModoNoMapa = 'transporte') {
  const nomes = lugares.map(nomeNoMapa)
  const flag = MODOS_NO_MAPA.find((m) => m.chave === modo)!.flag
  if (nomes.length === 0) return null
  if (nomes.length === 1) {
    return {
      embed: `https://maps.google.com/maps?${new URLSearchParams({ q: nomes[0], z: '12', hl: 'pt-BR', output: 'embed' })}`,
      abrir: `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: nomes[0] })}`,
    }
  }
  const [origem, ...resto] = nomes
  const travelmode = modo === 'transporte' ? 'transit' : modo === 'carro' ? 'driving' : 'walking'
  const abrir = new URLSearchParams({ api: '1', origin: origem, destination: resto[resto.length - 1], travelmode })
  if (resto.length > 1) abrir.set('waypoints', resto.slice(0, -1).join('|'))
  return {
    embed: `https://maps.google.com/maps?${new URLSearchParams({
      saddr: origem,
      daddr: resto.join(' to:'),
      dirflg: flag,
      hl: 'pt-BR',
      output: 'embed',
    })}`,
    abrir: `https://www.google.com/maps/dir/?${abrir}`,
  }
}

// Comparadores pra ver como ir de um lugar pro outro (trem, ônibus, avião, com preço)
export function linksDoTrecho(de: Pick<Lugar, 'nome' | 'pais'>, para: Pick<Lugar, 'nome' | 'pais'>) {
  const slug = (l: Pick<Lugar, 'nome' | 'pais'>) => encodeURIComponent(nomeNoMapa(l).replace(/,/g, '').replace(/\s+/g, '-'))
  return [
    { chave: 'rome2rio', nome: 'Comparar no Rome2Rio', url: `https://www.rome2rio.com/map/${slug(de)}/${slug(para)}` },
    { chave: 'maps', nome: 'Rota no Google Maps', url: linkDoMapaRota([de, para], 'transporte')!.abrir },
  ]
}

export type Passeio<T> = { ida: T; volta: T | null }

/**
 * Junta os bate-e-volta em passeios: a ida (A → B) com a volta (B → A).
 * A volta é a próxima no sentido contrário, no mesmo dia quando os dois têm horário.
 */
export function agruparPasseios<T extends TrajetoBase>(trajetos: T[], dia: (horario: string) => string): Passeio<T>[] {
  const bev = trajetos
    .filter((t) => t.bate_e_volta)
    .sort((a, b) => (a.partida ?? '￿').localeCompare(b.partida ?? '￿'))
  const usados = new Set<string>()
  const passeios: Passeio<T>[] = []
  for (const ida of bev) {
    if (usados.has(ida.id)) continue
    usados.add(ida.id)
    const volta =
      bev.find(
        (v) =>
          !usados.has(v.id) &&
          v.origem_id === ida.destino_id &&
          v.destino_id === ida.origem_id &&
          (!ida.partida || !v.partida || (v.partida >= ida.partida && dia(v.partida) === dia(ida.partida))),
      ) ?? null
    if (volta) usados.add(volta.id)
    passeios.push({ ida, volta })
  }
  return passeios
}
