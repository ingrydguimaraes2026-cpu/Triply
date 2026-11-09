// Meu orçamento pessoal (spec 056). Valores em CENTAVOS na moeda principal da viagem.
// Teste: apps/web/tests/orcamento-pessoal.test.mjs
import type { ClienteTogether } from './supabase'

const dias = (de: string, ate: string) =>
  Math.round((Date.UTC(+ate.slice(0, 4), +ate.slice(5, 7) - 1, +ate.slice(8, 10)) - Date.UTC(+de.slice(0, 4), +de.slice(5, 7) - 1, +de.slice(8, 10))) / 86400000)

// Quanto já foi, quanto sobra e quanto dá por dia daqui até o fim (contando hoje)
export function situacaoDoMeuOrcamento(
  meta: number,
  gasto: number,
  inicio: string | null,
  fim: string | null,
  hoje: string,
): { porcento: number; restante: number; porDia: number | null; diasRestantes: number | null; nivel: 'ok' | 'atencao' | 'estourou' } {
  const restante = meta - gasto
  const porcento = Math.round((gasto / meta) * 100)
  let diasRestantes: number | null = null
  if (inicio && fim && fim >= hoje) diasRestantes = dias(hoje < inicio ? inicio : hoje, fim) + 1
  const porDia = diasRestantes && restante > 0 ? Math.floor(restante / diasRestantes) : null
  return { porcento, restante, porDia, diasRestantes, nivel: gasto > meta ? 'estourou' : porcento >= 80 ? 'atencao' : 'ok' }
}

export async function buscarMeuOrcamento(cli: ClienteTogether, viagemId: string): Promise<number | null> {
  const { data, error } = await cli.from('orcamentos_pessoais').select('meta').eq('viagem_id', viagemId).maybeSingle()
  if (error) throw error
  return data ? Math.round(Number(data.meta) * 100) : null
}

export async function salvarMeuOrcamento(cli: ClienteTogether, viagemId: string, meuId: string, metaCentavos: number | null) {
  if (metaCentavos === null) {
    const { error } = await cli.from('orcamentos_pessoais').delete().eq('viagem_id', viagemId).eq('usuario_id', meuId)
    if (error) throw error
    return
  }
  const { error } = await cli
    .from('orcamentos_pessoais')
    .upsert({ viagem_id: viagemId, usuario_id: meuId, meta: metaCentavos / 100, atualizado_em: new Date().toISOString() })
  if (error) throw error
}
