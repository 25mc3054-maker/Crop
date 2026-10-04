const { callBedrockMock, callBedrock } = require('../../../backend/bedrock_placeholder')

test('callBedrockMock returns expected structure', async () => {
  const res = await callBedrockMock('hello world')
  expect(res).toBeDefined()
  expect(typeof res.output).toBe('string')
  expect(res.output.length).toBeGreaterThan(0)
})

test('callBedrock falls back to mock when USE_BEDROCK not set', async () => {
  process.env.USE_BEDROCK = 'false'
  const res = await callBedrock('testing')
  expect(res).toBeDefined()
  expect(typeof res.output).toBe('string')
  expect(res.output.length).toBeGreaterThan(0)
})
