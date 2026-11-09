// Viagens antigas e rolês (spec 118f). Os dois viram viagens normais com um destino só,
// marcadas em `viagens.tipo`. Assim o carimbo, o mapa da galera e o "há 1 ano" funcionam igual.
// - Viagem antiga: "a gente já foi pra Paris em 2019" → carimbo "de memória" na hora.
// - Rolê: "rolê hoje" + lugar → viagem de 1 dia (hoje). Se a pessoa está lá, o carimbo cai
//   pela localização na hora; senão, cai depois pelo app aberto ou por foto (118a).
// Teste: apps/web/tests/viagens-antigas.test.mjs
import type { ClienteTogether } from './supabase'
import { tipoDoLugar, type TipoDeLugar } from './carimbos.ts'
import { moedaDoPais } from './paises.ts'

// O core não tem os tipos do navegador: o console vem do próprio ambiente (web ou app)
declare const console: { error: (...dados: unknown[]) => void }

export type TipoDeViagem = 'viagem' | 'role' | 'antiga'
export type TipoDeRole = 'bate-volta' | 'praia' | 'show'

export const TIPOS_DE_ROLE: { tipo: TipoDeRole; titulo: string }[] = [
  { tipo: 'bate-volta', titulo: 'Bate-volta' },
  { tipo: 'praia', titulo: 'Praia' },
  { tipo: 'show', titulo: 'Show' },
]

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// Um lugar achado na busca (ou pela coordenada), já com o ponto no mapa
export type LugarAchado = {
  nome: string
  pais: string | null // nome em português ("Brasil")
  codigoPais: string | null // "BR"
  regiao: string | null // "Santa Catarina"
  latitude: number
  longitude: number
}

// ---- Regras -------------------------------------------------------------------

// Mês (1 a 12) e ano da viagem antiga: não pode ser no futuro nem antes de 1950
export function conferirViagemAntiga(mes: number, ano: number, hoje: string): string | null {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) return 'Escolha o mês.'
  if (!Number.isInteger(ano) || ano < 1950) return 'Escolha um ano a partir de 1950.'
  const [anoHoje, mesHoje] = hoje.split('-').map(Number)
  if (ano > (anoHoje as number) || (ano === anoHoje && mes > (mesHoje as number))) return 'Esse mês ainda não chegou. Pra viagem que vem aí, crie uma viagem nova.'
  return null
}

// A viagem antiga guarda só o mês: começa e termina no dia 1 (o carimbo fica com essa data)
export function dataDaViagemAntiga(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-01`
}

// "julho de 2019"
export const mesEAno = (dia: string) => `${MESES[Number(dia.slice(5, 7)) - 1]} de ${dia.slice(0, 4)}`

// Tipo do carimbo do rolê: show é show, praia é praia; bate-volta adivinha pelo nome do lugar
export function tipoDoLugarDoRole(tipo: TipoDeRole, nome: string): TipoDeLugar {
  if (tipo === 'show') return 'show'
  if (tipo === 'praia') return 'praia'
  return tipoDoLugar(nome)
}

// Data da foto (EXIF "2019:07:14 10:22:01" ou ISO) → mês e ano. Sem data que preste, null.
export function mesEAnoDaFoto(data: string | null | undefined): { mes: number; ano: number } | null {
  const m = /^(\d{4})[:-](\d{2})/.exec(String(data ?? '').trim())
  if (!m) return null
  const ano = Number(m[1])
  const mes = Number(m[2])
  if (ano < 1950 || mes < 1 || mes > 12) return null
  return { mes, ano }
}

// ---- Busca de lugar (grátis e sem chave) ----------------------------------------

const nomeDoPais = (codigo: string) => {
  try {
    return new Intl.DisplayNames(['pt-BR'], { type: 'region' }).of(codigo) ?? null
  } catch {
    return null
  }
}

type RespostaOpenMeteo = {
  results?: { name: string; latitude: number; longitude: number; country_code?: string; country?: string; admin1?: string; population?: number; feature_code?: string }[]
}

// Busca cidade, praia ou país pelo nome (Open-Meteo/GeoNames, com nome em português)
export async function procurarLugar(texto: string, sinal?: { readonly aborted: boolean }): Promise<LugarAchado[]> {
  const t = texto.trim()
  if (t.length < 2) return []
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(t)}&count=8&language=pt&format=json`
  // `as never`: o core não conhece o tipo AbortSignal do navegador; o sinal é o mesmo nos dois lados
  const resposta = await fetch(url, { signal: sinal as never })
  if (!resposta.ok) throw new Error('Falha ao buscar o lugar')
  const dados = (await resposta.json()) as RespostaOpenMeteo
  return (dados.results ?? []).slice(0, 6).map((r) => {
    const codigo = r.country_code ? r.country_code.toUpperCase() : null
    return {
      nome: r.name,
      pais: r.country ?? (codigo ? nomeDoPais(codigo) : null),
      codigoPais: codigo,
      regiao: (r.feature_code ?? '').startsWith('PCL') ? null : (r.admin1 ?? null),
      latitude: r.latitude,
      longitude: r.longitude,
    }
  })
}

type RespostaReversa = { city?: string; locality?: string; principalSubdivision?: string; countryCode?: string; countryName?: string }

// Onde fica este ponto? (BigDataCloud, feito pra chamar do aparelho, sem chave).
// O ponto da pessoa só vai pra essa busca; nada é guardado no banco.
export async function lugarPelaCoordenada(ponto: { latitude: number; longitude: number }): Promise<LugarAchado | null> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${ponto.latitude}&longitude=${ponto.longitude}&localityLanguage=pt`
  const resposta = await fetch(url)
  if (!resposta.ok) return null
  const r = (await resposta.json()) as RespostaReversa
  const nome = (r.city || r.locality || '').trim()
  if (!nome) return null
  const codigo = r.countryCode ? r.countryCode.toUpperCase() : null
  return {
    nome,
    pais: codigo ? (nomeDoPais(codigo) ?? r.countryName ?? null) : (r.countryName ?? null),
    codigoPais: codigo,
    regiao: r.principalSubdivision || null,
    latitude: ponto.latitude,
    longitude: ponto.longitude,
  }
}

// ---- Banco -------------------------------------------------------------------

export type PessoaDaGalera = { id: string; nome: string; avatar_url: string | null; viagens_juntos: number }

// Quem já dividiu viagem comigo (o banco tira convidado anônimo)
export async function buscarMinhaGalera(cli: ClienteTogether): Promise<PessoaDaGalera[]> {
  const { data, error } = await cli.rpc('minha_galera')
  if (error) throw error
  return (data ?? []).map((p) => ({ id: p.id, nome: p.nome ?? 'Alguém', avatar_url: p.avatar_url ?? null, viagens_juntos: p.viagens_juntos }))
}

async function criarComUmDestino(
  cli: ClienteTogether,
  tipo: TipoDeViagem,
  lugar: LugarAchado,
  dia: string,
  tipoDoLugarDoDestino: TipoDeLugar | null,
): Promise<{ viagemId: string; destinoId: string }> {
  const { data: viagem, error } = await cli
    .from('viagens')
    .insert({ nome: lugar.nome, data_inicio: dia, data_fim: dia, moeda_principal: lugar.codigoPais ? moedaDoPais(lugar.codigoPais) : 'BRL', tipo })
    .select('id')
    .single()
  if (error) throw error
  const { data: destino, error: erroDestino } = await cli
    .from('destinos')
    .insert({
      viagem_id: viagem.id,
      ordem: 0,
      nome: lugar.nome,
      pais: lugar.pais,
      latitude: lugar.latitude,
      longitude: lugar.longitude,
      chegada: dia,
      saida: dia,
      dias: 1,
      tipo_do_lugar: tipoDoLugarDoDestino,
    })
    .select('id')
    .single()
  if (erroDestino) throw erroDestino
  return { viagemId: viagem.id, destinoId: destino.id }
}

async function carimbar(cli: ClienteTogether, viagemId: string, destinoId: string, lugar: LugarAchado, tipo: TipoDeLugar, dia: string, como: 'memoria' | 'localizacao') {
  const { error } = await cli.from('carimbos').insert({
    viagem_id: viagemId,
    destino_id: destinoId,
    nome: lugar.nome,
    latitude: lugar.latitude,
    longitude: lugar.longitude,
    tipo,
    data: dia,
    como,
  })
  if (error && error.code !== '23505') throw error
}

// "A gente já foi pra...": cria a viagem antiga, carimba de memória e chama quem foi.
// Se chamar a galera falhar, a viagem e o carimbo continuam (dá pra chamar pelo link depois).
export async function criarViagemAntiga(
  cli: ClienteTogether,
  dados: { lugar: LugarAchado; mes: number; ano: number; pessoas: string[] },
  hoje: string,
): Promise<{ viagemId: string; chamados: number }> {
  const erro = conferirViagemAntiga(dados.mes, dados.ano, hoje)
  if (erro) throw new Error(erro)
  const dia = dataDaViagemAntiga(dados.mes, dados.ano)
  const tipo = tipoDoLugar(dados.lugar.nome)
  const { viagemId, destinoId } = await criarComUmDestino(cli, 'antiga', dados.lugar, dia, null)
  await carimbar(cli, viagemId, destinoId, dados.lugar, tipo, dia, 'memoria')
  let chamados = 0
  if (dados.pessoas.length) {
    const { data, error } = await cli.rpc('trazer_da_galera', { p_viagem: viagemId, p_pessoas: dados.pessoas })
    if (error) console.error('Erro ao chamar a galera:', error)
    else chamados = data ?? 0
  }
  return { viagemId, chamados }
}

// "Rolê hoje": viagem de 1 dia. `estouAqui` = o aparelho acabou de ver que a pessoa está no lugar
// (o lugar veio da localização dela), então o carimbo cai na hora.
export async function criarRole(cli: ClienteTogether, dados: { lugar: LugarAchado; tipo: TipoDeRole; estouAqui: boolean }, hoje: string): Promise<string> {
  const tipo = tipoDoLugarDoRole(dados.tipo, dados.lugar.nome)
  const { viagemId, destinoId } = await criarComUmDestino(cli, 'role', dados.lugar, hoje, tipo)
  if (dados.estouAqui) await carimbar(cli, viagemId, destinoId, dados.lugar, tipo, hoje, 'localizacao')
  return viagemId
}

// ---- Foto antiga (108) ---------------------------------------------------------

type Exif = Record<string, unknown> | null | undefined

// GPS do EXIF. Cada celular manda de um jeito; se não der pra ler, null.
export function pontoDoExif(exif: Exif): { latitude: number; longitude: number } | null {
  if (!exif) return null
  const gps = (exif['{GPS}'] as Record<string, unknown> | undefined) ?? exif
  let lat = Number(gps.Latitude ?? gps.GPSLatitude)
  let lng = Number(gps.Longitude ?? gps.GPSLongitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null
  if (String(gps.LatitudeRef ?? gps.GPSLatitudeRef).toUpperCase() === 'S') lat = -Math.abs(lat)
  if (String(gps.LongitudeRef ?? gps.GPSLongitudeRef).toUpperCase() === 'W') lng = -Math.abs(lng)
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { latitude: lat, longitude: lng } : null
}

// Mês e ano em que a foto foi tirada (EXIF DateTimeOriginal, ou DateTime)
export function mesEAnoDoExif(exif: Exif): { mes: number; ano: number } | null {
  if (!exif) return null
  const dentro = (exif['{Exif}'] as Record<string, unknown> | undefined) ?? {}
  const data = dentro.DateTimeOriginal ?? exif.DateTimeOriginal ?? exif.DateTime ?? (exif['{TIFF}'] as Record<string, unknown> | undefined)?.DateTime
  return mesEAnoDaFoto(typeof data === 'string' ? data : null)
}
