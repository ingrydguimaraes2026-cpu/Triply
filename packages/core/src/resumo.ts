// Resumo da noite (spec 042): às ~21h (hora do destino), o que acontece amanhã.
// Sem imports de propósito: a função do servidor (supabase/functions/resumo-da-noite) tem uma cópia.
// Testado em apps/web/tests/resumo.test.mjs.

type DestinoR = { id: string; nome: string; chegada: string | null; saida: string | null; longitude: number | null }
type TrajetoR = { origem_id: string | null; destino_id: string | null; meio: string; partida: string | null }
type EventoR = { dia: string; hora: string | null; titulo: string }
type PontoR = { local: string; quando: string | null }

// Fuso aproximado pela longitude (15° = 1 h). Sem horário de verão: erra no máximo 1 h.
export function fusoAproximado(longitude: number | null): number {
  if (longitude === null) return 0
  return Math.max(-12, Math.min(14, Math.round(longitude / 15)))
}

// Dia e hora "de lá" a partir de um instante, dado o fuso em horas
export function horaLocal(instante: string | Date, fuso: number): { dia: string; hora: string; h: number } {
  const d = new Date(new Date(instante).getTime() + fuso * 3600000)
  const p = (n: number) => String(n).padStart(2, '0')
  return { dia: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`, hora: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`, h: d.getUTCHours() }
}

const MEIOS: Record<string, string> = { aviao: 'Voo', trem: 'Trem', onibus: 'Ônibus', carro: 'Carro', barco: 'Barco', a_pe: 'A pé' }

// Onde o comboio está num dia (o último destino cujo período inclui o dia)
export function ondeNoDia(dia: string, destinos: DestinoR[]): DestinoR | undefined {
  const lista = destinos.filter((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia)
  return lista[lista.length - 1]
}

// Monta o resumo de amanhã. null = nada marcado (não manda push vazio).
export function resumoDeAmanha(
  amanha: string,
  fuso: number,
  { destinos, trajetos, eventos, pontos }: { destinos: DestinoR[]; trajetos: TrajetoR[]; eventos: EventoR[]; pontos: PontoR[] },
): { titulo: string; corpo: string } | null {
  const nome = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const itens: { hora: string; texto: string }[] = []
  for (const t of trajetos) {
    if (!t.partida) continue
    const l = horaLocal(t.partida, fuso)
    if (l.dia === amanha) itens.push({ hora: l.hora, texto: `${MEIOS[t.meio] ?? 'Saída'} ${nome(t.origem_id)} → ${nome(t.destino_id)}` })
  }
  for (const p of pontos) {
    if (!p.quando) continue
    const l = horaLocal(p.quando, fuso)
    if (l.dia === amanha) itens.push({ hora: l.hora, texto: `Encontro: ${p.local}` })
  }
  for (const e of eventos) if (e.dia === amanha) itens.push({ hora: e.hora?.slice(0, 5) ?? '', texto: e.titulo })
  const chegando = destinos.filter((d) => d.chegada === amanha && ondeNoDia(amanha, destinos)?.id === d.id && d.chegada !== d.saida)

  if (itens.length === 0 && chegando.length === 0) return null
  itens.sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'))
  const onde = ondeNoDia(amanha, destinos)
  const linhas = itens.slice(0, 4).map((i) => (i.hora ? `${i.hora} ${i.texto}` : i.texto))
  if (itens.length > 4) linhas.push(`+ ${itens.length - 4}`)
  if (chegando.length) linhas.push(`Chegada em ${chegando.map((d) => d.nome).join(', ')}`)
  const primeiro = itens.find((i) => i.hora)
  return {
    titulo: `🌙 Amanhã${onde ? ` em ${onde.nome}` : ''}${primeiro ? ` · começa ${primeiro.hora}` : ''}`,
    corpo: linhas.join(' · '),
  }
}
