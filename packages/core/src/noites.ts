// Spec 123: hospedagem por noite. Junta destinos, opções de hospedagem e deslocamentos e responde
// "onde dormimos cada noite, perto de onde chegamos, e conseguimos entrar no horário?".
// Função pura. Teste: apps/web/tests/noites.test.mjs
import type { Tables } from './database'
import { diaNoFuso, horaNoFuso, montarAgendaDoDia, opcoesNoDia } from './agenda.ts'
import { avisosDoDia, type CasaDoDia } from './avisos-do-dia.ts'
import { contasDaOpcao, montarHospedagem, noitesDaOpcao, type Opcao } from './hospedagem.ts'

type Destino = Pick<Tables<'destinos'>, 'id' | 'nome' | 'pais' | 'chegada' | 'saida'>
type Trajeto = Pick<Tables<'trajetos'>, 'id' | 'origem_id' | 'destino_id' | 'meio' | 'partida' | 'chegada' | 'observacao'> &
  Partial<Pick<Tables<'trajetos'>, 'de_texto' | 'para_texto' | 'estacao_chegada' | 'para_lat' | 'para_lon' | 'situacao' | 'grupo_opcoes' | 'escolhida' | 'ultimo_do_dia'>>

export type EstadoDaCidade = 'sem-cama' | 'comparando' | 'escolhida' | 'reservada'

// Como o grupo chega na cidade: o último deslocamento do dia de chegada
export type ChegadaNaCidade = {
  hora: string | null // "01:10" (pode ser no dia seguinte)
  diaSeguinte: boolean
  instante: string | null
  lugar: string // "Santa Lucia" ou "Veneza"
  lat: number | null
  lon: number | null
}

export type CidadeDaNoite = {
  destino: Destino
  noites: number | null // null = sem datas
  dias: string[] // as noites (AAAA-MM-DD)
  estado: EstadoDaCidade
  escolhida: Opcao | null
  opcoes: Opcao[] // escolhida primeiro, depois mais votadas
  chegada: ChegadaNaCidade | null
  malas: { ate: string; lugar: string } | null // dia do check-out com horas até o próximo trecho
}

export type Passagem = { destino: Destino; dia: string | null; dormemEm: string | null; tipo: 'bate-e-volta' }

export type NoitesDaViagem = {
  cidades: CidadeDaNoite[]
  passagens: Passagem[]
  semCama: number // noites
  praReservar: number
  reservadas: number
  total: Record<string, number> // centavos por moeda (só as escolhidas)
  porPessoa: Record<string, number>
  pago: Record<string, number>
}

const dia = (data: string) => new Date(`${data}T12:00:00Z`)
const somarDias = (data: string, n: number) => {
  const d = dia(data)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Noites entre a chegada e a saída: chegada 4, saída 7 → 4, 5, 6
function diasDasNoites(chegada: string | null, saida: string | null): string[] {
  if (!chegada || !saida || saida <= chegada) return []
  const dias: string[] = []
  for (let d = chegada; d < saida && dias.length < 60; d = somarDias(d, 1)) dias.push(d)
  return dias
}

function chegadaNaCidade(destino: Destino, trajetos: Trajeto[]): ChegadaNaCidade | null {
  if (!destino.chegada) return null
  const doDia = opcoesNoDia(trajetos as Tables<'trajetos'>[])
    .filter((t) => t.partida && diaNoFuso(t.partida) === destino.chegada)
    .sort((a, b) => a.partida!.localeCompare(b.partida!))
  const ultimo = doDia[doDia.length - 1]
  if (!ultimo) return null
  return {
    hora: ultimo.chegada ? horaNoFuso(ultimo.chegada) : null,
    diaSeguinte: !!ultimo.chegada && diaNoFuso(ultimo.chegada) > destino.chegada,
    instante: ultimo.chegada,
    lugar: ultimo.estacao_chegada || ultimo.para_texto || destino.nome,
    lat: ultimo.para_lat ?? null,
    lon: ultimo.para_lon ?? null,
  }
}

// ---------------- Distância a pé ----------------

// Metros em linha reta entre dois pontos (fórmula de haversine)
export function metrosEntre(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = 6_371_000
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(h))
}

// Minutos a pé: linha reta × 1,3 (as ruas não são retas) ÷ 80 m por minuto. Mínimo 1.
export function minutosAPe(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  return Math.max(1, Math.round((metrosEntre(a, b) * 1.3) / 80))
}

// "8 min a pé" ou, longe, "4,2 km"
export function textoAPe(minutos: number) {
  if (minutos <= 40) return `${minutos} min a pé`
  const km = (minutos * 80) / 1.3 / 1000
  return `${km.toFixed(1).replace('.', ',')} km`
}

// ---------------- Check-in contra a chegada ----------------

// "00:00" é meia-noite (fim do dia); "02:00" depois de um check-in às 15h é madrugada
function limiteEmMinutos(limite: string, inicio: string | null | undefined) {
  const [h, m] = limite.split(':').map(Number)
  let total = h * 60 + (m || 0)
  const [hi] = (inicio ?? '12:00').split(':').map(Number)
  if (total <= hi * 60) total += 1440
  return total
}

export type FatoDoCheckin = { nivel: 'ok' | 'ruim' | 'neutro'; texto: string }

export function checkinContraChegada(opcao: Pick<Opcao, 'horaCheckin' | 'horaCheckinLimite' | 'selfCheckin'>, chegada: ChegadaNaCidade | null): FatoDoCheckin | null {
  const chega = chegada?.hora ? `Chegam ${chegada.hora}` : null
  if (opcao.selfCheckin) return { nivel: 'ok', texto: `${chega ? `${chega} · ` : ''}self check-in, entra a qualquer hora` }
  if (!opcao.horaCheckinLimite) return chega ? { nivel: 'neutro', texto: `${chega} · check-in até que horas? Pôr na opção` } : null
  const limite = opcao.horaCheckinLimite.slice(0, 5)
  if (!chegada?.hora) return { nivel: 'neutro', texto: `Check-in até ${limite}` }
  const [h, m] = chegada.hora.split(':').map(Number)
  const chegaMin = h * 60 + m + (chegada.diaSeguinte ? 1440 : 0)
  return chegaMin > limiteEmMinutos(limite, opcao.horaCheckin)
    ? { nivel: 'ruim', texto: `${chega} · check-in só até ${limite}` }
    : { nivel: 'ok', texto: `${chega} · check-in até ${limite}` }
}

// O que o cartão da opção mostra: preço por pessoa, distância da chegada e check-in
export function fatosDaOpcao(opcao: Opcao, cidade: Pick<CidadeDaNoite, 'destino' | 'chegada'>, pessoas: number) {
  const noites = noitesDaOpcao(opcao, cidade.destino)
  const { porPessoa, porNoite } = contasDaOpcao(opcao.precoTotal, pessoas, noites)
  const temPonto = opcao.lat != null && opcao.lon != null && cidade.chegada?.lat != null && cidade.chegada?.lon != null
  const minutos = temPonto ? minutosAPe({ lat: opcao.lat!, lon: opcao.lon! }, { lat: cidade.chegada!.lat!, lon: cidade.chegada!.lon! }) : null
  return { porPessoa, porNoite, minutos, checkin: checkinContraChegada(opcao, cidade.chegada) }
}

// ---------------- A viagem toda ----------------

export function noitesDaViagem(destinos: Destino[], opcoes: Opcao[], trajetos: Trajeto[], pessoas: number): NoitesDaViagem {
  const itens = montarHospedagem(destinos, opcoes)
  const cidades: CidadeDaNoite[] = []
  const passagens: Passagem[] = []
  let semCama = 0
  let praReservar = 0
  let reservadas = 0
  const total: Record<string, number> = {}
  const pago: Record<string, number> = {}

  for (const item of itens) {
    if (item.situacao === 'casa') continue
    const d = item.destino
    if (item.situacao === 'bate-e-volta' && !item.escolhida) {
      // Onde dormem nesse dia: a cidade cujas noites incluem o dia
      const dono = d.chegada ? itens.find((o) => o.destino.id !== d.id && diasDasNoites(o.destino.chegada, o.destino.saida).includes(d.chegada!)) : null
      passagens.push({ destino: d, dia: d.chegada, dormemEm: dono?.destino.nome ?? null, tipo: 'bate-e-volta' })
      continue
    }
    const dias = diasDasNoites(d.chegada, d.saida)
    const escolhida = item.escolhida
    const estado: EstadoDaCidade = escolhida ? (escolhida.reserva && escolhida.reserva !== 'nao' ? 'reservada' : 'escolhida') : item.opcoes.length ? 'comparando' : 'sem-cama'
    const n = item.noites ?? 1 // sem datas: pelo menos uma noite
    if (estado === 'reservada') reservadas += n
    else if (estado === 'escolhida') praReservar += n
    else semCama += n
    if (escolhida?.precoTotal != null) {
      total[escolhida.moeda] = (total[escolhida.moeda] ?? 0) + escolhida.precoTotal
      if (escolhida.reserva === 'paga') pago[escolhida.moeda] = (pago[escolhida.moeda] ?? 0) + escolhida.precoTotal
    }

    // Malas: no dia do check-out, horas entre o primeiro trecho e o último (aviso da spec 122b)
    let malas: CidadeDaNoite['malas'] = null
    if (d.saida && d.saida !== d.chegada) {
      const casa: CasaDoDia = { nome: escolhida?.nome ?? d.nome, checkin: d.chegada, checkout: d.saida, horaCheckout: escolhida?.horaCheckout ?? null }
      const agenda = montarAgendaDoDia(d.saida, { destinos, trajetos, eventos: [] })
      const aviso = avisosDoDia(d.saida, agenda, [casa]).find((a) => a.chave === 'malas')
      if (aviso?.acao?.tipo === 'guarda-volumes') malas = { ate: aviso.titulo.replace('Malas até as ', ''), lugar: aviso.acao.lugar }
    }

    cidades.push({ destino: d, noites: item.noites, dias, estado, escolhida, opcoes: item.opcoes, chegada: chegadaNaCidade(d, trajetos), malas })
  }

  const porPessoa: Record<string, number> = {}
  for (const [moeda, valor] of Object.entries(total)) porPessoa[moeda] = Math.round(valor / Math.max(1, pessoas))
  return { cidades, passagens, semCama, praReservar, reservadas, total, porPessoa, pago }
}

// "sex 4 a dom 6" / "qua 9"
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export function textoDoDia(data: string) {
  const d = dia(data)
  return `${SEMANA[d.getUTCDay()]} ${d.getUTCDate()}`
}
export function textoDasNoites(cidade: Pick<CidadeDaNoite, 'noites' | 'dias'>) {
  if (cidade.noites === null) return 'Sem datas no roteiro'
  const n = `${cidade.noites} ${cidade.noites === 1 ? 'noite' : 'noites'}`
  if (!cidade.dias.length) return n
  const primeiro = textoDoDia(cidade.dias[0])
  return cidade.dias.length === 1 ? `${n} · ${primeiro}` : `${n} · ${primeiro} a ${textoDoDia(cidade.dias[cidade.dias.length - 1])}`
}
