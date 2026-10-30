// Ficha da pessoa (spec 050): o que o comboio precisa saber (alergia, restrição, aniversário)
// e saúde/emergência só pra quem a pessoa liberar. Teste: apps/web/tests/ficha-pessoal.test.mjs
import type { ClienteTogether } from './supabase'
import type { Tables, TablesInsert } from './database'

export type MinhaFicha = Tables<'fichas_pessoais'>
export type FichaNoComboio = {
  usuario_id: string
  telefone: string | null
  aniversario: string | null
  restricoes: string | null
  alergias: string | null
  mobilidade: string | null
  emergencia_nome: string | null
  emergencia_telefone: string | null
  tipo_sanguineo: string | null
  remedios: string | null
}

// Quem faz aniversário durante a viagem (compara só dia e mês; vira o ano se a viagem passa do Réveillon)
export function aniversariosNaViagem<F extends Pick<FichaNoComboio, 'usuario_id' | 'aniversario'>>(
  fichas: F[],
  inicio: string | null,
  fim: string | null,
): { usuarioId: string; dia: string }[] {
  if (!inicio) return []
  const ultimo = fim ?? inicio
  const saida: { usuarioId: string; dia: string }[] = []
  for (const f of fichas) {
    if (!f.aniversario) continue
    const mesDia = f.aniversario.slice(5)
    for (const ano of new Set([inicio.slice(0, 4), ultimo.slice(0, 4)])) {
      const dia = `${ano}-${mesDia}`
      if (dia >= inicio && dia <= ultimo) {
        saida.push({ usuarioId: f.usuario_id, dia })
        break
      }
    }
  }
  return saida.sort((a, b) => a.dia.localeCompare(b.dia))
}

// Restrições e alergias do grupo, pra escolher restaurante ("Ana: sem glúten · Léo: alergia a amendoim")
export function restricoesDoGrupo<F extends Pick<FichaNoComboio, 'usuario_id' | 'restricoes' | 'alergias'>>(
  fichas: F[],
  nomeDe: (id: string) => string,
): string[] {
  return fichas
    .filter((f) => f.restricoes || f.alergias)
    .map((f) => `${nomeDe(f.usuario_id)}: ${[f.restricoes, f.alergias && `alergia a ${f.alergias}`].filter(Boolean).join(', ')}`)
}

export async function buscarMinhaFicha(cli: ClienteTogether): Promise<MinhaFicha | null> {
  const { data, error } = await cli.from('fichas_pessoais').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function salvarMinhaFicha(cli: ClienteTogether, meuId: string, dados: Omit<TablesInsert<'fichas_pessoais'>, 'usuario_id' | 'atualizado_em'>) {
  const { error } = await cli.from('fichas_pessoais').upsert({ ...dados, usuario_id: meuId, atualizado_em: new Date().toISOString() })
  if (error) throw error
}

export async function buscarFichasDoComboio(cli: ClienteTogether, viagemId: string): Promise<FichaNoComboio[]> {
  const { data, error } = await cli.rpc('fichas_do_comboio', { p_viagem: viagemId })
  if (error) throw error
  return data ?? []
}
