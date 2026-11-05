import { Platform, Share } from 'react-native'
import { criarCodigoDeConvite } from '@together/core'
import { supabase } from './supabase'

// Link de convite: o mesmo /convite/<código> do site, pra quem receber abrir em qualquer lugar.
const SITE = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://together-viagem.vercel.app'

export const linkDoConvite = (codigo: string) => `${SITE}/convite/${codigo}`

export async function gerarLinkDeConvite(viagemId: string) {
  return linkDoConvite(await criarCodigoDeConvite(supabase, viagemId))
}

// Abre o "compartilhar" do celular. No navegador sem compartilhar, copia o link.
// Devolve 'copiado' quando só copiou (pra tela avisar).
export async function compartilharLink(link: string, nomeDaViagem: string): Promise<'compartilhado' | 'copiado'> {
  const texto = `Bora pra ${nomeDaViagem}? Entra no comboio pela Norti: ${link}`
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

// Gera o convite e abre o compartilhar. São dois passos: se só o compartilhar falhar
// (ex.: o navegador não deixou copiar), o convite já existe e a tela mostra o link pra copiar à mão.
export async function convidarProComboio(viagemId: string, nomeDaViagem: string): Promise<{ texto: string; erro: boolean } | null> {
  let link: string
  try {
    link = await gerarLinkDeConvite(viagemId)
  } catch {
    return { texto: 'Só o ADM da viagem pode gerar convite.', erro: true }
  }
  try {
    return (await compartilharLink(link, nomeDaViagem)) === 'copiado' ? { texto: 'Link copiado! Mande pra turma.', erro: false } : null
  } catch {
    return { texto: `Convite criado. Copie e mande: ${link}`, erro: false }
  }
}

// Convite aberto antes do login ("Já tenho conta"): o porteiro volta pra ele depois de entrar
export const conviteDepoisDoLogin: { codigo: string | null } = { codigo: null }
