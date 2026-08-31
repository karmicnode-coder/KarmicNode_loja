// ─── Karmic Node — Service Worker ──────────────────────────────────────
// PWA: cache offline básico (app-shell) + push notifications.
// Estratégia: network-first para navegação/HTML e chamadas /api/*
// (para nunca servir stock/preços desatualizados), cache-first para
// assets estáticos versionados pelo Vite (hash no nome do ficheiro).

const CACHE_NAME = 'karmic-node-v1'
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Nunca cachear chamadas à API (produtos/preços/stock têm de ser sempre frescos)
  if (url.pathname.startsWith('/api/')) return

  // Assets estáticos com hash (JS/CSS/imagens do build) — cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {})
        return res
      }))
    )
    return
  }

  // Navegação/HTML — network-first com fallback para cache (funciona offline)
  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {})
        return res
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  )
})

// ─── Push Notifications ──────────────────────────────────────────────
// Payload esperado (JSON): { title, body, url, icon }
self.addEventListener('push', (event) => {
  let data = { title: 'Karmic Node', body: 'Tens novidades à tua espera.', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    if (event.data) data.body = event.data.text()
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    })
  )
})
