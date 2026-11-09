import type { ReactNode } from 'react'

// Rótulo pequeno em caixa alta que abre uma seção ("PRÓXIMAS", "PASSADAS"), igual ao do app.
export default function RotuloDeSecao({ children }: { children: ReactNode }) {
  return <h3 className="rotulo-secao">{children}</h3>
}
