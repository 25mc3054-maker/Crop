const CACHE_NAME = 'krishi-net-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/assets/index-vFXiJ_N9.css',
  '/assets/index-mZ2oSEnp.js'
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(ASSETS)
    try {
      const resp = await fetch('/audio_manifest.json')
      if (resp.ok) {
        const manifest = await resp.json()
        const audioUrls = Object.values(manifest)
        await cache.addAll(audioUrls)
      }
    } catch (e) { }
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim()
    try {
      const clients = await self.clients.matchAll({ includeUncontrolled: true })
      for (const client of clients) client.postMessage({ type: 'SW_ACTIVATED' })
    } catch (e) { }
  })())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
        if (event.request.method === 'GET') caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()))
        return resp
      }).catch(() => caches.match('/index.html')))
    )
    return
  }

  if (event.request.url.includes('/tts')) {
    event.respondWith(
      fetch(event.request).then(res => { caches.open(CACHE_NAME).then(cache => cache.put(event.request, res.clone())); return res }).catch(() => caches.match(event.request))
    )
    return
  }
})
