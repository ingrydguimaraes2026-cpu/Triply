import { useRef, useState, type FormEvent } from 'react'
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react'
import Avatar from '../../components/ui/Avatar'
import type { Membro } from '../viagens/hooks'
import type { Post } from './api'
import { tempoAtras, textoDasCurtidas } from './regras'
import { textoDosMarcados } from '@together/core'

type Props = {
  post: Post
  autor: Membro | undefined
  eu: Membro | undefined
  nomeDe: (id: string) => string
  lugar: string | null
  meuId: string
  podeApagar: boolean
  aoCurtir: (post: Post, soCurtir?: boolean) => void
  aoComentar: (post: Post, texto: string) => Promise<boolean>
  aoVerComentarios: (post: Post) => void
  aoApagar: (post: Post) => Promise<void>
  aoSairDaMarcacao?: (post: Post) => void // spec 100
}

// Formato da foto igual ao Instagram: segue a 1ª foto, entre 4:5 (em pé) e 1.91:1 (deitada)
const proporcaoDa = (img: HTMLImageElement) => Math.min(1.91, Math.max(0.8, img.naturalWidth / img.naturalHeight || 1))

// Um post do feed, estilo Instagram (spec 014)
export default function PostCard({ post, autor, eu, nomeDe, lugar, meuId, podeApagar, aoCurtir, aoComentar, aoVerComentarios, aoApagar, aoSairDaMarcacao }: Props) {
  const [atual, setAtual] = useState(0) // foto visível no carrossel
  const [proporcao, setProporcao] = useState(0.8)
  const [coracao, setCoracao] = useState(false) // animação do toque duplo
  const [menu, setMenu] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const ultimoToque = useRef(0)
  const campo = useRef<HTMLInputElement>(null)

  const curti = post.curtidas.includes(meuId)
  const curtidas = textoDasCurtidas(post.curtidas, meuId, nomeDe)
  const ultimos = post.comentarios.slice(-2)
  const nome = autor?.nome ?? 'Ex-membro'
  const varias = post.fotos.length > 1

  // Toque duplo na foto curte (nunca descurte)
  function tocouNaFoto() {
    const agora = Date.now()
    if (agora - ultimoToque.current < 300) {
      if (!curti) aoCurtir(post, true)
      setCoracao(true)
      window.setTimeout(() => setCoracao(false), 750)
      ultimoToque.current = 0
    } else ultimoToque.current = agora
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    if (await aoComentar(post, texto)) setTexto('')
    setEnviando(false)
  }

  async function apagar() {
    setApagando(true)
    await aoApagar(post)
    setApagando(false)
  }

  return (
    <article className="post" id={`post-${post.id}`}>
      <header className="post-topo">
        <span className="post-anel">
          <Avatar nome={nome} url={autor?.avatarUrl ?? null} tamanho={32} />
        </span>
        <div className="post-quem">
          <p>
            <strong>{nome}</strong>
            <span className="post-ponto" aria-hidden="true">
              •
            </span>
            <time dateTime={post.criado_em}>{tempoAtras(post.criado_em)}</time>
          </p>
          {lugar && <span className="post-lugar">{lugar}</span>}
          {post.marcados.length > 0 && (
            <span className="post-marcados">
              {textoDosMarcados(post.marcados, nomeDe)}
              {aoSairDaMarcacao && post.marcados.includes(meuId) && (
                <>
                  {' · '}
                  <button type="button" className="botao-texto post-sair-marcacao" onClick={() => aoSairDaMarcacao(post)}>
                    me tirar
                  </button>
                </>
              )}
            </span>
          )}
        </div>
        {podeApagar && (
          <button type="button" className="post-menu" onClick={() => setMenu((m) => !m)} aria-label="Opções do post" aria-expanded={menu}>
            <MoreHorizontal size={22} aria-hidden="true" />
          </button>
        )}
      </header>

      {menu && (
        <div className="post-confirmar" role="alertdialog" aria-label="Apagar post">
          <span>Apagar este post e as fotos?</span>
          <div>
            <button type="button" className="botao secundario pequeno" onClick={() => setMenu(false)}>
              Manter
            </button>
            <button type="button" className="botao perigo pequeno" onClick={apagar} disabled={apagando}>
              <Trash2 size={14} aria-hidden="true" /> {apagando ? 'Apagando…' : 'Apagar'}
            </button>
          </div>
        </div>
      )}

      <div className="post-midia" style={{ aspectRatio: proporcao }}>
        <div
          className="post-trilho"
          onClick={tocouNaFoto}
          onScroll={(e) => {
            const el = e.currentTarget
            setAtual(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {post.fotos.map((f, i) =>
            f.url ? (
              <img
                key={f.id}
                src={f.url}
                alt={post.legenda ? `${post.legenda} (${i + 1})` : `Foto ${i + 1} de ${nome}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                onLoad={i === 0 ? (e) => setProporcao(proporcaoDa(e.currentTarget)) : undefined}
              />
            ) : (
              <span key={f.id} className="post-sem-link" />
            ),
          )}
        </div>
        {coracao && <Heart className="post-coracao" size={110} fill="currentColor" strokeWidth={0} aria-hidden="true" />}
        {varias && (
          <span className="post-contador">
            {atual + 1}/{post.fotos.length}
          </span>
        )}
      </div>

      <div className="post-acoes">
        <div className="post-botoes">
          <button type="button" className={curti ? 'curtido' : undefined} onClick={() => aoCurtir(post)} aria-label={curti ? 'Descurtir' : 'Curtir'} aria-pressed={curti}>
            <Heart size={26} strokeWidth={1.8} fill={curti ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => campo.current?.focus()} aria-label="Comentar">
            <MessageCircle size={26} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        {varias && (
          <span className="post-pontos" aria-hidden="true">
            {post.fotos.map((f, i) => (
              <i key={f.id} className={i === atual ? 'ativo' : undefined} />
            ))}
          </span>
        )}
      </div>

      <div className="post-corpo">
        {curtidas && <p className="post-curtidas">{curtidas}</p>}
        {post.legenda && (
          <p>
            <strong>{nome}</strong> {post.legenda}
          </p>
        )}
        {post.comentarios.length > 2 && (
          <button type="button" className="post-ver-todos" onClick={() => aoVerComentarios(post)}>
            Ver todos os {post.comentarios.length} comentários
          </button>
        )}
        {ultimos.map((c) => (
          <p key={c.id}>
            <strong>{nomeDe(c.autor)}</strong> {c.texto}
          </p>
        ))}
        {post.comentarios.length > 0 && post.comentarios.length <= 2 && (
          <button type="button" className="post-ver-todos" onClick={() => aoVerComentarios(post)}>
            Ver comentários
          </button>
        )}
      </div>

      <form className="post-comentar" onSubmit={enviar}>
        <Avatar nome={eu?.nome ?? 'Você'} url={eu?.avatarUrl ?? null} tamanho={26} />
        <input
          ref={campo}
          placeholder="Adicione um comentário…"
          maxLength={1000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label={`Comentar no post de ${nome}`}
        />
        {texto.trim() && (
          <button type="submit" disabled={enviando}>
            Publicar
          </button>
        )}
      </form>
    </article>
  )
}
