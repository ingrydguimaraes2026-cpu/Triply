import { useCallback, useEffect, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { buscarChegadas, chegadasRecentes, destinoDoDia, registrarChegada, type Chegada } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../viagens/hooks'
import { hojeTexto } from '../destinos/datas'
import { tempoAtras } from '../feed/regras'
import Avatar from '../../components/ui/Avatar'

// "Cheguei bem" (spec 051): um toque avisa o comboio. Mostra quem chegou nas últimas 24 h.
export default function ChegueiBem() {
  const { viagem, destinos, membros, meuId } = useViagemAtual()
  const [chegadas, setChegadas] = useState<Chegada[]>([])
  const [enviando, setEnviando] = useState(false)
  const [recado, setRecado] = useState<string | null>(null)
  const ondeHoje = destinoDoDia(hojeTexto(), destinos)

  const recarregar = useCallback(() => {
    buscarChegadas(supabase, viagem.id)
      .then(setChegadas)
      .catch((e) => console.error('Erro ao buscar chegadas:', e))
  }, [viagem.id])
  useEffect(recarregar, [recarregar])

  async function cheguei() {
    setEnviando(true)
    setRecado(null)
    try {
      const nova = await registrarChegada(supabase, viagem.id, ondeHoje?.nome ?? null)
      setChegadas((atual) => [nova, ...atual])
      setRecado('Pronto! O comboio foi avisado.')
      supabase.functions.invoke('cheguei-bem', { body: { chegada_id: nova.id } }).catch((e) => console.error('Erro ao avisar chegada:', e))
    } catch {
      setRecado('Não deu pra avisar agora. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  const recentes = chegadasRecentes(chegadas)
  const membro = (id: string) => membros.find((m) => m.id === id)

  return (
    <div className="cheguei-bem">
      <button type="button" className="botao" onClick={cheguei} disabled={enviando}>
        <CircleCheck size={18} aria-hidden="true" /> {enviando ? 'Avisando…' : `Cheguei bem${ondeHoje ? ` em ${ondeHoje.nome}` : ''}`}
      </button>
      {recado && <small role="status">{recado}</small>}
      {recentes.length > 0 && (
        <ul className="cheguei-bem-lista">
          {recentes.map((c) => {
            const m = membro(c.usuario_id)
            return (
              <li key={c.id}>
                <Avatar nome={m?.nome ?? '?'} url={m?.avatarUrl ?? null} tamanho={24} />
                <span>
                  <strong>{c.usuario_id === meuId ? 'Você' : (m?.nome ?? 'Alguém')}</strong> chegou bem{c.onde ? ` em ${c.onde}` : ''} · {tempoAtras(c.criado_em)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
