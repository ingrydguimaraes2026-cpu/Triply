import Norti from './Norti'

// Logo do Tripwave, igual à marca do app (spec 112): a Norti num quadradinho bege + o nome na serifada.
// O nome usa a cor do texto onde a logo está; o tamanho segue o font-size de quem está em volta.
// Uso: <Logo /> (Norti + nome) ou <Logo comNome={false} /> (só a Norti).
// O símbolo antigo ("Rota", 18/10/2026) continua em SimboloTogether, pra quem ainda precisar dele.

type Props = {
  comNome?: boolean
  className?: string
}

export function SimboloTogether() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="logo-simbolo">
      <circle cx="34" cy="22" r="9" fill="currentColor" />
      <path d="M34 38 V64 Q34 80 50 80" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 49 H52" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      <path d="M62 80 Q82 80 82 60 V58" fill="none" stroke="#FF9D00" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 11" />
      <circle cx="82" cy="44" r="7" fill="#FF9D00" />
    </svg>
  )
}

export default function Logo({ comNome = true, className }: Props) {
  return (
    <span className={`logo ${className ?? ''}`} aria-label={comNome ? undefined : 'Tripwave'} role={comNome ? undefined : 'img'}>
      <span className="logo-norti" aria-hidden="true">
        <Norti tamanho={30} sombra={false} />
      </span>
      {comNome && <span className="logo-nome">Tripwave</span>}
    </span>
  )
}
