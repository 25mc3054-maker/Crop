import React, { useEffect, useState } from 'react'
import axios from 'axios'
// import { Auth } from 'aws-amplify' // Uncomment after installing aws-amplify
// import awsconfig from './aws-exports' // Your Cognito config
import { API_BASE_URL } from './config'

export default function AmazonRates({ showAll = false, onClose = null }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ crop: '', quantity: '' })
  const [status, setStatus] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('farmer_token'))
  const [phone, setPhone] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [view, setView] = useState('rates') // 'rates' | 'orders' | 'profile'
  const [orders, setOrders] = useState([])
  const [profileData, setProfileData] = useState({ name: '', village: '', language: 'hi' })

  useEffect(() => {
    // Fetch rates. If `showAll` is true, request full public table (backend should support ?all=true)
    const key = localStorage.getItem('amazon_api_key')
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    if (key) headers['x-amazon-api-key'] = key

    const url = showAll ? `${API_BASE_URL}/amazon-rates/public` : `${API_BASE_URL}/amazon-rates`
    // For public full table, we call the server-side proxy which keeps the key on the server.
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
  }, [token, showAll])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(phone)) {
      alert('Please enter a valid 10-digit phone number')
      return
    }
    setLoginLoading(true)
    try {
      // TODO: Integrate AWS Amplify for real Cognito Login using API_BASE_URL if needed
      // const user = await Auth.signIn(phone, password)
      // const t = user.signInUserSession.accessToken.jwtToken
      
      // For demo purposes with the new backend, we can't easily fake a Cognito token.
      // You must configure Amplify in your main.jsx and use Auth.signIn here.
      alert('Backend is now using Cognito. Please integrate AWS Amplify in the frontend to get a valid token.')
      
      // localStorage.setItem('farmer_token', t)
      // setToken(t)
    } catch (err) {
      alert('Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('farmer_token')
    setShowForm(false)
    setView('rates')
    setProfileData({ name: '', village: '', language: 'hi' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: 'info', msg: 'Processing order...' })
    try {
      const res = await axios.post(`${API_BASE_URL}/sell-to-amazon`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStatus({ type: 'success', msg: `Order Placed! ID: ${res.data.orderId}` })
      setTimeout(() => {
        setShowForm(false)
        setStatus(null)
      }, 3000)
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to place order. Try again.' })
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(res.data.orders)
      setView('orders')
    } catch (e) { alert('Failed to fetch orders') }
  }

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProfileData({ 
        name: res.data.name || '', 
        village: res.data.village || '',
        language: res.data.language || 'hi'
      })
      setView('profile')
    } catch (e) { alert('Failed to fetch profile') }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.setItem('krishi_lang', profileData.language)
      alert('Profile updated! Reloading to apply language...')
      window.location.reload()
    } catch (e) { alert('Failed to update profile') }
  }

  const handleDownloadInvoice = async (order) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/invoice/${order.orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${order.orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Could not download invoice')
    }
  }

  const handleShare = async (order) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/invoice/${order.orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const file = new File([res.data], `invoice-${order.orderId}.pdf`, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Invoice', text: `Invoice for Order ${order.orderId}` })
        return
      }
    } catch (e) { if (e.name === 'AbortError') return }

    const text = `*INVOICE SUMMARY*\nOrder ID: ${order.orderId}\nCrop: ${order.crop}\nQuantity: ${order.quantity} qtl\nStatus: ${order.status}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (!token) {
    return (
      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', margin: '1rem 0', backgroundColor: '#f9f9f9', fontFamily: 'sans-serif' }}>
        <h3 style={{ color: '#232f3e' }}>Amazon Fresh Procurement</h3>
        <p>To view farmer-specific procurement rates please <a href="#/register">Register</a> or <a href="#/login">Login</a>.</p>
      </div>
    )
  }

  if (loading) return <div>Loading Amazon Rates...</div>
  if (!data) return null

  if (view === 'orders') {
    return (
      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', margin: '1rem 0', backgroundColor: '#f9f9f9', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ color: '#232f3e', margin: 0 }}>My Sales History</h3>
          <button onClick={() => setView('rates')} style={{ padding: '5px 10px', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Back to Rates</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#232f3e', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Crop</th>
              <th style={{ padding: '10px' }}>Qty (qtl)</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.orderId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{o.orderId}</td>
                <td style={{ padding: '10px' }}>{o.crop}</td>
                <td style={{ padding: '10px' }}>{o.quantity}</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: o.status === 'PAID' ? 'green' : 'orange' }}>{o.status}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleDownloadInvoice(o)} style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Download</button>
                  <button onClick={() => handleShare(o)} style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #25D366', marginLeft: '5px', backgroundColor: '#25D366', color: 'white' }}>Share</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (view === 'profile') {
    return (
      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', margin: '1rem 0', backgroundColor: '#f9f9f9', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ color: '#232f3e', margin: 0 }}>My Profile</h3>
          <button onClick={() => setView('rates')} style={{ padding: '5px 10px', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Back to Rates</button>
        </div>
        <form onSubmit={handleProfileSave} style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name:</label>
            <input 
              type="text" required placeholder="Enter your name"
              value={profileData.name}
              onChange={e => setProfileData({...profileData, name: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Village:</label>
            <input 
              type="text" required placeholder="Enter your village"
              value={profileData.village}
              onChange={e => setProfileData({...profileData, village: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Language Preference:</label>
            <select 
              value={profileData.language}
              onChange={e => setProfileData({...profileData, language: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="or">ଓଡ଼ିଆ (Odia)</option>
              <option value="as">অসমীয়া (Assamese)</option>
              <option value="en">English</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ff9900', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Save Profile</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', margin: '1rem 0', backgroundColor: '#f9f9f9', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ color: '#232f3e', margin: 0 }}>Amazon Fresh Procurement</h3>
        <div>
          <button onClick={fetchProfile} style={{ padding: '5px 10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>Profile</button>
          <button onClick={fetchOrders} style={{ padding: '5px 10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>My Sales</button>
          <button onClick={handleLogout} style={{ padding: '5px 10px', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#555' }}>
        {data.terms.map((t, i) => <span key={i} style={{ marginRight: '15px', display: 'inline-block' }}>✅ {t}</span>)}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: 'white' }}>
        <thead>
          <tr style={{ backgroundColor: '#232f3e', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Crop</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Price (₹/qtl)</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Note</th>
          </tr>
        </thead>
        <tbody>
          {data.rates.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{r.crop}</td>
              <td style={{ padding: '10px', fontWeight: 'bold', color: '#b12704' }}>₹{r.price}</td>
              <td style={{ padding: '10px', color: '#666' }}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {!showForm && (
        <button 
          onClick={() => setShowForm(true)}
          style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#ff9900', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#111' }}
        >
          Sell to Amazon Now
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, color: '#333' }}>Sell Your Crop</h4>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Crop:</label>
            <select 
              value={formData.crop} 
              onChange={e => setFormData({...formData, crop: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {data.rates.map(r => <option key={r.crop} value={r.crop}>{r.crop}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity (Quintals):</label>
            <input 
              type="number" min="1" required placeholder="e.g. 50"
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ff9900', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginRight: '10px' }}>Confirm Sale</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', backgroundColor: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          {status && <div style={{ marginTop: '10px', color: status.type === 'success' ? 'green' : 'red', fontWeight: 'bold' }}>{status.msg}</div>}
        </form>
      )}
    </div>
  )
}