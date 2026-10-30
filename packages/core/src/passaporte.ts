// Nacionalidade e validade do passaporte (spec 038). Nunca número nem foto de documento.
// Regras puras testadas em apps/web/tests/passaporte.test.mjs.
import type { ClienteTogether } from './supabase'

// Países da União Europeia (passaporte europeu entra sem ETIAS nem visto Schengen)
const UNIAO_EUROPEIA = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]

export function temPassaporteEuropeu(nacionalidades: string[]): boolean {
  return nacionalidades.some((n) => UNIAO_EUROPEIA.includes(n))
}

function somarMeses(dia: string, meses: number): string {
  const [a, m, d] = dia.split('-').map(Number)
  const total = a * 12 + (m - 1) + meses
  const ano = Math.floor(total / 12)
  const mes = (total % 12) + 1
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`
}

export type SituacaoDoPassaporte = { nivel: 'ok' | 'renovar' | 'vencido' | 'sem_data'; texto: string }

// A regra mais comum (Schengen, EUA, muitos outros): passaporte válido por 6 meses depois da volta
export function situacaoDoPassaporte(validade: string | null, volta: string | null, hoje: string): SituacaoDoPassaporte {
  if (!validade) return { nivel: 'sem_data', texto: 'Informe a validade do passaporte no seu perfil pra o app avisar se precisa renovar.' }
  const [a, m, d] = validade.split('-')
  const dataBr = `${d}/${m}/${a}`
  if (validade < hoje) return { nivel: 'vencido', texto: `Seu passaporte venceu em ${dataBr}. Renove antes de viajar.` }
  const limite = somarMeses(volta ?? hoje, 6)
  if (validade < limite) {
    return { nivel: 'renovar', texto: `Seu passaporte vence em ${dataBr}, menos de 6 meses depois da volta. Muitos países barram: renove antes.` }
  }
  return { nivel: 'ok', texto: `Passaporte válido até ${dataBr}.` }
}

// ---------- Banco ----------

export type MeusDocumentos = { nacionalidades: string[]; passaporteValidade: string | null }

export async function buscarMeusDocumentos(cli: ClienteTogether): Promise<MeusDocumentos> {
  const { data, error } = await cli.from('documentos_pessoais').select('nacionalidades, passaporte_validade').maybeSingle()
  if (error) throw error
  return { nacionalidades: data?.nacionalidades ?? [], passaporteValidade: data?.passaporte_validade ?? null }
}

export async function salvarMeusDocumentos(cli: ClienteTogether, meuId: string, docs: MeusDocumentos) {
  const { error } = await cli.from('documentos_pessoais').upsert({
    usuario_id: meuId,
    nacionalidades: docs.nacionalidades,
    passaporte_validade: docs.passaporteValidade,
    atualizado_em: new Date().toISOString(),
  })
  if (error) throw error
}

// Quem do comboio precisa olhar o passaporte (sem ver a data dos outros)
export async function buscarAlertasDePassaporte(cli: ClienteTogether, viagemId: string): Promise<{ usuarioId: string; situacao: 'vence' | 'sem_data' }[]> {
  const { data, error } = await cli.rpc('alertas_de_passaporte', { p_viagem: viagemId })
  if (error) throw error
  return (data ?? []).map((a) => ({ usuarioId: a.usuario_id, situacao: a.situacao === 'vence' ? 'vence' : 'sem_data' }))
}
