import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { BedSingle, Dices, Plus, Trash2 } from 'lucide-react'
import { apagarQuarto, buscarQuartos, criarQuarto, entrarNoQuarto, gravarSorteio, semQuarto, sortearQuartos, type Quarto } from '@together/core'
import { supabase } from '../../lib/supabase'
import type { Membro } from '../viagens/hooks'
import Avatar from '../../components/ui/Avatar'

type Props = { viagemId: string; hospedagemId: string; membros: Membro[]; meuId: string; podeEditar: boolean }

// Quem dorme onde (spec 068): quartos da hospedagem escolhida; cada um entra no seu, ou o ADM sorteia
export default function QuemDormeOnde({ viagemId, hospedagemId, membros, meuId, podeEditar }: Props) {
  const [quartos, setQuartos] = useState<Quarto[] | null>(null)
  const [nome, setNome] = useState('')
  const [vagas, setVagas] = useState(2)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(() => {
    buscarQuartos(supabase, hospedagemId)
      .then(setQuartos)
      .catch(() => setErro('Não deu pra carregar os quartos.'))
  }, [hospedagemId])
  useEffect(recarregar, [recarregar])

  async function tentar(acao: () => Promise<void>, falha: string) {
    setErro(null)
    try {
      await acao()
      recarregar()
    } catch (e) {
      const msg = (e as { message?: string }).message ?? ''
      setErro(/cheio/.test(msg) ? 'Esse quarto já está cheio.' : falha)
    }
  }

  async function novo(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    await tentar(() => criarQuarto(supabase, viagemId, hospedagemId, nome, vagas), 'Não deu pra criar o quarto.')
    setNome('')
  }

  if (!quartos) return null
  const pessoa = (id: string) => membros.find((m) => m.id === id)
  const fora = semQuarto(quartos, membros.map((m) => m.id))
  const vagasTotal = quartos.reduce((s, q) => s + q.vagas, 0)

  return (
    <section className="quartos" aria-label="Quem dorme onde">
      <h4>
        <BedSingle size={16} aria-hidden="true" /> Quem dorme onde
      </h4>
      {quartos.length === 0 && <p className="dica">{podeEditar ? 'Cadastre os quartos e camas da casa.' : 'Ninguém cadastrou os quartos ainda.'}</p>}
      <ul className="quartos-lista">
        {quartos.map((q) => {
          const estou = q.ocupantes.includes(meuId)
          const cheio = q.ocupantes.length >= q.vagas
          return (
            <li key={q.id}>
              <div className="quarto-topo">
                <strong>{q.nome}</strong>
                <small>
                  {q.ocupantes.length}/{q.vagas}
                </small>
                {podeEditar && (
                  <button type="button" className="botao-texto" aria-label={`Apagar ${q.nome}`} onClick={() => tentar(() => apagarQuarto(supabase, q.id), 'Não deu pra apagar.')}>
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="quarto-ocupantes">
                {q.ocupantes.map((id) => (
                  <span key={id} title={pessoa(id)?.nome}>
                    <Avatar nome={pessoa(id)?.nome ?? '?'} url={pessoa(id)?.avatarUrl ?? null} tamanho={26} />
                  </span>
                ))}
                {(estou || !cheio) && (
                  <button type="button" className="botao-texto" onClick={() => tentar(() => entrarNoQuarto(supabase, q.id, !estou), 'Não deu pra trocar de quarto.')}>
                    {estou ? 'Sair' : 'Vou dormir aqui'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {quartos.length > 0 && fora.length > 0 && (
        <p className="dica">Sem quarto: {fora.map((id) => (id === meuId ? 'você' : (pessoa(id)?.nome.split(' ')[0] ?? '?'))).join(', ')}{vagasTotal < membros.length && ' · faltam vagas'}</p>
      )}
      {podeEditar && (
        <>
          <form className="quartos-novo" onSubmit={novo}>
            <input aria-label="Nome do quarto" placeholder="Ex.: Quarto 1, Sofá-cama" maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)} />
            <input aria-label="Vagas" type="number" min={1} max={20} value={vagas} onChange={(e) => setVagas(Math.max(1, Math.min(20, Number(e.target.value))))} />
            <button type="submit" className="botao pequeno" disabled={!nome.trim()}>
              <Plus size={14} aria-hidden="true" />
            </button>
          </form>
          {quartos.length > 0 && (
            <button
              type="button"
              className="botao secundario pequeno alinhar-inicio"
              onClick={() => tentar(() => gravarSorteio(supabase, sortearQuartos(quartos, membros.map((m) => m.id)).distribuicao), 'Não deu pra sortear.')}
            >
              <Dices size={14} aria-hidden="true" /> Sortear os quartos
            </button>
          )}
        </>
      )}
      {erro && <p className="form-erro">{erro}</p>}
    </section>
  )
}
