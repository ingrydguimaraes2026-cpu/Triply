import { ExternalLink, Hospital, Landmark, Phone } from 'lucide-react'
import { destinoDoDia, linkConsuladoDoBrasil, linkHospitalPerto, numerosDeEmergencia, type Tables } from '@together/core'
import { codigoDoPais } from '../documentos/paises'
import { hojeTexto } from '../destinos/datas'
import SeguroDaViagem from './SeguroViagem'
import type { Membro } from '../viagens/hooks'
import './emergencia.css'

type Destino = Tables<'destinos'>

// Emergência (spec 037): números do país onde o comboio está + hospital perto + consulado do Brasil.
// Tudo vem junto com o app (funciona sem internet, menos os links de busca).
type Seguro = { viagemId: string; meuId: string; euSouAdm: boolean; membros: Membro[]; inicio: string | null; fim: string | null }

export default function Emergencia({ destinos, seguro }: { destinos: Destino[]; seguro?: Seguro }) {
  const hoje = hojeTexto()
  // Onde estamos hoje; fora das datas, o primeiro destino; e os outros países do roteiro embaixo
  const atual = destinoDoDia(hoje, destinos) ?? destinos[0]
  const paises: { codigo: string | null; nome: string | null; destino: Destino }[] = []
  for (const d of atual ? [atual, ...destinos.filter((x) => x.id !== atual.id)] : destinos) {
    const codigo = codigoDoPais(d.pais)
    if (paises.some((p) => (p.codigo ?? p.nome) === (codigo ?? d.pais))) continue
    paises.push({ codigo, nome: d.pais, destino: d })
  }

  if (paises.length === 0) {
    const { numeros } = numerosDeEmergencia(null)
    return (
      <div className="emergencia">
        <ListaDeNumeros numeros={numeros} />
        {seguro && <SeguroDaViagem {...seguro} />}
      </div>
    )
  }

  return (
    <div className="emergencia">
      {paises.map((p, i) => {
        const { numeros, conferido } = numerosDeEmergencia(p.codigo)
        return (
          <section key={p.destino.id} className={i === 0 ? 'emergencia-pais atual' : 'emergencia-pais'}>
            <h3>
              {p.nome ?? p.destino.nome}
              {i === 0 && atual && <small> · {atual.chegada && atual.chegada <= hoje ? 'onde vocês estão' : 'primeiro destino'}</small>}
            </h3>
            <ListaDeNumeros numeros={numeros} />
            {!conferido && <p className="dica">Não temos o número deste país. O 112 costuma funcionar; confira com a hospedagem.</p>}
            <div className="emergencia-links">
              <a href={linkHospitalPerto(p.destino)} target="_blank" rel="noreferrer noopener">
                <Hospital size={16} aria-hidden="true" /> Hospital perto de {p.destino.nome} <ExternalLink size={12} aria-hidden="true" />
              </a>
              <a href={linkConsuladoDoBrasil(p.destino.nome, p.nome)} target="_blank" rel="noreferrer noopener">
                <Landmark size={16} aria-hidden="true" /> Consulado do Brasil <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </section>
        )
      })}
      {seguro && <SeguroDaViagem {...seguro} />}
      <p className="dica">Perdeu o passaporte? Procure o consulado do Brasil mais perto e faça um boletim de ocorrência na polícia local.</p>
    </div>
  )
}

function ListaDeNumeros({ numeros }: { numeros: { rotulo: string; numero: string }[] }) {
  return (
    <ul className="emergencia-numeros">
      {numeros.map((n) => (
        <li key={n.numero + n.rotulo}>
          <a href={`tel:${n.numero}`}>
            <Phone size={18} aria-hidden="true" />
            <strong>{n.numero}</strong>
            <span>{n.rotulo}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
