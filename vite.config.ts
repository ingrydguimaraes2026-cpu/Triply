import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA: deixa "instalar" o site no celular, como se fosse um app
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Together',
        short_name: 'Together',
        description: 'Planeje a viagem com seu comboio, num lugar só.',
        lang: 'pt-BR',
        theme_color: '#7B542F',
        // Fundo da tela de abertura do app instalado (igual à do artefato da logo)
        background_color: '#1F140A',
        display: 'standalone',
        start_url: '/',
        // Segurar o ícone do app instalado mostra estes atalhos (spec 009)
        shortcuts: [
          {
            name: 'Lançar gasto',
            short_name: 'Gasto',
            description: 'Lançar um gasto rápido na viagem atual',
            url: '/?lancar=1',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          // Android corta o ícone no formato do celular: este tem margem extra pra nada sumir
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
