import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import Logo from '../components/ui/Logo'
import './pagina-legal.css'

// Moldura das páginas públicas de Termos de uso e Política de privacidade (abrem sem login).
// As lojas (App Store e Google Play) pedem o link dessas duas páginas.

// Dados que o Victor ainda vai decidir (docs/HANDOFF-loja.md). Trocar aqui vale pras duas páginas.
export const RESPONSAVEL = '[nome ou empresa responsável pela Norti, a definir]'
export const EMAIL_CONTATO = '[e-mail de contato, a definir]'
export const ATUALIZADO_EM = '10 de novembro de 2026'

type Props = {
  titulo: string
  children: ReactNode
}

export default function PaginaLegal({ titulo, children }: Props) {
  useEffect(() => {
    const tituloAntes = document.title
    document.title = `${titulo} · Norti`
    return () => {
      document.title = tituloAntes
    }
  }, [titulo])

  return (
    <main className="legal">
      <header className="legal-topo">
        <Link to="/" className="legal-marca" aria-label="Norti, ir pro início">
          <Logo />
        </Link>
      </header>

      <article className="legal-texto">
        <p className="legal-rascunho" role="note">
          Rascunho a revisar. Este texto ainda pode mudar antes do lançamento nas lojas.
        </p>
        <h1>{titulo}</h1>
        <p className="legal-data">Atualizado em {ATUALIZADO_EM}</p>
        {children}
      </article>

      <footer className="legal-rodape">
        <Link to="/termos">Termos de uso</Link>
        <span aria-hidden="true">·</span>
        <Link to="/privacidade">Política de privacidade</Link>
      </footer>
    </main>
  )
}
