// Lembretes no celular (spec 032). O banco escolhe o que vence agora (`lembretes_a_enviar`);
// aqui fica só o texto da notificação (puro, testado em apps/web/tests/lembretes.test.mjs).
// A função do servidor (supabase/functions/lembretes) tem uma cópia desta regra, porque o Deno
// não importa do pacote. Mudou aqui, muda lá.
import type { ClienteTogether } from './supabase'

export type LembreteDoBanco = {
  tipo: 'trajeto' | 'ponto' | 'cancelamento'
  alvo_id: string
  viagem_id: string
  titulo: string | null
  horario: string // ISO
  meio: string | null
}

export type AvisoDoLembrete = { titulo: string; corpo: string; url: string; tag: string }

const EMOJI_DO_MEIO: Record<string, string> = {
  aviao: '✈️',
  trem: '🚆',
  onibus: '🚌',
  carro: '🚗',
  barco: '⛴️',
  a_pe: '🚶',
}

// "em 45 min" · "em 1 h" · "em 1 h 10 min" · "agora"
export function faltaQuanto(horario: string, agora: Date = new Date()): string {
  const minutos = Math.round((new Date(horario).getTime() - agora.getTime()) / 60000)
  if (minutos <= 1) return 'agora'
  if (minutos < 60) return `em ${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `em ${horas} h ${resto} min` : `em ${horas} h`
}

// "2026-11-12T00:00:00+00:00" → "12/11" (a data do prazo, sem mexer no fuso)
function dataCurta(horario: string): string {
  const [, m, d] = horario.slice(0, 10).split('-')
  return `${d}/${m}`
}

// Prazo de cancelamento grátis (spec 041): quantos dias faltam e se já é hora de decidir
export function prazoDeCancelamento(ate: string | null, hoje: string): { dias: number; nivel: 'tranquilo' | 'perto' | 'hoje' | 'passou' } | null {
  if (!ate) return null
  const um = Date.UTC(+ate.slice(0, 4), +ate.slice(5, 7) - 1, +ate.slice(8, 10))
  const dois = Date.UTC(+hoje.slice(0, 4), +hoje.slice(5, 7) - 1, +hoje.slice(8, 10))
  const dias = Math.round((um - dois) / 86400000)
  return { dias, nivel: dias < 0 ? 'passou' : dias === 0 ? 'hoje' : dias <= 3 ? 'perto' : 'tranquilo' }
}

export function textoDoLembrete(l: LembreteDoBanco, agora: Date = new Date()): AvisoDoLembrete {
  const falta = faltaQuanto(l.horario, agora)
  const titulo = l.titulo?.trim() || (l.tipo === 'ponto' ? 'o ponto de encontro' : l.tipo === 'cancelamento' ? 'a hospedagem' : 'o trajeto')
  if (l.tipo === 'cancelamento') {
    return {
      titulo: '⏳ Cancelamento grátis acabando',
      corpo: `${titulo}: dá pra cancelar sem pagar só até ${dataCurta(l.horario)}. Ainda vão ficar?`,
      url: `/viagem/${l.viagem_id}/hospedagem`,
      tag: `lembrete-cancelamento-${l.alvo_id}`,
    }
  }
  if (l.tipo === 'ponto') {
    return {
      titulo: `📍 Encontro ${falta}`,
      corpo: `${titulo}. Não se atrase!`,
      url: `/viagem/${l.viagem_id}?foco=${l.alvo_id}`,
      tag: `lembrete-ponto-${l.alvo_id}`,
    }
  }
  const emoji = (l.meio && EMOJI_DO_MEIO[l.meio]) || '🧳'
  return {
    titulo: `${emoji} Saída ${falta}`,
    corpo: `${titulo}. Bilhete e documentos na mão.`,
    url: `/viagem/${l.viagem_id}/transportes`,
    tag: `lembrete-trajeto-${l.alvo_id}`,
  }
}

// ---------- Preferências de aviso (spec 033) ----------
// Sem linha no banco = ligado. Só guardo o que a pessoa mudou.

export type TipoAviso = 'lembretes' | 'fotos' | 'resumo'

export const TIPOS_DE_AVISO: { tipo: TipoAviso; nome: string; explica: string }[] = [
  { tipo: 'lembretes', nome: 'Lembretes de horário', explica: '1 hora antes de cada trajeto e ponto de encontro' },
  { tipo: 'resumo', nome: 'Resumo da noite', explica: 'Às 21h, o que acontece amanhã' },
  { tipo: 'fotos', nome: 'Fotos do comboio', explica: 'Post novo e comentário nas suas fotos' },
]

export async function buscarPreferenciasDeAviso(cli: ClienteTogether): Promise<Record<TipoAviso, boolean>> {
  const { data, error } = await cli.from('preferencias_aviso').select('tipo, ligado')
  if (error) throw error
  const prefs: Record<TipoAviso, boolean> = { lembretes: true, fotos: true, resumo: true }
  for (const linha of data ?? []) if (linha.tipo in prefs) prefs[linha.tipo as TipoAviso] = linha.ligado
  return prefs
}

export async function marcarPreferenciaDeAviso(cli: ClienteTogether, meuId: string, tipo: TipoAviso, ligado: boolean) {
  const { error } = await cli
    .from('preferencias_aviso')
    .upsert({ usuario_id: meuId, tipo, ligado, atualizado_em: new Date().toISOString() }, { onConflict: 'usuario_id,tipo' })
  if (error) throw error
}
