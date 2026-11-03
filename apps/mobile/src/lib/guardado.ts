import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Guarda coisinhas no aparelho (no navegador, no localStorage). Ex.: carimbos que a pessoa já viu cair.
// Chave só com letras, números, ponto, hífen e sublinhado (regra do SecureStore).
export async function lerGuardado<T>(chave: string): Promise<T | null> {
  try {
    const texto = Platform.OS === 'web' ? globalThis.localStorage?.getItem(chave) : await SecureStore.getItemAsync(chave)
    return texto ? (JSON.parse(texto) as T) : null
  } catch {
    return null
  }
}

export async function guardar(chave: string, valor: unknown): Promise<void> {
  try {
    const texto = JSON.stringify(valor)
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(chave, texto)
    else await SecureStore.setItemAsync(chave, texto)
  } catch {
    // Sem espaço ou sem permissão: o pior que acontece é o carimbo cair de novo
  }
}
