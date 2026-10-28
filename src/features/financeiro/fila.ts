import { salvarGasto, type DadosDoGasto } from './api'

// Fila de gastos lançados sem internet (spec 009). Fica no próprio celular (localStorage)
// e é enviada quando a conexão volta. Cada gasto já tem o id gerado no celular,
// então mandar duas vezes não duplica (o banco só edita o mesmo gasto).

const CHAVE = 'together:fila-gastos'
type Item = { viagemId: string; gasto: DadosDoGasto & { id: string } }

function ler(): Item[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '[]')
  } catch {
    return []
  }
}

function gravar(itens: Item[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens))
  } catch {
    // sem localStorage: não tem como guardar
  }
}

export function ehErroDeRede(erro: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const texto = erro instanceof Error ? erro.message : typeof erro === 'object' && erro ? String((erro as { message?: string }).message) : ''
  return /failed to fetch|network|load failed|fetch failed/i.test(texto)
}

export function guardarNaFila(viagemId: string, gasto: DadosDoGasto & { id: string }) {
  gravar([...ler().filter((i) => i.gasto.id !== gasto.id), { viagemId, gasto }])
}

export function tamanhoDaFila() {
  return ler().length
}

let enviando = false

// Tenta enviar tudo. Devolve quantos foram. Erro de rede: fica pra próxima.
export async function enviarFila(): Promise<number> {
  if (enviando) return 0
  enviando = true
  let enviados = 0
  try {
    for (const item of ler()) {
      try {
        await salvarGasto(item.viagemId, item.gasto)
        enviados++
        gravar(ler().filter((i) => i.gasto.id !== item.gasto.id))
      } catch (erro) {
        if (ehErroDeRede(erro)) break
        // O banco recusou (ex.: saiu do comboio): não adianta tentar de novo
        console.error('Gasto da fila recusado pelo banco, descartado:', item, erro)
        gravar(ler().filter((i) => i.gasto.id !== item.gasto.id))
      }
    }
  } finally {
    enviando = false
  }
  return enviados
}
