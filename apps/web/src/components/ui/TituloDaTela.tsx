import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from './icones'

// Cabeçalho de cada tela da viagem, igual ao TituloDaTela do app (apps/mobile/src/ui/pecas.tsx):
// título grande e, no máximo, uma linha pequena em cima ("3 fotos · 2 pessoas"). Sem frase explicando.
// "acao" é o botão da tela, à direita ("Postar", "Adicionar").
// "voltar" (endereço) mostra o botão redondo de voltar, só no celular: no computador o menu já leva.
// Uso: <TituloDaTela titulo="Fotos" acima="3 fotos · 2 pessoas" acao={<button className="botao">Postar</button>} />

type Props = {
  titulo: string
  acima?: string
  acao?: ReactNode
  voltar?: string
}

export default function TituloDaTela({ titulo, acima, acao, voltar }: Props) {
  return (
    <header className="titulo-da-tela">
      {voltar && (
        <Link to={voltar} relative="path" className="botao-redondo titulo-da-tela-voltar" aria-label="Voltar" title="Voltar">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
      )}
      <div className="titulo-da-tela-linha">
        <div className="titulo-da-tela-texto">
          {acima && <p>{acima}</p>}
          <h1>{titulo}</h1>
        </div>
        {acao}
      </div>
    </header>
  )
}
