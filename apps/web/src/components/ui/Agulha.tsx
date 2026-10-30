import { useId } from 'react'
import './ui.css'

// A Agulha: mascote do Together (uma bússola de chapéu de safári que acena).
// Mesmo desenho do app (apps/mobile/src/ui/Agulha.tsx), aqui em SVG puro com animação em CSS (ui.css).
//   parada  → flutua, a agulha balança e o braço acena
//   feliz   → pula, olhos fechadinhos e estrelinhas
//   dormindo→ respira e solta "z"
//   pensando→ chacoalha e a agulha gira rápido (carregando)
// Uso: <Agulha humor="dormindo" tamanho={120} />
export type Humor = 'parada' | 'feliz' | 'dormindo' | 'pensando'

const ESCURO = '#2A1A0C'

type Props = { humor?: Humor; tamanho?: number; sombra?: boolean; className?: string }

export default function Agulha({ humor = 'parada', tamanho = 120, sombra = true, className }: Props) {
  const id = useId()
  const ouro = `${id}-ouro`
  const rosto = `${id}-rosto`
  return (
    <svg
      viewBox="0 0 120 120"
      width={tamanho}
      height={tamanho}
      className={`agulha agulha-${humor} ${className ?? ''}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={ouro} cx="38%" cy="32%" r="72%">
          <stop offset="0" stopColor="#E9B866" />
          <stop offset=".55" stopColor="#C08530" />
          <stop offset="1" stopColor="#8E5E22" />
        </radialGradient>
        <radialGradient id={rosto} cx="45%" cy="38%" r="68%">
          <stop offset="0" stopColor="#FFFCF5" />
          <stop offset="1" stopColor="#F0E0C4" />
        </radialGradient>
      </defs>
      {sombra && <ellipse cx="60" cy="112" rx="30" ry="4" fill="#3B2715" opacity=".14" />}
      <g className="agulha-corpo">
        {/* pezinhos */}
        <ellipse cx="46" cy="106" rx="8" ry="4.5" fill="#7B542F" />
        <ellipse cx="74" cy="106" rx="8" ry="4.5" fill="#7B542F" />
        {/* braço que acena e o outro, parado */}
        <g className="agulha-braco">
          <path d="M24 74 Q12 68 11 55" fill="none" stroke="#7B4E28" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="11" cy="52" r="5.5" fill="#A8703F" />
        </g>
        <path d="M96 76 Q106 84 104 94" fill="none" stroke="#7B4E28" strokeWidth="5.5" strokeLinecap="round" />
        <circle cx="104" cy="96" r="5.5" fill="#A8703F" />
        {/* caixa dourada e o mostrador */}
        <circle cx="60" cy="64" r="40" fill={`url(#${ouro})`} />
        <circle cx="60" cy="64" r="35" fill="#8E5E22" />
        <circle cx="60" cy="64" r="32.5" fill={`url(#${rosto})`} />
        <path d="M29 45 A36 36 0 0 1 45 29" fill="none" stroke="#F6DB9E" strokeWidth="3" strokeLinecap="round" opacity=".9" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="59.3" y="33.5" width="1.4" height={i % 3 ? 2.5 : 4} rx=".7" fill="#C9A473" transform={`rotate(${i * 30} 60 64)`} />
        ))}
        {/* agulha da bússola */}
        <g className="agulha-ponteiro">
          <path d="M60 38 L60 62 L54 62Z" fill="#E06A4E" />
          <path d="M60 38 L66 62 L60 62Z" fill="#B5462F" />
          <path d="M60 80 L60 62 L54 62Z" fill="#8E6A3E" />
          <path d="M60 80 L66 62 L60 62Z" fill="#6B4A2A" />
          <circle cx="60" cy="62" r="3.2" fill="#C08530" />
          <circle cx="59.2" cy="61.2" r="1.1" fill="#FFF3D6" />
        </g>
        {humor !== 'dormindo' && (
          <g stroke="#3B2715" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M36 50.5 q6 -4 12 -.5" />
            <path d="M72 50 q6 -3.5 12 .5" />
          </g>
        )}
        <ellipse cx="39" cy="73" rx="4.5" ry="2.8" fill="#E58C6A" opacity=".55" />
        <ellipse cx="81" cy="73" rx="4.5" ry="2.8" fill="#E58C6A" opacity=".55" />
        <Olhos humor={humor} />
        <Boca humor={humor} />
        {/* chapéu de safári */}
        <g transform="rotate(-8 60 28)">
          <ellipse cx="60" cy="30" rx="36" ry="7.5" fill="#7B4E28" />
          <path d="M40 30 Q41 11 60 11 Q79 11 80 30Z" fill="#A8703F" />
          <path d="M40.6 25 Q60 21 79.4 25 L79.8 29.5 Q60 26 40.2 29.5Z" fill="#5E3D20" />
          <path d="M47 18 Q52 14 58 14" stroke="#C99257" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      </g>
      {humor === 'feliz' && (
        <g fill="#E3A04A">
          {[
            [14, 34, 7],
            [106, 28, 6],
            [104, 74, 4.5],
          ].map(([x, y, r], i) => (
            <path
              key={x}
              className="agulha-estrela"
              style={{ animationDelay: `${i * 0.4}s` }}
              d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`}
            />
          ))}
        </g>
      )}
      {humor === 'dormindo' && (
        <g fill="#7B542F" fontWeight="800">
          <text x="90" y="34" fontSize="15" className="agulha-z">
            z
          </text>
          <text x="98" y="26" fontSize="11" className="agulha-z" style={{ animationDelay: '1.3s' }}>
            z
          </text>
        </g>
      )}
    </svg>
  )
}

function Olhos({ humor }: { humor: Humor }) {
  const xs = [42, 78]
  if (humor === 'feliz')
    return xs.map((x) => <path key={x} d={`M${x - 5} 62 Q${x} 55 ${x + 5} 62`} fill="none" stroke={ESCURO} strokeWidth="3" strokeLinecap="round" />)
  if (humor === 'dormindo')
    return xs.map((x) => <path key={x} d={`M${x - 5} 60 Q${x} 64 ${x + 5} 60`} fill="none" stroke={ESCURO} strokeWidth="2.6" strokeLinecap="round" />)
  return xs.map((x) => (
    <g key={x} className="agulha-olho">
      <ellipse cx={x} cy="60" rx="5.5" ry="6.5" fill="#FFFDF8" />
      <g className="agulha-pupila">
        <ellipse cx={x} cy="61" rx="3.4" ry="4" fill={ESCURO} />
        <circle cx={x + 1.3} cy="59.4" r="1.3" fill="#fff" />
      </g>
    </g>
  ))
}

function Boca({ humor }: { humor: Humor }) {
  if (humor === 'feliz')
    return (
      <g>
        <path d="M54 86 Q60 96 66 86 Z" fill={ESCURO} />
        <ellipse cx="60" cy="91" rx="3" ry="1.6" fill="#E07A5F" />
      </g>
    )
  if (humor === 'pensando') return <ellipse cx="60" cy="88" rx="2.4" ry="2.8" fill={ESCURO} />
  if (humor === 'dormindo') return <path d="M57 88 h6" stroke={ESCURO} strokeWidth="2.4" strokeLinecap="round" />
  return <path d="M56 87 Q60 91.5 64 87" fill="none" stroke={ESCURO} strokeWidth="2.6" strokeLinecap="round" />
}
