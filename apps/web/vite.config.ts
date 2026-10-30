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
      // Notificações (spec 013): o service worker gerado também carrega o tratamento de "push"
      workbox: {
        importScripts: ['sw-push.js'],
        // Offline de leitura (spec 034): o que a pessoa já abriu continua abrindo sem internet.
        // Com internet: busca na rede (até 6 s) e guarda a cópia. Sem internet: mostra a última cópia.
        // Ao sair da conta, as cópias são apagadas (features/offline/cache.ts).
        runtimeCaching: [
          {
            // Leituras do banco (GET /rest/v1/...). Gravações (POST/PATCH/DELETE) nunca entram no cache.
            urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'together-dados',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 45 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Fotos e arquivos do Storage (avatar, feed, cofre): não mudam depois de enviados
            urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/storage/v1/object/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'together-arquivos',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 45, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Previsão do tempo (spec 023)
            urlPattern: ({ url }) => url.hostname === 'api.open-meteo.com',
            handler: 'NetworkFirst',
            options: { cacheName: 'together-clima', networkTimeoutSeconds: 5, expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 } },
          },
        ],
      },
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
