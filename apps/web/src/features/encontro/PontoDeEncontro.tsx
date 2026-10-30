import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import {
  apagarPontoDeEncontro,
  buscarPontosDeEncontro,
  criarPontoDeEncontro,
  linkDoMapa,
  type PontoDeEncontro as Ponto,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import BotaoCompartilhar from '../../components/ui/BotaoCompartilhar'
import BotaoIr from '../../components/ui/BotaoIr'
import './encontro.css'

// Quando (ISO) → "qua 12 nov, 14:30" (ou só a data se vier sem hora)
function formatarQuando(iso: string) {
  const d = new Date(iso)
  const data = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return hora === '00:00' ? data : `${data}, ${hora}`
}

// Spec 024 (roadmap #7): ponto de encontro — onde e que horas o comboio se encontra, com link pro mapa.
// Todo o comboio vê e cria; quem criou ou o ADM apaga.
export default function PontoDeEncontro({ viagemId, meuId, euSouAdm }: { viagemId: string; meuId: string; euSouAdm: boolean }) {
  const [pontos, setPontos] = useState<Ponto[] | null>(null)
  const [local, setLocal] = useState('')
  const [quando, setQuando] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarPontosDeEncontro(supabase, viagemId)
      .then((lista) => vivo && setPontos(lista))
      .catch(() => vivo && setPontos([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (pontos === null) return <p className="carregando-texto">Carregando…</p>

  const podeApagar = (p: Ponto) => p.criado_por === meuId || euSouAdm

  async function adicionar() {
    const limpo = local.trim()
    if (!limpo || salvando) return
    setSalvando(true)
    try {
      // datetime-local vem sem fuso ("2026-11-12T14:30"); o new Date() usa o fuso do aparelho
      const novo = await criarPontoDeEncontro(supabase, viagemId, {
        local: limpo,
        quando: quando ? new Date(quando).toISOString() : null,
        observacao: observacao || null,
      })
      setPontos((atual) => ordenar([...(atual ?? []), novo]))
      setLocal('')
      setQuando('')
      setObservacao('')
    } catch (erro) {
      console.error('Erro ao criar o ponto de encontro:', erro)
    } finally {
      setSalvando(false)
    }
  }

  async function remover(p: Ponto) {
    if (!podeApagar(p) || !window.confirm('Apagar este ponto de encontro?')) return
    try {
      await apagarPontoDeEncontro(supabase, p.id)
      setPontos((atual) => (atual ?? []).filter((x) => x.id !== p.id))
    } catch (erro) {
      console.error('Erro ao apagar o ponto de encontro:', erro)
    }
  }

  return (
    <div className="encontro">
      {pontos.length === 0 ? (
        <p className="resumo-vazio">Combine onde e que horas se encontrar (ex.: "portão 3 da estação, 9h").</p>
      ) : (
        <ul className="encontro-lista">
          {pontos.map((p) => (
            <li key={p.id} data-foco={p.id} className="encontro-item">
              <div className="encontro-corpo">
                <a className="encontro-local" href={linkDoMapa(p)} target="_blank" rel="noopener noreferrer">
                  <MapPin size={14} aria-hidden="true" /> {p.local}
                </a>
                {p.quando && <span className="encontro-quando">{formatarQuando(p.quando)}</span>}
                {p.observacao && <span className="encontro-obs">{p.observacao}</span>}
              </div>
              <BotaoIr alvo={{ nome: p.local, latitude: p.latitude, longitude: p.longitude }} />
              <BotaoCompartilhar viagemId={viagemId} item={{ tipo: 'ponto', id: p.id, titulo: p.local }} />
              {podeApagar(p) && (
                <button type="button" className="encontro-apagar" onClick={() => remover(p)} aria-label="Apagar ponto de encontro">
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className="encontro-novo"
        onSubmit={(e) => {
          e.preventDefault()
          adicionar()
        }}
      >
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value.slice(0, 200))}
          placeholder="Onde? (ex.: portão 3 da estação)"
          aria-label="Local do encontro"
        />
        <input
          type="text"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value.slice(0, 280))}
          placeholder="Observação (opcional)"
          aria-label="Observação"
        />
        <div className="encontro-novo-linha">
          <input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} aria-label="Quando" />
          <button type="submit" disabled={salvando || !local.trim()} aria-label="Adicionar ponto de encontro">
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  )
}

// Por horário combinado (sem horário no fim), depois por criação
function ordenar(lista: Ponto[]): Ponto[] {
  return [...lista].sort((a, b) => {
    if ((a.quando ?? '') !== (b.quando ?? '')) return (a.quando ?? '9999').localeCompare(b.quando ?? '9999')
    return a.criado_em.localeCompare(b.criado_em)
  })
}
