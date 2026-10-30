import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, Plus, Trash2, Wallet } from 'lucide-react'
import {
  apagarItemDaLista,
  buscarItensDaLista,
  criarItemDaLista,
  descricaoDasCompras,
  mudarItemDaLista,
  ordenarItens,
  resumoDaLista,
  SUGESTOES_LEVAR,
  type ItemDeLista,
  type TipoDeLista,
  comPendentes,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../viagens/hooks'
import FormGasto from '../financeiro/FormGasto'
import Gaveta from '../../components/ui/Gaveta'
import './listas.css'
import { lerMarcacoes, marcarOuGuardar } from '../offline/filaDeMarcacoes'

const NOMES: Record<TipoDeLista, string> = { levar: 'Quem leva', compras: 'Compras' }

// Listas do comboio (spec 048): "quem leva" e lista de compras, com dono e feito
export default function ListasDoComboio() {
  const { viagem, membros, meuId, euSouAdm } = useViagemAtual()
  const [itens, setItens] = useState<ItemDeLista[] | null>(null)
  const [lista, setLista] = useState<TipoDeLista>('levar')
  const [texto, setTexto] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [lancando, setLancando] = useState(false)

  const recarregar = useCallback(() => {
    buscarItensDaLista(supabase, viagem.id)
      .then((lista) => setItens(comPendentes(lista, lerMarcacoes(), 'itens_lista'))) // spec 086
      .catch((e) => {
        console.error('Erro ao buscar listas:', e)
        setErro('Não deu pra carregar as listas.')
      })
  }, [viagem.id])
  useEffect(recarregar, [recarregar])

  async function acrescentar(e: FormEvent | null, valor = texto) {
    e?.preventDefault()
    if (!valor.trim()) return
    setErro(null)
    try {
      const novo = await criarItemDaLista(supabase, viagem.id, lista, valor, lista === 'compras' ? quantidade : null)
      setItens((atual) => [...(atual ?? []), novo])
      setTexto('')
      setQuantidade('')
    } catch {
      setErro('Não deu pra acrescentar.')
    }
  }

  async function mudar(item: ItemDeLista, mudanca: { feito?: boolean; quem_id?: string | null }) {
    const antes = itens
    setItens((atual) => (atual ?? []).map((i) => (i.id === item.id ? { ...i, ...mudanca } : i)))
    try {
      // Spec 086: sem internet, fica guardado e sobe depois
      await marcarOuGuardar('itens_lista', item.id, mudanca, () => mudarItemDaLista(supabase, item.id, mudanca))
    } catch {
      setItens(antes)
      setErro('Não deu pra salvar.')
    }
  }

  async function apagar(item: ItemDeLista) {
    const antes = itens
    setItens((atual) => (atual ?? []).filter((i) => i.id !== item.id))
    try {
      await apagarItemDaLista(supabase, item.id)
    } catch {
      setItens(antes)
      setErro('Não deu pra apagar.')
    }
  }

  if (!itens) return erro ? <p className="form-erro">{erro}</p> : <p className="carregando-texto">Carregando…</p>
  const daLista = ordenarItens(itens.filter((i) => i.lista === lista))
  const resumo = resumoDaLista(daLista)
  const comprados = daLista.filter((i) => i.feito)
  const sugestoes = lista === 'levar' ? SUGESTOES_LEVAR.filter((s) => !daLista.some((i) => i.texto.toLowerCase() === s.toLowerCase())).slice(0, 4) : []

  return (
    <div className="listas">
      <div className="listas-abas" role="tablist">
        {(['levar', 'compras'] as TipoDeLista[]).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={l === lista} onClick={() => setLista(l)}>
            {NOMES[l]} <small>{itens.filter((i) => i.lista === l && !i.feito).length || ''}</small>
          </button>
        ))}
      </div>
      {resumo.total > 0 && (
        <p className="listas-resumo">
          {resumo.feitos} de {resumo.total} {lista === 'levar' ? 'garantidos' : 'comprados'}
          {resumo.semDono > 0 && ` · ${resumo.semDono} sem ninguém`}
        </p>
      )}

      <ul className="listas-itens">
        {daLista.map((item) => (
          <li key={item.id} className={item.feito ? 'feito' : undefined}>
            <button
              type="button"
              className="listas-marca"
              aria-pressed={item.feito}
              aria-label={item.feito ? `Desmarcar ${item.texto}` : `Marcar ${item.texto}`}
              onClick={() => mudar(item, { feito: !item.feito })}
            >
              {item.feito && <Check size={14} aria-hidden="true" />}
            </button>
            <span className="listas-texto">
              {item.texto}
              {item.quantidade && <small> · {item.quantidade}</small>}
            </span>
            <select aria-label={`Quem fica com ${item.texto}`} value={item.quem_id ?? ''} onChange={(e) => mudar(item, { quem_id: e.target.value || null })}>
              <option value="">Ninguém</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === meuId ? 'Eu' : m.nome}
                </option>
              ))}
            </select>
            {(item.criado_por === meuId || euSouAdm) && (
              <button type="button" className="botao-texto" aria-label={`Apagar ${item.texto}`} onClick={() => apagar(item)}>
                <Trash2 size={14} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {sugestoes.length > 0 && (
        <div className="listas-sugestoes">
          {sugestoes.map((s) => (
            <button key={s} type="button" onClick={() => acrescentar(null, s)}>
              <Plus size={12} aria-hidden="true" /> {s}
            </button>
          ))}
        </div>
      )}

      <form className="listas-nova" onSubmit={acrescentar}>
        <input
          aria-label={lista === 'levar' ? 'O que alguém precisa levar' : 'O que comprar'}
          placeholder={lista === 'levar' ? 'Ex.: adaptador de tomada' : 'Ex.: água'}
          maxLength={120}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        {lista === 'compras' && <input aria-label="Quantidade" className="listas-qtd" placeholder="Qtd." maxLength={20} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />}
        <button type="submit" className="botao pequeno" disabled={!texto.trim()}>
          <Plus size={14} aria-hidden="true" />
        </button>
      </form>
      {lista === 'compras' && comprados.length > 0 && (
        <button type="button" className="botao secundario pequeno" onClick={() => setLancando(true)}>
          <Wallet size={14} aria-hidden="true" /> Lançar o que foi comprado como gasto
        </button>
      )}
      {erro && <p className="form-erro">{erro}</p>}

      {lancando && (
        <Gaveta titulo="Lançar compras como gasto" aoFechar={() => setLancando(false)}>
          <FormGasto
            viagemId={viagem.id}
            moedaViagem={viagem.moeda_principal}
            membros={membros}
            meuId={meuId}
            euSouAdm={euSouAdm}
            inicial={{ descricao: descricaoDasCompras(comprados), categoria: 'alimentacao' }}
            aoTerminar={() => setLancando(false)}
          />
        </Gaveta>
      )}
    </div>
  )
}
