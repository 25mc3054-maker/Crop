import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

export default function Schemes({ onBack }) {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [applyState, setApplyState] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState('government')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch schemes on mount and whenever category changes
  useEffect(() => {
    fetchSchemes()
    const iv = setInterval(() => fetchSchemes(), 60 * 1000) // refresh every 60s
    return () => clearInterval(iv)
  }, [category])

  const fetchSchemes = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/schemes`, { params: { category } })
      setSchemes(res.data.schemes || [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch schemes', err)
    } finally {
      setLoading(false)
    }
  }

  const startApply = (id) => {
    setApplyState(prev => ({ ...prev, [id]: { name: '', phone: '', details: '' } }))
  }

  const updateField = (id, field, value) => {
    setApplyState(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }))
  }

  const submitApplication = async (schemeId) => {
    const data = applyState[schemeId]
    if (!data || !data.name || !data.phone) {
      setToast({ type: 'error', message: 'Please enter name and phone' })
      return
    }
    // basic phone validation (10 digits allowed with optional +91)
    const phoneNorm = data.phone.replace(/\s|-/g, '')
    if (!/^((\+91)?\d{10}|\d{10})$/.test(phoneNorm)) {
      setToast({ type: 'error', message: 'Enter a valid 10-digit phone number' })
      return
    }
    try {
      setSubmitting(true)
      const res = await axios.post(`${API_BASE_URL}/schemes/apply`, { schemeId, ...data })
      if (res.data && res.data.ok) {
        setToast({ type: 'success', message: 'Application submitted. Ref: ' + res.data.application.id })
        // Clear form
        setApplyState(prev => ({ ...prev, [schemeId]: null }))
      } else {
        setToast({ type: 'error', message: 'Failed to submit application' })
      }
    } catch (err) {
      console.error('Apply error', err)
      setToast({ type: 'error', message: 'Submission failed: ' + (err.response?.data?.error || err.message) })
    } finally {
      setSubmitting(false)
    }
  }

  // Toast for user feedback
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="container">
      {toast && (
        <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 2000 }}>
          <div className="card" style={{ padding: '12px 16px', borderRadius: 10, minWidth: 260, background: toast.type === 'success' ? 'linear-gradient(135deg,#10b981,#34d399)' : 'linear-gradient(135deg,#ff7a7a,#ffb86b)' }}>
            <div style={{ fontWeight: 800 }}>{toast.message}</div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <button className="big" onClick={() => { if (onBack) onBack(); else window.location.hash = '#/dashboard' }} style={{ marginBottom: '6px' }}>&larr; Back</button>
          <h1 style={{ marginTop: 6 }}>🏛️ Schemes & Support</h1>
          <p className="hint">Browse government schemes or loans & insurance products. Primary action opens the apply page when available.</p>
        </div>
        <div style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 12 }}>Last updated:</div>
          <div style={{ fontWeight: 700 }}>{lastUpdated ? lastUpdated.toLocaleString() : '—'}</div>
        </div>
      </div>

      {/* Tabs / Switches */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 12 }}>
        <button className={`big`} onClick={() => setCategory('government')} style={{ background: category === 'government' ? 'linear-gradient(135deg,#67f4ff,#7c4dff)' : undefined }}>Government Schemes</button>
        <button className={`big`} onClick={() => setCategory('finance')} style={{ background: category === 'finance' ? 'linear-gradient(135deg,#67f4ff,#7c4dff)' : undefined }}>Loans & Insurance</button>
      </div>

      {loading ? <div className="card" style={{ marginTop: 16 }}>Loading schemes...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {schemes.map(s => (
            <div key={s.id} className="card no-glow">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{s.name}</h3>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{s.provider} • {s.type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {/* For government category: only show official apply link (or fallback search). No in-site apply form. */}
                  {category === 'government' ? (
                    s.applyLink ? (
                      <a href={s.applyLink} target="_blank" rel="noreferrer" className="big" style={{ padding: '10px 16px' }}>Apply</a>
                    ) : (
                      <a href={`https://data.gov.in/search/site/${encodeURIComponent(s.name)}`} target="_blank" rel="noreferrer" className="big" style={{ padding: '10px 16px' }}>More Info</a>
                    )
                  ) : (
                    // finance tab: keep official link if present, otherwise allow in-site apply
                    s.applyLink ? (
                      <a href={s.applyLink} target="_blank" rel="noreferrer" className="big" style={{ padding: '10px 16px' }}>Apply</a>
                    ) : (
                      <button className="big" onClick={() => startApply(s.id)}>Apply</button>
                    )
                  )}
                </div>
              </div>
              <p style={{ marginTop: 10, color: 'var(--text-tertiary)' }}>{s.description}</p>
              <div style={{ marginTop: 8 }}>
                <strong>Eligibility:</strong>
                <p style={{ marginTop: 6, color: 'var(--text-tertiary)' }}>{s.eligibility}</p>
              </div>

              {applyState[s.id] && (
                <div style={{ marginTop: 12 }}>
                  <label>Name</label>
                  <input value={applyState[s.id].name} onChange={e => updateField(s.id, 'name', e.target.value)} placeholder="Your full name" />
                  <label style={{ marginTop: 8 }}>Phone</label>
                  <input value={applyState[s.id].phone} onChange={e => updateField(s.id, 'phone', e.target.value)} placeholder="+91xxxxxxxxxx" />
                  <label style={{ marginTop: 8 }}>Notes / Details</label>
                  <textarea value={applyState[s.id].details} onChange={e => updateField(s.id, 'details', e.target.value)} placeholder="Any supporting information" />
                  <div style={{ marginTop: 10, display: 'flex', gap: '8px' }}>
                    <button className="big" onClick={() => submitApplication(s.id)} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Application'}</button>
                    <button className="big" style={{ background: 'linear-gradient(135deg,#a0aec0, #718096)' }} onClick={() => setApplyState(prev => ({ ...prev, [s.id]: null }))}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
