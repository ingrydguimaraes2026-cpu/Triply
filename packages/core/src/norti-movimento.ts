// Movimentos da Norti (mascote), num lugar só pro app e pro site.
// Veio do mascot.js (skill Mascot Designer): cada "estado" é uma linha do tempo com
// esticar (sx/sy), girar (rot, em graus), andar (tx/ty, em fração do tamanho), a pose (imagem)
// de cada momento e os efeitos (brilho, confete, pontinhos, z, corações).
//
// 10/11/2026, pedido do Victor ("a Norti está toda travada"): parada, pensando, apontando,
// oi, amor e dormindo ganharam movimentos maiores. A parada respira, balança e dá um pulinho no
// fim de cada volta; "pensando" (o carregando) quica e balança a cabeça.
//
// O site usa estes números no <mascot-view> (apps/web/src/components/ui/norti/mascot.js);
// o app usa o MotorDaNorti abaixo (apps/mobile/src/ui/Norti.tsx).

type Curva = 'linear' | 'in' | 'out' | 'inOut'
type Chave = [number, number] | [number, number, Curva]
type Trilhas = Partial<Record<'sx' | 'sy' | 'rot' | 'tx' | 'ty' | 'opacity', Chave[]>>

export type PoseDaNorti = 'idle' | 'blink' | 'wave' | 'think' | 'celebrate' | 'oops' | 'sleep' | 'point' | 'love'
export type EfeitoDaNorti = 'sparkle' | 'confetti' | 'dots' | 'zzz' | 'hearts'
export type EstadoDaNorti = 'idle' | 'appear' | 'hello' | 'think' | 'celebrate' | 'oops' | 'sleep' | 'point' | 'love'

type DefDoEstado = {
  duration: number
  loop?: number
  next?: EstadoDaNorti
  blink: boolean
  frames: [number, PoseDaNorti][]
  tracks: Trilhas
  fx?: [number, EfeitoDaNorti][]
  loopFx?: EfeitoDaNorti
}

export type MovimentoDaNorti = {
  version: number
  ground: number
  blend: number
  crossfade: number
  blink: { duration: number; every: number[] }
  states: Record<EstadoDaNorti, DefDoEstado>
  poke: { duration: number; eyes: [number, number]; tracks: Trilhas }
}

export const MOVIMENTO_DA_NORTI: MovimentoDaNorti = {
  version: 2,
  ground: 0.94,
  blend: 0.2,
  crossfade: 0.09,
  blink: { duration: 0.13, every: [3.1, 2.4, 0.32, 4.2, 2.9, 3.6, 0.3, 2.2, 4.8] },
  states: {
    // Parada: respira, balança de um lado pro outro e, no fim de cada volta, dá um pulinho
    idle: {
      duration: 4.4,
      loop: 0,
      blink: true,
      frames: [[0, 'idle']],
      tracks: {
        sy: [[0, 1], [1.6, 1.028, 'inOut'], [3.2, 1, 'inOut'], [3.45, 0.94, 'out'], [3.7, 1.06, 'out'], [3.95, 0.99, 'inOut'], [4.4, 1, 'inOut']],
        sx: [[0, 1], [1.6, 0.988, 'inOut'], [3.2, 1, 'inOut'], [3.45, 1.05, 'out'], [3.7, 0.96, 'out'], [3.95, 1.005, 'inOut'], [4.4, 1, 'inOut']],
        rot: [[0, 0], [0.8, 1.6, 'inOut'], [2.4, -1.6, 'inOut'], [3.2, 0, 'inOut'], [3.7, -2.5, 'out'], [4.1, 0, 'inOut'], [4.4, 0]],
        ty: [[0, 0], [3.45, 0], [3.7, -0.05, 'out'], [3.95, 0, 'in'], [4.4, 0]],
      },
    },
    appear: {
      duration: 0.9,
      next: 'idle',
      blink: true,
      frames: [[0, 'idle']],
      tracks: {
        opacity: [[0, 0], [0.1, 1, 'out']],
        sy: [[0, 0.2], [0.3, 1.15, 'out'], [0.48, 0.92, 'inOut'], [0.64, 1.04, 'inOut'], [0.8, 1, 'inOut']],
        sx: [[0, 0.2], [0.3, 0.95, 'out'], [0.48, 1.08, 'inOut'], [0.64, 0.98, 'inOut'], [0.8, 1, 'inOut']],
        ty: [[0, 0], [0.3, -0.05, 'out'], [0.48, 0, 'in']],
      },
      fx: [[0.28, 'sparkle']],
    },
    hello: {
      duration: 2,
      next: 'idle',
      blink: true,
      frames: [[0, 'idle'], [0.14, 'wave'], [1.62, 'idle']],
      tracks: {
        sy: [[0, 1], [0.14, 0.92, 'out'], [0.3, 1.06, 'out'], [0.46, 0.99, 'inOut'], [0.6, 1, 'inOut'], [1.5, 1], [1.62, 0.95, 'in'], [1.78, 1.02, 'out'], [1.95, 1, 'inOut']],
        sx: [[0, 1], [0.14, 1.06, 'out'], [0.3, 0.96, 'out'], [0.46, 1.01, 'inOut'], [0.6, 1, 'inOut'], [1.5, 1], [1.62, 1.04, 'in'], [1.78, 0.99, 'out'], [1.95, 1, 'inOut']],
        rot: [[0, 0], [0.3, -6, 'out'], [0.55, 6, 'inOut'], [0.8, -5, 'inOut'], [1.05, 5, 'inOut'], [1.3, -2.5, 'inOut'], [1.55, 0, 'inOut']],
        ty: [[0, 0], [0.14, 0], [0.3, -0.05, 'out'], [0.48, 0, 'in']],
      },
      fx: [[0.34, 'sparkle']],
    },
    // Pensando (é a Norti do "carregando"): quica, balança a cabeça e solta pontinhos
    think: {
      duration: 1.8,
      loop: 0,
      blink: false,
      frames: [[0, 'think']],
      tracks: {
        ty: [[0, 0], [0.45, -0.05, 'out'], [0.9, 0, 'in'], [1.35, -0.02, 'out'], [1.8, 0, 'in']],
        sy: [[0, 1], [0.1, 0.95, 'out'], [0.45, 1.04, 'out'], [0.9, 0.96, 'in'], [1.02, 1.01, 'out'], [1.35, 1.01], [1.8, 1, 'in']],
        sx: [[0, 1], [0.1, 1.04, 'out'], [0.45, 0.97, 'out'], [0.9, 1.03, 'in'], [1.02, 0.995, 'out'], [1.8, 1]],
        rot: [[0, -4], [0.9, 4, 'inOut'], [1.8, -4, 'inOut']],
      },
      loopFx: 'dots',
    },
    celebrate: {
      duration: 2.2,
      next: 'idle',
      blink: true,
      frames: [[0, 'idle'], [0.2, 'celebrate'], [1.95, 'idle']],
      tracks: {
        sy: [[0, 1], [0.2, 0.84, 'out'], [0.36, 1.12, 'out'], [0.56, 1.02, 'inOut'], [0.74, 1.06, 'in'], [0.82, 0.86, 'out'], [0.96, 1.05, 'out'], [1.1, 0.98, 'inOut'], [1.24, 1, 'inOut'], [1.85, 1], [1.95, 0.96, 'in'], [2.1, 1, 'out']],
        sx: [[0, 1], [0.2, 1.12, 'out'], [0.36, 0.92, 'out'], [0.56, 0.99, 'inOut'], [0.74, 0.96, 'in'], [0.82, 1.13, 'out'], [0.96, 0.97, 'out'], [1.1, 1.01, 'inOut'], [1.24, 1, 'inOut'], [1.85, 1], [1.95, 1.03, 'in'], [2.1, 1, 'out']],
        ty: [[0, 0], [0.2, 0], [0.5, -0.2, 'out'], [0.56, -0.205], [0.8, 0, 'in'], [1, -0.035, 'out'], [1.12, 0, 'in']],
        rot: [[0, 0], [0.5, -4, 'out'], [0.8, 0, 'in'], [1, 3, 'out'], [1.12, 0, 'in']],
      },
      fx: [[0.42, 'confetti']],
    },
    oops: {
      duration: 2.6,
      loop: 0.8,
      blink: false,
      frames: [[0, 'idle'], [0.08, 'oops']],
      tracks: {
        sy: [[0, 1], [0.08, 0.9, 'out'], [0.22, 1.03, 'out'], [0.34, 0.97, 'inOut'], [0.8, 0.97], [1.7, 0.985, 'inOut'], [2.6, 0.97, 'inOut']],
        sx: [[0, 1], [0.08, 1.07, 'out'], [0.22, 0.98, 'out'], [0.34, 1.01, 'inOut'], [0.8, 1.01], [1.7, 1.003, 'inOut'], [2.6, 1.01, 'inOut']],
        tx: [[0, 0], [0.1, 0.03, 'out'], [0.2, -0.024, 'inOut'], [0.3, 0.018, 'inOut'], [0.4, -0.012, 'inOut'], [0.5, 0.006, 'inOut'], [0.6, 0, 'inOut']],
        rot: [[0, 0], [0.1, 2.5, 'out'], [0.2, -2, 'inOut'], [0.3, 1.5, 'inOut'], [0.4, -1, 'inOut'], [0.5, 0, 'inOut'], [0.8, 0], [1.7, -1.2, 'inOut'], [2.6, 0, 'inOut']],
      },
    },
    sleep: {
      duration: 4.4,
      loop: 0,
      blink: false,
      frames: [[0, 'sleep']],
      tracks: {
        sy: [[0, 1], [2.2, 1.045, 'inOut'], [4.4, 1, 'inOut']],
        sx: [[0, 1], [2.2, 1.016, 'inOut'], [4.4, 1, 'inOut']],
        rot: [[0, 0], [2.2, 1.5, 'inOut'], [4.4, 0, 'inOut']],
      },
      loopFx: 'zzz',
    },
    // Apontando (dicas, tour): se inclina pro lado da dica e dá umas cutucadas
    point: {
      duration: 2,
      loop: 0.5,
      blink: false,
      frames: [[0, 'point']],
      tracks: {
        sy: [[0, 1], [0.1, 0.94, 'out'], [0.28, 1.04, 'out'], [0.45, 1, 'inOut'], [0.75, 1.02, 'out'], [1, 1, 'inOut']],
        sx: [[0, 1], [0.1, 1.05, 'out'], [0.28, 0.97, 'out'], [0.45, 1, 'inOut'], [0.75, 0.99, 'out'], [1, 1, 'inOut']],
        tx: [[0, 0], [0.5, 0], [0.75, 0.04, 'out'], [1, 0, 'inOut'], [1.2, 0.025, 'out'], [1.4, 0, 'inOut'], [2, 0]],
        ty: [[0, 0], [0.5, 0], [0.75, -0.02, 'out'], [1, 0, 'in'], [2, 0]],
        rot: [[0, 0], [0.28, 3, 'out'], [0.5, 0, 'inOut'], [0.75, 4.5, 'out'], [1, 0, 'inOut'], [1.2, 2.5, 'out'], [1.4, 0, 'inOut'], [2, 0]],
      },
    },
    love: {
      duration: 2.4,
      loop: 0,
      blink: false,
      frames: [[0, 'love']],
      tracks: {
        sy: [[0, 1], [0.12, 1.07, 'out'], [0.26, 0.99, 'inOut'], [0.4, 1.05, 'out'], [0.6, 1, 'inOut'], [2.4, 1]],
        sx: [[0, 1], [0.12, 1.04, 'out'], [0.26, 1, 'inOut'], [0.4, 1.03, 'out'], [0.6, 1, 'inOut'], [2.4, 1]],
        rot: [[0, -2], [1.2, 2, 'inOut'], [2.4, -2, 'inOut']],
      },
      loopFx: 'hearts',
    },
  },
  poke: {
    duration: 0.55,
    eyes: [0.03, 0.22],
    tracks: {
      sy: [[0, 1], [0.07, 0.86, 'out'], [0.2, 1.07, 'out'], [0.32, 0.97, 'inOut'], [0.44, 1.01, 'inOut'], [0.55, 1, 'inOut']],
      sx: [[0, 1], [0.07, 1.12, 'out'], [0.2, 0.95, 'out'], [0.32, 1.02, 'inOut'], [0.44, 0.995, 'inOut'], [0.55, 1, 'inOut']],
    },
  },
}

// ---------------- O motor: onde a Norti está em cada instante (igual ao MascotEngine do site) ----------------

const CURVA: Record<Curva, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
}
const entre01 = (t: number) => Math.max(0, Math.min(1, t))
const misturar = (a: number, b: number, w: number) => a + (b - a) * w

function trilha(chaves: Chave[] | undefined, t: number, padrao: number) {
  if (!chaves || !chaves.length) return padrao
  if (t <= chaves[0][0]) return chaves[0][1]
  for (let i = 1; i < chaves.length; i++) {
    const [t1, v1, c] = chaves[i]
    if (t <= t1) {
      const [t0, v0] = chaves[i - 1]
      const vao = t1 - t0
      return vao <= 0 ? v1 : misturar(v0, v1, CURVA[c ?? 'linear'](entre01((t - t0) / vao)))
    }
  }
  return chaves[chaves.length - 1][1]
}

type Corpo = { sx: number; sy: number; rot: number; tx: number; ty: number; opacity: number }
const NEUTRO: Corpo = { sx: 1, sy: 1, rot: 0, tx: 0, ty: 0, opacity: 1 }

export type QuadroDaNorti = Corpo & {
  estado: EstadoDaNorti
  pose: PoseDaNorti
  anterior: PoseDaNorti | null // pose que está sumindo (troca suave)
  mistura: number // 0 → só a anterior, 1 → só a pose nova
  efeitos: EfeitoDaNorti[]
}

const VIDA_DO_EFEITO: Record<EfeitoDaNorti, number> = { sparkle: 0.9, confetti: 1.9, dots: Infinity, zzz: Infinity, hearts: Infinity }

export class MotorDaNorti {
  private m = MOVIMENTO_DA_NORTI
  private nasceu: number | null = null
  private deslocaPiscar: number
  private s: { nome: EstadoDaNorti; inicio: number; de: Corpo | null; deEm: number; dePose: PoseDaNorti | null; cutucada: number }
  aoTerminar: ((estado: EstadoDaNorti) => void) | null = null

  constructor(semente = 0) {
    // Várias Nortis na tela não piscam juntas
    const ciclo = this.m.blink.every.reduce((a, b) => a + b, 0)
    const x = Math.sin(semente * 12.9898 + 7 * 78.233) * 43758.5453
    this.deslocaPiscar = semente ? (x - Math.floor(x)) * ciclo : 0
    this.s = { nome: 'idle', inicio: 0, de: null, deEm: 0, dePose: null, cutucada: -1 }
  }

  get estado() {
    return this.s.nome
  }

  tocar(nome: EstadoDaNorti, agora: number) {
    if (this.nasceu === null) this.nasceu = agora
    const atual = this.nasceu === agora && this.s.inicio === 0 ? null : this.quadro(agora)
    this.s = {
      nome,
      inicio: agora,
      de: atual ? { sx: atual.sx, sy: atual.sy, rot: atual.rot, tx: atual.tx, ty: atual.ty, opacity: atual.opacity } : null,
      deEm: agora,
      dePose: atual ? atual.pose : null,
      cutucada: this.s.cutucada,
    }
  }

  cutucar(agora: number) {
    this.s.cutucada = agora
  }

  quadro(agora: number, reduzir = false): QuadroDaNorti {
    if (this.nasceu === null) this.nasceu = agora
    let def = this.m.states[this.s.nome]
    // Os de uma vez só passam pro próximo sozinhos
    while (def.loop === undefined && def.next && agora - this.s.inicio >= def.duration) {
      const acabou = this.s.nome
      this.s = { ...this.s, nome: def.next, inicio: this.s.inicio + def.duration, de: null, dePose: null }
      def = this.m.states[this.s.nome]
      this.aoTerminar?.(acabou)
    }
    const T = agora - this.s.inicio
    const t = def.loop === undefined || T < def.duration ? Math.min(T, def.duration) : def.loop + ((T - def.loop) % (def.duration - def.loop))
    const tr = def.tracks
    let f: Corpo = {
      sx: trilha(tr.sx, t, 1),
      sy: trilha(tr.sy, t, 1),
      rot: trilha(tr.rot, t, 0),
      tx: trilha(tr.tx, t, 0),
      ty: trilha(tr.ty, t, 0),
      opacity: trilha(tr.opacity, t, 1),
    }
    // Sai do que estava fazendo sem pular
    const bw = this.s.de ? entre01((agora - this.s.deEm) / this.m.blend) : 1
    if (bw < 1 && this.s.de) {
      const w = CURVA.out(bw)
      const de = this.s.de
      f = {
        sx: misturar(de.sx, f.sx, w),
        sy: misturar(de.sy, f.sy, w),
        rot: misturar(de.rot, f.rot, w),
        tx: misturar(de.tx, f.tx, w),
        ty: misturar(de.ty, f.ty, w),
        opacity: misturar(de.opacity, f.opacity, w),
      }
    }
    // Cutucada (toque): amassa e estica por cima
    let olhosFechados = false
    const P = this.m.poke
    const pt = agora - this.s.cutucada
    if (this.s.cutucada >= 0 && pt >= 0 && pt < P.duration) {
      f.sy *= trilha(P.tracks.sy, pt, 1)
      f.sx *= trilha(P.tracks.sx, pt, 1)
      olhosFechados = pt >= P.eyes[0] && pt <= P.eyes[1]
    }
    // Qual imagem, e de qual está vindo
    const quadros = def.frames
    let i = 0
    for (let k = 0; k < quadros.length; k++) if (quadros[k][0] <= (T < def.duration ? T : t)) i = k
    let pose = quadros[i][1]
    const trocaEm = quadros[i][0]
    let anterior: PoseDaNorti | null = i > 0 ? quadros[i - 1][1] : this.s.dePose
    let mistura = T < def.duration || def.loop === undefined ? entre01((T - trocaEm) / this.m.crossfade) : 1
    if (!anterior || anterior === pose) {
      anterior = null
      mistura = 1
    }
    if (pose === 'idle' && mistura === 1 && (olhosFechados || (def.blink && this.piscando(agora - this.nasceu)))) pose = 'blink'
    if (reduzir) {
      f = { ...NEUTRO, opacity: f.opacity }
      mistura = anterior ? entre01((T - trocaEm) / 0.25) : 1
    }
    const efeitos: EfeitoDaNorti[] = []
    if (!reduzir) {
      for (const [em, tipo] of def.fx ?? []) if (T >= em && T - em < VIDA_DO_EFEITO[tipo]) efeitos.push(tipo)
      if (def.loopFx) efeitos.push(def.loopFx)
    }
    return { estado: this.s.nome, pose, anterior, mistura, ...f, efeitos }
  }

  private piscando(g: number) {
    const B = this.m.blink
    const ciclo = B.every.reduce((a, b) => a + b, 0)
    const x = (g + this.deslocaPiscar) % ciclo
    let soma = 0
    for (const d of B.every) {
      soma += d
      if (x >= soma && x < soma + B.duration) return true
    }
    return false
  }
}

// Onde ficam a cabeça e os lados no desenho (fração da caixa), pros efeitos
export const ANCORAS_DA_NORTI = { cx: 0.5005, top: 0.3008, left: 0.2041, right: 0.7979, sombra: 0.4631 }
export const CORES_DOS_EFEITOS = {
  brilho: '#FFC93C',
  tinta: '#372a1b',
  coracao: '#FF4F7B',
  confete: ['#be9a6f', '#FFC93C', '#4CC9F0', '#7BD88F', '#FF4F7B', '#FFFFFF'],
}
