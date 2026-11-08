import './norti/mascot.js' // registra o <mascot-view> (os tipos ficam em norti/mascot-view.d.ts)
import './ui.css'

// A Norti: mascote do app (uma bússola em forma de pino de mapa, de chapéu de safári).
// Quem anima é o <mascot-view> (norti/mascot.js, gerado pela skill Mascot Designer),
// com as poses em public/norti/. O app usa as mesmas poses (apps/mobile/src/ui/Norti.tsx).
//   parada   → respira e pisca              feliz    → pula e solta confete (depois volta a parada)
//   dormindo → dorme e solta "z"            pensando → balança com pontinhos (carregando)
//   oi       → acena                        ops      → leva um susto (erro)
//   apontando→ aponta pra uma dica          amor     → corações (obrigado, favoritos)
// Tocar nela dá um apertãozinho. Uso: <Norti humor="dormindo" tamanho={120} />
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

type Props = { humor?: Humor; tamanho?: number; sombra?: boolean; className?: string }

export default function Norti({ humor = 'parada', tamanho = 120, sombra = true, className }: Props) {
  const { estado, poses } = MOVIMENTO[humor]
  return (
    <mascot-view
      src="/norti"
      state={estado}
      poses={poses}
      shadow={sombra ? 'on' : 'off'}
      // Pequenininha (logo, cabeçalho) não reage ao toque: o clique é do botão em volta
      poke={tamanho < 60 ? 'off' : 'on'}
      className={`norti ${className ?? ''}`}
      style={{ width: tamanho }}
      aria-hidden="true"
    />
  )
}
