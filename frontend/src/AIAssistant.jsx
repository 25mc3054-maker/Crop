import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import Navbar from './components/Navbar'
import { REGIONAL_LANGUAGES, playDualVoice } from './languageHelper'

export default function AIAssistant({ onBack }) {
  const [regLang, setRegLang] = useState(() => localStorage.getItem('krishi_secondary_lang') || 'none')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const updateLang = () => setRegLang(localStorage.getItem('krishi_secondary_lang') || 'none')
    window.addEventListener('krishi_lang_changed', updateLang)
    window.addEventListener('storage', updateLang)
    return () => {
      window.removeEventListener('krishi_lang_changed', updateLang)
      window.removeEventListener('storage', updateLang)
    }
  }, [])

  const currentLangObj = REGIONAL_LANGUAGES.find(l => l.code === regLang) || REGIONAL_LANGUAGES[0]

  const sendMessage = async (text) => {
    if (!text.trim()) return
    
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`${API_BASE_URL}/llm`, { prompt: text, lang: regLang === 'none' ? 'en' : regLang })
      const botOutput = res.data.output || 'I could not generate an answer.'
      const botMsg = { role: 'assistant', content: botOutput }
      setMessages(prev => [...prev, botMsg])

      // Speak answer using sequential speech
      playDualVoice(botOutput, regLang === 'none' ? '' : botOutput, regLang)
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your request.' }])
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      return alert('Voice recognition not supported in this browser')
    }
    
    const recognition = new SpeechRecognition()
    const langCodes = { te: 'te-IN', hi: 'hi-IN', kn: 'kn-IN', mr: 'mr-IN', ta: 'ta-IN', ml: 'ml-IN', bn: 'bn-IN', pa: 'pa-IN', gu: 'gu-IN', or: 'or-IN', as: 'as-IN', ur: 'ur-IN' }
    recognition.lang = langCodes[regLang] || 'en-IN'
    recognition.interimResults = false
    
    recognition.onresult = (ev) => {
      const text = ev.results[0][0].transcript
      sendMessage(text)
    }
    
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    
    setListening(true)
    recognition.start()
    recognitionRef.current = recognition
  }

  return (
    <div className="container" style={{ padding: '24px 16px', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar title="🤖 AI Agronomy Specialist" showBack={true} onBack={onBack} />

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-block', background: '#bbf7d0', color: '#000000', padding: '3px 8px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6, border: '1px solid #16a34a' }}>
              🤖 Generative Agronomy AI
            </div>
            <h2 style={{ margin: 0, color: '#000000', fontSize: '24px', fontWeight: 900 }}>
              AI Agronomist {regLang !== 'none' ? `(${currentLangObj.name})` : ''}
            </h2>
          </div>
        </div>

        {/* Message Log */}
        <div style={{ minHeight: '320px', maxHeight: '460px', overflowY: 'auto', background: '#ffffff', border: '2px solid #16a34a', padding: '16px', marginBottom: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌾</div>
              <p style={{ color: '#000000', fontWeight: 800, fontSize: 16 }}>Ask questions regarding crop pests, fertilizers, soil management, or market timings.</p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: 14, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  background: m.role === 'user' ? '#082d22' : '#e8f9ee',
                  color: m.role === 'user' ? '#ffffff' : '#000000',
                  border: m.role === 'user' ? '2px solid #000000' : '2px solid #16a34a',
                  fontWeight: 600,
                  fontSize: 14
                }}>
                  <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4, color: m.role === 'user' ? '#00eb78' : '#15803d' }}>
                    {m.role === 'user' ? 'Farmer' : 'Krishi AI Specialist'}
                  </div>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#15803d', fontWeight: 800, padding: '8px' }}>
              <div className="spinner" style={{ width: 24, height: 24, margin: 0, borderWidth: 3 }}></div>
              Thinking...
            </div>
          )}
        </div>

        {/* Input Controls */}
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Type your agricultural question here..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a' }}
          />
          <button type="button" onClick={startListening} className="btn btn-ghost" style={{ borderColor: '#000000', color: '#000000', padding: '12px 18px' }}>
            {listening ? '🔴 Listening...' : '🎤 Speak'}
          </button>
          <button type="submit" disabled={loading || !input.trim()} className="btn btn-dark" style={{ padding: '12px 24px' }}>
            Send →
          </button>
        </form>
      </div>
    </div>
  )
}
