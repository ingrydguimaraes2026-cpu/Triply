// Detector de furos (spec 092): junta o que pode dar errado no plano num lugar só.
// Puro (sem Supabase), pra dar pra testar. As datas são texto "AAAA-MM-DD".

export type Furo = {
  chave: string
  gravidade: 'alta' | 'media'
  texto: string
  aba: 'hospedagem' | 'transportes' | '' // onde resolver ('' = roteiro, na Overview)
}

type Destino = { id: string; nome: string; chegada: string | null; saida: string | null }
type Trajeto = { id: string; origem_id: string | null; destino_id: string | null; partida: string | null; chegada: string | null }
type Escolhida = { destinoId: string; nome: string; checkin: string | null; checkout: string | null }

const DIA = 86_400_000
const curta = (data: string) => {
  const [, m, d] = data.split('-')
  return `${Number(d)}/${m}`
}
const somarDias = (data: string, n: number) => new Date(Date.parse(`${data}T12:00:00Z`) + n * DIA).toISOString().slice(0, 10)
const noites = (de: string, ate: string) => Math.round((Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / DIA)
// Dia do horário no fuso do aparelho (mesma regra da agenda)
const diaDe = (horario: string) => {
  const d = new Date(horario)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function encontrarFuros({
  destinos,
  trajetos,
  escolhidas,
}: {
  destinos: Destino[]
  trajetos: Trajeto[]
  escolhidas: Escolhida[]
}): Furo[] {
  const furos: Furo[] = []
  const nome = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'

  for (const d of destinos) {
    // Destino sem datas: nada mais dá pra conferir nele
    if (!d.chegada) {
      furos.push({ chave: `datas-${d.id}`, gravidade: 'media', texto: `${d.nome} ainda sem datas`, aba: '' })
      continue
    }
    const saida = d.saida ?? d.chegada
    const n = noites(d.chegada, saida)
    if (n <= 0) continue // bate e volta: não dorme lá
    const casa = escolhidas.find((e) => e.destinoId === d.id)
    if (!casa) {
      furos.push({ chave: `cama-${d.id}`, gravidade: 'alta', texto: `${d.nome}: ${n === 1 ? '1 noite' : `${n} noites`} sem hospedagem escolhida`, aba: 'hospedagem' })
      continue
    }
    // Hospedagem escolhida não cobre todas as noites
    if (casa.checkin && casa.checkin > d.chegada) {
      const sem = noites(d.chegada, casa.checkin)
      furos.push({
        chave: `cama-antes-${d.id}`,
        gravidade: 'alta',
        texto: `${d.nome}: chega ${curta(d.chegada)}, mas o check-in em ${casa.nome} é ${curta(casa.checkin)} (${sem === 1 ? '1 noite' : `${sem} noites`} sem cama)`,
        aba: 'hospedagem',
      })
    }
    if (casa.checkout && casa.checkout < saida) {
      const sem = noites(casa.checkout, saida)
      furos.push({
        chave: `cama-depois-${d.id}`,
        gravidade: 'alta',
        texto: `${d.nome}: o check-out em ${casa.nome} é ${curta(casa.checkout)}, mas vocês ficam até ${curta(saida)} (${sem === 1 ? '1 noite' : `${sem} noites`} sem cama)`,
        aba: 'hospedagem',
      })
    }
    // Sai da cidade antes do check-out: paga noite que não usa
    const partida = trajetos.find((t) => t.origem_id === d.id && t.partida)
    if (casa.checkout && partida?.partida && diaDe(partida.partida) < casa.checkout) {
      furos.push({
        chave: `sai-antes-${d.id}`,
        gravidade: 'media',
        texto: `Vocês saem de ${d.nome} dia ${curta(diaDe(partida.partida))}, mas o check-out é ${curta(casa.checkout)}`,
        aba: 'hospedagem',
      })
    }
  }

  // Falta transporte entre destinos seguidos (na ordem do roteiro)
  for (let i = 0; i + 1 < destinos.length; i++) {
    const de = destinos[i]
    const para = destinos[i + 1]
    if (!trajetos.some((t) => t.origem_id === de.id && t.destino_id === para.id)) {
      furos.push({ chave: `trecho-${de.id}-${para.id}`, gravidade: 'media', texto: `Falta o transporte ${de.nome} → ${para.nome}`, aba: 'transportes' })
    }
  }

  // Trajetos que se atropelam: o próximo sai antes do anterior chegar
  const comHora = trajetos.filter((t) => t.partida).sort((a, b) => (a.partida! < b.partida! ? -1 : 1))
  for (let i = 0; i + 1 < comHora.length; i++) {
    const a = comHora[i]
    const b = comHora[i + 1]
    if (a.chegada && b.partida! < a.chegada) {
      furos.push({
        chave: `atropela-${a.id}-${b.id}`,
        gravidade: 'alta',
        texto: `${nome(b.origem_id)} → ${nome(b.destino_id)} sai antes de ${nome(a.origem_id)} → ${nome(a.destino_id)} chegar`,
        aba: 'transportes',
      })
    }
  }

  // Destino que chega antes do anterior sair (datas do roteiro sobrepostas demais)
  for (let i = 0; i + 1 < destinos.length; i++) {
    const a = destinos[i]
    const b = destinos[i + 1]
    if (a.chegada && b.chegada && b.chegada < (a.saida ?? a.chegada)) {
      furos.push({ chave: `sobrepoe-${a.id}-${b.id}`, gravidade: 'media', texto: `${b.nome} começa ${curta(b.chegada)}, antes de sair de ${a.nome} (${curta(a.saida ?? a.chegada)})`, aba: '' })
    }
    // Buraco entre destinos: sai de um e só chega no outro dias depois
    if (a.chegada && b.chegada && b.chegada > somarDias(a.saida ?? a.chegada, 0)) {
      const vazio = noites(a.saida ?? a.chegada, b.chegada)
      furos.push({ chave: `buraco-${a.id}-${b.id}`, gravidade: 'alta', texto: `Entre ${a.nome} e ${b.nome}: ${vazio === 1 ? '1 noite' : `${vazio} noites`} sem destino`, aba: '' })
    }
  }

  return furos.sort((x, y) => (x.gravidade === y.gravidade ? 0 : x.gravidade === 'alta' ? -1 : 1))
}
