// Paleta do redesign "Malinha" (Couro e caramelo). Mesmos nomes do tailwind.config.js,
// pra usar onde className não alcança (ícones, gradientes, sombras).
export const cor = {
  fundo: '#FBF3E6',
  cartao: '#FFFFFF',
  texto: '#3B2715',
  corpo: '#6E5540', // texto de parágrafo
  suave: '#7A5F45', // legendas, rótulos
  apagado: '#8A7058', // ícone de aba inativa
  couro: '#7B542F',
  caramelo: '#B97A22',
  escuro: '#4A2E14',
  creme: '#F5E9D6', // texto claro sobre foto
  chip: '#F6EAD7', // fundo de ícone
  areia: '#F1E4CF', // fundo de seletor / cartão neutro
  borda: '#EADCC6',
  linha: '#F1E6D4',
  tracejado: '#D9C3A2',
  dourado: '#E3A04A',
  verde: '#5E6B2E',
  verdeFundo: '#EEF0DF',
  vermelho: '#A1442B',
  vermelhoFundo: '#F6E2DA',
} as const

// Sombras marrons do design (o RN novo aceita boxShadow no style, inclusive no web)
export const sombra = {
  cartao: { boxShadow: '0 4px 14px rgba(74,46,20,0.06)' },
  botao: { boxShadow: '0 8px 20px rgba(123,84,47,0.28)' },
  flutuante: { boxShadow: '0 4px 12px rgba(74,46,20,0.15)' },
  hero: { boxShadow: '0 18px 40px rgba(74,46,20,0.25)' },
} as const

// Cores das bolinhas de iniciais (cada pessoa ganha uma fixa pela posição no comboio)
export const coresDePessoa = ['#A8703F', '#8E6A3E', '#B5553A', '#6B7A3A', '#A07A2C', '#4A2E14', '#7B542F', '#C99257']

// ---------------------------------------------------------------------------
// Caminho B "Embarque" (decisão do Victor, 10/11/2026). Régua: docs/design/direcao-redesenho/embarque.html
// Só a paleta de cima. Telas de trabalho (abas e listas) em creme; escuro só nos "momentos"
// (abertura, viagem pronta, convite, carimbo, descobrir).
export const trabalho = {
  fundo: cor.fundo, // #FBF3E6
  superficie: cor.cartao,
  superficie2: cor.chip,
  texto: cor.texto,
  texto2: cor.suave,
  linha: cor.borda,
  acento: cor.couro,
  acentoTexto: cor.creme,
  vidro: 'rgba(255,253,248,0.78)',
} as const

export const momento = {
  // Degradê de cima pra baixo: #4A2E14 → #3B2715
  degrade: [cor.escuro, cor.texto] as const,
  superficie: 'rgba(245,233,214,0.07)',
  superficie2: 'rgba(245,233,214,0.12)',
  texto: cor.creme,
  texto2: 'rgba(245,233,214,0.64)',
  linha: 'rgba(245,233,214,0.1)',
  acento: cor.dourado,
  acentoTexto: cor.texto,
} as const

// Tipografia B: títulos em Inter Tight 800 com as letras juntas (-0.035em), corpo em Inter.
// letterSpacing no RN é em px: use titulo(tamanho) pra calcular.
export const fonte = {
  titulo: 'InterTight_800ExtraBold',
  item: 'InterTight_700Bold',
  corpo: 'Inter_400Regular',
  corpoMedio: 'Inter_500Medium',
  corpoForte: 'Inter_600SemiBold',
  corpoNegrito: 'Inter_700Bold',
} as const

export function titulo(tamanho: number, junto = 0.035) {
  return { fontFamily: fonte.titulo, fontSize: tamanho, letterSpacing: -tamanho * junto, lineHeight: Math.round(tamanho * 1.05) }
}

// Rótulo pequeno em caixa alta (ex.: "PRÓXIMO PASSO", "A VIAGEM")
export const rotulo = { fontFamily: fonte.corpoForte, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase' as const }
