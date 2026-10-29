// Ajudantes pra mostrar datas em português.
// As datas do banco vêm como "2026-11-12" (sem hora).

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function partes(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  return { ano, mes, dia }
}

// "12 nov" ou "12 nov 2026"
export function formatarData(data: string, comAno = false) {
  const { ano, mes, dia } = partes(data)
  return `${dia} ${MESES[mes - 1]}${comAno ? ` ${ano}` : ''}`
}

// "12 – 20 nov 2026", "28 nov – 3 dez 2026" ou "Datas a definir"
export function formatarPeriodo(inicio: string | null, fim: string | null) {
  if (!inicio && !fim) return 'Datas a definir'
  if (inicio && !fim) return `A partir de ${formatarData(inicio, true)}`
  if (!inicio && fim) return `Até ${formatarData(fim, true)}`
  const a = partes(inicio!)
  const b = partes(fim!)
  if (a.ano === b.ano && a.mes === b.mes) return `${a.dia} – ${b.dia} ${MESES[b.mes - 1]} ${b.ano}`
  return `${formatarData(inicio!)} – ${formatarData(fim!, true)}`
}

// Quantos dias faltam até a data (negativo se já passou)
export function diasAte(data: string) {
  const { ano, mes, dia } = partes(data)
  const alvo = new Date(ano, mes - 1, dia)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
}
