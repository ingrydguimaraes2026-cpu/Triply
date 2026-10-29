// Notificações do Together (spec 013). Este arquivo é carregado pelo service worker do app (vite.config.ts → importScripts).
// O servidor manda { titulo, corpo, url, tag }; tocar na notificação abre o app nessa página.

self.addEventListener('push', (evento) => {
  let dados = {}
  try {
    dados = evento.data ? evento.data.json() : {}
  } catch {
    dados = { corpo: evento.data ? evento.data.text() : '' }
  }
  evento.waitUntil(
    self.registration.showNotification(dados.titulo || 'Together', {
      body: dados.corpo || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: dados.tag,
      data: { url: dados.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const url = (evento.notification.data && evento.notification.data.url) || '/'
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if ('focus' in janela) {
          janela.navigate(url)
          return janela.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
