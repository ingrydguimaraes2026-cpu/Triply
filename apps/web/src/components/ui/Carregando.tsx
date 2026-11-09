import Norti from './Norti'

// Tela (ou bloco) de "carregando" com a Norti pensando, igual ao do app.
// Uso: <Carregando /> ou <Carregando texto="Buscando as viagens…" compacto />

type Props = { texto?: string; compacto?: boolean }

export default function Carregando({ texto = 'Carregando…', compacto }: Props) {
  return (
    <div className={compacto ? 'carregando-tela compacto' : 'carregando-tela'} role="status">
      <Norti humor="pensando" tamanho={compacto ? 64 : 96} />
      <p>{texto}</p>
    </div>
  )
}
