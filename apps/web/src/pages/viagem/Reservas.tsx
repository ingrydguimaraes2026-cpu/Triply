import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { AbaAtivaContexto, useAbaAtiva } from '../../features/viagens/hooks'
import Transportes from './Transportes'
import Hospedagem from './Hospedagem'
import TituloDaTela from '../../components/ui/TituloDaTela'
import './viagem-tela.css'

// Reservas (igual à aba do app, apps/mobile/app/viagem/[id]/(abas)/reservas.tsx):
// Passagens e Hospedagem num lugar só, trocando pelas duas pílulas em cima.
// Endereço: /viagem/<id>/reservas[?parte=hospedagem]. Os antigos /transportes e /hospedagem caem aqui.
type Parte = 'transporte' | 'hospedagem'
const PARTES: { chave: Parte; nome: string }[] = [
  { chave: 'transporte', nome: 'Transporte' },
  { chave: 'hospedagem', nome: 'Hospedagem' },
]

export default function Reservas() {
  const ativa = useAbaAtiva()
  const [busca, setBusca] = useSearchParams()
  const daUrl = busca.get('parte')
  const pedida: Parte | null = daUrl === 'hospedagem' ? 'hospedagem' : daUrl === 'transporte' ? 'transporte' : null
  // A tela fica guardada ao trocar de aba: lembra a parte aberta e só segue o endereço quando está na frente
  const [parte, setParte] = useState<Parte>(pedida ?? 'transporte')
  if (ativa && pedida && pedida !== parte) setParte(pedida)
  // Cada parte só carrega na primeira vez que abre; depois fica guardada (o mapa não carrega de novo)
  const [abertas, setAbertas] = useState<Parte[]>([parte])
  if (!abertas.includes(parte)) setAbertas([...abertas, parte])

  function trocar(nova: Parte) {
    setParte(nova)
    const b = new URLSearchParams(busca)
    b.set('parte', nova)
    setBusca(b, { replace: true })
  }

  return (
    <div className="reservas">
      <TituloDaTela titulo="Reservas" />
      <div className="reservas-pilulas" role="tablist" aria-label="Reservas">
        {PARTES.map((p) => (
          <button key={p.chave} type="button" role="tab" aria-selected={parte === p.chave} className={parte === p.chave ? 'ativa' : undefined} onClick={() => trocar(p.chave)}>
            {p.nome}
          </button>
        ))}
      </div>
      {PARTES.filter((p) => abertas.includes(p.chave)).map((p) => (
        <AbaAtivaContexto.Provider key={p.chave} value={ativa && parte === p.chave}>
          <div className="reservas-parte" hidden={parte !== p.chave}>{p.chave === 'transporte' ? <Transportes naAba /> : <Hospedagem naAba />}</div>
        </AbaAtivaContexto.Provider>
      ))}
    </div>
  )
}
