import { Share2 } from 'lucide-react'
import type { ItemCompartilhavel } from '@together/core'
import { compartilharItem } from '../../lib/compartilhar'

// Botão de compartilhar um item (gasto, lugar, enquete, ponto). Reaproveitável nas abas.
export default function BotaoCompartilhar({
  viagemId,
  item,
  nomeDaViagem,
  className = 'botao-compartilhar',
}: {
  viagemId: string
  item: ItemCompartilhavel
  nomeDaViagem?: string
  className?: string
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label="Compartilhar"
      title="Compartilhar"
      onClick={(e) => {
        e.stopPropagation() // não dispara o clique do item em volta
        compartilharItem(viagemId, item, nomeDaViagem).catch(() => {})
      }}
    >
      <Share2 size={14} aria-hidden="true" />
    </button>
  )
}
