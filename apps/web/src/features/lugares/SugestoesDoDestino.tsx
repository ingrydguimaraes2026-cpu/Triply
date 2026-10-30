import { useState } from 'react'
import { ExternalLink, Plus, Sparkles } from 'lucide-react'
import { consultaDeSugestoes, sugestoesDaResposta, textoDaDistancia, type Sugestao, type Tables } from '@together/core'

// Sugestões de lugares por destino (spec 094): atrações conhecidas do OpenStreetMap perto do destino.
// "Salvar" vira um lugar do comboio (tipo passeio), com a coordenada e o link da Wikipédia.
type Props = {
  destino: Tables<'destinos'>
  jaSalvos: string[]
  aoSalvar: (s: Sugestao) => Promise<void>
}
export default function SugestoesDoDestino({ destino, jaSalvos, aoSalvar }: Props) {
  const [lista, setLista] = useState<Sugestao[] | null>(null)
  const [estado, setEstado] = useState<'parado' | 'buscando' | 'erro'>('parado')
  const [salvando, setSalvando] = useState<string | null>(null)

  if (destino.latitude == null || destino.longitude == null) return null
  const { latitude, longitude } = destino

  async function buscar() {
    setEstado('buscando')
    try {
      const r = await fetch(consultaDeSugestoes(latitude, longitude))
      if (!r.ok) throw new Error(`Overpass ${r.status}`)
      setLista(sugestoesDaResposta(await r.json(), latitude, longitude, jaSalvos))
      setEstado('parado')
    } catch (e) {
      console.error('Erro ao buscar sugestões:', e)
      setEstado('erro')
    }
  }

  async function salvar(s: Sugestao) {
    setSalvando(s.id)
    try {
      await aoSalvar(s)
      setLista((atual) => (atual ?? []).filter((x) => x.id !== s.id))
    } catch (e) {
      console.error('Erro ao salvar sugestão:', e)
    }
    setSalvando(null)
  }

  if (!lista)
    return (
      <div className="sugestoes">
        <button type="button" className="botao-texto" onClick={buscar} disabled={estado === 'buscando'}>
          <Sparkles size={15} aria-hidden="true" /> {estado === 'buscando' ? 'Procurando…' : `Sugestões em ${destino.nome}`}
        </button>
        {estado === 'erro' && <p className="form-dica">Não deu pra buscar agora (o serviço do mapa pode estar cheio). Tente de novo daqui a pouco.</p>}
      </div>
    )

  return (
    <div className="sugestoes">
      <p className="form-dica">
        <Sparkles size={14} aria-hidden="true" /> Conhecidos perto de {destino.nome} (OpenStreetMap)
      </p>
      {lista.length === 0 ? (
        <p className="form-dica">Nada de novo por aqui: vocês já salvaram os mais conhecidos.</p>
      ) : (
        <ul className="sugestoes-lista">
          {lista.map((s) => (
            <li key={s.id}>
              <span className="sugestoes-texto">
                {s.nome}
                <small>
                  {NOMES[s.tipo]} · {textoDaDistancia(s.metros)} do centro
                  {s.wikipedia && (
                    <>
                      {' '}
                      ·{' '}
                      <a href={s.wikipedia} target="_blank" rel="noreferrer">
                        Wikipédia <ExternalLink size={11} aria-hidden="true" />
                      </a>
                    </>
                  )}
                </small>
              </span>
              <button type="button" className="botao secundario pequeno" disabled={salvando === s.id} onClick={() => salvar(s)}>
                <Plus size={14} aria-hidden="true" /> Salvar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const NOMES: Record<Sugestao['tipo'], string> = { museu: 'Museu', mirante: 'Mirante', atracao: 'Atração', historico: 'Histórico' }
