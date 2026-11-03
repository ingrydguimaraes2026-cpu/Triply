import { useState } from 'react'
import { ExternalLink, Plus, Sparkles } from '../../components/ui/icones'
import { INFO_DO_TIPO, sugestoesDoCatalogo, textoDaDistancia, type Sugestao, type Tables } from '@together/core'
import { carregarCatalogo } from '../explorar/api'

// Sugestões de lugares por destino (spec 094): os mais conhecidos do catálogo do Explorar (spec 114).
// Cidade pronta vem do banco; cidade nova a função "explorar-cidade" prepara (pode levar até ~30 s).
// "Salvar" vira um lugar do comboio (tipo passeio), com a coordenada e o link da Wikipédia.
type Props = {
  destino: Tables<'destinos'>
  jaSalvos: string[]
  aoSalvar: (s: Sugestao) => Promise<void>
}
export default function SugestoesDoDestino({ destino, jaSalvos, aoSalvar }: Props) {
  const [lista, setLista] = useState<Sugestao[] | null>(null)
  const [estado, setEstado] = useState<'parado' | 'buscando' | 'preparando' | 'erro'>('parado')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)

  if (destino.latitude == null || destino.longitude == null) return null
  const { latitude, longitude } = destino

  async function buscar() {
    setEstado('buscando')
    try {
      const { lugares } = await carregarCatalogo(destino, () => setEstado('preparando'))
      const doCatalogo = lugares.map((l) => ({ ...l, tipoNome: INFO_DO_TIPO[l.tipo]?.nome ?? 'Atração' }))
      setLista(sugestoesDoCatalogo(doCatalogo, latitude, longitude, jaSalvos))
      setEstado('parado')
    } catch (e) {
      console.error('Erro ao buscar sugestões:', e)
      setErro(e instanceof Error ? e.message : null)
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
        <button type="button" className="botao-texto" onClick={buscar} disabled={estado === 'buscando' || estado === 'preparando'}>
          <Sparkles size={15} aria-hidden="true" /> {estado === 'buscando' ? 'Procurando…' : estado === 'preparando' ? `Preparando ${destino.nome}…` : `Sugestões em ${destino.nome}`}
        </button>
        {estado === 'preparando' && <p className="form-dica">Primeira vez nessa cidade: juntando os lugares (até 30 segundos).</p>}
        {estado === 'erro' && <p className="form-dica">{erro ?? 'Não deu pra buscar agora. Tente de novo daqui a pouco.'}</p>}
      </div>
    )

  return (
    <div className="sugestoes">
      <p className="form-dica">
        <Sparkles size={14} aria-hidden="true" /> Mais conhecidos em {destino.nome} (Wikidata)
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
                  {s.tipo} · {textoDaDistancia(s.metros)} do centro
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
