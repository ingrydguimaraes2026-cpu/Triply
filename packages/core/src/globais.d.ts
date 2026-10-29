// O core é TS puro (sem a lib DOM), mas o `fetch` existe igual na web e no React Native.
// Declaramos só o pedaço que usamos, pra não liberar `window`/`document` sem querer.
interface RespostaFetch {
  ok: boolean
  status: number
  json(): Promise<any>
}

declare function fetch(url: string): Promise<RespostaFetch>
