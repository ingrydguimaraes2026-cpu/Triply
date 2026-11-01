import Avatar from './Avatar'

// Bolinhas sobrepostas do comboio, igual ao do app.
// Uso: <PilhaDeAvatares pessoas={membros.map((m) => ({ nome: m.nome, url: m.avatarUrl }))} />

type Props = { pessoas: { nome: string; url?: string | null }[]; tamanho?: number; max?: number }

export default function PilhaDeAvatares({ pessoas, tamanho = 32, max = 6 }: Props) {
  const sobra = pessoas.length - max
  return (
    <span className="pilha-avatares">
      {pessoas.slice(0, max).map((p, i) => (
        <Avatar key={i} nome={p.nome} url={p.url} tamanho={tamanho} indice={i} />
      ))}
      {sobra > 0 && (
        <span className="avatar pilha-sobra" style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.34 }}>
          +{sobra}
        </span>
      )}
    </span>
  )
}
