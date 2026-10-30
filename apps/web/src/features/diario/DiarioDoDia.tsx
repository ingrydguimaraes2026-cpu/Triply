import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Lock } from 'lucide-react'
import type { Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import type { Membro } from '../viagens/hooks'
import './diario.css'

type Entrada = Tables<'diario'>

// Diário da viagem (spec 101): cada um escreve o seu dia; o comboio lê o dos outros.
type Props = { viagemId: string; dia: string; membros: Membro[]; meuId: string }
export default function DiarioDoDia({ viagemId, dia, membros, meuId }: Props) {
  const [entradas, setEntradas] = useState<Entrada[] | null>(null)
  const [texto, setTexto] = useState('')
  const [soEu, setSoEu] = useState(false)
  const [escrevendo, setEscrevendo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(() => {
    supabase
      .from('diario')
      .select('*')
      .eq('viagem_id', viagemId)
      .eq('dia', dia)
      .order('criado_em')
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao buscar o diário:', error)
          return setEntradas([])
        }
        setEntradas(data ?? [])
        const minha = (data ?? []).find((e) => e.autor === meuId)
        setTexto(minha?.texto ?? '')
        setSoEu(minha?.visibilidade === 'so_eu')
        setEscrevendo(false)
      })
  }, [viagemId, dia, meuId])
  useEffect(recarregar, [recarregar])

  if (!entradas) return null
  const minha = entradas.find((e) => e.autor === meuId)
  const dosOutros = entradas.filter((e) => e.autor !== meuId)
  const nome = (id: string) => membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? 'Alguém'

  async function salvar() {
    setErro(null)
    setSalvando(true)
    const limpo = texto.trim()
    const { error } = limpo
      ? await supabase
          .from('diario')
          .upsert({ viagem_id: viagemId, autor: meuId, dia, texto: limpo, visibilidade: soEu ? 'so_eu' : 'comboio', editado_em: new Date().toISOString() }, { onConflict: 'viagem_id,autor,dia' })
      : minha
        ? await supabase.from('diario').delete().eq('id', minha.id)
        : { error: null }
    setSalvando(false)
    if (error) {
      console.error('Erro ao salvar o diário:', error)
      return setErro('Não deu pra salvar. Tente de novo.')
    }
    recarregar()
  }

  return (
    <section className="diario" aria-label="Diário do dia">
      <h3>
        <BookOpen size={16} aria-hidden="true" /> Diário do dia
      </h3>

      {dosOutros.map((e) => (
        <article key={e.id} className="diario-entrada">
          <strong>{nome(e.autor)}</strong>
          <p>{e.texto}</p>
        </article>
      ))}

      {escrevendo ? (
        <div className="form diario-form">
          <textarea rows={4} maxLength={5000} placeholder="Como foi o seu dia?" value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
          <label className="diario-so-eu">
            <input type="checkbox" checked={soEu} onChange={(e) => setSoEu(e.target.checked)} /> <Lock size={13} aria-hidden="true" /> Só eu leio
          </label>
          {erro && (
            <p className="form-erro" role="alert">
              {erro}
            </p>
          )}
          <div className="form-rodape">
            <button type="button" className="botao secundario" onClick={recarregar} disabled={salvando}>
              Cancelar
            </button>
            <button type="button" className="botao" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : minha ? (
        <article className="diario-entrada minha">
          <strong>
            Você{minha.visibilidade === 'so_eu' && <small> · só você lê</small>}
          </strong>
          <p>{minha.texto}</p>
          <button type="button" className="botao-texto" onClick={() => setEscrevendo(true)}>
            Editar
          </button>
        </article>
      ) : (
        <button type="button" className="botao-texto" onClick={() => setEscrevendo(true)}>
          Escrever o meu dia
        </button>
      )}
    </section>
  )
}
