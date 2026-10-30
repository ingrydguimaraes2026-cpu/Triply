import { useState } from 'react'
import { Navigation } from 'lucide-react'
import { consultaDoLugar, maisPerto, pontoDaResposta, textoDaDistancia, type Tables } from '@together/core'
import type { Lugar } from './regras'
import BotaoIr from '../../components/ui/BotaoIr'

type Destino = Tables<'destinos'>
type ComPonto = { lugar: Lugar; destino: Destino | null; latitude: number; longitude: number }

// Coordenadas achadas no Photon ficam guardadas enquanto a página está aberta
const memoria = new Map<string, { latitude: number; longitude: number } | null>()

async function localizar(lugar: Lugar, destino: Destino | null) {
  if (memoria.has(lugar.id)) return memoria.get(lugar.id)!
  try {
    const r = await fetch(consultaDoLugar(lugar.nome, destino?.nome ?? '', destino?.latitude ?? null, destino?.longitude ?? null))
    const ponto = r.ok ? pontoDaResposta(await r.json()) : null
    memoria.set(lugar.id, ponto)
    return ponto
  } catch {
    return null
  }
}

// Perto de mim (spec 061 / C8): os lugares salvos mais perto de onde a pessoa está agora
export default function PertoDeMim({ lugares, destinos }: { lugares: Lugar[]; destinos: Destino[] }) {
  const [lista, setLista] = useState<(ComPonto & { metros: number })[] | null>(null)
  const [estado, setEstado] = useState<'parado' | 'buscando' | 'sem-local' | 'erro'>('parado')

  function buscar() {
    if (!('geolocation' in navigator)) return setEstado('sem-local')
    setEstado('buscando')
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const candidatos = lugares.filter((l) => !l.visitadoEm).slice(0, 25)
        const achados: ComPonto[] = []
        for (const lugar of candidatos) {
          const destino = destinos.find((d) => d.id === lugar.destinoId) ?? null
          const ponto = await localizar(lugar, destino)
          if (ponto) achados.push({ lugar, destino, ...ponto })
        }
        setLista(maisPerto(achados, p.coords.latitude, p.coords.longitude).slice(0, 8))
        setEstado('parado')
      },
      () => setEstado('sem-local'),
      { timeout: 10000, maximumAge: 120000 },
    )
  }

  return (
    <div className="perto-de-mim">
      <button type="button" className="botao secundario pequeno" onClick={buscar} disabled={estado === 'buscando' || lugares.length === 0}>
        <Navigation size={15} aria-hidden="true" /> {estado === 'buscando' ? 'Procurando…' : 'Perto de mim'}
      </button>
      {estado === 'sem-local' && <p className="dica">Sem a sua localização. Libere o acesso à localização no navegador.</p>}
      {lista && lista.length === 0 && <p className="dica">Nenhum lugar salvo num raio de 50 km (ou não deu pra achar no mapa).</p>}
      {lista && lista.length > 0 && (
        <ul className="perto-lista">
          {lista.map((x) => (
            <li key={x.lugar.id}>
              <span>
                <strong>{textoDaDistancia(x.metros)}</strong> {x.lugar.nome}
              </span>
              <BotaoIr alvo={{ nome: x.lugar.nome, latitude: x.latitude, longitude: x.longitude }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
