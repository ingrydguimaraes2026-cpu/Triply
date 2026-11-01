// Foto da pessoa, ou as iniciais quando não tem foto.
// A cor da bolinha é a do app: pela posição no comboio (indice) ou, sem ela, pelo nome.
// Uso: <Avatar nome="Ingryd Guimarães" url={membro.avatarUrl} />

type Props = {
  nome: string
  url?: string | null
  tamanho?: number
  indice?: number
}

// Mesmas cores do app (apps/mobile/theme.ts, coresDePessoa)
const CORES = ['#A8703F', '#8E6A3E', '#B5553A', '#6B7A3A', '#A07A2C', '#4A2E14', '#7B542F', '#C99257']

function iniciais(nome: string) {
  const palavras = nome.trim().split(/\s+/)
  return ((palavras[0]?.[0] ?? '') + (palavras.length > 1 ? palavras.at(-1)![0] : '')).toUpperCase()
}

function corDaPessoa(nome: string, indice?: number) {
  if (indice !== undefined) return CORES[indice % CORES.length]
  let soma = 0
  for (const letra of nome) soma += letra.charCodeAt(0)
  return CORES[soma % CORES.length]
}

export default function Avatar({ nome, url, tamanho = 36, indice }: Props) {
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }
  if (url) {
    return <img className="avatar" src={url} alt={nome} style={estilo} referrerPolicy="no-referrer" />
  }
  return (
    <span className="avatar" style={{ ...estilo, background: corDaPessoa(nome, indice) }} role="img" aria-label={nome}>
      {iniciais(nome)}
    </span>
  )
}
