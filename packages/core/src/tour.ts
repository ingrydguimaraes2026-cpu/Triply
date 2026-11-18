// Tour guiado (tutorial "de videogame") da viagem. Mesma fala e mesma ordem no app e no site.
//
// Versão 3, 10/11/2026, aprovada pelo Victor no protótipo docs/design/direcao-redesenho/tour-jogo.html:
// - a Norti fala numa caixa de diálogo de jogo; o texto aparece letra por letra;
// - toque em qualquer lugar pra seguir (sem botões pequenos de Próximo/Pular, que confundiam);
// - a pessoa FAZ: "Toque em Roteiro" só anda quando ela toca na aba de verdade (`tocar`);
//   tocou fora, a parte acesa balança e a Norti faz "ops";
// - cada parte é mostrada DENTRO da aba, apontando a peça principal dali (`alvo`);
// - o foco desliza de uma peça pra outra; no fim, a Norti comemora com confete.
// Sem alvo (ou peça fora da tela), a caixa aparece no meio, com a tela toda escura.
// Na fala, *assim* vira destaque dourado (ver `pedacosDaFala`).
export type AlvoDoTour =
  | 'barra'
  | 'aba-roteiro'
  | 'aba-reservas'
  | 'aba-contas'
  | 'aba-fotos'
  | 'roteiro-dias'
  | 'reservas-troca'
  | 'contas-lancar'
  | 'fotos-publicar'

export type AbaDoTour = 'roteiro' | 'reservas' | 'contas' | 'fotos'

export type PassoDoTour = {
  alvo: AlvoDoTour | null
  fala: string
  humor: 'oi' | 'apontando' | 'feliz'
  // Passo de fazer: só anda quando essa aba abre (a pessoa toca no foco)
  tocar?: AbaDoTour
}

// Versão 4, 16/11/2026 (primeiro minuto novo): 4 passos, sem exigir toque nas abas.
// Oi → as 5 partes → Contas → fim. Não roda em viagem antiga nem em rolê (ver `tourCabeNaViagem`).
export const PASSOS_DO_TOUR: PassoDoTour[] = [
  { alvo: null, humor: 'oi', fala: 'Oi! Eu sou a *Norti*. Bora dar uma volta rápida pela viagem?' },
  { alvo: 'barra', humor: 'apontando', fala: 'Aqui ficam as *5 partes* da viagem: Viagem, Roteiro, Reservas, Contas e Fotos.' },
  { alvo: 'aba-contas', humor: 'apontando', fala: 'Pagou algo? Lança em *Contas* que eu divido pra galera.' },
  { alvo: null, humor: 'feliz', fala: 'Pronto! Cada lugar que vocês chegarem vira um carimbo no mapa da galera.' },
]

// Viagem antiga (de memória) e rolê não têm roteiro, reservas nem contas pra mostrar
export function tourCabeNaViagem(tipo: string | null | undefined): boolean {
  return tipo !== 'antiga' && tipo !== 'role'
}

// Quebra a fala em pedaços normais e destacados: 'Toque em *Roteiro*.' →
// [{texto:'Toque em ', destaque:false}, {texto:'Roteiro', destaque:true}, {texto:'.', destaque:false}]
export type PedacoDaFala = { texto: string; destaque: boolean }
export function pedacosDaFala(fala: string): PedacoDaFala[] {
  return fala
    .split('*')
    .map((texto, i) => ({ texto, destaque: i % 2 === 1 }))
    .filter((p) => p.texto.length > 0)
}

// Quantas letras a fala tem (a "máquina de escrever" mostra uma por vez até chegar nesse número)
export function tamanhoDaFala(pedacos: PedacoDaFala[]) {
  return pedacos.reduce((soma, p) => soma + p.texto.length, 0)
}
