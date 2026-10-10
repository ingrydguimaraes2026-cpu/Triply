// Desenho do lado esquerdo do login: uma rota tracejada ligando três destinos.
export default function IlustracaoViagem() {
  return (
    <svg viewBox="0 0 400 300" className="login-ilustracao" aria-hidden="true">
      <circle cx="200" cy="150" r="140" fill="none" stroke="#ffcf71" strokeOpacity="0.12" />
      <circle cx="200" cy="150" r="100" fill="none" stroke="#ffcf71" strokeOpacity="0.12" />
      <circle cx="200" cy="150" r="60" fill="none" stroke="#ffcf71" strokeOpacity="0.12" />

      <path
        d="M70 220 C 120 120, 170 250, 210 150 S 300 60, 335 90"
        fill="none"
        stroke="#ffcf71"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />

      <g fill="#ff9d00" stroke="#7b542f" strokeWidth="3">
        <path d="M70 222 c-12-16-18-26-18-34 a18 18 0 0 1 36 0 c0 8-6 18-18 34z" />
        <path d="M210 152 c-12-16-18-26-18-34 a18 18 0 0 1 36 0 c0 8-6 18-18 34z" />
        <path d="M335 92 c-12-16-18-26-18-34 a18 18 0 0 1 36 0 c0 8-6 18-18 34z" />
      </g>
      <g fill="#7b542f">
        <circle cx="70" cy="188" r="6" />
        <circle cx="210" cy="118" r="6" />
        <circle cx="335" cy="58" r="6" />
      </g>

      <g transform="translate(262 108) rotate(-30)" fill="#fff6e5">
        <path d="M0 -4 L22 -1 L28 0 L22 1 L0 4 L4 0 Z" />
        <path d="M10 -1 L4 -12 L8 -12 L16 -1 Z" />
        <path d="M10 1 L4 12 L8 12 L16 1 Z" />
      </g>
    </svg>
  )
}
