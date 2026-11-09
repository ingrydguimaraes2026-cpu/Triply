import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Destaca o item apontado pelo ?foco=<id> da URL (quem chegou por um link de compartilhar).
 * Chame uma vez na página de destino. Como as listas carregam de forma assíncrona, procura
 * o elemento [data-foco=<id>] por alguns segundos; quando acha, rola até ele e pisca o destaque.
 */
export function useFocoDeItem(): void {
  const [params] = useSearchParams()
  const foco = params.get('foco')

  useEffect(() => {
    if (!foco) return
    let limparDestaque = () => {}

    const destacar = () => {
      const el = document.querySelector<HTMLElement>(`[data-foco="${CSS.escape(foco)}"]`)
      if (!el) return false
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('item-destacado')
      const t = setTimeout(() => el.classList.remove('item-destacado'), 2500)
      limparDestaque = () => clearTimeout(t)
      return true
    }

    if (destacar()) return () => limparDestaque()

    // Ainda não renderizou: tenta por ~3s (150ms × 20)
    let tentativas = 0
    const iv = setInterval(() => {
      tentativas += 1
      if (destacar() || tentativas >= 20) clearInterval(iv)
    }, 150)
    return () => {
      clearInterval(iv)
      limparDestaque()
    }
  }, [foco])
}
