import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import { preloadDashboardData } from './livePreload'

export default function Dashboard({ onLogout }) {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Load user info from token
    try {
      const token = localStorage.getItem('farmer_token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserName(payload.name || payload.phone || 'Farmer')
      }
    } catch (e) {
      console.error('Failed to decode token', e)
    }

    // Fetch live mandi prices
    fetchPrices()
    preloadDashboardData().catch(() => {})
    const interval = setInterval(fetchPrices, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchPrices = async () => {
    try {
      const crops = ['wheat', 'rice', 'maize', 'sugarcane', 'cotton', 'soybean', 'mustard', 'chickpea']
      const promises = crops.map(crop => 
        axios.get(`${API_BASE_URL}/prices`, { params: { crop } })
          .then(res => ({ crop, ...res.data }))
          .catch(e => ({ crop, price: 'N/A', unit: '', error: true }))
      )
      const results = await Promise.all(promises)
      setPrices(results)
    } catch (e) {
      console.error('Failed to fetch prices', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('farmer_token')
    onLogout && onLogout()
  }

  return (
    <div style={{ minHeight: '100vh', padding: 20 }}>
      <div className="container">
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>🌾 Krishi-Net Dashboard</h1>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)' }}>Welcome back, <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{userName}!</span></p>
          </div>
          <div>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ background: 'linear-gradient(135deg,#ff7aa0,#a855f7)', color: '#fff', border: 'none' }}>🚪 Logout</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 18px 0', color: 'var(--primary-light)' }}>📊 Live Mandi Prices</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 36 }}>
              <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, marginBottom: 12 }} aria-hidden></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading prices...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 18 }}>
              {prices.map((item, idx) => (
                <div key={idx} className="card" style={{ padding: 16, borderLeft: `4px solid ${item.error ? '#ff5f7d' : 'var(--primary)'}` }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{item.crop}</div>
                  <div style={{ fontSize: 22, color: item.error ? '#ff6a88' : 'var(--primary-light)', fontWeight: 800 }}>{item.error ? 'N/A' : `₹${item.price}`}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>{item.unit}</div>
                </div>
              ))}
            </div>
          )}
          <button onClick={fetchPrices} className="btn btn-primary">🔄 Refresh Prices</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
          {[
            {k: '#/soil-analyser', t: '🌱 Soil Health', d: 'Upload soil photos for detailed analysis'},
            {k: '#/weather', t: '☁️ Weather', d: '7-day weather forecast for your area'},
            {k: '#/community-news', t: '📰 Community News', d: 'Live farmer and agriculture news updates'},
            {k: '#/ai-assistant', t: '🤖 AI Assistant', d: 'Ask farming questions using voice or text'},
            {k: '#/schemes', t: '🏛️ Govt Schemes', d: 'View active farmer schemes and apply'},
            {k: '#/equipment', t: '🚜 Equipment', d: 'Rent or lend farming equipment'}
          ].map((card) => (
            <div key={card.k} className="card" style={{ cursor: 'pointer' }} onClick={() => window.location.hash = card.k}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--primary-light)', fontSize: 18, fontWeight: 700 }}>{card.t}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{card.d}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(124,77,255,0.04))' }}>
          <h3 style={{ margin: '0 0 12px 0', color: 'var(--primary-light)' }}>💬 Need Support?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>Contact our support team on WhatsApp for instant help</p>
          <button onClick={() => window.open('https://wa.me/919876543210?text=Hello%20Krishi-Net%20Support', '_blank')} className="btn btn-primary">💬 WhatsApp Support</button>
        </div>
      </div>
    </div>
  )
}
