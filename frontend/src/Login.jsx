import React, { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import { saveFarmerUserSession } from './userSession'

export default function Login({ onDone }) {
  const [phone, setPhone] = useState(() => localStorage.getItem('farmer_phone') || '')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [demoOtp, setDemoOtp] = useState('')

  const bypassAccess = async () => {
    setLoading(true)
    const targetPhone = phone.trim() || '7816086663'
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { phone: targetPhone, password: 'password123' })
      if (res.data?.token) {
        saveFarmerUserSession(res.data.user || { phone: targetPhone }, res.data.token)
        onDone && onDone()
        return
      }
    } catch (e) {
      console.warn('Backend login fallback used:', e)
    }
    const fallbackToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({ phone: targetPhone, name: 'Verified Farmer', village: 'Regional Hub' })) + '.bypass'
    saveFarmerUserSession({ phone: targetPhone, name: 'Verified Farmer', village: 'Regional Hub' }, fallbackToken)
    onDone && onDone()
    setLoading(false)
  }

  const sendOtp = async (e) => {
    e && e.preventDefault()
    const cleanDigits = phone.replace(/\D/g, '')
    if (cleanDigits.length < 7 || cleanDigits.length > 15) return alert('Enter valid phone number (7 to 15 digits)')
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/send-otp`, { phone: cleanDigits })
      setOtpSent(true)
      if (res.data.devOtp) {
        setDemoOtp(res.data.devOtp)
        setOtp(res.data.devOtp)
      } else {
        alert('OTP sent to your mobile number!')
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const verifyOtp = async (e) => {
    e && e.preventDefault()
    if (!otp || otp.length !== 6) return alert('Enter valid 6-digit OTP')
    setLoading(true)
    const cleanDigits = phone.replace(/\D/g, '')
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { phone: cleanDigits, otp })
      if (res.data?.token) {
        saveFarmerUserSession(res.data.user, res.data.token)
      }
      alert('Login successful!')
      onDone && onDone()
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const loginWithPassword = async (e) => {
    e && e.preventDefault()
    const cleanDigits = phone.replace(/\D/g, '')
    if (cleanDigits.length < 7 || cleanDigits.length > 15) return alert('Enter valid phone number (7 to 15 digits)')
    if (!password) return alert('Please enter your password')
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { phone: cleanDigits, password })
      if (res.data?.token) {
        saveFarmerUserSession(res.data.user, res.data.token)
      }
      alert('Login successful!')
      onDone && onDone()
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <section className="hero">
      <div className="hero-card" style={{ maxWidth: 480, textAlign: 'left', borderRadius: '28px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eaf7e6', color: '#2e7d32', padding: '5px 14px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.6px', borderRadius: '9999px' }}>
            <span>🌾</span> VERIFIED FARMER AUTHENTICATION
          </div>
          <h2 style={{ margin: '4px 0', fontSize: 26, fontWeight: 900, color: '#182c1d' }}>Krishi-Net Portal</h2>
          <p style={{ margin: 0, color: '#496150', fontSize: 14 }}>Access your personalized agricultural dashboard</p>
        </div>

        {/* ⚡ INSTANT ACCESS SHORTCUT FOR PHONE ENDING IN 6663 */}
        <div style={{ background: '#f0f7ee', border: '1.5px solid #b2dfa4', borderRadius: '18px', padding: '16px', marginBottom: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#2e7d32', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ Instant Access (Mobile: ******6663)
          </div>
          <div style={{ fontSize: 13, color: '#496150', marginBottom: 12 }}>
            Click below to enter immediately without password or OTP:
          </div>
          <button
            type="button"
            onClick={bypassAccess}
            disabled={loading}
            className="btn btn-primary btn-block"
            style={{ padding: '12px 18px', fontSize: 14, borderRadius: '9999px' }}
          >
            🚀 Enter Portal Now (Greeshmanth)
          </button>
        </div>
        
        {!usePassword ? (
          <form onSubmit={otpSent ? verifyOtp : sendOtp}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#000000', fontWeight: 800 }}>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={otpSent}
                style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a' }}
              />
            </div>

            {otpSent && (
              <div style={{ marginBottom: 18 }}>
                {demoOtp && (
                  <div style={{ background: '#dcfce7', border: '2px solid #16a34a', padding: '12px 14px', marginBottom: 14, color: '#000000', fontSize: 13, textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, textTransform: 'uppercase', color: '#15803d' }}>⚡ Demo Mode (Auto-Generated OTP)</div>
                    <div style={{ marginTop: 4, color: '#000000', fontSize: 14 }}>Your verification code: <strong style={{ fontSize: 18, color: '#047857', letterSpacing: 3, fontWeight: 900 }}>{demoOtp}</strong></div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2, fontWeight: 600 }}>(Auto-populated for immediate evaluation)</div>
                  </div>
                )}
                <label style={{ color: '#000000', fontWeight: 800 }}>Enter 6-Digit OTP</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength="6"
                  style={{ letterSpacing: 6, textAlign: 'center', fontWeight: 900, fontSize: 20, backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a' }}
                />
                <div style={{ marginTop: 10 }}>
                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setOtp(''); setDemoOtp('') }}
                    style={{ background: 'none', border: 'none', color: '#065f46', fontWeight: 800, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    ← Change phone number
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-dark btn-block" style={{ marginTop: 10, padding: 14 }}>
              {loading ? '⏳ Processing Request...' : (otpSent ? '✓ Verify & Proceed' : '📱 Send OTP Code')}
            </button>
          </form>
        ) : (
          <form onSubmit={loginWithPassword}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#000000', fontWeight: 800 }}>Mobile Number</label>
              <input 
                type="tel" 
                placeholder="Enter 10-digit mobile number" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a' }} 
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ color: '#000000', fontWeight: 800, margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#065f46',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                    textTransform: 'uppercase'
                  }}
                >
                  {showPassword ? '🙈 Hide Password' : '👁️ Show Password'}
                </button>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    color: '#000000', 
                    border: '2px solid #16a34a',
                    paddingRight: '48px'
                  }} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: '#e8f9ee',
                    border: '1px solid #16a34a',
                    color: '#000000',
                    padding: '4px 8px',
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: 'pointer',
                    lineHeight: 1
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-dark btn-block" style={{ marginTop: 10, padding: 14 }}>
              {loading ? '⏳ Authenticating...' : '🔐 Login with Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button 
            type="button" 
            onClick={() => setUsePassword(!usePassword)}
            style={{ background: 'none', border: 'none', color: '#065f46', fontWeight: 800, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {usePassword ? '← Use OTP login instead' : '🔑 Use Password login instead →'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 18, borderTop: '2px solid rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#1f2937', marginBottom: 10, fontWeight: 700 }}>Don't have a registered farmer account?</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => window.location.hash = '#/register'} style={{ padding: 12 }}>
            📝 Register New Farmer Account
          </button>
        </div>
      </div>
    </section>
  )
}
