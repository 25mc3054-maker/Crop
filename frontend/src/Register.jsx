import React, { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'

export default function Register({ onDone }) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [village, setVillage] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [step, setStep] = useState('register') // 'register' or 'verify'

  const sendOtp = async (e) => {
    e && e.preventDefault()
    if (!/^\d{10}$/.test(phone)) return alert('Enter valid 10-digit phone number')
    if (!name || !village) return alert('Please fill all fields')
    
    setLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, { phone, name, village, password })
      setOtpSent(true)
      setStep('verify')
      alert('OTP sent! Check your phone.')
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e) => {
    e && e.preventDefault()
    if (!otp || otp.length !== 6) return alert('Enter valid 6-digit OTP')
    
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-registration`, { phone, otp })
      localStorage.setItem('farmer_token', res.data.token)
      alert('Registration successful!')
      onDone && onDone()
    } catch (err) {
      alert(err.response?.data?.error || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="hero">
      <div className="hero-card" style={{ maxWidth: 520 }}>
        <h2 style={{ marginBottom: 6, fontSize: 22 }}>🌾 Krishi-Net</h2>
        <h3 style={{ marginBottom: 18, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px', fontSize: 13 }}>{step === 'register' ? 'Farmer Registration' : 'Verify OTP'}</h3>

        {step === 'register' ? (
          <form onSubmit={sendOtp}>
            <div style={{ marginBottom: 12 }}>
              <label>Phone</label>
              <input type="text" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Name</label>
              <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Village</label>
              <input type="text" placeholder="Your village" value={village} onChange={e => setVillage(e.target.value)} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label>Password (Optional)</label>
              <input type="password" placeholder="Password (leave blank for OTP-only login)" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-block">{loading ? 'Sending OTP...' : 'Send OTP'}</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => window.location.hash = '#/'} style={{ marginTop: 10 }}>Back to Login</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <div style={{ marginBottom: 12, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>OTP sent to <strong>{phone}</strong></p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Enter OTP</label>
              <input type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength="6" style={{ fontSize: 18, textAlign: 'center', letterSpacing: 4 }} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-block">{loading ? 'Verifying...' : 'Verify OTP'}</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep('register')} style={{ marginTop: 10 }}>Back</button>
          </form>
        )}
      </div>
    </section>
  )
}
