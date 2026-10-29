import { Platform, Share } from 'react-native'
import { criarCodigoDeConvite } from '@together/core'
import { supabase } from './supabase'

// Link de convite: o mesmo /convite/<código> do site, pra quem receber abrir em qualquer lugar.
const SITE = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://together-viagem.vercel.app'

export async function gerarLinkDeConvite(viagemId: string) {
  const codigo = await criarCodigoDeConvite(supabase, viagemId)
  return `${SITE}/convite/${codigo}`
}

// Abre o "compartilhar" do celular. No navegador sem compartilhar, copia o link.
// Devolve 'copiado' quando só copiou (pra tela avisar).
export async function compartilharLink(link: string, nomeDaViagem: string): Promise<'compartilhado' | 'copiado'> {
  const texto = `Bora pra ${nomeDaViagem}? Entra no comboio pelo Together: ${link}`
  if (Platform.OS === 'web') {
    const nav = globalThis.navigator as Navigator | undefined
    if (nav?.share) {
      await nav.share({ text: texto })
      return 'compartilhado'
    }
    await nav?.clipboard?.writeText(link)
    return 'copiado'
  }
  await Share.share({ message: texto })
  return 'compartilhado'
}

// Convite aberto antes do login ("Já tenho conta"): o porteiro volta pra ele depois de entrar
export const conviteDepoisDoLogin: { codigo: string | null } = { codigo: null }
