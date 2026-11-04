// Congelado pelo RUMO (03/11/2026, docs/RUMO.md, "O que congelar").
// Congelar não é apagar: o código, as rotas e os dados continuam. Só os atalhos
// saem dos menus e das telas principais (o link direto pela URL segue abrindo).
// Pra descongelar uma parte, troque o `true` dela por `false`. Web e app leem daqui.
export const CONGELADO: Record<
  'cambioAvancado' | 'documentos' | 'frasesUteis' | 'fichaDoPais' | 'guiaDaCasa' | 'calendario' | 'notificacoes' | 'comentarios' | 'passe',
  boolean
> = {
  cambioAvancado: true, // termômetro, boletim das 12h e 20h, avisos de câmbio
  documentos: true, // documentos de entrada e exigências por país
  frasesUteis: true,
  fichaDoPais: true,
  guiaDaCasa: true,
  calendario: true, // baixar o .ics da agenda
  notificacoes: true, // central de novidades própria (o "sino")
  comentarios: true, // comentários soltos em gasto, hospedagem e lugar
  passe: true, // Passe da viagem (spec 119) e os extras trancados
}
