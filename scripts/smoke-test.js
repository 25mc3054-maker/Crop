const http = require('http')
const https = require('https')

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (c) => body += c)
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  console.log('Running smoke tests...')
  const checks = [
    { name: 'Frontend', url: 'http://localhost:5000/' },
    { name: 'Service Worker', url: 'http://localhost:5000/service-worker.js' },
    { name: 'Audio manifest', url: 'http://localhost:5000/audio_manifest.json' },
    { name: 'Backend health', url: 'http://localhost:4000/health' }
  ]

  for (const c of checks) {
    try {
      const res = await fetch(c.url)
      console.log(`${c.name}: ${res.status}`)
    } catch (err) {
      console.error(`${c.name}: ERROR - ${err && err.stack ? err.stack : err}`)
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(1) })
