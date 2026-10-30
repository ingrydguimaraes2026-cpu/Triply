import { useEffect, useState } from 'react'
import { Globe2 } from 'lucide-react'
import { estatisticasDoViajante, type Estatisticas } from '@together/core'
import { supabase } from '../../lib/supabase'
import { hojeTexto } from '../destinos/datas'
import { codigoDoPais, nomeDoPais } from '../documentos/paises'
import MapaMundi from '../mapa/MapaMundi'
import './onde-ja-fui.css'

// Mapa de onde já fui (N5) e estatísticas do viajante (N6), spec 102.
// Junta as viagens que já começaram. Os países com cidade visitada acendem no mapa.
export default function OndeJaFui() {
  const [e, setE] = useState<Estatisticas | null>(null)

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase.from('viagens').select('id, nome, data_inicio, data_fim'),
      supabase.from('destinos').select('viagem_id, nome, pais, latitude, longitude, ordem'),
    ]).then(([v, d]) => {
      if (!ativo || v.error || d.error) return
      const destinos = (d.data ?? []).map((x) => ({ ...x, codigo: codigoDoPais(x.pais) }))
      setE(estatisticasDoViajante(v.data ?? [], destinos, hojeTexto()))
    })
    return () => {
      ativo = false
    }
  }, [])

  if (!e || e.viagens === 0) return null
  const numero = (n: number) => n.toLocaleString('pt-BR')

  return (
    <section className="cartao-ui onde-ja-fui">
      <h2>
        <Globe2 size={18} aria-hidden="true" /> Onde já fui
      </h2>
      {e.pontos.length > 0 && (
        <div className="onde-ja-fui-mapa">
          <MapaMundi pontos={e.pontos} numerar={false} ligar={false} zoomMaximo={4} />
        </div>
      )}
      <dl className="onde-ja-fui-numeros">
        <div>
          <dt>viagens</dt>
          <dd>{numero(e.viagens)}</dd>
        </div>
        <div>
          <dt>{e.paises.length === 1 ? 'país' : 'países'}</dt>
          <dd>{numero(e.paises.length)}</dd>
        </div>
        <div>
          <dt>cidades</dt>
          <dd>{numero(e.cidades)}</dd>
        </div>
        <div>
          <dt>dias viajando</dt>
          <dd>{numero(e.dias)}</dd>
        </div>
        <div>
          <dt>km entre cidades</dt>
          <dd>{numero(e.km)}</dd>
        </div>
      </dl>
      {e.paises.length > 0 && <p className="form-dica">{e.paises.map(nomeDoPais).join(' · ')}</p>}
    </section>
  )
}
