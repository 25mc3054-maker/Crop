jest.setTimeout(20000)

// Mock aws-sdk to avoid calling real AWS services during tests
jest.mock('aws-sdk', () => {
  const S3 = jest.fn(() => ({
    putObject: jest.fn(() => ({ promise: () => Promise.resolve() })),
    getSignedUrlPromise: jest.fn(() => Promise.resolve('https://example.com/tts.mp3'))
  }))
  const Rekognition = jest.fn(() => ({
    detectLabels: jest.fn(() => ({ promise: () => Promise.resolve({ Labels: [{ Name: 'Loam', Confidence: 95 }] }) }))
  }))
  return { S3, Rekognition }
})

const { handler } = require('./agent_handler')

test('agent handler processes image and stores result (mocked AWS)', async () => {
  process.env.USE_BEDROCK = 'false'
  const imageBase64 = Buffer.from('fake-image').toString('base64')
  const event = { imageBase64, intent: 'soil_analysis', lang: 'en', resultBucket: 'test-bucket', s3KeyPrefix: 'test/' }
  const res = await handler(event)
  expect(res).toBeDefined()
  expect(res.ok).toBe(true)
  expect(res.s3Key).toMatch(/test\/agent-result-\d+\.json/)
})
