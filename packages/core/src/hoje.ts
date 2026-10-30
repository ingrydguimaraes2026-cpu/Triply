// Tela Hoje (spec 058): o que está acontecendo agora e o que vem depois.
// Puro, testado em apps/web/tests/hoje.test.mjs.

type ComHora = { hora: string } // "08:30" ou "" (sem hora)

// "Agora" = o último item com hora que já começou (até 2 h atrás); "próximo" = o primeiro que ainda não começou
export function agoraEProximo<I extends ComHora>(itens: I[], horaAtual: string): { agora: I | null; proximo: I | null } {
  const comHora = itens.filter((i) => i.hora).sort((a, b) => a.hora.localeCompare(b.hora))
  const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
  const atual = minutos(horaAtual)
  const comecados = comHora.filter((i) => minutos(i.hora) <= atual)
  const ultimo = comecados[comecados.length - 1]
  const agora = ultimo && atual - minutos(ultimo.hora) <= 120 ? ultimo : null
  const proximo = comHora.find((i) => minutos(i.hora) > atual) ?? null
  return { agora, proximo }
}

// "em 25 min" / "em 2 h 10 min" a partir de duas horas "HH:MM" do mesmo dia
export function faltaPara(hora: string, horaAtual: string): string {
  const m = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
  const dif = m(hora) - m(horaAtual)
  if (dif <= 0) return 'agora'
  if (dif < 60) return `em ${dif} min`
  return dif % 60 ? `em ${Math.floor(dif / 60)} h ${dif % 60} min` : `em ${dif / 60} h`
}
