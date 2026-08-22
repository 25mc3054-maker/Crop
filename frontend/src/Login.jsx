import React, { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'

export default function Login({ onDone }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')

  const sendOtp = async (e) => {
    e && e.preventDefault()
    if (!/^\d{10}$/.test(phone)) return alert('Enter valid 10-digit phone number')
    setLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/send-otp`, { phone })
      setOtpSent(true)
      alert('OTP sent to your mobile number!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const verifyOtp = async (e) => {
    e && e.preventDefault()
    if (!otp || otp.length !== 6) return alert('Enter valid 6-digit OTP')
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { phone, otp })
      localStorage.setItem('farmer_token', res.data.token)
      alert('Login successful!')
      onDone && onDone()
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const loginWithPassword = async (e) => {
    e && e.preventDefault()
    if (!/^\d{10}$/.test(phone)) return alert('Enter valid 10-digit phone number')
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { phone, password })
      localStorage.setItem('farmer_token', res.data.token)
      alert('Login successful!')
      onDone && onDone()
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <section className="hero">
      <div className="hero-card" style={{ maxWidth: 520 }}>
        <h2 style={{ marginBottom: 8, fontSize: 26 }}>🌾 Krishi-Net</h2>
        <h3 style={{ marginBottom: 20, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px', fontSize: 13 }}>Farmer Portal</h3>
        
        {!usePassword ? (
          <form onSubmit={otpSent ? verifyOtp : sendOtp}>
            <div style={{ marginBottom: 18 }}>
              <label>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={otpSent}
              />
            </div>

            {otpSent && (
              <div style={{ marginBottom: 18 }}>
                <label>Enter OTP</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength="6"
                  style={{ letterSpacing: 4, textAlign: 'center', fontWeight: 700 }}
                />
                <div style={{ marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setOtpSent(false); setOtp('') }}>← Change number</button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-block">
              {loading ? '⏳ Please wait...' : (otpSent ? '✓ Verify & Login' : '📱 Send OTP')}
            </button>
          </form>
        ) : (
          <form onSubmit={loginWithPassword}>
            <div style={{ marginBottom: 18 }}>
              <label>Mobile Number</label>
              <input type="tel" placeholder="Enter 10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label>Password</label>
              <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-block">{loading ? '⏳ Logging in...' : '🔐 Login with Password'}</button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setUsePassword(!usePassword)}>{usePassword ? '← Use OTP instead' : 'Use Password instead →'}</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>New to Krishi-Net?</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => window.location.hash = '#/register'}>📝 Register Now</button>
        </div>
      </div>
    </section>
  )
}
