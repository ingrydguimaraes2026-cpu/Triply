// Tour guiado (tutorial "de videogame") da viagem: na primeira vez que a pessoa abre uma viagem,
// a tela escurece, um pedaço fica aceso e a Norti explica o que tem ali, passo a passo.
// Mesmo texto no app e no site. `alvo` é a peça que acende (sem alvo: balão no meio da tela).
// Regras de texto: frases curtas, sem emoji, "galera" (não "comboio").
export type AlvoDoTour = 'proximo-passo' | 'aba-roteiro' | 'aba-reservas' | 'aba-contas' | 'aba-fotos' | 'galera'

export type PassoDoTour = {
  alvo: AlvoDoTour | null
  titulo: string
  texto: string
  humor: 'oi' | 'apontando' | 'feliz'
}

export const PASSOS_DO_TOUR: PassoDoTour[] = [
  {
    alvo: null,
    titulo: 'Oi, eu sou a Norti',
    texto: 'Em meio minuto te mostro onde fica cada coisa da viagem.',
    humor: 'oi',
  },
  {
    alvo: 'proximo-passo',
    titulo: 'Próximo passo',
    texto: 'Aqui aparece sempre o que falta fazer agora. Fez, ganha um carimbo no passaporte.',
    humor: 'apontando',
  },
  {
    alvo: 'aba-roteiro',
    titulo: 'Roteiro',
    texto: 'Os dias da viagem, o que fazer em cada um e as ideias da galera.',
    humor: 'apontando',
  },
  {
    alvo: 'aba-reservas',
    titulo: 'Reservas',
    texto: 'Passagens e onde vocês vão dormir, tudo num lugar só.',
    humor: 'apontando',
  },
  {
    alvo: 'aba-contas',
    titulo: 'Contas',
    texto: 'Lançou um gasto, o app divide e mostra quem deve pra quem.',
    humor: 'apontando',
  },
  {
    alvo: 'aba-fotos',
    titulo: 'Fotos',
    texto: 'O álbum da galera, dia por dia.',
    humor: 'apontando',
  },
  {
    alvo: 'galera',
    titulo: 'A galera',
    texto: 'Toque nos rostos pra ver quem vai e chamar mais gente.',
    humor: 'apontando',
  },
  {
    alvo: null,
    titulo: 'Pronto, é isso',
    texto: 'Pra ver de novo, é só abrir o seu perfil e tocar em "Ver o tour de novo".',
    humor: 'feliz',
  },
]
