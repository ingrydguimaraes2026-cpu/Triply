import { Camera, Luggage, Map as Mapa, MapPinned, Printer, Route, Settings, Sparkles, Sun, Ticket, Users, Wallet } from '../../components/ui/icones'

// As 5 partes da viagem, iguais às abas do app (apps/mobile/app/viagem/[id]/(abas)/_layout.tsx).
// Pra criar uma aba nova: adicione aqui e no src/router.tsx
export const ABAS = [
  { para: '', rotulo: 'Viagem', icone: Luggage },
  // Roteiro como no app: Matches + Dia 1, Dia 2... O baralho do Explorar abre por "Descobrir mais lugares"
  { para: 'roteiro', rotulo: 'Roteiro', icone: Mapa },
  // Reservas = Passagens + Hospedagem, com as duas pílulas (como no app)
  { para: 'reservas', rotulo: 'Reservas', icone: Ticket },
  { para: 'contas', rotulo: 'Contas', icone: Wallet },
  { para: 'fotos', rotulo: 'Fotos', icone: Camera },
]

// "Tudo da viagem": o resto, como na tela do app (apps/mobile/app/tudo-da-viagem.tsx).
// No computador fica no menu, embaixo das 5 partes; no celular, no "..." da capa da tela Viagem (igual ao app).
// Os cartões do comboio (tarefas, enquetes, cofre...) ficam na página /tudo.
export const TUDO_DA_VIAGEM = [
  { para: 'hoje', rotulo: 'Hoje', sub: 'Agora e próximo', icone: Sun },
  { para: 'lugares', rotulo: 'Lugares', sub: 'Ideias salvas', icone: MapPinned },
  { para: 'cidades', rotulo: 'Cidades', sub: 'Datas e ordem das cidades', icone: Route },
  { para: 'comboio', rotulo: 'Comboio', sub: 'Quem vai e papéis', icone: Users },
  { para: 'retrospectiva', rotulo: 'Retrospectiva', sub: 'A viagem em números', icone: Sparkles },
  { para: 'imprimir', rotulo: 'PDF', sub: 'Roteiro e livro', icone: Printer },
  { para: 'configuracoes', rotulo: 'Configurações', sub: 'Nome, datas, moeda', icone: Settings, soAdm: true },
]
