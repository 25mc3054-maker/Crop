const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'frontend', 'dist')
const port = process.env.PORT || 5000

function send404(res) {
  res.statusCode = 404
  res.end('Not found')
}

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURIComponent(new URL(req.url, `http://localhost`).pathname)
    if (reqPath === '/') reqPath = '/index.html'
    const filePath = path.join(root, reqPath)
    if (!filePath.startsWith(root)) return send404(res)
    if (!fs.existsSync(filePath)) return send404(res)
    const stat = fs.statSync(filePath)
    res.setHeader('Content-Length', stat.size)
    if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript')
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css')
    if (filePath.endsWith('.html')) res.setHeader('Content-Type', 'text/html')
    if (filePath.endsWith('.json')) res.setHeader('Content-Type', 'application/json')
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (e) {
    res.statusCode = 500
    res.end('Server error')
  }
})

server.listen(port, () => console.log(`Static server serving ${root} on http://127.0.0.1:${port}`))
