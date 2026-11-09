// O core é TS puro (sem a lib DOM), mas o `fetch` existe igual na web e no React Native.
// Declaramos só o pedaço que usamos, pra não liberar `window`/`document` sem querer.
interface RespostaFetch {
  ok: boolean
  status: number
  json(): Promise<any>
}

declare function fetch(url: string, init?: { signal?: unknown; headers?: Record<string, string> }): Promise<RespostaFetch>

// URL e URLSearchParams também existem igual na web e no app (o Expo traz a versão completa)
declare class URL {
  constructor(url: string)
  readonly hostname: string
  readonly pathname: string
  readonly protocol: string
}

declare class URLSearchParams {
  constructor(init?: Record<string, string>)
  set(nome: string, valor: string): void
  append(nome: string, valor: string): void
  toString(): string
}

// Timers também existem igual na web e no app (spec 114: esperar a cidade ficar pronta)
declare function setTimeout(fn: () => void, ms?: number): unknown
