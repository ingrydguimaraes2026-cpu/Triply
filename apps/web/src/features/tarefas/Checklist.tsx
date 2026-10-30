import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import {
  alternarTarefa,
  apagarTarefa,
  buscarTarefas,
  criarTarefa,
  editarTarefa,
  type Tarefa,
  comPendentes,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { formatarData } from '../../lib/datas'
import { lerMarcacoes, marcarOuGuardar } from '../offline/filaDeMarcacoes'

type Pessoa = { id: string; nome: string }

// Spec 020: checklist da viagem com responsável e prazo ("quem compra o seguro?").
// Todo o comboio vê e cria; quem criou, o responsável ou o ADM marcam e editam.
export default function Checklist({
  viagemId,
  membros,
  meuId,
  euSouAdm,
}: {
  viagemId: string
  membros: Pessoa[]
  meuId: string
  euSouAdm: boolean
}) {
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null)
  const [titulo, setTitulo] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [prazo, setPrazo] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarTarefas(supabase, viagemId)
      .then((lista) => vivo && setTarefas(comPendentes(lista, lerMarcacoes(), 'tarefas'))) // spec 086
      .catch(() => vivo && setTarefas([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  const nomePorId = useMemo(() => new Map(membros.map((m) => [m.id, m.nome])), [membros])

  if (tarefas === null) return <p className="carregando-texto">Carregando…</p>

  function podeMexer(t: Tarefa) {
    return t.criado_por === meuId || t.responsavel_id === meuId || euSouAdm
  }
  function podeApagar(t: Tarefa) {
    return t.criado_por === meuId || euSouAdm
  }

  async function adicionar() {
    const limpo = titulo.trim()
    if (!limpo || salvando) return
    setSalvando(true)
    try {
      const nova = await criarTarefa(supabase, viagemId, {
        titulo: limpo,
        responsavelId: responsavel || null,
        prazo: prazo || null,
      })
      setTarefas((atual) => ordenar([...(atual ?? []), nova]))
      setTitulo('')
      setResponsavel('')
      setPrazo('')
    } catch (erro) {
      console.error('Erro ao criar a tarefa:', erro)
    } finally {
      setSalvando(false)
    }
  }

  async function alternar(t: Tarefa) {
    if (!podeMexer(t)) return
    const feita = !t.feita
    setTarefas((atual) => ordenar((atual ?? []).map((x) => (x.id === t.id ? { ...x, feita } : x))))
    try {
      await marcarOuGuardar('tarefas', t.id, { feita }, () => alternarTarefa(supabase, t.id, feita)) // spec 086
    } catch (erro) {
      console.error('Erro ao marcar a tarefa:', erro)
      setTarefas((atual) => ordenar((atual ?? []).map((x) => (x.id === t.id ? { ...x, feita: !feita } : x))))
    }
  }

  async function remover(t: Tarefa) {
    if (!podeApagar(t) || !window.confirm('Apagar esta tarefa?')) return
    try {
      await apagarTarefa(supabase, t.id)
      setTarefas((atual) => (atual ?? []).filter((x) => x.id !== t.id))
    } catch (erro) {
      console.error('Erro ao apagar a tarefa:', erro)
    }
  }

  async function trocarResponsavel(t: Tarefa, id: string) {
    const responsavelId = id || null
    setTarefas((atual) => (atual ?? []).map((x) => (x.id === t.id ? { ...x, responsavel_id: responsavelId } : x)))
    try {
      await editarTarefa(supabase, t.id, { responsavelId })
    } catch (erro) {
      console.error('Erro ao trocar o responsável:', erro)
    }
  }

  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <div className="checklist">
      {tarefas.length === 0 ? (
        <p className="resumo-vazio">Nada na lista ainda. Anote quem fica com o quê (seguro, van, ingressos…).</p>
      ) : (
        <ul className="checklist-lista">
          {tarefas.map((t) => {
            const atrasada = !t.feita && t.prazo && t.prazo < hoje
            return (
              <li key={t.id} className={t.feita ? 'tarefa feita' : 'tarefa'}>
                <button
                  type="button"
                  className="tarefa-check"
                  onClick={() => alternar(t)}
                  disabled={!podeMexer(t)}
                  aria-label={t.feita ? 'Desmarcar tarefa' : 'Marcar como feita'}
                  aria-pressed={t.feita}
                >
                  {t.feita && <Check size={14} aria-hidden="true" />}
                </button>
                <div className="tarefa-corpo">
                  <span className="tarefa-titulo">{t.titulo}</span>
                  <span className="tarefa-meta">
                    {podeMexer(t) ? (
                      <select
                        value={t.responsavel_id ?? ''}
                        onChange={(e) => trocarResponsavel(t, e.target.value)}
                        aria-label="Responsável"
                      >
                        <option value="">Sem responsável</option>
                        {membros.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{t.responsavel_id ? nomePorId.get(t.responsavel_id) ?? 'Alguém' : 'Sem responsável'}</span>
                    )}
                    {t.prazo && <span className={atrasada ? 'tarefa-prazo atrasada' : 'tarefa-prazo'}>· {formatarData(t.prazo)}</span>}
                  </span>
                </div>
                {podeApagar(t) && (
                  <button type="button" className="tarefa-apagar" onClick={() => remover(t)} aria-label="Apagar tarefa">
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form
        className="checklist-nova"
        onSubmit={(e) => {
          e.preventDefault()
          adicionar()
        }}
      >
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value.slice(0, 200))}
          placeholder="Nova tarefa (ex.: comprar o seguro)"
          aria-label="Nova tarefa"
        />
        <div className="checklist-nova-linha">
          <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} aria-label="Responsável">
            <option value="">Sem responsável</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} aria-label="Prazo" />
          <button type="submit" disabled={salvando || !titulo.trim()} aria-label="Adicionar tarefa">
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  )
}

// Pendentes primeiro, depois por prazo (sem prazo no fim) e por criação
function ordenar(lista: Tarefa[]): Tarefa[] {
  return [...lista].sort((a, b) => {
    if (a.feita !== b.feita) return a.feita ? 1 : -1
    if ((a.prazo ?? '') !== (b.prazo ?? '')) return (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999')
    return a.criado_em.localeCompare(b.criado_em)
  })
}
