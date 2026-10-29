import { linkDoItem, textoDoItem, type ItemCompartilhavel } from '@together/core'

// Domínio do app pros links. Em produção vem do VITE_APP_URL; local cai pro endereço atual.
export function baseDoApp(): string {
  return import.meta.env.VITE_APP_URL || window.location.origin
}

/**
 * Compartilha um item: usa o compartilhamento nativo do celular quando existe;
 * no desktop, copia o link e abre o WhatsApp Web já com o texto.
 * Quem envia a mensagem é o usuário — a gente só prepara.
 */
export async function compartilharItem(
  viagemId: string,
  item: ItemCompartilhavel,
  nomeDaViagem?: string,
): Promise<'compartilhado' | 'copiado'> {
  const link = linkDoItem(baseDoApp(), viagemId, item)
  const texto = textoDoItem(item, link, nomeDaViagem)

  if (navigator.share) {
    try {
      await navigator.share({ text: texto })
      return 'compartilhado'
    } catch {
      // usuário cancelou o compartilhamento nativo: não faz mais nada
      return 'compartilhado'
    }
  }

  try {
    await navigator.clipboard.writeText(link)
  } catch {
    // sem clipboard (ou bloqueado): segue pro WhatsApp Web mesmo assim
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  return 'copiado'
}
