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
        name: 'Triply',
        short_name: 'Triply',
        description: 'Planeje a viagem com seu comboio, num lugar só.',
        lang: 'pt-BR',
        theme_color: '#142132',
        background_color: '#F4F6F8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
