import { Share } from 'react-native'
import { linkDoItem, textoDoItem, type ItemCompartilhavel } from '@together/core'

// Mesmo domínio do convite (site), pros links abrirem em qualquer lugar.
const SITE = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://together-viagem.vercel.app'

// Abre o "compartilhar" do celular com o link que leva direto ao item.
export async function compartilharItem(viagemId: string, item: ItemCompartilhavel, nomeDaViagem?: string): Promise<void> {
  const link = linkDoItem(SITE, viagemId, item)
  await Share.share({ message: textoDoItem(item, link, nomeDaViagem) })
}
