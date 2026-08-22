jest.mock('aws-sdk', () => {
  const Rekognition = function() {
    return {
      detectLabels: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Labels: [{ Name: 'soil', Confidence: 98 }] }) })
    }
  }
  const S3 = function() {
    return {
      putObject: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ ETag: 'mock-etag' }) })
    }
  }
  return { Rekognition, S3 }
})

const { handler } = require('./agent_handler')

describe('agent_handler with AWS mocks', () => {
  test('processes image and uploads result to S3', async () => {
    process.env.USE_BEDROCK = 'false'
    const sampleImage = Buffer.from('fakeimage').toString('base64')
    const event = { intent: 'soil_analysis', lang: 'en', imageBase64: sampleImage, resultBucket: 'mock-bucket', s3KeyPrefix: 'test/' }
    const res = await handler(event)
    expect(res).toBeDefined()
    expect(res.ok).toBe(true)
    expect(res.s3Key).toMatch(/test\/agent-result-\d+\.json/)
  }, 20000)
})
