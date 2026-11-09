import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { BellRing, Heart, Layers, MessageCircle, Plus } from '../../components/ui/icones'
import { albumPorDia } from '@together/core'
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
import TelaVazia from '../../components/ui/TelaVazia'
import TituloDaTela from '../../components/ui/TituloDaTela'
import ErroNaTela from '../../components/ui/ErroNaTela'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './fotos.css'

const CHAVE_SEM_AVISO = 'together:feed-sem-aviso'

// Fotos (spec 014), igual à aba do app (apps/mobile/app/viagem/[id]/(abas)/fotos.tsx):
// "N fotos · N pessoas", o botão "Postar", 2 pílulas (Feed | Por dia) e a Norti quando está vazio.
// "Por dia" tem o filtro por pessoa, como no app. Só quem viaja junto vê.
export default function Fotos() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  const { estado, recarregar, mudarPost, tirarPost } = usePosts(viagem.id)
  const [busca] = useSearchParams()
  const [modo, setModo] = useState<'feed' | 'dias'>('feed')
  const [postando, setPostando] = useState(false)
  const [pessoa, setPessoa] = useState<string | null>(null) // Por dia: só as fotos de quem postou
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
  const quemPostou = new Set(posts.map((p) => p.autor)).size
  const doDia = pessoa ? posts.filter((p) => p.autor === pessoa) : posts

  // Grade de fotos (usada no Por dia)
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

  return (
    <div className="feed-pagina">
      <TituloDaTela
        titulo="Fotos"
        acima={`${totalDeFotos} ${totalDeFotos === 1 ? 'foto' : 'fotos'} · ${quemPostou} ${quemPostou === 1 ? 'pessoa' : 'pessoas'}`}
        acao={
          <button type="button" className="botao compacto" onClick={() => setPostando(true)}>
            <Plus size={17} aria-hidden="true" /> Postar
          </button>
        }
      />

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

      <div className="fotos-pilulas" role="tablist" aria-label="Jeito de ver">
        {(['feed', 'dias'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={modo === m} className={modo === m ? 'ativa' : undefined} onClick={() => setModo(m)}>
            {m === 'feed' ? 'Feed' : 'Por dia'}
          </button>
        ))}
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
      {estado.status === 'erro' && <ErroNaTela titulo="Não deu pra carregar o feed" aoTentar={recarregar} />}

      {estado.status === 'pronto' &&
        (modo === 'dias' ? (
          <>
            {/* Filtro por pessoa, como no app */}
            <div className="fotos-pessoas" aria-label="Fotos de quem">
              <button type="button" className={pessoa ? undefined : 'ativa'} aria-pressed={!pessoa} onClick={() => setPessoa(null)}>
                Todos
              </button>
              {membros.map((m) => (
                <button key={m.id} type="button" className={pessoa === m.id ? 'ativa' : undefined} aria-pressed={pessoa === m.id} onClick={() => setPessoa(pessoa === m.id ? null : m.id)}>
                  <Avatar nome={m.nome} url={m.avatarUrl} tamanho={26} />
                  {m.id === meuId ? 'Você' : m.nome.split(' ')[0]}
                </button>
              ))}
            </div>
            {doDia.length === 0 ? (
              <TelaVazia titulo="Nenhuma foto ainda" texto="As fotos que o comboio postar no feed aparecem aqui, separadas por dia." />
            ) : (
              <div className="album-dias">
                {albumPorDia(doDia, destinos).map((g) => (
                  <section key={g.dia}>
                    <h2 className="album-dia">
                      {diaPorExtenso(g.dia)}
                      {g.destino && <small> · {g.destino}</small>}
                    </h2>
                    {grade(g.posts)}
                  </section>
                ))}
              </div>
            )}
            {/* Spec 099: baixar tudo em .zip */}
            <BaixarFotos nomeDaViagem={viagem.nome} posts={posts} destinos={destinos} />
          </>
        ) : posts.length === 0 ? (
          <TelaVazia titulo="Nenhum post ainda" texto='Toque em "Postar" pra mandar as primeiras fotos pro comboio.' />
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
