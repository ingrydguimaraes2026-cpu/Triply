// Formatação de datas e nomes pras telas (pt-BR, curtinho como no design).

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const SEMANA_LONGA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// "2026-11-14" → Date local (sem pular de dia por fuso)
export function lerData(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function paraIso(data: Date): string {
  const m = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${m}-${d}`
}

export function hojeIso() {
  return paraIso(new Date())
}

// "14–19 nov", "28 nov – 3 dez", "jul 2026"
export function periodo(inicio: string | null, fim: string | null): string {
  if (!inicio) return 'Sem data'
  const a = lerData(inicio)
  if (!fim) return `${a.getDate()} ${MESES[a.getMonth()]}`
  const b = lerData(fim)
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MESES[a.getMonth()]}`
  return `${a.getDate()} ${MESES[a.getMonth()]} – ${b.getDate()} ${MESES[b.getMonth()]}`
}

export function mesEAno(iso: string | null): string {
  if (!iso) return ''
  const d = lerData(iso)
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function nomeDoMes(mes: number, ano: number) {
  const n = MESES_LONGOS[mes]
  return `${n[0].toUpperCase()}${n.slice(1)} ${ano}`
}

// "sex 14"
export function diaCurto(d: Date) {
  return `${SEMANA[d.getDay()]} ${d.getDate()}`
}

// "Sexta, 14 de nov"
export function diaLongo(d: Date) {
  return `${SEMANA_LONGA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
}

// Quantos dias faltam pra uma data (0 = hoje, negativo = já passou)
export function diasAte(iso: string): number {
  const hoje = lerData(hojeIso())
  return Math.round((lerData(iso).getTime() - hoje.getTime()) / 86_400_000)
}

// Todos os dias entre início e fim (inclusive)
export function diasDaViagem(inicio: string | null, fim: string | null): Date[] {
  if (!inicio) return []
  const a = lerData(inicio)
  const b = fim ? lerData(fim) : a
  const dias: Date[] = []
  for (let d = new Date(a); d <= b && dias.length < 60; d.setDate(d.getDate() + 1)) dias.push(new Date(d))
  return dias
}

// "06:10" a partir de um timestamp do banco
export function hora(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// "Ana Souza" → "AS"; "Ana" → "AN"
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? nome
}
