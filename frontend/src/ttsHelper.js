import axios from 'axios'
import { API_BASE_URL } from './config'

export async function getTtsUrl(text, lang = 'hi', retryCount = 0) {
  try {
    const res = await axios.post(`${API_BASE_URL}/tts`, { text, languageCode: lang }, { timeout: 15000 })
    if (res.data.url) return res.data.url
    if (res.data.audioBase64) return 'data:audio/mp3;base64,' + res.data.audioBase64
    return null
  } catch (e) {
    console.error('TTS request failed', e)
    
    // Advanced: Retry logic for accessibility
    if (retryCount < 1) {
      console.log('Retrying TTS...')
      return getTtsUrl(text, lang, retryCount + 1)
    }

    // fallback to audio_manifest prebuilt file
    try {
      const am = await axios.get('/audio_manifest.json')
      const url = am.data[lang] || am.data['en']
      return url
    } catch (err) {
      return null
    }
  }
}

export async function playTtsFor(text, lang) {
  const url = await getTtsUrl(text, lang)
  if (!url) return
  const audio = new Audio(url)
  try { await audio.play() } catch (e) { console.warn('autoplay failed', e) }
}
