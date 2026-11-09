// Reserva entra sem digitar (spec 120b): print, PDF ou texto colado vira um rascunho
// (tipo, datas, horários, endereço, código, de quem é). A pessoa confere e confirma, e o
// rascunho vira o que já existe: trajeto (voo, ônibus, trem, carro), hospedagem (casa, hotel)
// ou item da agenda (ingresso, restaurante, passeio). O arquivo original vai pro cofre.
// - Texto colado: lido aqui, por regras (funciona sem internet e sem custo).
// - Print e PDF: lidos pela Edge Function `ler-reserva` (IA, a chave fica no servidor).
//   Se ela falhar, o formulário abre com o que deu pra ler, sem perder o arquivo.
// Teste: apps/web/tests/reserva-lida.test.mjs
import type { ClienteTogether } from './supabase'
import { tipoProvavel, type TipoDoTrajeto } from './transporte-do-grupo.ts'

// O core não tem os tipos do navegador: o console vem do próprio ambiente (web ou app)
declare const console: { error: (...dados: unknown[]) => void }

export type TipoDeReserva = 'voo' | 'onibus' | 'trem' | 'carro' | 'casa' | 'ingresso' | 'restaurante' | 'passeio'
export const TIPOS_DE_RESERVA: { tipo: TipoDeReserva; titulo: string }[] = [
  { tipo: 'voo', titulo: 'Voo' },
  { tipo: 'onibus', titulo: 'Ônibus' },
  { tipo: 'trem', titulo: 'Trem' },
  { tipo: 'carro', titulo: 'Carro' },
  { tipo: 'casa', titulo: 'Casa ou hotel' },
  { tipo: 'ingresso', titulo: 'Ingresso' },
  { tipo: 'restaurante', titulo: 'Restaurante' },
  { tipo: 'passeio', titulo: 'Passeio' },
]

export type RascunhoDeReserva = {
  tipo: TipoDeReserva | null
  titulo: string | null // nome da casa, do show, ou "LA 3456"
  codigo: string | null // localizador / código da reserva
  data: string | null // AAAA-MM-DD: partida, check-in ou dia do evento
  hora: string | null // HH:MM
  dataFim: string | null // chegada ou check-out
  horaFim: string | null
  origem: string | null // cidade de partida (trajeto)
  destino: string | null // cidade de chegada, ou cidade da casa
  endereco: string | null
  pessoa: string | null // nome do passageiro ou hóspede, como veio na reserva
}

export const rascunhoVazio = (): RascunhoDeReserva => ({
  tipo: null,
  titulo: null,
  codigo: null,
  data: null,
  hora: null,
  dataFim: null,
  horaFim: null,
  origem: null,
  destino: null,
  endereco: null,
  pessoa: null,
})

export type OndeVaiAReserva = 'trajeto' | 'hospedagem' | 'agenda'

export function ondeVaiAReserva(tipo: TipoDeReserva): OndeVaiAReserva {
  if (tipo === 'voo' || tipo === 'onibus' || tipo === 'trem' || tipo === 'carro') return 'trajeto'
  if (tipo === 'casa') return 'hospedagem'
  return 'agenda'
}

export function meioDoTrajeto(tipo: TipoDeReserva): 'aviao' | 'onibus' | 'trem' | 'carro' | 'outro' {
  if (tipo === 'voo') return 'aviao'
  if (tipo === 'onibus') return 'onibus'
  if (tipo === 'trem') return 'trem'
  if (tipo === 'carro') return 'carro'
  return 'outro'
}

// ---- Limpeza (vale pro que vem da IA e do formulário) -------------------------------

const TIPOS = new Set<string>(TIPOS_DE_RESERVA.map((t) => t.tipo))

function dataValida(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
  if (!m) return null
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (a < 2000 || a > 2100 || mes < 1 || mes > 12 || d < 1) return null
  const ultimo = new Date(Date.UTC(a, mes, 0)).getUTCDate()
  return d <= ultimo ? v.trim() : null
}

function horaValida(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const m = /^(\d{1,2})[:hH](\d{2})/.exec(v.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  return h <= 23 && min <= 59 ? `${String(h).padStart(2, '0')}:${m[2]}` : null
}

function textoValido(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t ? t.slice(0, max) : null
}

// Aceita qualquer coisa (resposta da IA, campos do formulário) e devolve só o que tem formato certo
export function normalizarRascunho(bruto: unknown): RascunhoDeReserva {
  const b = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, unknown>
  const tipo = typeof b.tipo === 'string' && TIPOS.has(b.tipo) ? (b.tipo as TipoDeReserva) : null
  const data = dataValida(b.data)
  let dataFim = dataValida(b.dataFim)
  if (data && dataFim && dataFim < data) dataFim = null
  return {
    tipo,
    titulo: textoValido(b.titulo, 120),
    codigo: textoValido(b.codigo, 40),
    data,
    hora: horaValida(b.hora),
    dataFim,
    horaFim: horaValida(b.horaFim),
    origem: textoValido(b.origem, 80),
    destino: textoValido(b.destino, 80),
    endereco: textoValido(b.endereco, 200),
    pessoa: textoValido(b.pessoa, 80),
  }
}

// Junta duas leituras: o que a primeira achou manda; a segunda completa os buracos
export function juntarRascunhos(primeiro: RascunhoDeReserva, segundo: RascunhoDeReserva): RascunhoDeReserva {
  const r = { ...primeiro }
  for (const k of Object.keys(r) as (keyof RascunhoDeReserva)[]) if (r[k] == null) (r as Record<string, unknown>)[k] = segundo[k]
  return r
}

// O que ainda falta pra confirmar (o resto é opcional)
export function oQueFalta(r: RascunhoDeReserva): string[] {
  const falta: string[] = []
  if (!r.tipo) return ['o tipo da reserva']
  if (!r.data) falta.push(r.tipo === 'casa' ? 'o dia do check-in' : 'a data')
  if (ondeVaiAReserva(r.tipo) === 'trajeto' && !r.hora) falta.push('o horário de saída')
  return falta
}

// ---- Leitura do texto colado (regras) --------------------------------------------

const MESES: Record<string, number> = {
  jan: 1, janeiro: 1, january: 1,
  fev: 2, fevereiro: 2, feb: 2, february: 2,
  mar: 3, marco: 3, march: 3,
  abr: 4, abril: 4, apr: 4, april: 4,
  mai: 5, maio: 5, may: 5,
  jun: 6, junho: 6, june: 6,
  jul: 7, julho: 7, july: 7,
  ago: 8, agosto: 8, aug: 8, august: 8,
  set: 9, setembro: 9, sep: 9, sept: 9, september: 9,
  out: 10, outubro: 10, oct: 10, october: 10,
  nov: 11, novembro: 11, november: 11,
  dez: 12, dezembro: 12, dec: 12, december: 12,
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '')
const doisDigitos = (n: number) => String(n).padStart(2, '0')

// Sem ano na reserva: o mais provável é a próxima vez que esse dia acontece (reserva é pra frente)
function comAno(dia: number, mes: number, ano: number | null, hoje: string): string | null {
  let a = ano
  if (a != null && a < 100) a += 2000
  if (a == null) {
    a = Number(hoje.slice(0, 4))
    if (`${a}-${doisDigitos(mes)}-${doisDigitos(dia)}` < hoje) a += 1
  }
  return dataValida(`${a}-${doisDigitos(mes)}-${doisDigitos(dia)}`)
}

// Todas as datas do texto, na ordem em que aparecem
export function datasDoTexto(texto: string, hoje: string): string[] {
  const t = semAcento(texto.toLowerCase())
  const achadas: { pos: number; data: string }[] = []
  const nomes = Object.keys(MESES).sort((a, b) => b.length - a.length).join('|')
  const padroes: [RegExp, (m: RegExpExecArray) => string | null][] = [
    [/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m) => dataValida(`${m[1]}-${m[2]}-${m[3]}`)],
    [/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g, (m) => comAno(Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : null, hoje)],
    [new RegExp(`\\b(\\d{1,2})(?:º|o)?\\s*(?:de\\s+)?(${nomes})\\.?(?:\\s*(?:de\\s+)?(\\d{4}))?\\b`, 'g'), (m) => comAno(Number(m[1]), MESES[m[2] as string] as number, m[3] ? Number(m[3]) : null, hoje)],
    [new RegExp(`\\b(${nomes})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?(?:\\s+(\\d{4}))?\\b`, 'g'), (m) => comAno(Number(m[2]), MESES[m[1] as string] as number, m[3] ? Number(m[3]) : null, hoje)],
  ]
  const ocupado: [number, number][] = []
  for (const [re, ler] of padroes) {
    for (let m = re.exec(t); m; m = re.exec(t)) {
      const ini = m.index
      const fim = ini + m[0].length
      if (ocupado.some(([a, b]) => ini < b && fim > a)) continue
      const data = ler(m)
      if (data) {
        achadas.push({ pos: ini, data })
        ocupado.push([ini, fim])
      }
    }
  }
  return achadas.sort((a, b) => a.pos - b.pos).map((x) => x.data)
}

export function horasDoTexto(texto: string): string[] {
  const horas: string[] = []
  const re = /\b([01]?\d|2[0-3])\s?(?::|h)\s?([0-5]\d)\b|\b([01]?\d|2[0-3])h\b/gi
  for (let m = re.exec(texto); m; m = re.exec(texto)) {
    horas.push(m[3] ? `${doisDigitos(Number(m[3]))}:00` : `${doisDigitos(Number(m[1]))}:${m[2]}`)
  }
  return horas
}

function tipoDoTexto(t: string): TipoDeReserva | null {
  const s = semAcento(t.toLowerCase())
  if (/\b(voo|flight|cartao de embarque|boarding|aeroporto|airport|latam|gol linhas|azul linhas|tap air|companhia aerea)\b/.test(s)) return 'voo'
  if (/\b(onibus|rodoviaria|buser|clickbus|poltrona|bus)\b/.test(s)) return 'onibus'
  if (/\b(trem|train|trenitalia|sncf|renfe|comboio|eurostar|italo)\b/.test(s)) return 'trem'
  if (/\b(aluguel de carro|locadora|localiza|movida|unidas|hertz|rentcars|rental car|car rental|retirada do veiculo)\b/.test(s)) return 'carro'
  if (/\b(airbnb|booking\.com|hotel|pousada|hostel|hospedagem|anfitriao|host|check-?in|check-?out)\b/.test(s)) return 'casa'
  if (/\b(ingresso|ingressos|ticket|tickets|sympla|ingresse|eventim|ticketmaster|show|festival|setor|pista)\b/.test(s)) return 'ingresso'
  if (/\b(restaurante|restaurant|mesa para|table for|opentable|thefork|reserva para \d+ pessoas)\b/.test(s)) return 'restaurante'
  if (/\b(passeio|tour|excursao|getyourguide|civitatis|viator|trilha)\b/.test(s)) return 'passeio'
  return null
}

function codigoDoTexto(t: string): string | null {
  const re = /(?:c[oó]digo(?: da reserva| de confirma[cç][aã]o)?|localizador|n[uú]mero da reserva|reserva(?: n[ºo°.]*)?|confirma[cç][aã]o|booking (?:reference|code|number)|confirmation(?: code| number)?|pnr)\s*[:#nº°]*\s*([A-Z0-9][A-Z0-9-]{4,15})\b/gi
  for (let m = re.exec(t); m; m = re.exec(t)) {
    const c = m[1] as string
    if (/\d/.test(c) || c === c.toUpperCase()) return c.toUpperCase()
  }
  return null
}

function linhaDepoisDe(t: string, rotulos: RegExp): string | null {
  const m = new RegExp(`(?:^|\\n)\\s*(?:${rotulos.source})\\s*:?\\s*([^\\n]{3,200})`, 'i').exec(t)
  return m ? (m[1] as string).trim() : null
}

function enderecoDoTexto(t: string): string | null {
  const rotulado = linhaDepoisDe(t, /endere[cç]o|address|local|onde/)
  if (rotulado) return rotulado
  const linha = t.split('\n').find((l) => /\b(rua|r\.|av\.|avenida|travessa|estrada|rodovia|alameda|pra[cç]a|servid[aã]o|street|st\.|road|rd\.|via|calle|rue)\s+\S+.*\d/i.test(l))
  return linha ? linha.trim() : null
}

function trechoDoTexto(t: string): { origem: string; destino: string } | null {
  const cidade = "[A-ZÀ-Ý][A-Za-zÀ-ÿ'. -]{1,40}?"
  const de = new RegExp(`\\b(?:[Dd]e|[Ff]rom|[Oo]rigem:?)\\s+(${cidade})\\s*(?:\\([A-Z]{3}\\))?\\s+(?:para|pra|a|to|destino:?)\\s+(${cidade})\\s*(?:\\([A-Z]{3}\\))?(?=\\s*(?:[\\n,.;(]|em\\b|on\\b|$))`)
  const seta = new RegExp(`(${cidade})\\s*(?:\\([A-Z]{3}\\))?\\s*(?:→|->|>|–|—)\\s*(${cidade})\\s*(?:\\([A-Z]{3}\\))?(?=\\s*(?:[\\n,.;(]|$))`)
  const m = de.exec(t) ?? seta.exec(t)
  return m ? { origem: (m[1] as string).trim(), destino: (m[2] as string).trim() } : null
}

function tituloDoTexto(t: string, tipo: TipoDeReserva | null): string | null {
  if (tipo === 'voo') {
    const v = /\b((?:[A-Z]{2}|[A-Z]\d|\d[A-Z]))\s?(\d{3,4})\b/.exec(t)
    if (v) return `${v[1]} ${v[2]}`
  }
  const rotulado = linhaDepoisDe(t, /hotel|pousada|acomoda[cç][aã]o|propriedade|property|evento|event|restaurante|restaurant|passeio|tour/)
  if (rotulado) return rotulado
  const estadia = /(?:sua (?:reserva|estadia) (?:em|no|na)|reserva confirmada (?:em|no|na)|your (?:stay|reservation) at|you'?re going to)\s+([^\n.!]{3,80})/i.exec(t)
  if (estadia) return (estadia[1] as string).trim()
  return null
}

function pessoaDoTexto(t: string): string | null {
  const v = linhaDepoisDe(t, /passageiro|passenger|h[oó]spede|guest|nome do (?:passageiro|h[oó]spede)|titular|traveller|traveler/)
  return v ? v.replace(/\s{2,}.*/, '').slice(0, 80) : null
}

// Lê o texto colado (e-mail, SMS, página de confirmação). Não inventa: o que não achar fica vazio.
export function lerTextoDaReserva(texto: string, hoje: string): RascunhoDeReserva {
  const t = texto.replace(/\r/g, '').slice(0, 20000)
  const tipo = tipoDoTexto(t)
  const datas = datasDoTexto(t, hoje)
  const horas = horasDoTexto(t)
  const trecho = tipo && ondeVaiAReserva(tipo) === 'trajeto' ? trechoDoTexto(t) : null
  return normalizarRascunho({
    tipo,
    titulo: tituloDoTexto(t, tipo),
    codigo: codigoDoTexto(t),
    data: datas[0] ?? null,
    hora: horas[0] ?? null,
    dataFim: datas.find((d, i) => i > 0 && d >= (datas[0] as string) && d !== datas[0]) ?? null,
    horaFim: horas[1] ?? null,
    origem: trecho?.origem ?? null,
    destino: trecho?.destino ?? null,
    endereco: tipo === 'voo' ? null : enderecoDoTexto(t),
    pessoa: pessoaDoTexto(t),
  })
}

// ---- Pra onde vai (destino da viagem, pessoa do comboio) ------------------------------

type DestinoDaViagem = { id: string; nome: string; chegada: string | null; saida: string | null }
const chave = (t: string) => semAcento(t.toLowerCase()).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

// Destino pelo nome: "Florianópolis (FLN)" acha "Florianópolis"; "Rio" não acha "Rio Grande"? acha, se for o único.
export function destinoPeloNome<D extends DestinoDaViagem>(nome: string | null, destinos: D[]): D | null {
  if (!nome) return null
  const n = chave(nome)
  if (!n) return null
  return destinos.find((d) => chave(d.nome) === n) ?? destinos.find((d) => n.includes(chave(d.nome)) || chave(d.nome).includes(n)) ?? null
}

// Destino pela data: o que está com o grupo nesse dia
export function destinoPelaData<D extends DestinoDaViagem>(dia: string | null, destinos: D[]): D | null {
  if (!dia) return null
  return destinos.find((d) => d.chegada && dia >= d.chegada && dia <= (d.saida ?? d.chegada)) ?? null
}

// Onde a reserva entra: trajeto (origem e destino), casa (destino) ou agenda (nenhum)
export function destinosDaReserva<D extends DestinoDaViagem>(r: RascunhoDeReserva, destinos: D[]): { origemId: string | null; destinoId: string | null } {
  if (!r.tipo) return { origemId: null, destinoId: null }
  const onde = ondeVaiAReserva(r.tipo)
  if (onde === 'trajeto') {
    const destino = destinoPeloNome(r.destino, destinos) ?? destinoPelaData(r.dataFim ?? r.data, destinos)
    const origem = destinoPeloNome(r.origem, destinos)
    return { origemId: origem && origem.id !== destino?.id ? origem.id : null, destinoId: destino?.id ?? null }
  }
  if (onde === 'hospedagem') {
    const d = destinoPeloNome(r.destino, destinos) ?? destinoPeloNome(r.endereco?.split(',').slice(-2, -1)[0] ?? null, destinos) ?? destinoPelaData(r.data, destinos) ?? (destinos.length === 1 ? destinos[0] : null)
    return { origemId: null, destinoId: d?.id ?? null }
  }
  return { origemId: null, destinoId: null }
}

// De quem é: o nome da reserva bate com o primeiro nome de alguém do comboio
export function pessoaDaReserva(nome: string | null, membros: { id: string; nome: string }[]): string | null {
  if (!nome) return null
  const palavras = chave(nome).split(' ')
  const achados = membros.filter((m) => {
    const primeiro = chave(m.nome).split(' ')[0]
    return !!primeiro && palavras.includes(primeiro)
  })
  return achados.length === 1 ? (achados[0] as { id: string }).id : null
}

// "2026-12-28" + "09:10" → horário certo no fuso do aparelho (igual ao formulário do site)
export function horarioNoAparelho(dia: string | null, hora: string | null): string | null {
  if (!dia || !hora) return null
  const d = new Date(`${dia}T${hora}`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const notaDoCodigo = (r: RascunhoDeReserva) => (r.codigo ? `Código da reserva: ${r.codigo}` : null)

export function trajetoDaReserva(r: RascunhoDeReserva, ids: { origemId: string | null; destinoId: string | null }) {
  const tipo = r.tipo ?? 'voo'
  return {
    meio: meioDoTrajeto(tipo),
    origem_id: ids.origemId,
    destino_id: ids.destinoId,
    partida: horarioNoAparelho(r.data, r.hora),
    chegada: horarioNoAparelho(r.dataFim ?? r.data, r.horaFim),
    situacao: 'comprado',
    observacao: [r.titulo, notaDoCodigo(r)].filter(Boolean).join(' · ') || null,
  }
}

export function hospedagemDaReserva(r: RascunhoDeReserva, destinoId: string | null) {
  return {
    nome: r.titulo ?? (r.destino ? `Hospedagem em ${r.destino}` : 'Hospedagem'),
    destino_id: destinoId,
    endereco: r.endereco,
    checkin: r.data,
    checkout: r.dataFim,
    hora_checkin: r.hora,
    hora_checkout: r.horaFim,
    observacao: notaDoCodigo(r),
  }
}

export function eventoDaReserva(r: RascunhoDeReserva) {
  const padrao = r.tipo === 'restaurante' ? 'Restaurante' : r.tipo === 'passeio' ? 'Passeio' : 'Ingresso'
  return {
    dia: r.data as string,
    hora: r.hora,
    titulo: r.titulo ?? padrao,
    local: r.endereco,
    observacao: notaDoCodigo(r),
  }
}

// ---- Banco e Edge Function --------------------------------------------------------

export type EntradaDaLeitura = { texto: string } | { arquivo: string; tipo: string } // arquivo em base64
export type ResultadoDaLeitura = { rascunho: RascunhoDeReserva; lidoPelaIa: boolean }

// Texto: as regras leem na hora; a IA (se estiver no ar) completa. Arquivo: só a IA lê.
// Nunca dá erro: se nada funcionar, devolve o rascunho do jeito que deu.
export async function lerReserva(cli: ClienteTogether, entrada: EntradaDaLeitura, hoje: string): Promise<ResultadoDaLeitura> {
  const pelasRegras = 'texto' in entrada ? lerTextoDaReserva(entrada.texto, hoje) : rascunhoVazio()
  try {
    const { data, error } = await cli.functions.invoke('ler-reserva', { body: { ...entrada, hoje } })
    if (error || !data?.rascunho) return { rascunho: pelasRegras, lidoPelaIa: false }
    return { rascunho: juntarRascunhos(normalizarRascunho(data.rascunho), pelasRegras), lidoPelaIa: true }
  } catch (e) {
    console.error('Leitura da reserva pela IA não funcionou:', e)
    return { rascunho: pelasRegras, lidoPelaIa: false }
  }
}

export type ReservaSalva = { onde: OndeVaiAReserva; id: string; escolhida: boolean }

// Grava o rascunho confirmado como trajeto, hospedagem ou item da agenda. Devolve o id
// (pra amarrar o arquivo no cofre). Casa lançada pelo ADM já fica como a escolhida do destino.
export async function salvarReserva(
  cli: ClienteTogether,
  viagemId: string,
  r: RascunhoDeReserva,
  ctx: { destinos: DestinoDaViagem[]; membros: { id: string; nome: string }[]; euSouAdm: boolean; tipoDoTrajeto?: TipoDoTrajeto },
): Promise<ReservaSalva> {
  if (!r.tipo) throw new Error('Escolha o tipo da reserva.')
  const falta = oQueFalta(r)
  if (falta.length) throw new Error(`Falta ${falta.join(' e ')}.`)
  const onde = ondeVaiAReserva(r.tipo)
  const ids = destinosDaReserva(r, ctx.destinos)

  if (onde === 'trajeto') {
    const tipo = ctx.tipoDoTrajeto ?? tipoProvavel(ids)
    const { data, error } = await cli.from('trajetos').insert({ ...trajetoDaReserva(r, ids), tipo, viagem_id: viagemId }).select('id').single()
    if (error) {
      if (error.code === '42501') throw new Error('Trecho do grupo só o ADM (ou quem ele liberou) lança. Se é a sua chegada ou saída, marque assim e confirme de novo.')
      throw error
    }
    const pessoa = pessoaDaReserva(r.pessoa, ctx.membros)
    if (pessoa) {
      const { error: erroPassageiro } = await cli.from('trajeto_passageiros').insert({ trajeto_id: data.id, usuario_id: pessoa })
      if (erroPassageiro) console.error('Não deu pra marcar o passageiro:', erroPassageiro)
    }
    return { onde, id: data.id, escolhida: false }
  }

  if (onde === 'hospedagem') {
    const { data, error } = await cli.from('hospedagens').insert({ ...hospedagemDaReserva(r, ids.destinoId), viagem_id: viagemId }).select('id').single()
    if (error) throw error
    let escolhida = false
    if (ctx.euSouAdm && ids.destinoId) {
      const { error: erroEscolha } = await cli.rpc('escolher_hospedagem', { p_hospedagem: data.id, p_escolher: true })
      if (erroEscolha) console.error('Não deu pra marcar como escolhida:', erroEscolha)
      else escolhida = true
    }
    return { onde, id: data.id, escolhida }
  }

  const { data, error } = await cli.from('eventos_agenda').insert({ ...eventoDaReserva(r), viagem_id: viagemId }).select('id').single()
  if (error) throw error
  return { onde, id: data.id, escolhida: false }
}

// Ligação do arquivo do cofre com o que a reserva virou
export function ligacaoNoCofre(salva: ReservaSalva): { trajeto_id?: string; hospedagem_id?: string; evento_id?: string } {
  if (salva.onde === 'trajeto') return { trajeto_id: salva.id }
  if (salva.onde === 'hospedagem') return { hospedagem_id: salva.id }
  return { evento_id: salva.id }
}

// Bytes → base64 (o core não tem btoa garantido no app)
export function paraBase64(bytes: Uint8Array): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let saida = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] as number
    const b = bytes[i + 1]
    const c = bytes[i + 2]
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0)
    saida += letras[(n >> 18) & 63]! + letras[(n >> 12) & 63]! + (b === undefined ? '=' : letras[(n >> 6) & 63]!) + (c === undefined ? '=' : letras[n & 63]!)
  }
  return saida
}

// Campo de data do formulário: "28/12/2026" ↔ "2026-12-28"
export const dataParaCampo = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '')
export function dataDoCampo(texto: string): string | null {
  const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(texto)
  return m ? dataValida(`${m[3]}-${doisDigitos(Number(m[2]))}-${doisDigitos(Number(m[1]))}`) : null
}
