/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // NativeWind no web: evita o erro "dark mode is type 'media'". Não usamos dark mode.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta do redesign "Malinha" (espelho de theme.ts)
        fundo: '#FBF3E6',
        cartao: '#FFFFFF',
        texto: '#3B2715',
        corpo: '#6E5540',
        suave: '#7A5F45',
        apagado: '#8A7058',
        couro: '#7B542F',
        caramelo: '#B97A22',
        escuro: '#4A2E14',
        creme: '#F5E9D6',
        chip: '#F6EAD7',
        areia: '#F1E4CF',
        borda: '#EADCC6',
        linha: '#F1E6D4',
        tracejado: '#D9C3A2',
        dourado: '#E3A04A',
        verde: '#5E6B2E',
        'verde-fundo': '#EEF0DF',
        vermelho: '#A1442B',
        'vermelho-fundo': '#F6E2DA',
      },
      fontFamily: {
        // Caminho B (Embarque): títulos em Inter Tight 800, corpo em Inter.
        // Os nomes antigos (display, body...) ficam, então todas as telas mudam juntas.
        display: ['InterTight_800ExtraBold'],
        'display-bold': ['InterTight_800ExtraBold'],
        'titulo-item': ['InterTight_700Bold'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-semibold': ['Inter_600SemiBold'],
        'body-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
}
