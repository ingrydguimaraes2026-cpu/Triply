import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import {
  buscarMinhaMala,
  marcarNaMala,
  MODELOS_DE_MALA,
  modeloDeMala,
  porNaMala,
  progressoDaMala,
  tirarDaMala,
  type ItemDaMala,
  type ModeloDeMala,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../viagens/hooks'
import '../listas/listas.css'

function diasDaViagem(inicio: string | null, fim: string | null) {
  if (!inicio || !fim) return 5
  return Math.round((Date.parse(`${fim}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 86400000) + 1
}

// Mala individual (spec 069): só você vê. Começa por um modelo (frio, meia-estação, calor).
export default function MinhaMala() {
  const { viagem } = useViagemAtual()
  const [itens, setItens] = useState<ItemDaMala[] | null>(null)
  const [modelo, setModelo] = useState<ModeloDeMala>('meia_estacao')
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(() => {
    buscarMinhaMala(supabase, viagem.id)
      .then(setItens)
      .catch(() => setErro('Não deu pra carregar a mala.'))
  }, [viagem.id])
  useEffect(recarregar, [recarregar])

  async function tentar(acao: () => Promise<void>) {
    setErro(null)
    try {
      await acao()
      recarregar()
    } catch {
      setErro('Não deu pra salvar.')
    }
  }

  async function marcar(i: ItemDaMala) {
    setItens((atual) => (atual ?? []).map((x) => (x.id === i.id ? { ...x, feito: !i.feito } : x)))
    try {
      await marcarNaMala(supabase, i.id, !i.feito)
    } catch {
      recarregar()
    }
  }

  async function acrescentar(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    await tentar(() => porNaMala(supabase, viagem.id, [{ texto, quantidade: null }]))
    setTexto('')
  }

  if (!itens) return erro ? <p className="form-erro">{erro}</p> : null

  if (itens.length === 0) {
    const dias = diasDaViagem(viagem.data_inicio, viagem.data_fim)
    return (
      <div className="listas">
        <p className="dica">Só você vê. Escolha um modelo pra começar ({dias} dias de viagem):</p>
        <div className="listas-abas">
          {MODELOS_DE_MALA.map((m) => (
            <button key={m.chave} type="button" aria-selected={modelo === m.chave} onClick={() => setModelo(m.chave)}>
              {m.nome}
            </button>
          ))}
        </div>
        <button type="button" className="botao pequeno alinhar-inicio" onClick={() => tentar(() => porNaMala(supabase, viagem.id, modeloDeMala(modelo, dias)))}>
          Montar minha lista
        </button>
        {erro && <p className="form-erro">{erro}</p>}
      </div>
    )
  }

  const { feitos, total } = progressoDaMala(itens)
  const ordenados = [...itens].sort((a, b) => Number(a.feito) - Number(b.feito))
  return (
    <div className="listas">
      <p className="listas-resumo">
        {feitos} de {total} na mala · só você vê
      </p>
      <ul className="listas-itens">
        {ordenados.map((i) => (
          <li key={i.id} className={i.feito ? 'feito' : undefined}>
            <button type="button" className="listas-marca" aria-pressed={i.feito} aria-label={i.feito ? `Tirar ${i.texto}` : `Pus ${i.texto}`} onClick={() => marcar(i)}>
              {i.feito && <Check size={14} aria-hidden="true" />}
            </button>
            <span className="listas-texto">
              {i.texto}
              {i.quantidade && <small> · {i.quantidade}</small>}
            </span>
            <button type="button" className="botao-texto" aria-label={`Apagar ${i.texto}`} onClick={() => tentar(() => tirarDaMala(supabase, i.id))}>
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <form className="listas-nova" onSubmit={acrescentar}>
        <input aria-label="Item da mala" placeholder="Ex.: chapinha" maxLength={80} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button type="submit" className="botao pequeno" disabled={!texto.trim()}>
          <Plus size={14} aria-hidden="true" />
        </button>
      </form>
      {erro && <p className="form-erro">{erro}</p>}
    </div>
  )
}
