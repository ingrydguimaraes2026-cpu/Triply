import { useEffect, useState } from 'react'
import { Check, Lock, Plus, Trash2, Unlock, X } from 'lucide-react'
import {
  apagarEnquete,
  buscarEnquetes,
  criarEnquete,
  fecharEnquete,
  votarEnquete,
  type Enquete,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import BotaoCompartilhar from '../../components/ui/BotaoCompartilhar'

// Spec 021: enquetes rápidas pra decidir em grupo (data, restaurante, passeio).
// Todo o comboio cria e vota; quem criou ou o ADM fecha e apaga.
export default function Enquetes({ viagemId, meuId, euSouAdm }: { viagemId: string; meuId: string; euSouAdm: boolean }) {
  const [enquetes, setEnquetes] = useState<Enquete[] | null>(null)
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarEnquetes(supabase, viagemId)
      .then((lista) => vivo && setEnquetes(lista))
      .catch(() => vivo && setEnquetes([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (enquetes === null) return <p className="carregando-texto">Carregando…</p>

  async function votar(enquete: Enquete, opcaoId: string, jaVotei: boolean) {
    if (enquete.fechada) return
    const marcar = !jaVotei
    // Atualiza a tela na hora (escolha única tira meus outros votos)
    setEnquetes((atual) =>
      (atual ?? []).map((e) => {
        if (e.id !== enquete.id) return e
        return {
          ...e,
          opcoes: e.opcoes.map((o) => {
            if (o.id === opcaoId) {
              const semMim = o.votos.filter((v) => v !== meuId)
              return { ...o, votos: marcar ? [...semMim, meuId] : semMim }
            }
            // Escolha única: ao marcar uma, saio das outras
            if (!e.multipla && marcar) return { ...o, votos: o.votos.filter((v) => v !== meuId) }
            return o
          }),
        }
      }),
    )
    try {
      await votarEnquete(supabase, opcaoId, marcar)
    } catch (erro) {
      console.error('Erro ao votar:', erro)
      recarregar()
    }
  }

  async function recarregar() {
    try {
      setEnquetes(await buscarEnquetes(supabase, viagemId))
    } catch {
      /* mantém o que tem */
    }
  }

  async function fechar(e: Enquete) {
    setEnquetes((atual) => (atual ?? []).map((x) => (x.id === e.id ? { ...x, fechada: !e.fechada } : x)))
    try {
      await fecharEnquete(supabase, e.id, !e.fechada)
    } catch (erro) {
      console.error('Erro ao fechar a enquete:', erro)
      recarregar()
    }
  }

  async function remover(e: Enquete) {
    if (!window.confirm('Apagar esta enquete e os votos?')) return
    try {
      await apagarEnquete(supabase, e.id)
      setEnquetes((atual) => (atual ?? []).filter((x) => x.id !== e.id))
    } catch (erro) {
      console.error('Erro ao apagar a enquete:', erro)
    }
  }

  return (
    <div className="enquetes">
      {enquetes.length === 0 && !criando ? (
        <p className="resumo-vazio">Nenhuma enquete ainda. Crie uma pra decidir junto (que dia, qual restaurante…).</p>
      ) : (
        enquetes.map((e) => {
          const total = new Set(e.opcoes.flatMap((o) => o.votos)).size
          const souDono = e.criadoPor === meuId || euSouAdm
          const maxVotos = Math.max(1, ...e.opcoes.map((o) => o.votos.length))
          return (
            <article key={e.id} data-foco={e.id} className={e.fechada ? 'enquete fechada' : 'enquete'}>
              <header className="enquete-topo">
                <h3>{e.pergunta}</h3>
                <div className="enquete-acoes">
                  <BotaoCompartilhar viagemId={viagemId} item={{ tipo: 'enquete', id: e.id, titulo: e.pergunta }} />
                  {souDono && (
                    <>
                      <button type="button" onClick={() => fechar(e)} aria-label={e.fechada ? 'Reabrir enquete' : 'Fechar enquete'}>
                        {e.fechada ? <Unlock size={15} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
                      </button>
                      <button type="button" onClick={() => remover(e)} aria-label="Apagar enquete">
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </header>
              <ul className="enquete-opcoes">
                {e.opcoes.map((o) => {
                  const jaVotei = o.votos.includes(meuId)
                  const n = o.votos.length
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        className={jaVotei ? 'opcao votada' : 'opcao'}
                        onClick={() => votar(e, o.id, jaVotei)}
                        disabled={e.fechada}
                        aria-pressed={jaVotei}
                      >
                        <span className="opcao-barra" style={{ width: `${(n / maxVotos) * 100}%` }} aria-hidden="true" />
                        <span className="opcao-marca">{jaVotei && <Check size={13} aria-hidden="true" />}</span>
                        <span className="opcao-texto">{o.texto}</span>
                        <span className="opcao-n">{n}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="enquete-rodape">
                {total === 0 ? 'Ninguém votou ainda' : `${total} ${total === 1 ? 'pessoa votou' : 'pessoas votaram'}`}
                {e.multipla ? ' · dá pra marcar várias' : ''}
                {e.fechada ? ' · fechada' : ''}
              </p>
            </article>
          )
        })
      )}

      {criando ? (
        <FormNova
          aoCriar={async (dados) => {
            await criarEnquete(supabase, viagemId, dados)
            await recarregar()
            setCriando(false)
          }}
          aoCancelar={() => setCriando(false)}
        />
      ) : (
        <button type="button" className="enquete-nova-btn" onClick={() => setCriando(true)}>
          <Plus size={16} aria-hidden="true" /> Nova enquete
        </button>
      )}
    </div>
  )
}

function FormNova({
  aoCriar,
  aoCancelar,
}: {
  aoCriar: (dados: { pergunta: string; multipla: boolean; opcoes: string[] }) => Promise<void>
  aoCancelar: () => void
}) {
  const [pergunta, setPergunta] = useState('')
  const [opcoes, setOpcoes] = useState(['', ''])
  const [multipla, setMultipla] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const validas = opcoes.map((o) => o.trim()).filter(Boolean)
  const pode = pergunta.trim().length > 0 && validas.length >= 2 && !salvando

  function mudarOpcao(i: number, valor: string) {
    setOpcoes((atual) => atual.map((o, idx) => (idx === i ? valor.slice(0, 120) : o)))
  }

  async function enviar() {
    if (!pode) return
    setSalvando(true)
    try {
      await aoCriar({ pergunta: pergunta.trim(), multipla, opcoes: validas })
    } catch (erro) {
      console.error('Erro ao criar a enquete:', erro)
      setSalvando(false)
    }
  }

  return (
    <form
      className="enquete-form"
      onSubmit={(ev) => {
        ev.preventDefault()
        enviar()
      }}
    >
      <input
        type="text"
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value.slice(0, 200))}
        placeholder="A pergunta (ex.: que dia a gente vai?)"
        aria-label="Pergunta da enquete"
        autoFocus
      />
      {opcoes.map((o, i) => (
        <div key={i} className="enquete-form-opcao">
          <input
            type="text"
            value={o}
            onChange={(e) => mudarOpcao(i, e.target.value)}
            placeholder={`Opção ${i + 1}`}
            aria-label={`Opção ${i + 1}`}
          />
          {opcoes.length > 2 && (
            <button type="button" onClick={() => setOpcoes((a) => a.filter((_, idx) => idx !== i))} aria-label="Remover opção">
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      {opcoes.length < 10 && (
        <button type="button" className="enquete-add-opcao" onClick={() => setOpcoes((a) => [...a, ''])}>
          <Plus size={14} aria-hidden="true" /> Opção
        </button>
      )}
      <label className="enquete-multipla">
        <input type="checkbox" checked={multipla} onChange={(e) => setMultipla(e.target.checked)} /> Pode marcar várias
      </label>
      <div className="enquete-form-acoes">
        <button type="submit" className="enquete-criar" disabled={!pode}>
          Criar enquete
        </button>
        <button type="button" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
