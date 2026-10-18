// Avisos de logística dos transportes (spec 004). Funções puras, testadas em tests/transportes.test.mjs.
// Horários vêm do banco em UTC ("2026-11-14T08:10:00+00:00") e são mostrados no fuso do celular.

export type TrajetoParaAviso = {
  id: string
  origem_id: string | null
  destino_id: string | null
  partida: string | null
  chegada: string | null
  bate_e_volta: boolean
}

export type DestinoParaAviso = { id: string; nome: string; chegada?: string | null; saida?: string | null }

// Dia local ("2026-11-14") de um horário com fuso
export function diaLocal(horario: string): string {
  const d = new Date(horario)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function diaCurto(data: string) {
  return String(Number(data.slice(8, 10)))
}

/**
 * Avisos de um trajeto. Nunca bloqueiam: só chamam atenção.
 * `trajetos` é a lista toda (pra achar a volta de um bate-e-volta).
 */
export function avisosDoTrajeto(
  trajeto: TrajetoParaAviso,
  destinos: DestinoParaAviso[],
  trajetos: TrajetoParaAviso[] = [],
): string[] {
  const avisos: string[] = []
  const origem = destinos.find((d) => d.id === trajeto.origem_id)
  const destino = destinos.find((d) => d.id === trajeto.destino_id)

  if (!origem || !destino) {
    avisos.push('Trajeto sem destino: um dos lugares saiu do roteiro. Edite ou apague.')
    return avisos
  }
  if (trajeto.partida && trajeto.chegada && trajeto.chegada < trajeto.partida) {
    avisos.push('A chegada está antes da partida.')
  }
  if (trajeto.partida) {
    const dia = diaLocal(trajeto.partida)
    if (origem.chegada && dia < origem.chegada && !trajeto.bate_e_volta) {
      avisos.push(`A partida de ${origem.nome} é antes da chegada de vocês lá (dia ${diaCurto(origem.chegada)}).`)
    }
    if (origem.saida && dia > origem.saida && !trajeto.bate_e_volta) {
      avisos.push(`A partida é depois da saída de ${origem.nome} (dia ${diaCurto(origem.saida)}).`)
    }
  }

  if (trajeto.bate_e_volta) {
    // A volta é o outro trajeto bate-e-volta no sentido contrário
    const volta = trajetos.find(
      (t) => t.id !== trajeto.id && t.bate_e_volta && t.origem_id === trajeto.destino_id && t.destino_id === trajeto.origem_id,
    )
    const ehIda = !volta || !volta.partida || !trajeto.partida || trajeto.partida <= volta.partida
    const base = ehIda ? origem : destino
    const horarioVolta = ehIda ? (volta?.chegada ?? volta?.partida) : (trajeto.chegada ?? trajeto.partida)
    if (horarioVolta && base.saida && diaLocal(horarioVolta) > base.saida) {
      avisos.push(
        `A saída de ${base.nome} é dia ${diaCurto(base.saida)}, mas a volta do bate-e-volta é dia ${diaCurto(diaLocal(horarioVolta))}: reservem mais uma diária em ${base.nome}.`,
      )
    } else {
      avisos.push(`Bate-e-volta: vocês voltam pra ${base.nome} no mesmo dia. Confiram se a diária em ${base.nome} cobre essa noite.`)
    }
  }
  return avisos
}

// O próximo trajeto: o de partida mais próxima no futuro
export function proximoTrajeto<T extends { partida: string | null }>(trajetos: T[], agora = new Date()): T | null {
  const futuros = trajetos
    .filter((t) => t.partida && new Date(t.partida).getTime() >= agora.getTime())
    .sort((a, b) => a.partida!.localeCompare(b.partida!))
  return futuros[0] ?? null
}

// "2026-11-14T09:10" (campo datetime-local, no fuso do celular) ↔ horário do banco
export function paraCampoHorario(horario: string | null): string {
  if (!horario) return ''
  const d = new Date(horario)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function deCampoHorario(valor: string): string | null {
  return valor ? new Date(valor).toISOString() : null
}

// "09:10" (no fuso do celular)
export function hora(horario: string) {
  return new Date(horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}