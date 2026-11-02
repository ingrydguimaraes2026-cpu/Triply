import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import MapaMundi from '../../features/mapa/MapaMundi'
import Agulha from './Agulha'
import './sobre-o-mapa.css'

// Tela "cartão creme sobre o mapa escuro" do design Plataforma (spec 113):
// Convite, convite inválido e página 404 usam. A logo leva pra Minhas viagens.
type Props = {
  children: ReactNode
  pontos?: { nome: string; latitude: number; longitude: number }[]
  opacidade?: number // do mapa (1 = forte; o convite usa mais clarinho)
  zoomMaximo?: number
  centralizado?: boolean // conteúdo do cartão no meio (convite inválido e 404)
  className?: string
}

// Logo clara no canto de cima (também usada na Nova viagem)
export function MarcaSobreOMapa() {
  return (
    <Link to="/" className="sobre-mapa-marca" aria-label="Together: ir pro início">
      <span className="sobre-mapa-agulha">
        <Agulha tamanho={36} sombra={false} />
      </span>
      Together
    </Link>
  )
}

export default function SobreOMapa({ children, pontos = [], opacidade = 1, zoomMaximo, centralizado = false, className }: Props) {
  // O mapa enquadra os pontos na parte de cima, acima do cartão
  const areaLivre = useMemo(() => ({ esquerda: 0, topo: 40, direita: 0, baixo: window.innerHeight * 0.5 }), [])
  return (
    <div className={`sobre-mapa ${className ?? ''}`}>
      <div className="sobre-mapa-fundo" style={{ opacity: opacidade }} aria-hidden="true">
        <MapaMundi pontos={pontos} areaLivre={areaLivre} zoomMaximo={zoomMaximo} numerar={false} />
      </div>
      <MarcaSobreOMapa />
      <main className={centralizado ? 'sobre-mapa-cartao centralizado' : 'sobre-mapa-cartao'}>{children}</main>
    </div>
  )
}
