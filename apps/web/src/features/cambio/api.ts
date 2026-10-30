import { supabase } from '../../lib/supabase'
import type { Tables } from '@together/core'
import { deBanco, paraBanco } from '@together/core'

// Compra de moeda com valores em centavos
export type CompraDeMoeda = Omit<Tables<'compras_cambio'>, 'valor_origem' | 'valor_destino' | 'cotacao'> & {
  valorOrigem: number
  valorDestino: number
}

export async function buscarCompras(viagemId: string): Promise<CompraDeMoeda[]> {
  const { data, error } = await supabase
    .from('compras_cambio')
    .select('*')
    .eq('viagem_id', viagemId)
    .order('data', { ascending: false })
  if (error) throw error
  return data.map(({ valor_origem, valor_destino, cotacao: _cotacao, ...c }) => ({
    ...c,
    valorOrigem: deBanco(valor_origem),
    valorDestino: deBanco(valor_destino),
  }))
}

export type DadosDaCompra = {
  id?: string
  moedaOrigem: string
  moedaDestino: string
  valorOrigem: number // centavos
  valorDestino: number // centavos
  data: string
  especie?: boolean // spec 083: dinheiro vivo
}

// Cada pessoa registra e edita só as próprias compras (regra do banco)
export async function salvarCompra(viagemId: string, compra: DadosDaCompra) {
  const linha = {
    moeda_origem: compra.moedaOrigem,
    moeda_destino: compra.moedaDestino,
    valor_origem: Number(paraBanco(compra.valorOrigem)),
    valor_destino: Number(paraBanco(compra.valorDestino)),
    data: compra.data,
    ...(compra.especie !== undefined ? { especie: compra.especie } : {}),
  }
  const { error } = compra.id
    ? await supabase.from('compras_cambio').update(linha).eq('id', compra.id)
    : await supabase.from('compras_cambio').insert({ ...linha, viagem_id: viagemId })
  if (error) throw error
}

export async function apagarCompra(id: string) {
  const { error } = await supabase.from('compras_cambio').delete().eq('id', id)
  if (error) throw error
}

// ---------- Cotação de hoje (Frankfurter, grátis e sem chave) ----------
// Resposta: "1 <base> = X <moeda>". Guardada em memória por 3 horas.
const TRES_HORAS = 3 * 60 * 60 * 1000
const memoria = new Map<string, { quando: number; taxas: Record<string, number> }>()

/**
 * Cotações de hoje pra converter pra moeda `base`.
 * Devolve `taxas[X]` = quantas unidades de X valem 1 da base (o mesmo formato de cotacao.ts).
 * Sem internet ou moeda que o Frankfurter não tem → null.
 */
export async function cotacoesDeHoje(base: string, moedas: string[]): Promise<Record<string, number> | null> {
  const lista = [...new Set(moedas.filter((m) => m !== base))].sort()
  if (lista.length === 0) return {}
  const chave = `${base}:${lista.join(',')}`
  const guardado = memoria.get(chave)
  if (guardado && Date.now() - guardado.quando < TRES_HORAS) return guardado.taxas
  try {
    const resposta = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${lista.join(',')}`)
    if (!resposta.ok) return null
    const dados: { rates?: Record<string, number> } = await resposta.json()
    const taxas = dados.rates ?? {}
    memoria.set(chave, { quando: Date.now(), taxas })
    return taxas
  } catch {
    return null
  }
}

// ---------- Termômetro do câmbio (Financeiro) ----------
// Histórico: Frankfurter (Banco Central Europeu, 1 valor por dia útil). Agora: AwesomeAPI (comercial, atualiza durante o dia).
// As duas são grátis, sem chave e funcionam direto do navegador.
const SEIS_HORAS = 6 * 60 * 60 * 1000
const CINCO_MINUTOS = 5 * 60 * 1000
const historicos = new Map<string, { quando: number; serie: { data: string; valor: number }[] }>()
const agoras = new Map<string, { quando: number; valor: number; hora: string }>()

// 1 ano de cotação: quantos reais vale 1 da moeda, dia a dia
export async function buscarHistorico(moeda: string): Promise<{ data: string; valor: number }[]> {
  const guardado = historicos.get(moeda)
  if (guardado && Date.now() - guardado.quando < SEIS_HORAS) return guardado.serie
  const inicio = new Date(Date.now() - 366 * 86_400_000).toISOString().slice(0, 10)
  const resposta = await fetch(`https://api.frankfurter.dev/v1/${inicio}..?base=${moeda}&symbols=BRL`)
  if (!resposta.ok) throw new Error(`Frankfurter respondeu ${resposta.status}`)
  const dados: { rates?: Record<string, { BRL?: number }> } = await resposta.json()
  const serie = Object.entries(dados.rates ?? {})
    .filter(([, r]) => typeof r.BRL === 'number')
    .map(([data, r]) => ({ data, valor: r.BRL! }))
    .sort((a, b) => a.data.localeCompare(b.data))
  historicos.set(moeda, { quando: Date.now(), serie })
  return serie
}

// Cotação comercial de agora (compra). Sem resposta → null (a tela usa o último valor do histórico).
export async function buscarAgora(moeda: string): Promise<{ valor: number; hora: string } | null> {
  const guardado = agoras.get(moeda)
  if (guardado && Date.now() - guardado.quando < CINCO_MINUTOS) return guardado
  try {
    const resposta = await fetch(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`)
    if (!resposta.ok) return null
    const dados: Record<string, { bid?: string; create_date?: string }> = await resposta.json()
    const item = dados[`${moeda}BRL`]
    const valor = Number(item?.bid)
    if (!valor) return null
    const novo = { quando: Date.now(), valor, hora: item?.create_date ?? '' }
    agoras.set(moeda, novo)
    return novo
  } catch {
    return null
  }
}
