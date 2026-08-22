// twilio_ivr.js
// Simple Twilio Voice webhook handlers for IVR (DTMF) and speech-driven flows.
// Use this file's endpoints with Twilio's Voice webhook configuration.

const express = require('express')
const router = express.Router()
const { callBedrock } = require('./bedrock_placeholder')

function twimlResponse(body) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`
}

// Entrypoint: present simple menu (Hindi example). Use language mapping in production.
router.post('/ivr/welcome', (req, res) => {
  const body = `<Gather input="dtmf" numDigits="1" action="/ivr/menu" method="POST"><Say language="hi-IN">नमस्ते। मंडी भाव के लिए 1 दबाएँ. मिट्टी के बारे में बोलने के लिए 2 दबाएँ.</Say></Gather>`
  res.type('text/xml').send(twimlResponse(body))
})

// Menu handler: route by digit
router.post('/ivr/menu', express.urlencoded({ extended: false }), async (req, res) => {
  const digits = req.body.Digits
  if (digits === '1') {
    // Ask for crop name
    const body = `<Gather input="speech dtmf" timeout="5" action="/ivr/price" method="POST"><Say language="hi-IN">किस फसल की कीमत चाहिए? बोलें या टाइप करें।</Say></Gather>`
    return res.type('text/xml').send(twimlResponse(body))
  }
  if (digits === '2') {
    const body = `<Say language="hi-IN">कृपया अपने खेत के बारे में बताइए।</Say><Record maxLength="8" action="/ivr/soil-recorded"/>`
    return res.type('text/xml').send(twimlResponse(body))
  }
  const body = `<Say language="hi-IN">त्रुटि, फिर से प्रयास करें.</Say>`
  res.type('text/xml').send(twimlResponse(body))
})

// Price handler: takes speech or transcription from Twilio and responds with mocked price or LLM response
router.post('/ivr/price', express.urlencoded({ extended: false }), async (req, res) => {
  const speech = req.body.SpeechResult || req.body.Body || req.body.TranscriptionText || ''
  // Call Bedrock or use mocked /prices endpoint — for now call LLM with price_query intent
  const prompt = speech || 'wheat'
  const llmReq = { prompt, intent: 'price_query', lang: 'hi' }
  const out = await callBedrock(prompt, llmReq)
  const reply = out.output || 'मौजूदा मंडी भाव उपलब्ध नहीं है.'
  const body = `<Say language="hi-IN">${reply}</Say>`
  res.type('text/xml').send(twimlResponse(body))
})

// Soil recorded handler: Twilio will POST a recordingUrl; we can fetch, transcribe, or hand off
router.post('/ivr/soil-recorded', express.urlencoded({ extended: false }), async (req, res) => {
  const recordingUrl = req.body.RecordingUrl
  console.log('Received recording at', recordingUrl)
  // For demo: acknowledge receipt and tell user to expect SMS
  const body = `<Say language="hi-IN">धन्यवाद। हमने आपकी रिकॉर्डिंग प्राप्त कर ली है। परिणाम आपको एसएमएस द्वारा भेजे जाएंगे।</Say>`
  res.type('text/xml').send(twimlResponse(body))
})

module.exports = router
