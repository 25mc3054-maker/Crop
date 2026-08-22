#!/usr/bin/env node
/**
 * Generate sample audio prompts using Amazon Polly and save to frontend/public/audio/
 * Requires AWS credentials configured and `S3_TTS_BUCKET` if you want to also upload.
 * Usage: node generate_audio.js --out ./frontend/public/audio
 */
const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk')
const argv = require('minimist')(process.argv.slice(2))

const outDir = argv.out || argv._[0] || path.join(__dirname, '..', 'frontend', 'public', 'audio')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const prompts = require('../backend/prompts.json')
const ttsMap = require('../backend/tts_lang_map.json')

const polly = new AWS.Polly({ region: process.env.AWS_REGION || 'ap-south-1' })

async function synth(text, voice, lang, outFile) {
  const params = { Text: text, OutputFormat: 'mp3', VoiceId: voice }
  const res = await polly.synthesizeSpeech(params).promise()
  if (!res.AudioStream) throw new Error('No audio')
  fs.writeFileSync(outFile, res.AudioStream)
  console.log('Wrote', outFile)
}

async function main() {
  // Build short welcome prompt per language
  const suggestions = {
    hi: 'नमस्ते, कैसे मदद चाहिए? मंडी भाव जानने के लिए बोलें, या मिट्टी फोटो भेजें।',
    en: 'Hello, how can I help? Ask prices or upload a soil photo.'
  }

  for (const lang of Object.keys(ttsMap)) {
    const map = ttsMap[lang]
    const voice = map.pollyVoice || 'Aditi'
    const text = suggestions[lang] || suggestions['en']
    const outFile = path.join(outDir, `${lang}.mp3`)
    try {
      await synth(text, voice, map.pollyLang || 'hi-IN', outFile)
    } catch (err) {
      console.warn('Polly synth failed for', lang, err.message)
      // write placeholder file
      fs.writeFileSync(outFile, Buffer.from(''))
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
