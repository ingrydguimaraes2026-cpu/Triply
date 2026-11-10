import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { PASSOS_DO_TOUR, type AlvoDoTour } from '@together/core'
import Norti from '../../components/ui/Norti'
import { jaViu, marcarVisto } from './guardado'
import './tour.css'

// Tour guiado da viagem (tutorial "de videogame"), igual ao do app (apps/mobile/src/ui/tour/Tour.tsx).
// Refeito em 10/11/2026: em vez de ficar na tela principal, a Norti leva a pessoa por cada aba.
// - Passo de "tocar" (ex.: "Toque em Roteiro"): só a peça acesa recebe o toque; o tour anda quando
//   a aba abre de verdade (olhando o endereço).
// - Passo de explicar: acende a peça principal DENTRO da aba (dias, troca, "Lançar gasto", "Publicar").
// Textos no @together/core (PASSOS_DO_TOUR). A peça que acende tem data-tour="<alvo>".
// Pra ver de novo: verTourDeNovo() (./guardado).

const FOLGA = 6
const ESPERA_MAXIMA = 1800 // a aba nova pode demorar a desenhar: espera a peça por até 1,8 s

// Primeira peça visível com esse alvo (a mesma aba pode estar na barra do celular e no menu do computador)
function pecaDo(alvo: AlvoDoTour): DOMRect | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${alvo}"]`)) {
    const r = el.getBoundingClientRect()
    const naTela = r.bottom > 0 && r.top < window.innerHeight
    if (r.width > 0 && r.height > 0 && naTela && getComputedStyle(el).visibility !== 'hidden') return r
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

// Aba aberta agora, pelo endereço: /viagem/<id>/<aba>
function abaDo(caminho: string) {
  return caminho.split('/')[3] ?? ''
}

// `pronto`: a tela da viagem já carregou. `aoComecar` e `aoTerminar`: voltam pra aba Viagem.
export default function TourDaViagem({
  pronto,
  aoComecar,
  aoTerminar,
}: {
  pronto: boolean
  aoComecar: () => void
  aoTerminar: () => void
}) {
  const [passo, setPasso] = useState<number | null>(null)
  // undefined = medindo (não mostra nada ainda), null = sem peça (balão no meio)
  const [caixa, setCaixa] = useState<Caixa | null | undefined>(undefined)
  const aba = abaDo(useLocation().pathname)

  // aoComecar muda a cada desenho da tela (o navigate do router não é estável): guardado num ref,
  // senão o relógio recomeçava sem parar e o tour demorava (ou reiniciava no meio)
  const comecar = useRef(aoComecar)
  useEffect(() => {
    comecar.current = aoComecar
  })

  useEffect(() => {
    if (!pronto || jaViu()) return
    const t = setTimeout(() => {
      comecar.current()
      setPasso(0)
    }, 1100) // depois que o bilhete chegou
    return () => clearTimeout(t)
  }, [pronto])

  // Passo de tocar: a pessoa abriu a aba certa, então anda
  useEffect(() => {
    if (passo === null) return
    if (PASSOS_DO_TOUR[passo].tocar === aba) {
      setCaixa(undefined)
      setPasso(passo + 1)
    }
  }, [aba, passo])

  // Mede a peça do passo e segue ela
  useEffect(() => {
    if (passo === null) return
    const alvo = PASSOS_DO_TOUR[passo].alvo
    if (!alvo) {
      setCaixa(null)
      return
    }
    // O foco segue a peça quadro a quadro enquanto o passo está na tela: a aba nova entra subindo
    // (.aba-entra), os botões chegam com animação e a tela pode rolar. Medir uma vez só deixava o
    // foco torto. Só muda o estado quando a peça mexeu de verdade.
    const comeco = performance.now()
    let achou = false
    let quadro = 0
    const seguir = () => {
      const r = pecaDo(alvo)
      if (r) {
        achou = true
        const c = caixaDe(r)
        setCaixa((antes) =>
          antes &&
          Math.abs(antes.x - c.x) < 0.5 &&
          Math.abs(antes.y - c.y) < 0.5 &&
          Math.abs(antes.w - c.w) < 0.5 &&
          Math.abs(antes.h - c.h) < 0.5
            ? antes
            : c,
        )
      } else if (!achou && performance.now() - comeco > ESPERA_MAXIMA) {
        setCaixa(null) // a peça não apareceu: balão no meio, sem foco
      }
    }
    const porQuadro = () => {
      seguir()
      quadro = requestAnimationFrame(porQuadro)
    }
    seguir()
    quadro = requestAnimationFrame(porQuadro)
    // Reserva: com a aba em segundo plano o navegador para os quadros; o relógio continua medindo
    const reserva = setInterval(seguir, 150)
    return () => {
      cancelAnimationFrame(quadro)
      clearInterval(reserva)
    }
  }, [passo])

  const fechar = useCallback(() => {
    setPasso(null)
    setCaixa(undefined)
    marcarVisto()
    aoTerminar()
  }, [aoTerminar])

  const avancar = useCallback(() => {
    if (passo === null) return
    if (passo >= PASSOS_DO_TOUR.length - 1) return fechar()
    setCaixa(undefined)
    setPasso(passo + 1)
  }, [passo, fechar])

  // Esc pula o tour
  useEffect(() => {
    if (passo === null) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [passo, fechar])

  if (passo === null || caixa === undefined) return null
  const p = PASSOS_DO_TOUR[passo]
  const ultimo = passo === PASSOS_DO_TOUR.length - 1
  // Passo de tocar com a peça na tela: só ela recebe o toque, o resto fica bloqueado
  const fazer = Boolean(p.tocar && caixa)
  const W = window.innerWidth
  const H = window.innerHeight
  // Sem peça: o foco vira um ponto no meio (a tela fica toda escura)
  const foco = caixa ?? { x: W / 2, y: H / 2, w: 0, h: 0 }
  // Balão do lado que tem mais espaço: peça embaixo → balão em cima, e vice-versa
  const lugar = !caixa
    ? { top: Math.max(24, H / 2 - 110) }
    : caixa.y + caixa.h / 2 > H / 2
      ? { bottom: H - caixa.y + 14 }
      : { top: caixa.y + caixa.h + 14 }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-titulo">
      {fazer && caixa ? (
        // Quatro bloqueios em volta do buraco: o toque na peça passa, o resto não
        <>
          <div className="tour-bloqueio" style={{ left: 0, top: 0, width: W, height: caixa.y }} />
          <div className="tour-bloqueio" style={{ left: 0, top: caixa.y + caixa.h, width: W, bottom: 0 }} />
          <div className="tour-bloqueio" style={{ left: 0, top: caixa.y, width: caixa.x, height: caixa.h }} />
          <div
            className="tour-bloqueio"
            style={{ left: caixa.x + caixa.w, top: caixa.y, right: 0, height: caixa.h }}
          />
        </>
      ) : (
        <div className="tour-bloqueio" style={{ inset: 0 }} />
      )}
      <div
        className={caixa ? (fazer ? 'tour-foco tocar' : 'tour-foco') : 'tour-foco sem-peca'}
        style={{ left: foco.x, top: foco.y, width: foco.w, height: foco.h }}
        aria-hidden="true"
      />
      <div key={passo} className="tour-balao" style={lugar} aria-live="polite">
        <div className="tour-balao-topo">
          <Norti humor={p.humor} tamanho={58} sombra={false} chegar={false} />
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
          {!fazer && (
            <button type="button" className="tour-proximo" onClick={avancar} autoFocus>
              {passo === 0 ? 'Bora' : ultimo ? 'Começar' : 'Próximo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
