import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { PASSOS_DO_TOUR, pedacosDaFala, tamanhoDaFala, type AlvoDoTour } from '@together/core'
import Norti, { type Humor } from '../../components/ui/Norti'
import { jaViu, marcarVisto } from './guardado'
import './tour.css'

// Tour guiado da viagem, com cara de jogo (versão aprovada pelo Victor em 10/11/2026 no protótipo
// docs/design/direcao-redesenho/tour-jogo.html). Igual ao do app (apps/mobile/src/ui/tour/Tour.tsx).
// - A Norti fala numa caixa de diálogo; o texto aparece letra por letra.
// - Toque (ou Enter) em qualquer lugar pra seguir; tocar enquanto ela escreve mostra a frase inteira.
// - Passo de fazer ("Toque em Roteiro"): só a peça acesa recebe o toque; o tour anda quando a aba
//   abre de verdade (olhando o endereço). Tocou fora: a parte acesa balança e a Norti faz "ops".
// - O foco desliza de uma peça pra outra e segue a peça se ela mexer (aba entrando, tela rolando).
// Falas no @together/core (PASSOS_DO_TOUR). A peça que acende tem data-tour="<alvo>".
// Pra ver de novo: verTourDeNovo() (./guardado).

const FOLGA = 4
const RAIO = 18
const ESPERA_DA_ABA = 420 // a aba nova entra subindo (.aba-entra, 420 ms): mede depois
const ESPERA_MAXIMA = 1800 // a peça pode demorar a desenhar: espera por até 1,8 s
const LETRA_MS = 26 // velocidade da "máquina de escrever"

type Retangulo = { left: number; top: number; right: number; bottom: number }

function visivel(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const naTela = r.bottom > 0 && r.top < window.innerHeight
  return r.width > 0 && r.height > 0 && naTela && getComputedStyle(el).visibility !== 'hidden'
}

// Onde está a peça desse alvo:
// - data-tour="<alvo>": a primeira visível (a mesma aba pode estar na barra do celular e no menu do computador);
// - data-tour-junto="<alvo>": a soma de várias peças. É a "barra": as 5 partes da viagem. No computador o
//   menu tem mais coisa embaixo ("Tudo da viagem"), e acender o menu inteiro não batia com a fala.
function pecaDo(alvo: AlvoDoTour): Retangulo | null {
  const juntas = [...document.querySelectorAll<HTMLElement>(`[data-tour-junto="${alvo}"]`)].filter(visivel)
  if (juntas.length) {
    const rs = juntas.map((el) => el.getBoundingClientRect())
    return {
      left: Math.min(...rs.map((r) => r.left)),
      top: Math.min(...rs.map((r) => r.top)),
      right: Math.max(...rs.map((r) => r.right)),
      bottom: Math.max(...rs.map((r) => r.bottom)),
    }
  }
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${alvo}"]`)) {
    if (visivel(el)) return el.getBoundingClientRect()
  }
  return null
}

type Caixa = { x: number; y: number; w: number; h: number }
// O que está na tela: o passo e onde fica a peça dele (null = sem peça, caixa no meio)
type Mostrado = { passo: number; caixa: Caixa | null }

function caixaDe(r: Retangulo): Caixa {
  const esq = Math.max(4, r.left - FOLGA)
  const topo = Math.max(4, r.top - FOLGA)
  const dir = Math.min(window.innerWidth - 4, r.right + FOLGA)
  const fim = Math.min(window.innerHeight - 4, r.bottom + FOLGA)
  return { x: esq, y: topo, w: dir - esq, h: fim - topo }
}

const igual = (a: Caixa | null, b: Caixa | null) =>
  a === b ||
  (!!a &&
    !!b &&
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.w - b.w) < 0.5 &&
    Math.abs(a.h - b.h) < 0.5)

// Aba aberta agora, pelo endereço: /viagem/<id>/<aba>
function abaDo(caminho: string) {
  return caminho.split('/')[3] ?? ''
}

const reduzir = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const falaLimpa = (fala: string) => fala.replace(/\*/g, '')

// `pronto`: a tela da viagem já carregou. `aoComecar` e `aoTerminar`: voltam pra aba Viagem.
export default function TourDaViagem({
  pronto,
  usuarioId,
  aoComecar,
  aoTerminar,
}: {
  pronto: boolean
  usuarioId: string // a marca "já viu" é por pessoa (M7)
  aoComecar: () => void
  aoTerminar: () => void
}) {
  // `passo` é onde o tour está; `mostrado` só troca quando a peça do passo foi achada.
  // Assim a fala nova e o foco chegam juntos, e o foco desliza da peça anterior pra nova.
  const [passo, setPasso] = useState<number | null>(null)
  const [mostrado, setMostrado] = useState<Mostrado | null>(null)
  const aba = abaDo(useLocation().pathname)

  // aoComecar muda a cada desenho da tela (o navigate do router não é estável): guardado num ref,
  // senão o relógio recomeçava sem parar e o tour demorava (ou reiniciava no meio)
  const comecar = useRef(aoComecar)
  useEffect(() => {
    comecar.current = aoComecar
  })

  useEffect(() => {
    if (!pronto || jaViu(usuarioId)) return
    const t = setTimeout(() => {
      comecar.current()
      setMostrado(null)
      setPasso(0)
    }, 1100) // depois que o bilhete chegou
    return () => clearTimeout(t)
  }, [pronto, usuarioId])

  // Passo de tocar: a pessoa abriu a aba certa, então anda
  useEffect(() => {
    if (passo === null) return
    if (PASSOS_DO_TOUR[passo].tocar === aba) setPasso(passo + 1)
  }, [aba, passo])

  // Acha a peça do passo e segue ela
  useEffect(() => {
    if (passo === null) return
    const alvo = PASSOS_DO_TOUR[passo].alvo
    const mostrar = (caixa: Caixa | null) =>
      setMostrado((antes) => (antes && antes.passo === passo && igual(antes.caixa, caixa) ? antes : { passo, caixa }))
    if (!alvo) {
      mostrar(null)
      return
    }
    // O foco segue a peça quadro a quadro enquanto o passo está na tela: botões chegam com animação e
    // a tela pode rolar. Depois de trocar de aba, espera a aba entrar antes de começar.
    let achou = false
    let quadro = 0
    let reserva: ReturnType<typeof setInterval> | undefined
    let comeco = 0
    const seguir = () => {
      const r = pecaDo(alvo)
      if (r) {
        achou = true
        mostrar(caixaDe(r))
      } else if (!achou && performance.now() - comeco > ESPERA_MAXIMA) {
        mostrar(null) // a peça não apareceu: caixa no meio, sem foco
      }
    }
    const porQuadro = () => {
      seguir()
      quadro = requestAnimationFrame(porQuadro)
    }
    const trocouDeAba = passo > 0 && Boolean(PASSOS_DO_TOUR[passo - 1].tocar)
    const espera = setTimeout(
      () => {
        comeco = performance.now()
        seguir()
        quadro = requestAnimationFrame(porQuadro)
        // Reserva: com a aba em segundo plano o navegador para os quadros; o relógio continua medindo
        reserva = setInterval(seguir, 150)
      },
      trocouDeAba ? ESPERA_DA_ABA : 0,
    )
    return () => {
      clearTimeout(espera)
      cancelAnimationFrame(quadro)
      clearInterval(reserva)
    }
  }, [passo])

  const fechar = useCallback(() => {
    setPasso(null)
    setMostrado(null)
    marcarVisto(usuarioId)
    aoTerminar()
  }, [aoTerminar, usuarioId])

  const avancar = useCallback(() => {
    if (passo === null) return
    if (passo >= PASSOS_DO_TOUR.length - 1) return fechar()
    setPasso(passo + 1)
  }, [passo, fechar])

  if (passo === null || !mostrado) return null
  return (
    <Cortina
      passo={mostrado.passo}
      caixa={mostrado.caixa}
      esperando={passo !== mostrado.passo}
      aoAvancar={avancar}
      aoFechar={fechar}
    />
  )
}

function Cortina({
  passo,
  caixa,
  esperando,
  aoAvancar,
  aoFechar,
}: {
  passo: number
  caixa: Caixa | null
  esperando: boolean // a aba nova está entrando: a fala anterior fica parada na tela
  aoAvancar: () => void
  aoFechar: () => void
}) {
  const p = PASSOS_DO_TOUR[passo]
  const ultimo = passo === PASSOS_DO_TOUR.length - 1
  const total = PASSOS_DO_TOUR.length
  const fazer = Boolean(p.tocar && caixa)
  const mostrarFazer = fazer && !esperando

  // Tamanho da janela (a caixa de diálogo muda de lado conforme a peça)
  const [tela, setTela] = useState({ W: window.innerWidth, H: window.innerHeight })
  useEffect(() => {
    const mudou = () => setTela({ W: window.innerWidth, H: window.innerHeight })
    window.addEventListener('resize', mudou)
    return () => window.removeEventListener('resize', mudou)
  }, [])
  const { W, H } = tela

  // ---- Fala letra por letra
  const pedacos = useMemo(() => pedacosDaFala(p.fala), [p.fala])
  const letrasDaFala = tamanhoDaFala(pedacos)
  const [letras, setLetras] = useState(0)
  const relogio = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  useEffect(() => {
    if (reduzir()) {
      setLetras(letrasDaFala)
      return
    }
    setLetras(0)
    relogio.current = setInterval(() => setLetras((n) => n + 1), LETRA_MS)
    return () => clearInterval(relogio.current)
  }, [passo, letrasDaFala])
  const digitando = letras < letrasDaFala
  useEffect(() => {
    if (!digitando) clearInterval(relogio.current)
  }, [digitando])
  const podeSeguir = !digitando && !p.tocar && !esperando

  // ---- A Norti pula a cada fala (e quando a pessoa erra)
  const [humor, setHumor] = useState<Humor>(p.humor)
  const retrato = useRef<HTMLSpanElement>(null)
  const pular = useCallback(() => {
    if (reduzir()) return
    retrato.current?.animate(
      [
        { transform: 'translateY(10px) scale(0.9, 1.08)' },
        { transform: 'translateY(-8px) scale(1.04, 0.96)' },
        { transform: 'none' },
      ],
      { duration: 500, easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)' },
    )
  }, [])
  useEffect(() => {
    setHumor(p.humor)
    pular()
  }, [passo, p.humor, pular])

  // ---- Tocou fora no passo de fazer: a parte acesa balança e a Norti faz "ops"
  const foco = useRef<HTMLDivElement>(null)
  const voltaDoOps = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(voltaDoOps.current), [])
  const errou = () => {
    setHumor('ops')
    pular()
    clearTimeout(voltaDoOps.current)
    voltaDoOps.current = setTimeout(() => setHumor(p.humor), 900)
    if (reduzir()) return
    foco.current?.animate(
      ['0', '-6px', '6px', '-4px', '3px', '0'].map((x) => ({ transform: `translateX(${x})` })),
      { duration: 420 },
    )
  }

  // ---- Fim: some devagar e só então fecha
  const [saindo, setSaindo] = useState(false)
  const sair = () => {
    if (reduzir()) return aoAvancar()
    setSaindo(true)
    setTimeout(aoAvancar, 260)
  }

  const aoTocar = () => {
    if (esperando || saindo) return
    if (digitando) return setLetras(letrasDaFala) // mostra a frase inteira
    if (p.tocar && caixa) return errou()
    if (ultimo) return sair()
    aoAvancar()
  }
  const tocar = useRef(aoTocar)
  useEffect(() => {
    tocar.current = aoTocar
  })

  // Teclado: Enter, espaço ou seta pra direita seguem; Esc fecha o tour
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault()
        tocar.current()
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aoFechar])

  // ---- Caixa de diálogo: do lado oposto ao foco (peça embaixo → caixa em cima)
  const caixaDoDialogo = useRef<HTMLDivElement>(null)
  const [altura, setAltura] = useState(0)
  useLayoutEffect(() => {
    setAltura(caixaDoDialogo.current?.offsetHeight ?? 0)
  }, [passo, W])
  // Só desliza depois de já estar no lugar (senão a caixa entrava escorregando do meio da tela)
  const [desliza, setDesliza] = useState(false)
  useEffect(() => {
    if (!altura || desliza) return
    const q = requestAnimationFrame(() => setDesliza(true))
    return () => cancelAnimationFrame(q)
  }, [altura, desliza])
  const embaixo = caixa ? caixa.y + caixa.h / 2 > H * 0.5 : false
  const topo = embaixo ? 14 : caixa ? H - 18 - altura : (H - altura) / 2

  // Sem peça: o foco vira um ponto no meio (a tela fica toda escura)
  const f = caixa ?? { x: W / 2, y: H / 2, w: 0, h: 0 }
  const raio = caixa ? Math.min(RAIO, caixa.h / 2) : 0

  // Fala: o que já "foi escrito" aparece, o resto fica invisível (a caixa não muda de tamanho)
  const fala = pedacos.map((pd, i) => {
    const antes = tamanhoDaFala(pedacos.slice(0, i)) // letras dos pedaços anteriores
    const vistas = Math.min(Math.max(letras - antes, 0), pd.texto.length)
    const Tag = pd.destaque ? 'em' : 'span'
    return (
      <Tag key={i}>
        {pd.texto.slice(0, vistas)}
        <span className="tour-falta">{pd.texto.slice(vistas)}</span>
      </Tag>
    )
  })

  return (
    <div className={saindo ? 'tour saindo' : 'tour'} role="dialog" aria-modal="true" aria-label="Tour da viagem">
      {/* Toques. Normal: a tela toda segue. Passo de fazer: a peça acesa deixa o toque passar pra aba de
          verdade; em volta, tocar faz a parte acesa balançar. */}
      {fazer && caixa ? (
        <>
          <div className="tour-bloqueio" onClick={aoTocar} style={{ left: 0, top: 0, width: W, height: caixa.y }} />
          <div className="tour-bloqueio" onClick={aoTocar} style={{ left: 0, top: caixa.y + caixa.h, width: W, bottom: 0 }} />
          <div className="tour-bloqueio" onClick={aoTocar} style={{ left: 0, top: caixa.y, width: caixa.x, height: caixa.h }} />
          <div
            className="tour-bloqueio"
            onClick={aoTocar}
            style={{ left: caixa.x + caixa.w, top: caixa.y, right: 0, height: caixa.h }}
          />
        </>
      ) : (
        <div className="tour-bloqueio" onClick={aoTocar} style={{ inset: 0 }} />
      )}

      <div
        ref={foco}
        className={['tour-foco', !caixa && 'sem-peca', mostrarFazer && 'tocar'].filter(Boolean).join(' ')}
        style={{ left: f.x, top: f.y, width: f.w, height: f.h, borderRadius: raio }}
        aria-hidden="true"
      />

      {/* Seta quicando em cima da peça, no passo de fazer */}
      <span
        className="tour-dedo"
        style={{ left: f.x + f.w / 2 - 13, top: f.y - 32, opacity: mostrarFazer ? 1 : 0 }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22 3 10h6V2h6v8h6z" />
        </svg>
      </span>

      {ultimo && <Confete />}

      {/* Caixa de diálogo de jogo */}
      <div
        ref={caixaDoDialogo}
        className={desliza ? 'tour-dialogo desliza' : 'tour-dialogo'}
        style={{ top: topo, visibility: altura ? 'visible' : 'hidden' }}>
        <button type="button" className="tour-caixa" onClick={aoTocar} aria-label={falaLimpa(p.fala)} autoFocus>
          <span className="tour-retrato" ref={retrato} aria-hidden="true">
            <Norti humor={humor} tamanho={88} sombra={false} chegar={false} />
          </span>
          <span className="tour-nome" aria-hidden="true">
            Norti
          </span>
          <span className="tour-fala" aria-live="polite">
            {fala}
          </span>
          <span className="tour-pe" aria-hidden="true">
            <span>
              {passo + 1}/{total}
            </span>
            {podeSeguir && (
              <span className="tour-seguir">
                toque pra seguir <i />
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

// Confete caindo pela tela toda (o fim do tour)
const CORES_DO_CONFETE = ['var(--laranja)', 'var(--creme)', 'var(--caramelo)', 'var(--couro)', 'var(--cor-sucesso)', 'var(--dourado-claro)']
function Confete() {
  return (
    <div className="tour-confete" aria-hidden="true">
      {Array.from({ length: 40 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 29) % 100}%`,
            background: CORES_DO_CONFETE[i % CORES_DO_CONFETE.length],
            animationDelay: `${(i % 8) * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}
