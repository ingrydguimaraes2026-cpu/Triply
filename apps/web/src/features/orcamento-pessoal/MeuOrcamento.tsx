import { useEffect, useState, type FormEvent } from 'react'
import { buscarMeuOrcamento, formatarDinheiro, salvarMeuOrcamento, situacaoDoMeuOrcamento } from '@together/core'
import { supabase } from '../../lib/supabase'
import { hojeTexto } from '../destinos/datas'

type Props = { viagemId: string; meuId: string; moeda: string; gasto: number; inicio: string | null; fim: string | null }

// Meu orçamento pessoal (spec 056): só eu vejo. Gasto = minha parte nos gastos do comboio + meus pessoais.
export default function MeuOrcamento({ viagemId, meuId, moeda, gasto, inicio, fim }: Props) {
  const [meta, setMeta] = useState<number | null | undefined>(undefined) // undefined = carregando
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    buscarMeuOrcamento(supabase, viagemId)
      .then((m) => ativo && setMeta(m))
      .catch(() => ativo && setMeta(null))
    return () => {
      ativo = false
    }
  }, [viagemId])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const limpo = texto.trim().replace(/\./g, '').replace(',', '.')
    const valor = limpo ? Math.round(Number(limpo) * 100) : null
    if (valor !== null && (!Number.isFinite(valor) || valor <= 0)) return setErro('Valor inválido. Ex.: 8.000')
    try {
      await salvarMeuOrcamento(supabase, viagemId, meuId, valor)
      setMeta(valor)
      setEditando(false)
    } catch {
      setErro('Não deu pra salvar.')
    }
  }

  if (meta === undefined) return null

  if (editando || meta === null) {
    return (
      <form className="meu-orcamento-form" onSubmit={salvar}>
        <label htmlFor="meu-orcamento">Quanto você quer gastar na viagem ({moeda})? Só você vê.</label>
        <div>
          <input id="meu-orcamento" inputMode="decimal" placeholder="8.000" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <button type="submit" className="botao pequeno">
            Salvar
          </button>
          {editando && (
            <button type="button" className="botao-texto" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          )}
        </div>
        {erro && <p className="form-erro">{erro}</p>}
      </form>
    )
  }

  const s = situacaoDoMeuOrcamento(meta, gasto, inicio, fim, hojeTexto())
  return (
    <div className={`meu-orcamento nivel-${s.nivel}`}>
      <p className="numero">
        {formatarDinheiro(gasto, moeda)} <small>de {formatarDinheiro(meta, moeda)}</small>
      </p>
      <div className="barra-orcamento" aria-hidden="true">
        <span style={{ width: `${Math.min(100, s.porcento)}%` }} />
      </div>
      <p className="numero-legenda">
        {s.nivel === 'estourou'
          ? `Passou ${formatarDinheiro(-s.restante, moeda)} do seu orçamento`
          : `${s.porcento}% · sobram ${formatarDinheiro(s.restante, moeda)}${s.porDia !== null ? ` · ${formatarDinheiro(s.porDia, moeda)} por dia (${s.diasRestantes} ${s.diasRestantes === 1 ? 'dia' : 'dias'})` : ''}`}
        {' · '}
        <button
          type="button"
          className="botao-texto"
          onClick={() => {
            setTexto(String(meta / 100).replace('.', ','))
            setEditando(true)
          }}
        >
          mudar
        </button>
      </p>
    </div>
  )
}
