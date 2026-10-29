import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Janela de formulário. No celular sobe de baixo (gaveta); no computador fica no meio da tela.
// Uso:
//   {aberta && (
//     <Gaveta titulo="Lançar gasto" aoFechar={() => setAberta(false)}>
//       ...formulário...
//     </Gaveta>
//   )}

type Props = {
  titulo: string
  aoFechar: () => void
  children: ReactNode
  escura?: boolean // fundo preto (ex.: ver foto em tela cheia)
}

export default function Gaveta({ titulo, aoFechar, children, escura }: Props) {
  const idTitulo = useId()

  // Esc fecha; a página de trás não rola enquanto a gaveta está aberta
  useEffect(() => {
    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoApertar)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoApertar)
      document.body.style.overflow = antes
    }
  }, [aoFechar])

  return createPortal(
    <div className={escura ? 'gaveta-fundo escura' : 'gaveta-fundo'} onClick={aoFechar}>
      <div
        className="gaveta"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="gaveta-topo">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="gaveta-fechar" onClick={aoFechar} aria-label="Fechar">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="gaveta-corpo">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
