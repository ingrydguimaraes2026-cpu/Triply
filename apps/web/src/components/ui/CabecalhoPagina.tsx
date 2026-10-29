import type { ReactNode } from 'react'

// Título grande no topo de cada aba, com espaço pra um botão à direita.
// Uso: <CabecalhoPagina titulo="Financeiro" subtitulo="..." acao={<button>...</button>} />

type Props = {
  titulo: string
  subtitulo?: string
  acao?: ReactNode
}

export default function CabecalhoPagina({ titulo, subtitulo, acao }: Props) {
  return (
    <header className="cabecalho-pagina">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {acao}
    </header>
  )
}
