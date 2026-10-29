// Logo do Together (conceito "Rota", escolhido em 18/10/2026):
// a letra "t" vira uma pessoa, e a trilha pontilhada leva até o destino.
// O "t" e o nome usam a cor do texto onde a logo está (creme no escuro, marrom no claro);
// a trilha e o destino são sempre laranja.
// Uso: <Logo /> (símbolo + nome) ou <Logo comNome={false} /> (só o símbolo).
// O tamanho segue o font-size de quem está em volta.

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
    <span className={`logo ${className ?? ''}`} aria-label={comNome ? undefined : 'Together'} role={comNome ? undefined : 'img'}>
      <SimboloTogether />
      {comNome && <span className="logo-nome">together</span>}
    </span>
  )
}
