const AWS = require('aws-sdk')
const { callBedrock } = require('../../../backend/bedrock_placeholder')
const prompts = require('../../../backend/prompts.json')
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })
const rekognition = new AWS.Rekognition({ apiVersion: '2016-06-27' })

// Helper: retry with exponential backoff
async function retry(fn, attempts = 3, baseDelay = 500) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const delay = baseDelay * Math.pow(2, i)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}

// Helper: timeout a promise
function withTimeout(promise, ms) {
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  return Promise.race([promise, timeout])
}

exports.handler = async function(event) {
  console.log('Agent lambda event', JSON.stringify(event).slice(0,400))
  try {
    const lang = event.lang || 'en'
    const intent = event.intent || 'soil_analysis'
    const intentPrompts = prompts.intents || {}
    const defaultPrompt = intentPrompts.default?.system || event.prompt || ''
    let promptTemplate = intentPrompts[intent]?.system || defaultPrompt

    // If imageBase64 provided, call Rekognition DetectLabels with retries and timeout
    let rekog = null
    if (event.imageBase64) {
      const buffer = Buffer.from(event.imageBase64, 'base64')
      const params = { Image: { Bytes: buffer }, MaxLabels: 10, MinConfidence: 60 }
      rekog = await retry(() => withTimeout(rekognition.detectLabels(params).promise(), 8000), 3, 400)
      const labels = (rekog.Labels || []).map(l => l.Name + ' (' + Math.round(l.Confidence) + '%)').join(', ')
      promptTemplate = `${promptTemplate}\n\nDetected labels: ${labels}`
    }

    // Call Bedrock (mock or real depending on env) with retry/timeouts
    const bedrockCall = () => callBedrock(promptTemplate, { modelId: event.modelId })
    const llm = await retry(() => withTimeout(bedrockCall(), 12000), 3, 500)

    // Save result to S3 if bucket provided
    if (event.resultBucket && event.s3KeyPrefix) {
      const key = `${event.s3KeyPrefix}agent-result-${Date.now()}.json`
      await retry(() => s3.putObject({ Bucket: event.resultBucket, Key: key, Body: JSON.stringify({ llm, rekog }), ContentType: 'application/json' }).promise(), 3, 400)
      return { ok: true, s3Key: key }
    }

    return { ok: true, llm, rekog }
  } catch (err) {
    console.error('Agent lambda error', err)
    return { ok: false, error: err.message }
  }
}
