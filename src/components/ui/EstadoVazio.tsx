import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

// O que aparece quando ainda não tem nada cadastrado.
// Sempre explica o que a pessoa ganha e mostra o próximo passo.
// Uso:
//   <EstadoVazio icone={Receipt} titulo="Nenhum gasto ainda"
//     texto="Lance o primeiro gasto e o app divide pro comboio."
//     acao={<button className="botao">Lançar gasto</button>} />

type Props = {
  icone: LucideIcon
  titulo: string
  texto: string
  acao?: ReactNode
  compacto?: boolean // versão menor, pra usar dentro de cartões
}

export default function EstadoVazio({ icone: Icone, titulo, texto, acao, compacto }: Props) {
  return (
    <div className={compacto ? 'vazio compacto' : 'vazio'}>
      <span className="vazio-icone">
        <Icone size={compacto ? 20 : 28} aria-hidden="true" />
      </span>
      <p className="vazio-titulo">{titulo}</p>
      <p className="vazio-texto">{texto}</p>
      {acao}
    </div>
  )
}
