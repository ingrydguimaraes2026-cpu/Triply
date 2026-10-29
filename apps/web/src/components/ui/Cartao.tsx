import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

// Cartão branco arredondado, o bloco básico do dashboard.
// Uso:
//   <Cartao titulo="Orçamento" icone={Wallet} acao={<Link to="financeiro">Ver tudo</Link>}>
//     ...conteúdo...
//   </Cartao>

type Props = {
  titulo?: string
  icone?: LucideIcon
  acao?: ReactNode // algo no canto direito do título (link, botão)
  className?: string
  children: ReactNode
}

export default function Cartao({ titulo, icone: Icone, acao, className, children }: Props) {
  return (
    <section className={`cartao-ui ${className ?? ''}`}>
      {titulo && (
        <header className="cartao-ui-topo">
          <h2>
            {Icone && <Icone size={18} aria-hidden="true" />}
            {titulo}
          </h2>
          {acao}
        </header>
      )}
      {children}
    </section>
  )
}
