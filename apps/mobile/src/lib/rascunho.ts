import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { Escolha, EstiloId } from '@together/core'

// Rascunho da primeira viagem (spec 116): o que a pessoa respondeu pra Agulha antes de ter conta.
// Fica na memória e no aparelho, pra sobreviver ao "confirme seu e-mail" (sair e voltar pro app).
// Depois do login, a tela /comecar cria a viagem com ele e apaga.

export type RascunhoDaViagem = {
  destino: string
  pais: string | null // código ISO (ex.: "BR"), da lista de cidades
  dias: number
  estilos: EstiloId[]
  escolhas: Record<string, Escolha> // id do catálogo → escolha (o "gostinho" do deslize)
}

const CHAVE = 'tripwave.rascunho'
let atual: RascunhoDaViagem | null = null

export function lerRascunho(): RascunhoDaViagem | null {
  return atual
}

export async function carregarRascunho(): Promise<void> {
  try {
    const texto = Platform.OS === 'web' ? globalThis.localStorage?.getItem(CHAVE) : await SecureStore.getItemAsync(CHAVE)
    atual = texto ? (JSON.parse(texto) as RascunhoDaViagem) : null
  } catch {
    atual = null
  }
}

export async function guardarRascunho(r: RascunhoDaViagem | null): Promise<void> {
  atual = r
  try {
    if (Platform.OS === 'web') {
      if (r) globalThis.localStorage?.setItem(CHAVE, JSON.stringify(r))
      else globalThis.localStorage?.removeItem(CHAVE)
    } else if (r) await SecureStore.setItemAsync(CHAVE, JSON.stringify(r))
    else await SecureStore.deleteItemAsync(CHAVE)
  } catch {
    // Sem armazenamento: fica só na memória
  }
}
