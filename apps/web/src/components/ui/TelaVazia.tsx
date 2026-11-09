import type { ReactNode } from 'react'
import Norti, { type Humor } from './Norti'

// Tela sem nada ainda, igual à do app: a Norti, uma frase e o botão principal embaixo.
// Sem caixa nem borda tracejada. Pra vazio pequeno dentro de cartão, use o EstadoVazio compacto.
// Uso: <TelaVazia titulo="Nenhum post ainda" texto='Toque em "Postar" pra mandar as primeiras fotos.' acao={<button className="botao">Postar</button>} />

type Props = {
  titulo: string
  texto?: string
  acao?: ReactNode
  humor?: Humor
}

export default function TelaVazia({ titulo, texto, acao, humor = 'dormindo' }: Props) {
  return (
    <div className="tela-vazia">
      <Norti humor={humor} tamanho={120} />
      <p className="tela-vazia-titulo">{titulo}</p>
      {texto && <p className="tela-vazia-texto">{texto}</p>}
      {acao && <div className="tela-vazia-acao">{acao}</div>}
    </div>
  )
}
