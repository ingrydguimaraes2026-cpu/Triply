import { useCallback, useEffect, useState } from 'react'
import { Heart, MapPinPlus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../viagens/hooks'
import { useBuscaDeLugares } from '../destinos/useBuscaDeLugares'
import type { Cidade } from '../destinos/buscarCidades'
import '../listas/listas.css'

type Candidato = { id: string; nome: string; pais: string | null; latitude: number | null; longitude: number | null; criado_por: string; votos: string[] }

// Destinos candidatos (spec 075): o comboio sugere cidades e vota; o ADM põe a mais votada no roteiro
export default function DestinosCandidatos() {
  const { viagem, destinos, membros, meuId, euSouAdm, recarregar: recarregarViagem } = useViagemAtual()
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null)
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('destinos_candidatos')
      .select('id, nome, pais, latitude, longitude, criado_por, candidato_votos (usuario_id)')
      .eq('viagem_id', viagem.id)
      .order('criado_em')
    if (error) return setErro('Não deu pra carregar os candidatos.')
    setCandidatos((data ?? []).map(({ candidato_votos, ...c }) => ({ ...c, votos: (candidato_votos ?? []).map((v) => v.usuario_id) })))
  }, [viagem.id])
  useEffect(() => {
    recarregar()
  }, [recarregar])

  async function sugerir(c: Cidade) {
    setBusca('')
    setErro(null)
    const { error } = await supabase
      .from('destinos_candidatos')
      .insert({ viagem_id: viagem.id, nome: c.nome, pais: c.pais || null, latitude: c.latitude, longitude: c.longitude })
    if (error) setErro('Não deu pra sugerir.')
    recarregar()
  }
  const { sugestoes, buscando, valida } = useBuscaDeLugares(busca, sugerir)

  async function votar(c: Candidato) {
    const votei = c.votos.includes(meuId)
    const { error } = votei
      ? await supabase.from('candidato_votos').delete().eq('candidato_id', c.id).eq('usuario_id', meuId)
      : await supabase.from('candidato_votos').insert({ candidato_id: c.id })
    if (error) setErro('Não deu pra votar.')
    recarregar()
  }

  async function apagar(c: Candidato) {
    await supabase.from('destinos_candidatos').delete().eq('id', c.id)
    recarregar()
  }

  // ADM: vira destino do roteiro (no fim) e sai da lista de candidatos
  async function porNoRoteiro(c: Candidato) {
    setErro(null)
    const { error } = await supabase
      .from('destinos')
      .insert({ viagem_id: viagem.id, nome: c.nome, pais: c.pais, latitude: c.latitude, longitude: c.longitude, ordem: destinos.length })
    if (error) return setErro('Não deu pra pôr no roteiro.')
    await supabase.from('destinos_candidatos').delete().eq('id', c.id)
    recarregar()
    recarregarViagem()
  }

  if (!candidatos) return erro ? <p className="form-erro">{erro}</p> : null
  const ordenados = [...candidatos].sort((a, b) => b.votos.length - a.votos.length)
  const nome = (id: string) => (id === meuId ? 'você' : (membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? '?'))

  return (
    <div className="listas">
      <p className="dica">Sugira cidades e vote. A mais votada vira destino quando o ADM puser no roteiro.</p>
      <ul className="listas-itens">
        {ordenados.map((c) => (
          <li key={c.id}>
            <button type="button" className={c.votos.includes(meuId) ? 'lugar-voto votou' : 'lugar-voto'} aria-pressed={c.votos.includes(meuId)} onClick={() => votar(c)}>
              <Heart size={13} aria-hidden="true" fill={c.votos.includes(meuId) ? 'currentColor' : 'none'} />
              {c.votos.length > 0 && <span>{c.votos.length}</span>}
            </button>
            <span className="listas-texto">
              <strong>{c.nome}</strong>
              {c.pais && <small> · {c.pais}</small>}
              {c.votos.length > 0 && <small> · {c.votos.map(nome).join(', ')}</small>}
            </span>
            {euSouAdm && (
              <button type="button" className="botao secundario pequeno" onClick={() => porNoRoteiro(c)} title="Pôr no roteiro">
                <MapPinPlus size={14} aria-hidden="true" />
              </button>
            )}
            {(c.criado_por === meuId || euSouAdm) && (
              <button type="button" className="botao-texto" aria-label={`Tirar ${c.nome}`} onClick={() => apagar(c)}>
                <Trash2 size={14} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="candidatos-busca">
        <input aria-label="Sugerir cidade" placeholder="Sugerir cidade: ex. Lisboa" value={busca} onChange={(e) => setBusca(e.target.value)} />
        {valida && (sugestoes.length > 0 || buscando) && (
          <ul className="lugar-sugestoes">
            {buscando && sugestoes.length === 0 && <li className="dica">Buscando…</li>}
            {sugestoes.slice(0, 6).map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => sugerir(c)}>
                  <strong>{c.nome}</strong>
                  <small>{[c.regiao, c.pais].filter(Boolean).join(', ')}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {erro && <p className="form-erro">{erro}</p>}
    </div>
  )
}
