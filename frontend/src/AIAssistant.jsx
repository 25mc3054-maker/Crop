import React, { useState, useRef } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'

const LABELS = {
  hi: { title: 'कृषि-नेट AI सहायक', speak: 'बोलो', send: 'भेजें', thinking: 'सोच रहा हूँ...', placeholder: 'यहाँ अपना सवाल लिखें...' },
  en: { title: 'Krishi-Net AI Assistant', speak: 'Speak', send: 'Send', thinking: 'Thinking...', placeholder: 'Type your question here...' }
}

export default function AIAssistant({ onBack }) {
  const [lang, setLang] = useState('hi')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const l = LABELS[lang] || LABELS['en']

  const sendMessage = async (text) => {
    if (!text.trim()) return
    
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`${API_BASE_URL}/llm`, { prompt: text, lang })
      const botMsg = { role: 'assistant', content: res.data.output }
      setMessages(prev => [...prev, botMsg])

      // Try to play TTS
      try {
        const tts = await axios.post(`${API_BASE_URL}/tts`, { 
          text: res.data.output, 
          voice: 'Aditi', 
          languageCode: 'hi-IN' 
        })
        if (tts.data.audioBase64) {
          const audio = new Audio('data:audio/mp3;base64,' + tts.data.audioBase64)
          audio.play()
        }
      } catch (e) {
        console.error('TTS failed', e)
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your request.' }])
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return alert('Voice recognition not supported in this browser')
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
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
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '20px',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: '18px'
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '34px', fontWeight: 700 }}>{l.title}</h2>
        <button onClick={onBack} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
          ← Back
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <select value={lang} onChange={e => setLang(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15, 23, 42, 0.7)', color: '#f8fafc', minWidth: '170px' }}>
          <option value="hi">हिन्दी</option>
          <option value="en">English</option>
        </select>
      </div>

      <div style={{ 
        background: 'rgba(15, 23, 42, 0.65)', 
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: '14px', 
        padding: '20px', 
        minHeight: '400px', 
        maxHeight: '500px', 
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        {messages.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>Ask me anything about farming!</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            marginBottom: '15px', 
            padding: '12px', 
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: msg.role === 'user' ? 'rgba(59,130,246,0.20)' : 'rgba(16,185,129,0.18)',
            textAlign: msg.role === 'user' ? 'right' : 'left',
            color: '#f8fafc'
          }}>
            <strong style={{ color: msg.role === 'user' ? '#93c5fd' : '#6ee7b7' }}>{msg.role === 'user' ? 'You:' : 'AI:'}</strong>
            <p style={{ margin: '5px 0 0 0' }}>{msg.content}</p>
          </div>
        ))}
        {loading && <p style={{ color: '#94a3b8' }}>{l.thinking}</p>}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder={l.placeholder}
          style={{ 
            flex: 1, 
            padding: '12px', 
            border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: '10px',
            fontSize: '16px',
            background: 'rgba(15, 23, 42, 0.7)',
            color: '#f8fafc'
          }}
        />
        <button 
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{ 
            padding: '12px 24px', 
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
            color: 'white', 
            border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: '10px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {l.send}
        </button>
        <button 
          onClick={startListening}
          disabled={listening}
          style={{ 
            padding: '12px 24px', 
            background: listening ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
            color: 'white', 
            border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: '10px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {listening ? '🎤 Listening...' : '🎤 ' + l.speak}
        </button>
      </div>
      </div>
    </div>
  )
}
