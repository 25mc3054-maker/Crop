
// bedrock_placeholder.js
// Scaffolding for integrating with Amazon Bedrock. This file supports two modes:
// 1) Mock mode (default) - returns canned responses for local development.
// 2) Real mode - when `USE_BEDROCK=true` in env, attempts to call Bedrock via
//    the AWS SDK v3 `@aws-sdk/client-bedrock` (install separately).

const useBedrock = process.env.USE_BEDROCK === 'true'
const fs = require('fs')
const path = require('path')

// Helper to attempt to load AWS SDK v3 Bedrock client if available.
function tryLoadBedrockClient() {
  try {
    const mod = require('@aws-sdk/client-bedrock-runtime')
    return { available: true, mod }
  } catch (e) {
    return { available: false }
  }
}

async function callBedrockMock(prompt, options = {}) {
  const rawPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
  const userQuestion = rawPrompt.split('\n\n[')[0].trim().toLowerCase()
  const normalizedQuestion = userQuestion.normalize('NFKD')
  const intent = options.intent || 'default'
  const lang = options.lang === 'en' ? 'en' : 'hi'

  const directAnswersHi = {
    weather_query: 'आपके क्षेत्र में वर्तमान तापमान, वर्षा की संभावना और अगली बारिश का समय मौसम सेक्शन में लाइव दिख रहा है। खेत में काम की योजना उसी के अनुसार रखें।',
    market_advisor: 'आज के भाव के अनुसार, बिक्री से पहले नजदीकी मंडियों की तुलना करें और जिस फसल में ट्रेंड ऊपर है उसे तुरंत न बेचकर 2-3 दिन मॉनिटर करें।',
    crop_doctor: 'गेहूं के लिए अच्छी जल निकासी वाली दोमट (Loam) या चिकनी-दोमट मिट्टी सबसे बेहतर रहती है, pH लगभग 6.0 से 7.5 रखें।',
    government_scheme: 'आपके राज्य के अनुसार लागू सरकारी योजनाएं स्कीम्स सेक्शन में दिख रही हैं; उसी सूची से Apply पर क्लिक करके सीधे आधिकारिक पोर्टल पर आवेदन करें।',
    amazon_procurement: 'बेहतर बिक्री के लिए गुणवत्ता ग्रेडिंग, नमी परीक्षण और तौल रिकॉर्ड तैयार रखें, फिर खरीदारों के रेट की तुलना करके ही डील फाइनल करें।',
    default: 'कृपया अपना सवाल फसल, मौसम, मिट्टी, मंडी भाव, उपकरण या सरकारी योजना में से किसी एक विषय पर साफ लिखें, मैं सीधा उत्तर दूँगा।'
  }

  const directAnswersEn = {
    weather_query: 'Your local weather section already shows current temperature, rain chance, and next rain timing live. Plan field work based on that update.',
    market_advisor: 'Before selling, compare rates across nearby mandis and monitor the trend for 2-3 days if the crop price is rising.',
    crop_doctor: 'For wheat, well-drained loam to clay-loam soil is best, with an ideal pH range of about 6.0 to 7.5.',
    government_scheme: 'State-eligible government schemes are listed in your schemes section; use Apply on each card to open the official portal directly.',
    amazon_procurement: 'For better selling outcomes, keep crop grading, moisture test records, and weight logs ready before finalizing buyer rates.',
    default: 'Please ask a clear question about crop health, weather, soil, mandi prices, equipment, or government schemes for a direct answer.'
  }

  const selectedAnswers = lang === 'en' ? directAnswersEn : directAnswersHi
  let output = selectedAnswers[intent] || selectedAnswers.default

  const hasWheatKeyword = /wheat/.test(normalizedQuestion) || /गेह|गह/.test(userQuestion)
  const hasSoilKeyword = /soil/.test(normalizedQuestion) || /मिट्टी|मिट|मटट|मटटी/.test(userQuestion)
  const isWheatSoilQuestion =
    userQuestion.includes('which soil is better to grow wheat') ||
    (hasWheatKeyword && hasSoilKeyword) ||
    (intent === 'crop_doctor' && hasSoilKeyword)

  if (isWheatSoilQuestion) {
    output = lang === 'en'
      ? 'For wheat, loam or clay-loam soil with good drainage is best. Keep soil pH around 6.0 to 7.5 for good growth.'
      : 'गेहूं के लिए दोमट (Loam) या चिकनी-दोमट मिट्टी सबसे अच्छी मानी जाती है। pH 6.0–7.5 रखें और खेत में जल निकासी अच्छी होनी चाहिए।'
  }

  if (lang === 'hi' && hasSoilKeyword && !hasWheatKeyword) {
    output = 'मिट्टी का सही चुनाव फसल पर निर्भर करता है। ज्यादातर फसलों के लिए अच्छी जल निकासी वाली दोमट मिट्टी और pH 6.0–7.5 उपयुक्त रहती है।'
  }

  return {
    model: options.model || 'claude-3.5-sonnet (mock)',
    output
  }
}

async function callBedrock(prompt, options = {}) {
  if (!useBedrock) return callBedrockMock(prompt, options)

  // Real Bedrock invocation (example). To enable, install `@aws-sdk/client-bedrock`
  // and ensure your environment has permission to call Bedrock.
  try {
    const loaded = tryLoadBedrockClient()
    if (!loaded.available) throw new Error('AWS Bedrock Runtime client not installed (install @aws-sdk/client-bedrock-runtime to enable)')
    const { BedrockRuntimeClient, InvokeModelCommand } = loaded.mod
    const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' })
    const modelId = options.modelId || process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3.5-sonnet'
    
    // Load system prompt from prompts.json if intent is present
    let systemPrompt = undefined
    try {
      const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf8'))
      if (options.intent && prompts.intents && prompts.intents[options.intent]) {
        systemPrompt = prompts.intents[options.intent].system
      }
    } catch (e) { /* ignore missing prompts file */ }

    // Construct payload for Claude 3 (default)
    // Note: Different models require different body structures.
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: "user", content: [{ type: "text", text: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }] }
      ]
    }

    const cmd = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(payload),
      contentType: 'application/json',
      accept: 'application/json'
    })
    
    const res = await client.send(cmd)
    
    // Decode and parse response
    const responseBody = new TextDecoder().decode(res.body)
    const parsed = JSON.parse(responseBody)
    const outputText = parsed.content?.[0]?.text || JSON.stringify(parsed)
    
    return { model: modelId, output: outputText }
  } catch (err) {
    console.error('Bedrock call failed:', err)
    return { model: 'bedrock-error', output: `Bedrock error: ${err.message}` }
  }
}

module.exports = { callBedrock, callBedrockMock };
