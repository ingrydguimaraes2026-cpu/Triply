import type { ReactNode } from 'react'

// Título grande no topo de cada aba, com espaço pra um botão à direita (igual ao TituloDaTela do app).
// "acima" é a linha pequena antes do título (ex.: "Olá, Ingryd").
// Uso: <CabecalhoPagina acima="Paris · 12 a 20 mai" titulo="Financeiro" subtitulo="..." acao={<button>...</button>} />

type Props = {
  titulo: string
  acima?: string
  subtitulo?: string
  acao?: ReactNode
}

export default function CabecalhoPagina({ titulo, acima, subtitulo, acao }: Props) {
  return (
    <header className="cabecalho-pagina">
      <div>
        {acima && <p className="cabecalho-pagina-acima">{acima}</p>}
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {acao}
    </header>
  )
}
