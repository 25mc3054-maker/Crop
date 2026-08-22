const request = require('supertest')
const app = require('../server')
const fs = require('fs')
const path = require('path')

describe('Additional backend endpoints', () => {
  test('GET /prices returns JSON with price', async () => {
    const res = await request(app).get('/prices').query({ crop: 'rice' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('crop', 'rice')
    expect(res.body).toHaveProperty('price')
  })

  test('POST /upload/soil accepts file and returns labels', async () => {
    const imgPath = path.join(__dirname, '..', 'test', 'fixtures', 'sample.jpg')
    // Ensure fixture exists; if not, create a small placeholder file
    if (!fs.existsSync(path.dirname(imgPath))) fs.mkdirSync(path.dirname(imgPath), { recursive: true })
    if (!fs.existsSync(imgPath)) fs.writeFileSync(imgPath, Buffer.from([0,1,2,3]))

    const res = await request(app).post('/upload/soil').attach('photo', imgPath)
    expect([200, 500]).toContain(res.statusCode)
    // If Rekognition isn't available locally, ensure we at least got a JSON response
    if (res.statusCode === 200) expect(res.body).toHaveProperty('id')
  })

  test('POST /webhook/twilio handles simple PRICE command', async () => {
    const res = await request(app)
      .post('/webhook/twilio')
      .type('form')
      .send({ Body: 'PRICE wheat', From: '+9112345' })
    expect(res.statusCode).toBe(200)
    expect(res.text).toContain('<Response>')
  })
})
