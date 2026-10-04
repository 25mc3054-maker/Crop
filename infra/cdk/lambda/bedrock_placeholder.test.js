const { callBedrockMock, callBedrock } = require('../../../backend/bedrock_placeholder')

test('callBedrockMock returns expected structure', async () => {
  const res = await callBedrockMock('hello world')
  expect(res).toBeDefined()
  expect(res.model).toMatch(/mock/)
  expect(typeof res.output).toBe('string')
  expect(res.output).toContain('कृपया')
})

test('callBedrock falls back to mock when USE_BEDROCK not set', async () => {
  process.env.USE_BEDROCK = 'false'
  const res = await callBedrock('testing', { lang: 'en' })
  expect(res).toBeDefined()
  expect(res.model).toMatch(/mock/)
  expect(res.output).toContain('Please ask a clear question')
})
