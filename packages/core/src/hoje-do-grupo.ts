// "Hoje" com as reservas do grupo (spec 120a). Funções puras, sem import de valor
// (o teste carrega o arquivo direto). Testado em apps/web/tests/hoje-do-grupo.test.mjs.

// ---------- Quem chega e quem sai hoje ----------
type DestinoH = { id: string; nome: string; chegada: string | null; saida: string | null }
type TrajetoH = {
  id: string
  origem_id: string | null
  destino_id: string | null
  meio: string
  partida: string | null
  chegada: string | null
  link_reserva: string | null
  quem_busca_id?: string | null
  passageiros?: string[]
}

export type Movimento = {
  chave: string
  tipo: 'chega' | 'sai'
  hora: string // a hora que importa hoje: a da chegada (se chega hoje) ou a da saída
  trajetoId: string
  meio: string
  de: string
  para: string
  saiAs: string | null
  chegaAs: string | null
  pessoas: string[] // nomes; vazio = o comboio inteiro (spec 067)
  quemBusca: string | null // nome de quem vai buscar (só quando chega hoje)
  linkReserva: string | null
}

// Cada trajeto que sai ou chega hoje vira um bilhete. Se ele chega hoje, conta como "chega"
// (é quem o grupo espera); senão, como "sai". Ordem: pela hora.
export function quemChegaESaiHoje(
  dia: string,
  trajetos: TrajetoH[],
  destinos: DestinoH[],
  membros: { id: string; nome: string }[],
  diaDe: (instante: string) => string,
  horaDe: (instante: string) => string,
): Movimento[] {
  const nomeDo = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const saida: Movimento[] = []
  for (const t of trajetos) {
    const saiHoje = !!t.partida && diaDe(t.partida) === dia
    const chegaHoje = !!t.chegada && diaDe(t.chegada) === dia
    if (!saiHoje && !chegaHoje) continue
    const passageiros = t.passageiros ?? []
    // Todo mundo marcado também é "o comboio inteiro"
    const todos = passageiros.length === 0 || membros.every((m) => passageiros.includes(m.id))
    saida.push({
      chave: `m${t.id}`,
      tipo: chegaHoje ? 'chega' : 'sai',
      hora: chegaHoje ? horaDe(t.chegada!) : horaDe(t.partida!),
      trajetoId: t.id,
      meio: t.meio,
      de: nomeDo(t.origem_id),
      para: nomeDo(t.destino_id),
      saiAs: t.partida ? horaDe(t.partida) : null,
      chegaAs: t.chegada ? horaDe(t.chegada) : null,
      pessoas: todos ? [] : membros.filter((m) => passageiros.includes(m.id)).map((m) => m.nome),
      quemBusca: chegaHoje ? (membros.find((m) => m.id === t.quem_busca_id)?.nome ?? null) : null,
      linkReserva: t.link_reserva,
    })
  }
  return saida.sort((a, b) => a.hora.localeCompare(b.hora))
}

// ---------- Plano do dia ----------
type EventoH = { id: string; dia: string; hora: string | null; titulo: string; local: string | null; observacao: string | null }
type LugarH = { id: string; nome: string; endereco: string | null; latitude: number | null; longitude: number | null; visitado_em: string | null }
type RoteiroH = { destino_id: string; dias: string[][] }

export type ItemDoPlano = {
  chave: string
  hora: string // "" = sem hora
  titulo: string
  detalhe: string
  lugarId: string | null // quando é um lugar do roteiro (pro "Cheguei")
  eventoId: string | null // quando veio da agenda (pro "ver reserva")
  visitado: boolean
  alvo: { nome: string; endereco?: string | null; latitude?: number | null; longitude?: number | null }
}

// Qual dia do roteiro do destino é esse (0 = dia da chegada). Conta em UTC pra não sofrer com horário de verão.
export function indiceDoDia(chegada: string, dia: string): number {
  return Math.round((Date.parse(`${dia}T12:00:00Z`) - Date.parse(`${chegada}T12:00:00Z`)) / 86400000)
}

const normalizar = (s: string) => s.trim().toLowerCase()

// Os lugares do roteiro de hoje (spec 115) + os eventos da agenda de hoje (029).
// Evento com o mesmo nome de um lugar do roteiro (o "Montar os dias" cria assim) vira um item só, com a hora.
// Ordem: com hora (por hora), depois os do roteiro sem hora (na ordem do roteiro), depois eventos sem hora.
export function planoDoDia(
  dia: string,
  { destinos, eventos, roteiros, lugares }: { destinos: DestinoH[]; eventos: EventoH[]; roteiros: RoteiroH[]; lugares: LugarH[] },
): ItemDoPlano[] {
  const lugarDo = new Map(lugares.map((l) => [l.id, l]))
  const doRoteiro: LugarH[] = []
  for (const d of destinos) {
    if (!d.chegada || d.chegada > dia || (d.saida ?? d.chegada) < dia) continue
    const dias = roteiros.find((r) => r.destino_id === d.id)?.dias ?? []
    for (const id of dias[indiceDoDia(d.chegada, dia)] ?? []) {
      const l = lugarDo.get(id)
      if (l && !doRoteiro.includes(l)) doRoteiro.push(l)
    }
  }

  const itemDoLugar = (l: LugarH): ItemDoPlano => ({
    chave: `l${l.id}`,
    hora: '',
    titulo: l.nome,
    detalhe: l.endereco ?? '',
    lugarId: l.id,
    eventoId: null,
    visitado: !!l.visitado_em,
    alvo: { nome: l.nome, endereco: l.endereco, latitude: l.latitude, longitude: l.longitude },
  })

  const usados = new Set<string>()
  const comHora: ItemDoPlano[] = []
  const semHora: ItemDoPlano[] = []
  for (const e of eventos) {
    if (e.dia !== dia) continue
    const lugar = doRoteiro.find((l) => !usados.has(l.id) && normalizar(l.nome) === normalizar(e.titulo))
    if (lugar) usados.add(lugar.id)
    const item: ItemDoPlano = lugar
      ? { ...itemDoLugar(lugar), chave: `e${e.id}`, eventoId: e.id, hora: e.hora ? e.hora.slice(0, 5) : '', detalhe: [e.local, e.observacao].filter(Boolean).join(' · ') || (lugar.endereco ?? '') }
      : {
          chave: `e${e.id}`,
          hora: e.hora ? e.hora.slice(0, 5) : '',
          titulo: e.titulo,
          detalhe: [e.local, e.observacao].filter(Boolean).join(' · '),
          lugarId: null,
          eventoId: e.id,
          visitado: false,
          alvo: { nome: e.local || e.titulo },
        }
    ;(item.hora ? comHora : semHora).push(item)
  }
  comHora.sort((a, b) => a.hora.localeCompare(b.hora))
  return [...comHora, ...doRoteiro.filter((l) => !usados.has(l.id)).map(itemDoLugar), ...semHora]
}

// ---------- Reserva no cofre ----------
// O arquivo do cofre (spec 028) de cada trajeto, hospedagem ou item da agenda: o mais novo, se tiver mais de um
type CampoDoCofre = 'trajeto_id' | 'hospedagem_id' | 'evento_id'
export function arquivoDeCada<A extends { [C in CampoDoCofre]?: string | null } & { criado_em: string }>(arquivos: A[], campo: CampoDoCofre): Map<string, A> {
  const mapa = new Map<string, A>()
  for (const a of arquivos) {
    const id = a[campo]
    if (!id) continue
    const atual = mapa.get(id)
    if (!atual || a.criado_em > atual.criado_em) mapa.set(id, a)
  }
  return mapa
}

// ---------- Abre sozinho na viagem ----------
// A viagem que está acontecendo hoje (a que começou por último, se tiver mais de uma)
export function viagemAcontecendo<V extends { dataInicio: string | null; dataFim: string | null }>(viagens: V[], dia: string): V | null {
  const agora = viagens.filter((v) => v.dataInicio && v.dataInicio <= dia && (v.dataFim ?? v.dataInicio) >= dia)
  return agora.sort((a, b) => b.dataInicio!.localeCompare(a.dataInicio!))[0] ?? null
}
