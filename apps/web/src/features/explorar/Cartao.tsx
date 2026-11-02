import { useRef, useState, type PointerEvent } from 'react'
import { Clock, Sun, Ticket } from 'lucide-react'
import { creditoDaFoto, INFO_DO_TIPO, precoLegivel, tempoLegivel, type Escolha, type LugarDoCatalogo } from '@together/core'

// Cartão do Explorar (spec 114). Igual ao protótipo aprovado:
// - o de baixo (`parado`) fica imóvel, do mesmo tamanho e com o mesmo conteúdo;
// - só o de cima arrasta; soltar longe decide; soltar perto volta pro centro;
// - quando o cartão sai, a troca é instantânea (sem animação), pra não "saltar".

const LIMITE_X = 110
const LIMITE_Y = 110

type Props = {
  lugar: LugarDoCatalogo
  parado?: boolean
  voando?: Escolha | null // a tela manda o cartão voar (botão ou teclado)
  aoDecidir?: (e: Escolha) => boolean // false = não aceitou (ex.: já tem 3 "não abro mão"): o cartão volta
  aoVerMais?: () => void
}

export default function Cartao({ lugar, parado, voando, aoDecidir, aoVerMais }: Props) {
  const inicio = useRef<{ x: number; y: number } | null>(null)
  const [arrasto, setArrasto] = useState({ dx: 0, dy: 0, ativo: false })

  const dx = arrasto.dx
  const dy = arrasto.dy
  const transform = voando
    ? { quero: 'translate(560px, 40px) rotate(20deg)', passo: 'translate(-560px, 40px) rotate(-20deg)', nao_abro_mao: 'translate(0, -900px)' }[voando]
    : `translate(${dx}px, ${dy}px) rotate(${(dx / 18).toFixed(2)}deg)`
  const transicao = voando ? 'transform 250ms ease-in' : arrasto.ativo ? 'none' : 'transform 220ms ease-out'
  const forca = (v: number, lim: number) => Math.max(0, Math.min(1, v / lim))
  const opQuero = voando === 'quero' ? 1 : forca(dx, LIMITE_X)
  const opPasso = voando === 'passo' ? 1 : forca(-dx, LIMITE_X)
  const opEstrela = voando === 'nao_abro_mao' ? 1 : forca(-dy, LIMITE_Y) * (1 - forca(Math.abs(dx), 200))

  function aoApertar(e: PointerEvent<HTMLDivElement>) {
    if (parado || voando) return
    inicio.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setArrasto({ dx: 0, dy: 0, ativo: true })
  }
  function aoMover(e: PointerEvent<HTMLDivElement>) {
    if (!inicio.current) return
    setArrasto({ dx: e.clientX - inicio.current.x, dy: Math.min(40, e.clientY - inicio.current.y), ativo: true })
  }
  function aoSoltar() {
    if (!inicio.current) return
    inicio.current = null
    const { dx: x, dy: y } = arrasto
    const escolha: Escolha | null = x > LIMITE_X ? 'quero' : x < -LIMITE_X ? 'passo' : y < -LIMITE_Y ? 'nao_abro_mao' : null
    // Decidiu: o cartão voa de onde foi solto (sem voltar pro centro antes). Não decidiu: volta pro centro.
    const aceito = escolha ? aoDecidir?.(escolha) !== false : false
    setArrasto(aceito ? { dx: x, dy: y, ativo: false } : { dx: 0, dy: 0, ativo: false })
  }

  const info = INFO_DO_TIPO[lugar.tipo] ?? INFO_DO_TIPO.outro
  return (
    <div
      className={parado ? 'exp-cartao parado' : 'exp-cartao'}
      aria-hidden={parado || undefined}
      style={parado ? undefined : { transform, transition: transicao }}
      onPointerDown={aoApertar}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
    >
      <div className="exp-foto">
        {lugar.fotoUrl ? <img src={lugar.fotoUrl} alt={parado ? '' : lugar.nome} draggable={false} /> : <div className="exp-sem-foto">{info.nome}</div>}
        <span className="exp-tag">{info.nome}</span>
        {lugar.fotoUrl && <span className="exp-credito">{creditoDaFoto(lugar.fotoAutor, lugar.fotoLicenca)}</span>}
        {!parado && (
          <>
            <span className="exp-selo quero" style={{ opacity: opQuero }}>QUERO</span>
            <span className="exp-selo passo" style={{ opacity: opPasso }}>PASSO</span>
            <span className="exp-selo estrela" style={{ opacity: opEstrela }}>NÃO ABRO MÃO</span>
          </>
        )}
      </div>
      <div className="exp-info">
        <div>
          <h2>{lugar.nome}</h2>
          {lugar.bairro && <p className="exp-bairro">{lugar.bairro}</p>}
        </div>
        {lugar.porQue && <p className="exp-porque">{lugar.porQue}</p>}
        <div className="exp-chips">
          <span>
            <Clock size={14} aria-hidden="true" /> {tempoLegivel(lugar.tempoMin)}
          </span>
          <span>
            <Ticket size={14} aria-hidden="true" /> {precoLegivel(lugar.gratis)}
          </span>
          {lugar.melhorHora && (
            <span>
              <Sun size={14} aria-hidden="true" /> {lugar.melhorHora}
            </span>
          )}
          {parado ? (
            <span className="exp-vermais">Ver mais</span>
          ) : (
            <button type="button" className="exp-vermais" onPointerDown={(e) => e.stopPropagation()} onClick={aoVerMais}>
              Ver mais
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
