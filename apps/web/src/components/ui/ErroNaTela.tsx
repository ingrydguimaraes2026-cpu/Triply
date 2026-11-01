import Agulha from './Agulha'

// Erro amigável com botão de tentar de novo, igual ao do app.
// Uso: <ErroNaTela aoTentar={() => recarregar()} />

type Props = { titulo?: string; texto?: string; aoTentar?: () => void }

export default function ErroNaTela({ titulo = 'Não deu pra carregar', texto = 'Confira a internet e tente de novo.', aoTentar }: Props) {
  return (
    <div className="carregando-tela" role="alert">
      <Agulha humor="pensando" tamanho={96} />
      <p className="erro-tela-titulo">{titulo}</p>
      <p>{texto}</p>
      {aoTentar && (
        <button type="button" className="botao secundario" onClick={aoTentar}>
          Tentar de novo
        </button>
      )}
    </div>
  )
}
