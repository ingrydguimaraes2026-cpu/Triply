/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // NativeWind no web: evita o erro "dark mode is type 'media'". Não usamos dark mode.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta "Couro e laranja" (mesma da web)
        couro: '#7b542f',
        caramelo: '#b6771d',
        laranja: '#ff9d00',
        dourado: '#ffcf71',
        fundo: '#fff6e5',
        cartao: '#ffffff',
        texto: '#3b2715',
        suave: '#7b542f',
        borda: '#f0dfc0',
        comboio: '#7b542f',
        'comboio-fundo': '#ffe7b8',
        pessoal: '#9a5b00',
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        'display-bold': ['Fraunces_700Bold'],
        body: ['PlusJakartaSans_400Regular'],
        'body-medium': ['PlusJakartaSans_500Medium'],
        'body-semibold': ['PlusJakartaSans_600SemiBold'],
        'body-bold': ['PlusJakartaSans_700Bold'],
      },
    },
  },
  plugins: [],
}
