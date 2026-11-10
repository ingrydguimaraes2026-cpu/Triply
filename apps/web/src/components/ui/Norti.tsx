import { useEffect, useRef } from 'react'
import './norti/mascot.js' // registra o <mascot-view> (os tipos ficam em norti/mascot-view.d.ts)
import './ui.css'

// A Norti: mascote e nome do app (uma bússola em forma de pino de mapa, de chapéu de safári).
// Quem anima é o <mascot-view> (norti/mascot.js, gerado pela skill Mascot Designer),
// com as poses em public/norti/. O app usa as mesmas poses (apps/mobile/src/ui/Norti.tsx).
//   parada   → respira e pisca              feliz    → pula e solta confete (depois volta a parada)
//   dormindo → dorme e solta "z"            pensando → balança com pontinhos (carregando)
//   oi       → acena                        ops      → leva um susto (erro)
//   apontando→ aponta pra uma dica          amor     → corações (obrigado, favoritos)
// Tocar nela dá um apertãozinho. Uso: <Norti humor="dormindo" tamanho={120} />
// Ela chega com um pulinho e um brilho (estado "appear") e depois faz o humor pedido;
// `chegar={false}` pula isso (logo, cabeçalho). Movimentos em packages/core/src/norti-movimento.ts.
export type Humor = 'parada' | 'feliz' | 'dormindo' | 'pensando' | 'oi' | 'ops' | 'apontando' | 'amor'

// Nome do movimento no mascot.js e as poses que ele usa (só essas imagens são baixadas)
const MOVIMENTO: Record<Humor, { estado: string; poses: string }> = {
  parada: { estado: 'idle', poses: 'idle,blink' },
  feliz: { estado: 'celebrate', poses: 'idle,blink,celebrate' },
  dormindo: { estado: 'sleep', poses: 'idle,sleep' },
  pensando: { estado: 'think', poses: 'idle,think' },
  oi: { estado: 'hello', poses: 'idle,blink,wave' },
  ops: { estado: 'oops', poses: 'idle,oops' },
  apontando: { estado: 'point', poses: 'idle,point' },
  amor: { estado: 'love', poses: 'idle,love' },
}

type Props = { humor?: Humor; tamanho?: number; sombra?: boolean; className?: string; chegar?: boolean }
type ElementoDaNorti = HTMLElement & { play?: (estado: string) => void }

export default function Norti({ humor = 'parada', tamanho = 120, sombra = true, className, chegar = tamanho >= 48 }: Props) {
  const { estado, poses } = MOVIMENTO[humor]
  const ref = useRef<ElementoDaNorti>(null)
  const estadoRef = useRef(estado)
  useEffect(() => {
    estadoRef.current = estado
  }, [estado])

  // Chegada: pulinho com brilho, depois o humor pedido (o mascot.js já respeita reduced motion)
  useEffect(() => {
    const el = ref.current
    if (!chegar || !el) return
    const comecar = () => el.play?.('appear')
    const aoAcabar = (e: Event) => {
      if ((e as CustomEvent<{ state: string }>).detail?.state === 'appear' && estadoRef.current !== 'idle') el.play?.(estadoRef.current)
    }
    el.addEventListener('done', aoAcabar)
    // O <mascot-view> pode ainda não estar pronto: espera um quadro
    const quadro = requestAnimationFrame(comecar)
    return () => {
      cancelAnimationFrame(quadro)
      el.removeEventListener('done', aoAcabar)
    }
  }, [chegar])

  return (
    <mascot-view
      ref={ref}
      src="/norti"
      state={estado}
      poses={chegar ? `${poses},blink` : poses}
      shadow={sombra ? 'on' : 'off'}
      // Pequenininha (logo, cabeçalho) não reage ao toque: o clique é do botão em volta
      poke={tamanho < 60 ? 'off' : 'on'}
      className={`norti ${className ?? ''}`}
      style={{ width: tamanho }}
      aria-hidden="true"
    />
  )
}
