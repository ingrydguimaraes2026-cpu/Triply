// Tour guiado (tutorial "de videogame") da viagem. Mesmo texto e mesma ordem no app e no site.
//
// Refeito em 10/11/2026 depois do Victor ("ele fica na página principal e acabou"). Regras que
// vieram da pesquisa (tours longos e só de leitura quase ninguém termina; tutorial de jogo
// ensina fazendo, no lugar certo):
// - a pessoa FAZ: "Toque em Roteiro" só anda quando ela toca na aba de verdade (`tocar`);
// - cada parte é mostrada DENTRO da aba, apontando a peça principal dali (`alvo`);
// - curto: uma frase por passo, "Pular" sempre à vista.
// Sem alvo (ou peça fora da tela), o balão aparece no meio, sem foco.
export type AlvoDoTour =
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
  titulo: string
  texto: string
  humor: 'oi' | 'apontando' | 'feliz'
  // Passo de fazer: só anda quando essa aba abre (a pessoa toca no foco)
  tocar?: AbaDoTour
}

export const PASSOS_DO_TOUR: PassoDoTour[] = [
  {
    alvo: null,
    titulo: 'Oi, eu sou a Norti',
    texto: 'Bora conhecer a viagem? Leva meio minuto, e é você quem vai tocando.',
    humor: 'oi',
  },
  { alvo: 'aba-roteiro', titulo: 'Toque em Roteiro', texto: 'É onde mora o plano de cada dia.', humor: 'apontando', tocar: 'roteiro' },
  {
    alvo: 'roteiro-dias',
    titulo: 'Os dias da viagem',
    texto: 'Toque num dia pra ver o que tem nele. Embaixo ficam as ideias da galera.',
    humor: 'apontando',
  },
  { alvo: 'aba-reservas', titulo: 'Agora, Reservas', texto: 'Passagens e hospedagem, num lugar só.', humor: 'apontando', tocar: 'reservas' },
  {
    alvo: 'reservas-troca',
    titulo: 'Transporte ou hospedagem',
    texto: 'Troque aqui entre as passagens e onde vocês vão dormir.',
    humor: 'apontando',
  },
  { alvo: 'aba-contas', titulo: 'Agora, Contas', texto: 'Ninguém mais faz conta de cabeça.', humor: 'apontando', tocar: 'contas' },
  {
    alvo: 'contas-lancar',
    titulo: 'Lance um gasto',
    texto: 'Pagou algo? Lance aqui. O app divide e mostra quem deve pra quem.',
    humor: 'apontando',
  },
  { alvo: 'aba-fotos', titulo: 'Por último, Fotos', texto: 'O álbum da galera.', humor: 'apontando', tocar: 'fotos' },
  {
    alvo: 'fotos-publicar',
    titulo: 'Publique as fotos',
    texto: 'Mande fotos daqui. Elas se organizam sozinhas, dia por dia.',
    humor: 'apontando',
  },
  {
    alvo: null,
    titulo: 'Pronto, você já sabe o caminho',
    texto: 'Pra ver de novo, é só abrir o seu perfil e tocar em "Ver o tour de novo".',
    humor: 'feliz',
  },
]
