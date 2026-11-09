// Feriados nas datas da viagem (spec 095). Dados do Nager.Date (grátis, sem chave).
// Puro, pra dar pra testar.

export type FeriadoDaApi = { date: string; localName: string; name: string; countryCode: string; global: boolean; counties: string[] | null }

export type Feriado = { data: string; nome: string; nomeLocal: string; pais: string; destino: string; regional: boolean }

export function urlDosFeriados(ano: number, codigoDoPais: string): string {
  return `https://date.nager.at/api/v3/PublicHolidays/${ano}/${codigoDoPais.toUpperCase()}`
}

// Quais (ano, país) buscar pra cobrir os destinos da viagem
export function consultasDeFeriados(destinos: { codigo: string | null; chegada: string | null; saida: string | null }[]): { ano: number; codigo: string }[] {
  const chaves = new Set<string>()
  for (const d of destinos) {
    if (!d.codigo || !d.chegada) continue
    for (const data of [d.chegada, d.saida ?? d.chegada]) chaves.add(`${data.slice(0, 4)}|${d.codigo.toUpperCase()}`)
  }
  return [...chaves].map((c) => {
    const [ano, codigo] = c.split('|')
    return { ano: Number(ano), codigo }
  })
}

// Feriados que caem enquanto o comboio está num destino daquele país
export function feriadosNaViagem(
  feriados: FeriadoDaApi[],
  destinos: { nome: string; codigo: string | null; chegada: string | null; saida: string | null }[],
): Feriado[] {
  const lista: Feriado[] = []
  const vistos = new Set<string>()
  for (const f of feriados) {
    for (const d of destinos) {
      if (!d.codigo || !d.chegada || d.codigo.toUpperCase() !== f.countryCode) continue
      if (f.date < d.chegada || f.date > (d.saida ?? d.chegada)) continue
      const chave = `${f.date}|${f.countryCode}|${f.name}`
      if (vistos.has(chave)) continue
      vistos.add(chave)
      lista.push({ data: f.date, nome: f.name, nomeLocal: f.localName, pais: f.countryCode, destino: d.nome, regional: !f.global })
    }
  }
  return lista.sort((a, b) => a.data.localeCompare(b.data))
}
