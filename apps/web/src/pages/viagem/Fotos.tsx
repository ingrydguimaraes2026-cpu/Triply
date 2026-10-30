import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { BellRing, CalendarDays, Camera, Heart, ImagePlus, Layers, LayoutGrid, LayoutList, MessageCircle, Plus, Star } from 'lucide-react'
import { albumPorDia, melhoresPosts } from '@together/core'
import { diaPorExtenso } from '../../features/agenda/hooks'
import BaixarFotos from '../../features/feed/BaixarFotos'
import { useViagemAtual } from '../../features/viagens/hooks'
import { usePosts } from '../../features/feed/hooks'
import { apagarComentario, apagarPost, avisarComboio, comentar, curtir, descurtir, desmarcar, type Post } from '../../features/feed/api'
import { alternarCurtida } from '../../features/feed/regras'
import FormPost from '../../features/feed/FormPost'
import PostCard from '../../features/feed/PostCard'
import Comentarios from '../../features/feed/Comentarios'
import { ligarAvisos, situacaoDoAviso } from '../../features/cambio/avisos'
import Avatar from '../../components/ui/Avatar'
import EstadoVazio from '../../components/ui/EstadoVazio'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './fotos.css'

const CHAVE_SEM_AVISO = 'together:feed-sem-aviso'

// Fotos (spec 014): o feed do comboio, estilo Instagram. Só quem viaja junto vê.
export default function Fotos() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  const { estado, recarregar, mudarPost, tirarPost } = usePosts(viagem.id)
  const [busca] = useSearchParams()
  const [modo, setModo] = useState<'feed' | 'grade' | 'dias' | 'melhores'>('feed')
  const [postando, setPostando] = useState(false)
  const [soComigo, setSoComigo] = useState(false) // spec 100
  const [comentariosDe, setComentariosDe] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pedirAviso, setPedirAviso] = useState(false)
  const alvo = useRef<string | null>(busca.get('post')) // post pra rolar até (aviso no celular ou grade)

  const posts = estado.status === 'pronto' ? estado.posts : []
  const nomeDe = useCallback((id: string) => membros.find((m) => m.id === id)?.nome ?? 'Ex-membro', [membros])
  const lugarDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? null
  const postDosComentarios = posts.find((p) => p.id === comentariosDe)

  // Este aparelho ainda não recebe avisos? Oferece ligar (uma vez; "Agora não" esconde)
  useEffect(() => {
    let ativo = true
    let dispensado = false
    try {
      dispensado = localStorage.getItem(CHAVE_SEM_AVISO) === '1'
    } catch {
      // sem localStorage: só mostra
    }
    if (!dispensado) situacaoDoAviso().then((s) => ativo && setPedirAviso(s === 'desligado'))
    return () => {
      ativo = false
    }
  }, [])

  // Rola até o post pedido, quando ele aparecer na tela
  useEffect(() => {
    if (!alvo.current || estado.status !== 'pronto' || modo !== 'feed') return
    const id = alvo.current
    requestAnimationFrame(() => document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    alvo.current = null
  }, [estado, modo])

  function falhou(mensagem: string, e: unknown) {
    console.error(mensagem, e)
    setErro(mensagem)
    recarregar()
  }

  async function aoCurtir(post: Post, soCurtir = false) {
    const curti = post.curtidas.includes(meuId)
    if (soCurtir && curti) return
    setErro(null)
    mudarPost(post.id, (p) => ({ ...p, curtidas: alternarCurtida(p.curtidas, meuId) }))
    try {
      if (curti) await descurtir(post.id, meuId)
      else await curtir(post.id)
    } catch (e) {
      falhou('Não deu pra curtir. Tente de novo.', e)
    }
  }

  async function aoComentar(post: Post, texto: string) {
    setErro(null)
    try {
      const novo = await comentar(post.id, texto)
      mudarPost(post.id, (p) => ({ ...p, comentarios: [...p.comentarios, novo] }))
      avisarComboio({ comentario_id: novo.id })
      return true
    } catch (e) {
      console.error('Erro ao comentar:', e)
      setErro('Não deu pra comentar. Confira a internet e tente de novo.')
      return false
    }
  }

  async function aoApagarComentario(post: Post, comentarioId: string) {
    setErro(null)
    mudarPost(post.id, (p) => ({ ...p, comentarios: p.comentarios.filter((c) => c.id !== comentarioId) }))
    try {
      await apagarComentario(comentarioId)
    } catch (e) {
      falhou('Não deu pra apagar o comentário.', e)
    }
  }

  async function aoApagar(post: Post) {
    setErro(null)
    try {
      await apagarPost(post)
      tirarPost(post.id)
    } catch (e) {
      falhou(e instanceof Error && e.message.startsWith('As fotos') ? e.message : 'Não deu pra apagar o post.', e)
    }
  }

  async function ligarAvisosDoFeed() {
    try {
      await ligarAvisos()
      setPedirAviso(false)
    } catch (e) {
      const motivo = (e as Error).message
      if (motivo === 'negado') setErro('As notificações estão bloqueadas pra este site. Libere nas configurações e tente de novo.')
      else if (motivo !== 'sem-app') setErro('Não deu pra ligar os avisos.')
      setPedirAviso(false)
    }
  }

  function agoraNao() {
    setPedirAviso(false)
    try {
      localStorage.setItem(CHAVE_SEM_AVISO, '1')
    } catch {
      // sem localStorage: volta a perguntar na próxima vez
    }
  }

  function abrirNoFeed(id: string) {
    alvo.current = id
    setModo('feed')
  }

  const eu = membros.find((m) => m.id === meuId)
  const totalDeFotos = posts.reduce((soma, p) => soma + p.fotos.length, 0)

  // Grade de fotos (usada na Grade, no Por dia e nos Melhores)
  const grade = (lista: typeof posts) => (
    <ul className="grade">
      {lista.map((p) => (
        <li key={p.id}>
          <button type="button" onClick={() => abrirNoFeed(p.id)} aria-label={`Abrir post de ${nomeDe(p.autor)}`}>
            {p.fotos[0]?.url ? <img src={p.fotos[0].url} alt="" loading="lazy" decoding="async" /> : <span className="post-sem-link" />}
            {p.fotos.length > 1 && <Layers className="grade-varias" size={18} aria-hidden="true" />}
            <span className="grade-numeros" aria-hidden="true">
              <span>
                <Heart size={16} fill="currentColor" strokeWidth={0} /> {p.curtidas.length}
              </span>
              <span>
                <MessageCircle size={16} fill="currentColor" strokeWidth={0} /> {p.comentarios.length}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
  const melhores = melhoresPosts(posts) // spec 098
  const comigo = posts.filter((p) => p.marcados.includes(meuId)) // spec 100

  return (
    <div className="feed-pagina">
      <header className="feed-cabecalho">
        <h1>Fotos</h1>
        <p>
          {estado.status === 'pronto' && posts.length > 0
            ? `${posts.length} ${posts.length === 1 ? 'post' : 'posts'} · ${totalDeFotos} ${totalDeFotos === 1 ? 'foto' : 'fotos'} · só o comboio vê`
            : 'O feed da viagem. Só quem viaja junto vê.'}
        </p>
        {/* Spec 099: baixar tudo em .zip */}
        {estado.status === 'pronto' && <BaixarFotos nomeDaViagem={viagem.nome} posts={posts} destinos={destinos} />}
      </header>

      {/* Barra de postar, como no Instagram/Facebook */}
      <button type="button" className="feed-compor" onClick={() => setPostando(true)}>
        <Avatar nome={eu?.nome ?? 'Você'} url={eu?.avatarUrl ?? null} tamanho={38} />
        <span>Compartilhe uma foto da viagem…</span>
        <ImagePlus size={22} aria-hidden="true" />
      </button>

      {pedirAviso && (
        <div className="feed-aviso">
          <BellRing size={18} aria-hidden="true" />
          <p>Receber aviso no celular quando alguém do comboio postar ou comentar?</p>
          <div>
            <button type="button" className="botao pequeno" onClick={ligarAvisosDoFeed}>
              Avisar
            </button>
            <button type="button" className="botao-texto" onClick={agoraNao}>
              Agora não
            </button>
          </div>
        </div>
      )}

      {/* Abas Feed / Grade, como no perfil do Instagram */}
      <div className="feed-abas" role="tablist" aria-label="Jeito de ver">
        <button type="button" role="tab" aria-selected={modo === 'feed'} className={modo === 'feed' ? 'ativo' : undefined} onClick={() => setModo('feed')}>
          <LayoutList size={18} aria-hidden="true" /> Feed
        </button>
        <button type="button" role="tab" aria-selected={modo === 'grade'} className={modo === 'grade' ? 'ativo' : undefined} onClick={() => setModo('grade')}>
          <LayoutGrid size={18} aria-hidden="true" /> Grade
        </button>
        {/* Spec 098: álbum por dia e melhores */}
        <button type="button" role="tab" aria-selected={modo === 'dias'} className={modo === 'dias' ? 'ativo' : undefined} onClick={() => setModo('dias')}>
          <CalendarDays size={18} aria-hidden="true" /> Por dia
        </button>
        <button type="button" role="tab" aria-selected={modo === 'melhores'} className={modo === 'melhores' ? 'ativo' : undefined} onClick={() => setModo('melhores')}>
          <Star size={18} aria-hidden="true" /> Melhores
        </button>
      </div>

      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}

      {estado.status === 'carregando' && (
        <div className="feed" aria-busy="true" aria-label="Carregando o feed">
          {[0, 1].map((n) => (
            <div key={n} className="post post-esqueleto">
              <div className="post-topo">
                <span className="esq-bola" />
                <span className="esq-linha" />
              </div>
              <div className="esq-foto" />
            </div>
          ))}
        </div>
      )}
      {estado.status === 'erro' && (
        <div className="aviso-erro">
          <p>Não deu pra carregar o feed.</p>
          <button type="button" className="botao secundario pequeno" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      )}

      {estado.status === 'pronto' &&
        (posts.length === 0 ? (
          <EstadoVazio
            icone={Camera}
            titulo="Nenhum post ainda"
            texto="Poste as fotos da viagem. Todo o comboio vê, curte e comenta."
            acao={
              <button type="button" className="botao" onClick={() => setPostando(true)}>
                <Plus size={18} aria-hidden="true" /> Primeiro post
              </button>
            }
          />
        ) : modo === 'grade' ? (
          <>
            {comigo.length > 0 && (
              <button type="button" className={soComigo ? 'chip-filtro ativo' : 'chip-filtro'} aria-pressed={soComigo} onClick={() => setSoComigo(!soComigo)}>
                Fotos em que estou ({comigo.length})
              </button>
            )}
            {grade(soComigo ? comigo : posts)}
          </>
        ) : modo === 'dias' ? (
          <div className="album-dias">
            {albumPorDia(posts, destinos).map((g) => (
              <section key={g.dia}>
                <h2 className="album-dia">
                  {diaPorExtenso(g.dia)}
                  {g.destino && <small> · {g.destino}</small>}
                </h2>
                {grade(g.posts)}
              </section>
            ))}
          </div>
        ) : modo === 'melhores' ? (
          melhores.length === 0 ? (
            <p className="form-dica">Curta as fotos do feed: as mais curtidas aparecem aqui.</p>
          ) : (
            grade(melhores)
          )
        ) : (
          <div className="feed">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                autor={membros.find((m) => m.id === p.autor)}
                eu={eu}
                nomeDe={nomeDe}
                lugar={lugarDe(p.destino_id)}
                meuId={meuId}
                podeApagar={p.autor === meuId || euSouAdm}
                aoCurtir={aoCurtir}
                aoComentar={aoComentar}
                aoVerComentarios={(post) => setComentariosDe(post.id)}
                aoApagar={aoApagar}
                aoSairDaMarcacao={(post) =>
                  desmarcar(post.id, meuId)
                    .then(recarregar)
                    .catch(() => setErro('Não deu pra tirar a marcação agora.'))
                }
              />
            ))}
          </div>
        ))}

      {postando && (
        <Gaveta titulo="Novo post" aoFechar={() => setPostando(false)}>
          <FormPost
            viagemId={viagem.id}
            destinos={destinos}
            destinoInicial={null}
            membros={membros}
            aoTerminar={(id) => {
              setPostando(false)
              setModo('feed')
              alvo.current = id
              avisarComboio({ post_id: id })
              recarregar()
            }}
          />
        </Gaveta>
      )}

      {postDosComentarios && (
        <Gaveta titulo="Comentários" aoFechar={() => setComentariosDe(null)}>
          <Comentarios
            post={postDosComentarios}
            membros={membros}
            meuId={meuId}
            euSouAdm={euSouAdm}
            aoComentar={aoComentar}
            aoApagarComentario={aoApagarComentario}
          />
        </Gaveta>
      )}
    </div>
  )
}
