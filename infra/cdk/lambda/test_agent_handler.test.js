const { handler } = require('./agent_handler')

describe('agent_handler', () => {
  test('returns ok for price_query intent (mock Bedrock)', async () => {
    process.env.USE_BEDROCK = 'false'
    const event = { intent: 'price_query', lang: 'en' }
    const res = await handler(event)
    expect(res).toBeDefined()
    expect(res.ok).toBe(true)
  }, 20000)
})
