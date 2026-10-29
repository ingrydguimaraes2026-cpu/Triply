import { useEffect, useState } from 'react'
import { Check, Megaphone, Pencil, Plus, Trash2, X } from 'lucide-react'
import { apagarAviso, buscarAvisos, criarAviso, editarAviso, type Aviso } from '@together/core'
import { supabase } from '../../lib/supabase'

// Spec 019: recados do ADM fixados no topo da viagem ("passaporte na mão amanhã!").
// Todo o comboio lê; só o ADM vê os botões de criar, editar e apagar.
export default function FaixaAvisos({ viagemId, euSouAdm }: { viagemId: string; euSouAdm: boolean }) {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null)
  const [editando, setEditando] = useState<string | 'novo' | null>(null)
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarAvisos(supabase, viagemId)
      .then((lista) => vivo && setAvisos(lista))
      .catch(() => vivo && setAvisos([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (avisos === null) return null
  // Sem avisos e sem ser ADM: não ocupa espaço
  if (avisos.length === 0 && !euSouAdm) return null

  function abrirNovo() {
    setTexto('')
    setEditando('novo')
  }
  function abrirEdicao(a: Aviso) {
    setTexto(a.texto)
    setEditando(a.id)
  }
  function fechar() {
    setEditando(null)
    setTexto('')
  }

  async function salvar() {
    const limpo = texto.trim()
    if (!limpo || salvando) return
    setSalvando(true)
    try {
      if (editando === 'novo') {
        const novo = await criarAviso(supabase, viagemId, limpo)
        setAvisos((atual) => [novo, ...(atual ?? [])])
      } else if (editando) {
        await editarAviso(supabase, editando, limpo)
        setAvisos((atual) => (atual ?? []).map((a) => (a.id === editando ? { ...a, texto: limpo } : a)))
      }
      fechar()
    } catch (erro) {
      console.error('Erro ao salvar o aviso:', erro)
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    if (!window.confirm('Apagar este aviso?')) return
    try {
      await apagarAviso(supabase, id)
      setAvisos((atual) => (atual ?? []).filter((a) => a.id !== id))
    } catch (erro) {
      console.error('Erro ao apagar o aviso:', erro)
    }
  }

  return (
    <section className="faixa-avisos" aria-label="Avisos do comboio">
      {avisos.map((a) =>
        editando === a.id ? (
          <Formulario key={a.id} texto={texto} setTexto={setTexto} salvando={salvando} aoSalvar={salvar} aoCancelar={fechar} />
        ) : (
          <article key={a.id} className="aviso">
            <Megaphone size={20} aria-hidden="true" />
            <p>{a.texto}</p>
            {euSouAdm && (
              <div className="aviso-acoes">
                <button type="button" onClick={() => abrirEdicao(a)} aria-label="Editar aviso">
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => remover(a.id)} aria-label="Apagar aviso">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </article>
        ),
      )}

      {euSouAdm && editando === 'novo' && (
        <Formulario texto={texto} setTexto={setTexto} salvando={salvando} aoSalvar={salvar} aoCancelar={fechar} />
      )}
      {euSouAdm && editando !== 'novo' && (
        <button type="button" className="aviso-novo" onClick={abrirNovo}>
          <Plus size={16} aria-hidden="true" /> {avisos.length ? 'Novo aviso' : 'Fixar um aviso pro comboio'}
        </button>
      )}
    </section>
  )
}

function Formulario({
  texto,
  setTexto,
  salvando,
  aoSalvar,
  aoCancelar,
}: {
  texto: string
  setTexto: (t: string) => void
  salvando: boolean
  aoSalvar: () => void
  aoCancelar: () => void
}) {
  return (
    <div className="aviso aviso-form">
      <Megaphone size={20} aria-hidden="true" />
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, 280))}
        placeholder="Ex.: Passaporte na mão amanhã às 8h!"
        rows={2}
        autoFocus
        aria-label="Texto do aviso"
      />
      <div className="aviso-acoes">
        <button type="button" onClick={aoSalvar} disabled={salvando || !texto.trim()} aria-label="Salvar aviso">
          <Check size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={aoCancelar} aria-label="Cancelar">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
