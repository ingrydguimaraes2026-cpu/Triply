// Marcações feitas sem internet (spec 086): item da lista, da mala e tarefa.
// Ficam guardadas no celular (localStorage) e vão pro banco quando a conexão volta.
// A regra de conflito está em @together/core (fila-offline.ts).
import { juntarNaFila, ordemDeEnvio, tirarDaFila, type Criacao, type Marcacao, type TabelaMarcavel } from '@together/core'
import { supabase } from '../../lib/supabase'
import { ehErroDeRede } from '../financeiro/fila'

const CHAVE = 'together:fila-marcacoes'
const CHAVE_CRIACOES = 'together:fila-criacoes'
export const EVENTO_FILA = 'together:fila-marcacoes-mudou'

export function lerMarcacoes(): Marcacao[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '[]')
  } catch {
    return []
  }
}

function gravar(fila: Marcacao[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(fila))
  } catch {
    // sem localStorage: não tem como guardar
  }
  window.dispatchEvent(new Event(EVENTO_FILA))
}

async function enviarUma(m: Marcacao): Promise<boolean> {
  const { data, error } = await supabase
    .from(m.tabela)
    .update(m.campos as never)
    .eq('id', m.id)
    .select('id')
  if (error) throw error
  return (data ?? []).length > 0 // 0 = item apagado (ou sem permissão)
}

// Tenta gravar agora; sem internet, guarda na fila. Devolve true se ficou guardado.
// Erro que não é de rede (o banco recusou) continua sendo erro: quem chamou desfaz na tela.
export async function marcarOuGuardar(tabela: TabelaMarcavel, id: string, campos: Marcacao['campos'], fazer: () => Promise<void>) {
  try {
    await fazer()
    return false
  } catch (erro) {
    if (!ehErroDeRede(erro)) throw erro
    gravar(juntarNaFila(lerMarcacoes(), { tabela, id, campos, quando: Date.now() }))
    return true
  }
}

// ---------- Itens criados sem internet (por enquanto: lista do comboio) ----------

export function lerCriacoes(): Criacao[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CRIACOES) ?? '[]')
  } catch {
    return []
  }
}

function gravarCriacoes(lista: Criacao[]) {
  try {
    localStorage.setItem(CHAVE_CRIACOES, JSON.stringify(lista))
  } catch {
    // sem localStorage: não tem como guardar
  }
  window.dispatchEvent(new Event(EVENTO_FILA))
}

// Tenta criar agora; sem internet, guarda (com o id já gerado). Devolve true se ficou guardado.
export async function criarOuGuardar(c: Criacao, fazer: () => Promise<unknown>) {
  try {
    await fazer()
    return false
  } catch (erro) {
    if (!ehErroDeRede(erro)) throw erro
    gravarCriacoes([...lerCriacoes().filter((x) => x.linha.id !== c.linha.id), c])
    return true
  }
}

async function enviarCriacoes(): Promise<{ enviadas: number; semRede: boolean }> {
  let enviadas = 0
  for (const c of [...lerCriacoes()].sort((a, b) => a.quando - b.quando)) {
    // upsert ignorando repetido: se já chegou antes, não duplica
    const { error } = await supabase.from(c.tabela).upsert(c.linha as never, { onConflict: 'id', ignoreDuplicates: true })
    if (error && ehErroDeRede(error)) return { enviadas, semRede: true }
    if (error) console.error('Item da fila recusado pelo banco, descartado:', c, error)
    else enviadas++
    gravarCriacoes(lerCriacoes().filter((x) => x.linha.id !== c.linha.id))
  }
  return { enviadas, semRede: false }
}

let enviando = false

// Manda tudo que está guardado. Devolve quantas foram. Erro de rede: para e tenta depois.
export async function enviarMarcacoes(): Promise<number> {
  if (enviando) return 0
  enviando = true
  let enviadas = 0
  try {
    // Primeiro os itens novos (uma marcação pode ser num item criado sem internet)
    const criadas = await enviarCriacoes()
    enviadas += criadas.enviadas
    if (criadas.semRede) return enviadas
    for (const m of ordemDeEnvio(lerMarcacoes())) {
      try {
        if (await enviarUma(m)) enviadas++
        else console.warn('Marcação descartada: o item não existe mais.', m)
        gravar(tirarDaFila(lerMarcacoes(), m))
      } catch (erro) {
        if (ehErroDeRede(erro)) break
        console.error('Marcação recusada pelo banco, descartada:', m, erro)
        gravar(tirarDaFila(lerMarcacoes(), m))
      }
    }
  } finally {
    enviando = false
  }
  return enviadas
}
