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
