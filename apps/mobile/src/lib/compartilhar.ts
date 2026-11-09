import { Platform, Share } from 'react-native'
import { linkDoItem, textoDoItem, type ItemCompartilhavel } from '@together/core'

// Mesmo domínio do convite (site), pros links abrirem em qualquer lugar.
const SITE = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://together-viagem.vercel.app'

// Abre o "compartilhar" do celular com o link que leva direto ao item.
export async function compartilharItem(viagemId: string, item: ItemCompartilhavel, nomeDaViagem?: string): Promise<void> {
  const link = linkDoItem(SITE, viagemId, item)
  await Share.share({ message: textoDoItem(item, link, nomeDaViagem) })
}

export const linkDaViagem = (viagemId: string) => `${SITE}/viagem/${viagemId}`

// Compartilha um texto solto (cutucar quem falta votar, contar um carimbo).
// No navegador sem "compartilhar", copia. Devolve false se a pessoa fechou sem mandar.
export async function compartilharTexto(texto: string): Promise<boolean> {
  try {
    const nav = globalThis.navigator as Navigator | undefined
    if (Platform.OS === 'web' && nav?.share) await nav.share({ text: texto })
    else if (Platform.OS === 'web') await nav?.clipboard?.writeText(texto)
    else await Share.share({ message: texto })
    return true
  } catch {
    return false
  }
}
