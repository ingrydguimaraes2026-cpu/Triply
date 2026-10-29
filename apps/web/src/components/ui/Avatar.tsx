// Foto da pessoa, ou as iniciais quando não tem foto.
// Uso: <Avatar nome="Ingryd Guimarães" url={membro.avatarUrl} />

type Props = {
  nome: string
  url?: string | null
  tamanho?: number
}

function iniciais(nome: string) {
  const palavras = nome.trim().split(/\s+/)
  return ((palavras[0]?.[0] ?? '') + (palavras.length > 1 ? palavras.at(-1)![0] : '')).toUpperCase()
}

export default function Avatar({ nome, url, tamanho = 36 }: Props) {
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.38 }
  if (url) {
    return <img className="avatar" src={url} alt={nome} style={estilo} referrerPolicy="no-referrer" />
  }
  return (
    <span className="avatar" style={estilo} role="img" aria-label={nome}>
      {iniciais(nome)}
    </span>
  )
}
