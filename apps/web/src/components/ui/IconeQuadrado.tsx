import type { LucideIcon } from './icones'

// Quadradinho bege com ícone (atalhos, itens de lista), igual ao do app.
// Uso: <IconeQuadrado icone={Wallet} /> ou <IconeQuadrado icone={Bed} tamanho={48} />

type Props = { icone: LucideIcon; tamanho?: number }

export default function IconeQuadrado({ icone: Icone, tamanho = 40 }: Props) {
  return (
    <span className="icone-quadrado" style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.3 }} aria-hidden="true">
      <Icone size={Math.round(tamanho * 0.48)} />
    </span>
  )
}
