import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import Navbar from './components/Navbar'
import { getDualCropName } from './languageHelper'

export default function AmazonRates({ showAll = false, onClose = null, onBack = null }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ crop: '', quantity: '' })
  const [status, setStatus] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('farmer_token'))
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [view, setView] = useState('rates')
  const [orders, setOrders] = useState([])
  const [regLang, setRegLang] = useState(() => localStorage.getItem('krishi_secondary_lang') || 'none')

  useEffect(() => {
    fetchRates()
    const updateLang = () => setRegLang(localStorage.getItem('krishi_secondary_lang') || 'none')
    window.addEventListener('krishi_lang_changed', updateLang)
    window.addEventListener('storage', updateLang)
    return () => {
      window.removeEventListener('krishi_lang_changed', updateLang)
      window.removeEventListener('storage', updateLang)
    }
  }, [token, showAll])

  const fetchRates = () => {
    setLoading(true)
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const url = showAll ? `${API_BASE_URL}/amazon-rates/public` : `${API_BASE_URL}/amazon-rates`
    const opts = showAll ? {} : { headers }
    axios.get(url, opts)
      .then(res => {
        setData(res.data)
        if (res.data.rates && res.data.rates.length > 0) {
          setFormData(prev => ({ ...prev, crop: res.data.rates[0].crop }))
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch rates', err)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setToken(null)
          localStorage.removeItem('farmer_token')
        }
        setLoading(false)
      })
  }

  const fetchOrders = async () => {
    if (!token) {
      alert('Please log in to view your orders.')
      return
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(res.data.orders || [])
      setView('orders')
    } catch (e) {
      console.error(e)
      alert('Could not fetch sales orders.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: 'info', msg: 'Processing procurement order...' })
    try {
      const res = await axios.post(`${API_BASE_URL}/sell-to-amazon`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStatus({ type: 'success', msg: `Order created successfully! ID: ${res.data.orderId}. Pickup scheduled within 48h.` })
      setShowForm(false)
      setFormData({ crop: data?.rates?.[0]?.crop || '', quantity: '' })
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Order placement failed. Check connection.' })
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '24px 16px', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
        <Navbar title="🌾 Direct Farm-Gate Procurement" showBack={true} onBack={onBack || onClose} />
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#000000', fontWeight: 800 }}>Loading procurement rates...</p>
        </div>
      </div>
    )
  }

  if (!data || !data.rates) {
    return (
      <div className="container" style={{ padding: '24px 16px', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
        <Navbar title="🌾 Direct Farm-Gate Procurement" showBack={true} onBack={onBack || onClose} />
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p style={{ color: '#000000', fontWeight: 800 }}>No rates currently available. Please check backend connection.</p>
        </div>
      </div>
    )
  }

  const categories = ['All', ...new Set(data.rates.map(r => r.category || 'General'))]

  const filteredRates = data.rates.filter(r => {
    const cropInfo = getDualCropName(r.symbol || r.crop, regLang)
    const matchesSearch = r.crop.toLowerCase().includes(search.toLowerCase()) ||
                          r.symbol?.toLowerCase().includes(search.toLowerCase()) ||
                          cropInfo.en.toLowerCase().includes(search.toLowerCase()) ||
                          cropInfo.reg.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || (r.category || 'General') === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container" style={{ padding: '24px 16px', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar title="🌾 Direct Farm-Gate Procurement" showBack={true} onBack={onBack || onClose} />

      {view === 'orders' ? (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#000000', fontWeight: 900, fontSize: 20 }}>📦 Your Direct Procurement Sales</h3>
            <button onClick={() => setView('rates')} className="btn btn-dark" style={{ padding: '8px 16px', fontSize: 13 }}>
              ← Back to Procurement Rates
            </button>
          </div>
          {orders.length === 0 ? (
            <p style={{ color: '#000000', fontWeight: 700 }}>No sales recorded yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Commodity</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderId}>
                    <td style={{ fontWeight: 800 }}>{o.orderId}</td>
                    <td style={{ fontWeight: 800 }}>{o.crop}</td>
                    <td>{o.quantity} Quintals</td>
                    <td>
                      <span style={{ padding: '2px 8px', background: o.status === 'PAID' ? '#bbf7d0' : '#fef08a', color: '#000000', fontWeight: 900, border: '1px solid #000' }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'inline-block', background: '#bbf7d0', color: '#000000', padding: '3px 8px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6, border: '1px solid #16a34a' }}>
                ⚡ Direct Market Procurement
              </div>
              <h2 style={{ color: '#000000', margin: 0, fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                🌾 Direct Farm-Gate Procurement Rates
              </h2>
              <div style={{ fontSize: 13, color: '#1f2937', marginTop: 4, fontWeight: 600 }}>
                Powered by <strong>Commodities-API</strong> (700+ Global & Domestic Commodities)
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => window.location.hash = '#/market-prices'} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                📊 Market Explorer
              </button>
              <button onClick={fetchOrders} className="btn btn-dark" style={{ padding: '8px 16px', fontSize: 13 }}>
                📦 My Sales
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: '20px', background: '#ffffff', padding: '12px 16px', border: '2px solid #16a34a' }}>
            {(data.terms || []).map((t, i) => (
              <span key={i} style={{ fontSize: '0.85rem', color: '#000000', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                ✅ {t}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input 
              type="text" 
              placeholder="🔍 Search crops (Wheat, Rice, Coffee, Cotton, Soybean, Spices)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 220, backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a' }}
            />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ width: 'auto', minWidth: 180, backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a' }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto', border: '2px solid #16a34a', marginBottom: 20 }}>
            <table>
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <th>Commodity</th>
                  <th>Category</th>
                  <th>Benchmark Price</th>
                  <th>24h Market Trend</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((r, i) => {
                  const cropInfo = getDualCropName(r.symbol || r.crop, regLang)
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 900, color: '#000000', fontSize: 15 }}>
                        {cropInfo.icon} {cropInfo.en} {regLang !== 'none' && cropInfo.reg ? `(${cropInfo.reg})` : ''}
                      </td>
                      <td style={{ color: '#1f2937', fontWeight: 700 }}>{r.category || 'General'}</td>
                      <td style={{ fontWeight: 900, color: '#065f46', fontSize: 16 }}>₹{r.priceInr || r.price} / {r.unit}</td>
                      <td>
                        <span style={{ fontWeight: 900, color: (r.change24h || 0) >= 0 ? '#15803d' : '#b91c1c' }}>
                          {(r.change24h || 0) >= 0 ? '▲ +' : '▼ '}{r.change24h || 0}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, crop: r.crop }));
                            setShowForm(true);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: 12 }}
                        >
                          🚜 Sell
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-dark"
              style={{ padding: '14px 28px', fontSize: 14 }}
            >
              ➕ Initiate Direct Procurement Sale
            </button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '20px', backgroundColor: '#ffffff', border: '2px solid #16a34a' }}>
              <h4 style={{ margin: '0 0 14px 0', color: '#000000', fontSize: 18, fontWeight: 900 }}>🌾 Place Procurement Sale Order</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '16px' }}>
                <div>
                  <label style={{ color: '#000000', fontWeight: 800 }}>Select Commodity:</label>
                  <select 
                    value={formData.crop} 
                    onChange={e => setFormData({...formData, crop: e.target.value})}
                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a' }}
                  >
                    {(data.rates || []).map(r => {
                      const cInfo = getDualCropName(r.symbol || r.crop, regLang)
                      return (
                        <option key={r.crop} value={r.crop}>
                          {cInfo.en} {regLang !== 'none' && cInfo.reg ? `(${cInfo.reg})` : ''} - ₹{r.priceInr || r.price}/{r.unit}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#000000', fontWeight: 800 }}>Quantity (Quintals):</label>
                  <input 
                    type="number" min="1" required placeholder="e.g. 25"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button type="submit" className="btn btn-dark" style={{ padding: '12px 24px' }}>
                  ✓ Confirm Sale Order
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost" style={{ borderColor: '#000000', color: '#000000', padding: '12px 20px' }}>
                  Cancel
                </button>
              </div>
              {status && (
                <div style={{ marginTop: '14px', color: status.type === 'success' ? '#15803d' : '#b91c1c', fontWeight: 800, fontSize: 14 }}>
                  {status.msg}
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  )
}