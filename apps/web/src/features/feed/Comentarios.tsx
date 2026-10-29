import { useState, type FormEvent } from 'react'
import { MessageCircle, Trash2 } from 'lucide-react'
import Avatar from '../../components/ui/Avatar'
import EstadoVazio from '../../components/ui/EstadoVazio'
import type { Membro } from '../viagens/hooks'
import type { Post } from './api'
import { podeApagarComentario, tempoAtras } from './regras'

type Props = {
  post: Post
  membros: Membro[]
  meuId: string
  euSouAdm: boolean
  aoComentar: (post: Post, texto: string) => Promise<boolean>
  aoApagarComentario: (post: Post, comentarioId: string) => void
}

// Todos os comentários de um post (vai dentro de uma Gaveta)
export default function Comentarios({ post, membros, meuId, euSouAdm, aoComentar, aoApagarComentario }: Props) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const membro = (id: string) => membros.find((m) => m.id === id)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    if (await aoComentar(post, texto)) setTexto('')
    setEnviando(false)
  }

  return (
    <div className="comentarios">
      {post.comentarios.length === 0 ? (
        <EstadoVazio icone={MessageCircle} titulo="Nenhum comentário ainda" texto="Seja a primeira pessoa a comentar." />
      ) : (
        <ul>
          {post.comentarios.map((c) => {
            const quem = membro(c.autor)
            return (
              <li key={c.id}>
                <Avatar nome={quem?.nome ?? 'Ex-membro'} url={quem?.avatarUrl ?? null} tamanho={30} />
                <p>
                  <strong>{quem?.nome ?? 'Ex-membro'}</strong> {c.texto}
                  <time dateTime={c.criado_em}>{tempoAtras(c.criado_em)}</time>
                </p>
                {podeApagarComentario(c.autor, post.autor, meuId, euSouAdm) && (
                  <button type="button" className="botao-texto" onClick={() => aoApagarComentario(post, c.id)} aria-label="Apagar comentário">
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <form className="post-comentar" onSubmit={enviar}>
        <input placeholder="Adicione um comentário…" maxLength={1000} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Comentário" />
        <button type="submit" disabled={!texto.trim() || enviando}>
          Publicar
        </button>
      </form>
    </div>
  )
}
