import type { ReactNode } from 'react'

// Botão redondo de 44px (voltar, compartilhar, mais...), igual ao do app.
// "claro" é a versão pra ficar em cima de foto.
// Uso: <BotaoRedondo rotulo="Voltar" aoClicar={...}><ArrowLeft size={20} /></BotaoRedondo>

type Props = { rotulo: string; aoClicar?: () => void; claro?: boolean; children: ReactNode }

export default function BotaoRedondo({ rotulo, aoClicar, claro, children }: Props) {
  return (
    <button type="button" className={claro ? 'botao-redondo claro' : 'botao-redondo'} onClick={aoClicar} aria-label={rotulo} title={rotulo}>
      {children}
    </button>
  )
}
