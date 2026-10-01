const CACHE_NAME = 'krishi-net-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/styles.css'
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(ASSETS)
    // Try to fetch audio manifest and pre-cache audio fallbacks
    try {
      const resp = await fetch('/audio_manifest.json')
      if (resp.ok) {
        const manifest = await resp.json()
        const audioUrls = Object.values(manifest)
        await cache.addAll(audioUrls)
      }
    } catch (e) { /* ignore */ }
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim()
    try {
      const clients = await self.clients.matchAll({ includeUncontrolled: true })
      for (const client of clients) {
        client.postMessage({ type: 'SW_ACTIVATED' })
      }
    } catch (e) { /* ignore */ }
  })())
})

self.addEventListener('install', (event) => {
  // notify clients that a new service worker was installed — useful for update flow
  event.waitUntil((async () => {
    try {
      const clients = await self.clients.matchAll({ includeUncontrolled: true })
      for (const client of clients) {
        client.postMessage({ type: 'SW_INSTALLED' })
      }
    } catch (e) { }
  })())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Cache-first for same-origin navigation and static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((resp) => {
        if (event.request.method === 'GET') {
          const copy = resp.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        }
        return resp
      }).catch(() => caches.match('/index.html')))
    )
    return
  }

  // For TTS audio and social feeds, cache responses for low-bandwidth / offline sync
  if (event.request.url.includes('/tts') || event.request.url.includes('/api/social/posts')) {
    event.respondWith(
      fetch(event.request).then(res => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
        return res
      }).catch(() => caches.match(event.request))
    )
    return
  }

})
