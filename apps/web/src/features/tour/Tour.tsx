import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { PASSOS_DO_TOUR, type AlvoDoTour } from '@together/core'
import Norti from '../../components/ui/Norti'
import { jaViu, marcarVisto } from './guardado'
import './tour.css'

// Tour guiado da viagem (tutorial "de videogame", pedido do Victor em 10/11/2026), igual ao do app
// (apps/mobile/src/ui/tour/Tour.tsx). Na primeira vez que a pessoa abre uma viagem, a tela escurece,
// a peça do passo fica acesa (o foco anda de uma pra outra) e a Norti explica num balão.
// Textos no @together/core (PASSOS_DO_TOUR).
//
// A peça que acende ganha o atributo data-tour="<alvo>" (ex.: data-tour="galera").
// Passo cuja peça não está na tela (ou está escondida) é pulado. Pra ver de novo: verTourDeNovo() (./guardado).

const FOLGA = 6

// Primeira peça visível com esse alvo (a mesma aba pode estar na barra do celular e no menu do computador)
function pecaDo(alvo: AlvoDoTour): DOMRect | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${alvo}"]`)) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return r
  }
  return null
}

type Caixa = { x: number; y: number; w: number; h: number }

function caixaDe(r: DOMRect): Caixa {
  const esq = Math.max(4, r.left - FOLGA)
  const topo = Math.max(4, r.top - FOLGA)
  const dir = Math.min(window.innerWidth - 4, r.right + FOLGA)
  const fim = Math.min(window.innerHeight - 4, r.bottom + FOLGA)
  return { x: esq, y: topo, w: dir - esq, h: fim - topo }
}

// `pronto`: a tela da viagem já carregou (aí o tour pode começar). `aoComecar`: volta pra aba Viagem.
export default function TourDaViagem({ pronto, aoComecar }: { pronto: boolean; aoComecar: () => void }) {
  const [passo, setPasso] = useState<number | null>(null)
  const [caixa, setCaixa] = useState<Caixa | null>(null)

  useEffect(() => {
    if (!pronto || jaViu()) return
    const t = setTimeout(() => {
      aoComecar()
      setPasso(0)
    }, 1100) // depois que o bilhete chegou
    return () => clearTimeout(t)
  }, [pronto, aoComecar])

  // Mede a peça do passo, e de novo se a tela mudar de tamanho ou rolar
  useLayoutEffect(() => {
    if (passo === null) return
    const alvo = PASSOS_DO_TOUR[passo].alvo
    const medir = () => {
      const r = alvo ? pecaDo(alvo) : null
      setCaixa(r ? caixaDe(r) : null)
    }
    medir()
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [passo])

  const fechar = useCallback(() => {
    setPasso(null)
    setCaixa(null)
    marcarVisto()
  }, [])

  const avancar = useCallback(() => {
    if (passo === null) return
    for (let i = passo + 1; i < PASSOS_DO_TOUR.length; i++) {
      const alvo = PASSOS_DO_TOUR[i].alvo
      if (!alvo || pecaDo(alvo)) return setPasso(i)
    }
    fechar()
  }, [passo, fechar])

  // Esc pula o tour
  useEffect(() => {
    if (passo === null) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [passo, fechar])

  if (passo === null) return null
  const p = PASSOS_DO_TOUR[passo]
  const ultimo = passo === PASSOS_DO_TOUR.length - 1
  // Sem peça: o foco vira um ponto no meio (a tela fica toda escura)
  const foco = caixa ?? { x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0 }
  // Balão do lado que tem mais espaço: peça embaixo → balão em cima, e vice-versa
  const lugar = !caixa
    ? { top: Math.max(24, window.innerHeight / 2 - 110) }
    : caixa.y + caixa.h / 2 > window.innerHeight / 2
      ? { bottom: window.innerHeight - caixa.y + 12 }
      : { top: caixa.y + caixa.h + 12 }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-titulo">
      <div
        className={caixa ? 'tour-foco' : 'tour-foco sem-peca'}
        style={{ left: foco.x, top: foco.y, width: foco.w, height: foco.h }}
        aria-hidden="true"
      />
      <div key={passo} className="tour-balao" style={lugar} aria-live="polite">
        <div className="tour-balao-topo">
          <Norti humor={p.humor} tamanho={58} sombra={false} />
          <div>
            <h2 id="tour-titulo">{p.titulo}</h2>
            <p>{p.texto}</p>
          </div>
        </div>
        <div className="tour-balao-pe">
          <span className="tour-bolinhas" aria-label={`Passo ${passo + 1} de ${PASSOS_DO_TOUR.length}`}>
            {PASSOS_DO_TOUR.map((_, i) => (
              <i key={i} className={i === passo ? 'atual' : i < passo ? 'feito' : undefined} />
            ))}
          </span>
          {!ultimo && (
            <button type="button" className="tour-pular" onClick={fechar}>
              Pular
            </button>
          )}
          <button type="button" className="tour-proximo" onClick={avancar} autoFocus>
            {passo === 0 ? 'Bora' : ultimo ? 'Começar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}
