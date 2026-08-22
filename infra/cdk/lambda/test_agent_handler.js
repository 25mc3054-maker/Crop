// Simple test runner for agent_handler
const handler = require('./agent_handler').handler

async function run() {
  console.log('Running agent handler test (mocked Bedrock)')
  // Ensure mock Bedrock mode
  process.env.USE_BEDROCK = 'false'
  const event = { intent: 'price_query', lang: 'en' }
  try {
    const res = await handler(event)
    console.log('Result:', JSON.stringify(res, null, 2))
    if (res.ok) {
      console.log('TEST PASS')
      process.exit(0)
    } else {
      console.error('TEST FAIL: handler returned error', res.error)
      process.exit(2)
    }
  } catch (err) {
    console.error('TEST ERROR', err)
    process.exit(3)
  }
}

run()
