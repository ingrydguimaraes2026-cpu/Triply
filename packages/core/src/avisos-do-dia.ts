// Spec 122b: avisos que o app calcula sozinho no dia. Função pura: recebe a linha do tempo do dia
// (montarAgendaDoDia) e as hospedagens escolhidas, devolve os avisos e onde cada um aparece.
// Teste: apps/web/tests/avisos-do-dia.test.mjs
import type { ItemDaAgenda } from './agenda.ts'
import { duracaoCurta, horaNoFuso } from './agenda.ts'

export type CasaDoDia = {
  nome: string
  checkin: string | null // AAAA-MM-DD
  checkout: string | null
  horaCheckin?: string | null // "15:00" (a partir de)
  horaCheckinLimite?: string | null // "00:00" (até)
  horaCheckout?: string | null // "10:00"
  contatoAnfitriao?: string | null
}

export type AcaoDoAviso = { tipo: 'anfitriao'; texto: string; contato: string | null } | { tipo: 'guarda-volumes'; lugar: string }

export type AvisoDoDia = {
  chave: string
  depoisDe: string // chave do item da agenda depois do qual o aviso aparece
  nivel: 'ruim' | 'dica' | 'folga'
  titulo: string
  texto: string
  acao?: AcaoDoAviso
}

// Folga mínima entre chegar e o próximo sair (decisão da 122b: 30 min; com malas, 45)
export const FOLGA_MINIMA = 30
export const FOLGA_MINIMA_COM_MALAS = 45
// Folga "boa" que ainda vale mostrar discretamente ("1h20 de folga")
const FOLGA_MOSTRADA_ATE = 180

type Desl = Extract<ItemDaAgenda, { tipo: 'trajeto' }>
const minutos = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000)

// Minutos desde o começo do dia (no fuso do aparelho); passa de 1440 se for no dia seguinte
function minutosNoDia(dia: string, horario: string) {
  return minutos(new Date(`${dia}T00:00:00`).toISOString(), horario)
}
// "00:00" vira 1440 (meia-noite = fim do dia); "01:30" depois de um check-in às 15h também é madrugada
function limiteEmMinutos(limite: string, inicio: string | null | undefined) {
  const [h, m] = limite.split(':').map(Number)
  let total = h * 60 + m
  const [hi] = (inicio ?? '12:00').split(':').map(Number)
  if (total <= hi * 60) total += 1440
  return total
}

export function avisosDoDia(dia: string, itens: ItemDaAgenda[], casas: CasaDoDia[]): AvisoDoDia[] {
  const avisos: AvisoDoDia[] = []
  const desl = itens.filter((i): i is Desl => i.tipo === 'trajeto')
  if (!desl.length) return avisos

  const saindo = casas.find((c) => c.checkout === dia)
  const chegando = casas.find((c) => c.checkin === dia)
  const comMalas = !!saindo || !!chegando
  const minima = comMalas ? FOLGA_MINIMA_COM_MALAS : FOLGA_MINIMA

  // 1. Folga entre deslocamentos seguidos (sem nada no meio da linha do tempo)
  for (let i = 0; i < itens.length - 1; i++) {
    const a = itens[i]
    const b = itens[i + 1]
    if (a.tipo !== 'trajeto' || b.tipo !== 'trajeto' || !a.chegada) continue
    const folga = minutos(a.chegada, b.partida)
    if (folga < 0) {
      avisos.push({
        chave: `folga-${b.chave}`,
        depoisDe: a.chave,
        nivel: 'ruim',
        titulo: 'Os horários se cruzam',
        texto: `Chegam às ${horaNoFuso(a.chegada)}, mas o próximo sai às ${b.hora}. Confiram os horários.`,
      })
    } else if (folga < minima) {
      avisos.push({
        chave: `folga-${b.chave}`,
        depoisDe: a.chave,
        nivel: 'ruim',
        titulo: `Folga curta: ${duracaoCurta(folga)}`,
        texto: `Pouco tempo pra trocar${comMalas ? ' com as malas' : ''}.` + (b.ultimo ? ' E o próximo é o último do dia: perdeu, fica sem.' : ' Se atrasar, perdem o próximo.'),
      })
    } else if (folga <= FOLGA_MOSTRADA_ATE) {
      avisos.push({
        chave: `folga-${b.chave}`,
        depoisDe: a.chave,
        nivel: 'folga',
        titulo: `${duracaoCurta(folga)} de folga até o próximo`,
        texto: '',
      })
    }
  }

  // 2. Chegada x check-in de onde vão dormir hoje (o último deslocamento do dia)
  const ultimo = desl[desl.length - 1]
  if (chegando && ultimo.chegada) {
    const chega = minutosNoDia(dia, ultimo.chegada)
    const horaChega = horaNoFuso(ultimo.chegada)
    if (chegando.horaCheckinLimite && chega > limiteEmMinutos(chegando.horaCheckinLimite, chegando.horaCheckin)) {
      avisos.push({
        chave: 'checkin',
        depoisDe: ultimo.chave,
        nivel: 'ruim',
        titulo: `Chegam às ${horaChega}, check-in até ${chegando.horaCheckinLimite}`,
        texto: `Avisem ${chegando.nome} ou escolham um horário que chegue mais cedo.`,
        acao: {
          tipo: 'anfitriao',
          contato: chegando.contatoAnfitriao ?? null,
          texto: `Oi! Somos o grupo da reserva em ${chegando.nome}. Nosso transporte chega às ${horaChega}. Dá pra fazer o check-in nesse horário?`,
        },
      })
    } else if (chegando.horaCheckin) {
      const [h, m] = chegando.horaCheckin.split(':').map(Number)
      if (chega < h * 60 + m) {
        avisos.push({
          chave: 'checkin',
          depoisDe: ultimo.chave,
          nivel: 'dica',
          titulo: `Chegam às ${horaChega}, check-in só às ${chegando.horaCheckin}`,
          texto: `Vejam se ${chegando.nome} guarda as malas antes do check-in.`,
        })
      }
    }
  }

  // 3. Malas no dia: saíram de uma casa e ainda têm horas de passeio antes do último deslocamento
  if (saindo && desl.length >= 2) {
    const primeiro = desl[0]
    const livreDesde = primeiro.chegada ?? primeiro.partida
    const horas = minutos(livreDesde, ultimo.partida)
    if (horas >= 180) {
      avisos.push({
        chave: 'malas',
        depoisDe: primeiro.chave,
        nivel: 'dica',
        titulo: `Malas até as ${ultimo.hora}`,
        texto: `Saíram de ${saindo.nome} e o próximo grande trecho é às ${ultimo.hora}. Deixem as malas num guarda-volumes perto de ${primeiro.para}.`,
        acao: { tipo: 'guarda-volumes', lugar: primeiro.para },
      })
    }
  }

  return avisos
}

// Google Maps procurando guarda-volumes perto do lugar
export function linkDoGuardaVolumes(lugar: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`luggage storage ${lugar}`)}`
}
