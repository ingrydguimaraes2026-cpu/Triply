import { useEffect, useState, type FormEvent } from 'react'
import { MessageCircle, Trash2 } from 'lucide-react'
import {
  acharMencoes,
  completarMencao,
  partesComMencoes,
  sugerirMencoes,
  apagarComentarioDoItem,
  buscarComentariosDoItem,
  comentarNoItem,
  type AlvoDoComentario,
  type ComentarioDeItem,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../viagens/hooks'
import { tempoAtras } from '../feed/regras'
import Avatar from '../../components/ui/Avatar'
import EstadoVazio from '../../components/ui/EstadoVazio'
import Gaveta from '../../components/ui/Gaveta'
import './comentarios.css'

type Props = {
  alvo: AlvoDoComentario
  titulo: string // nome do item, vai no topo da gaveta
  quantidade?: number
  aoMudar?: () => void // avisa a página pra atualizar o número
}

// Comentários em qualquer item (spec 027): o botão com o número e, ao tocar, a conversa numa gaveta.
export default function ComentariosDoItem({ alvo, titulo, quantidade = 0, aoMudar }: Props) {
  const [aberto, setAberto] = useState(false)
  return (
    // A gaveta é um portal: sem isso, o clique lá dentro "vazaria" pro item em volta
    <span className="comentarios-item-ancora" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="botao-comentarios"
        onClick={() => setAberto(true)}
        aria-label={quantidade ? `${quantidade} ${quantidade === 1 ? 'comentário' : 'comentários'}` : 'Comentar'}
        title="Comentários"
      >
        <MessageCircle size={14} aria-hidden="true" />
        {quantidade > 0 && <span>{quantidade}</span>}
      </button>
      {aberto && (
        <Gaveta titulo={`Comentários · ${titulo}`} aoFechar={() => setAberto(false)}>
          <Conversa alvo={alvo} aoMudar={aoMudar} />
        </Gaveta>
      )}
    </span>
  )
}

function Conversa({ alvo, aoMudar }: { alvo: AlvoDoComentario; aoMudar?: () => void }) {
  const { viagem, membros, meuId, euSouAdm } = useViagemAtual()
  const [comentarios, setComentarios] = useState<ComentarioDeItem[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const membro = (id: string) => membros.find((m) => m.id === id)
  const sugestoes = sugerirMencoes(texto, membros.filter((m) => m.id !== meuId)) // spec 043

  // Depende do tipo e do id (não do objeto `alvo`, que é recriado a cada render da página)
  const { tipo, id } = alvo
  useEffect(() => {
    let ativo = true
    buscarComentariosDoItem(supabase, { tipo, id })
      .then((lista) => {
        if (ativo) setComentarios(lista)
      })
      .catch((e) => {
        console.error('Erro ao carregar comentários:', e)
        if (ativo) setErro('Não deu pra carregar os comentários.')
      })
    return () => {
      ativo = false
    }
  }, [tipo, id])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setErro(null)
    setEnviando(true)
    try {
      const novo = await comentarNoItem(supabase, viagem.id, alvo, texto)
      setComentarios((atual) => [...(atual ?? []), novo])
      setTexto('')
      aoMudar?.()
      // Spec 043: avisa no celular quem foi mencionado (se der erro, o comentário já foi; só loga)
      if (acharMencoes(novo.texto, membros).some((id) => id !== meuId)) {
        supabase.functions.invoke('avisar-mencao', { body: { comentario_id: novo.id } }).catch((e) => console.error('Erro ao avisar menção:', e))
      }
    } catch (e) {
      console.error('Erro ao comentar:', e)
      setErro('Não deu pra comentar. Confira a internet e tente de novo.')
    }
    setEnviando(false)
  }

  async function apagar(id: string) {
    const antes = comentarios
    setComentarios((atual) => (atual ?? []).filter((c) => c.id !== id))
    try {
      await apagarComentarioDoItem(supabase, id)
      aoMudar?.()
    } catch (e) {
      console.error('Erro ao apagar comentário:', e)
      setComentarios(antes)
      setErro('Não deu pra apagar o comentário.')
    }
  }

  return (
    <div className="comentarios-item">
      {comentarios === null && !erro && <p className="carregando-texto">Carregando…</p>}
      {comentarios?.length === 0 && (
        <EstadoVazio icone={MessageCircle} titulo="Nenhum comentário ainda" texto="Combine aqui: dúvidas, quem paga, se vale a pena…" />
      )}
      {comentarios && comentarios.length > 0 && (
        <ul>
          {comentarios.map((c) => {
            const quem = membro(c.autor)
            return (
              <li key={c.id}>
                <Avatar nome={quem?.nome ?? 'Ex-membro'} url={quem?.avatarUrl ?? null} tamanho={30} />
                <p>
                  <strong>{c.autor === meuId ? 'Você' : (quem?.nome ?? 'Ex-membro')}</strong>{' '}
                  {partesComMencoes(c.texto, membros).map((parte, i) =>
                    parte.pessoaId ? (
                      <mark key={i} className={parte.pessoaId === meuId ? 'mencao eu' : 'mencao'}>
                        {parte.texto}
                      </mark>
                    ) : (
                      parte.texto
                    ),
                  )}
                  <time dateTime={c.criado_em}>{tempoAtras(c.criado_em)}</time>
                </p>
                {(c.autor === meuId || euSouAdm) && (
                  <button type="button" className="botao-texto" onClick={() => apagar(c.id)} aria-label="Apagar comentário">
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      {sugestoes && (
        <ul className="mencao-sugestoes" aria-label="Mencionar alguém">
          {sugestoes.pessoas.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setTexto(completarMencao(texto, p))}>
                <Avatar nome={p.nome} url={p.avatarUrl} tamanho={22} /> {p.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="comentarios-item-form" onSubmit={enviar}>
        <input
          placeholder="Escreva um comentário… (@ pra chamar alguém)"
          maxLength={1000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Comentário"
          autoFocus
        />
        <button type="submit" disabled={!texto.trim() || enviando}>
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
