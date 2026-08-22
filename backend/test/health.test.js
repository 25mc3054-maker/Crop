const request = require('supertest')
const app = require('../server')

describe('Backend health and LLM', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
  })

  test('POST /llm with prompt returns ok and output', async () => {
    const res = await request(app).post('/llm').send({ prompt: 'Hello', lang: 'en' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(res.body).toHaveProperty('output')
  })
})
