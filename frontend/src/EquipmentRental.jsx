import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import { CACHE_KEYS, readLiveCache, writeLiveCache } from './livePreload'

export default function EquipmentRental({ onBack }) {
  const cachedEquipment = readLiveCache(CACHE_KEYS.equipment, 20 * 60 * 1000)
  const [agencies, setAgencies] = useState(cachedEquipment?.data?.agencies || [])
  const [loading, setLoading] = useState(!cachedEquipment)
  const [error, setError] = useState(null)
  const [locationLabel, setLocationLabel] = useState(cachedEquipment?.data?.locationLabel || '')
  const [lastUpdated, setLastUpdated] = useState(cachedEquipment ? new Date(cachedEquipment.ts).toLocaleTimeString() : '')
  const [searchRadiusKm, setSearchRadiusKm] = useState(cachedEquipment?.data?.searchRadiusKm || null)

  useEffect(() => {
    loadNearbyAgencies(true)

    const refresh = () => loadNearbyAgencies(false)
    const interval = setInterval(refresh, 120000)
    const onFocus = () => refresh()
    const onOnline = () => refresh()
    const onVisibility = () => {
      if (!document.hidden) refresh()
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const fetchAgencies = async (coords = null, showLoader = true) => {
    try {
      if (showLoader) setLoading(true)
      setError(null)

      const params = {}
      if (coords?.lat && coords?.lon) {
        params.lat = coords.lat
        params.lon = coords.lon
      }

      const res = await axios.get(`${API_BASE_URL}/equipment-rentals/nearby`, { params })
      setAgencies(res.data.agencies || [])
      setLocationLabel(res.data.locationLabel || 'Near your location')
      setSearchRadiusKm(res.data.searchRadiusKm || null)
      setLastUpdated(new Date().toLocaleTimeString())
      writeLiveCache(CACHE_KEYS.equipment, res.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to load nearby equipment rentals.')
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  const loadNearbyAgencies = (showLoader = true) => {
    if (!navigator.geolocation) {
      fetchAgencies(null, showLoader)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchAgencies({ lat: position.coords.latitude, lon: position.coords.longitude }, showLoader)
      },
      () => {
        fetchAgencies(null, showLoader)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#f8fafc', cursor: 'pointer' }}>&larr; Back to Dashboard</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Equipment Rental Near You</h1>
        <button onClick={() => loadNearbyAgencies(false)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
          Refresh Live Data
        </button>
      </div>

      <p style={{ color: '#cbd5e1', marginTop: '10px' }}>{locationLabel || 'Detecting your location...'}</p>
      <p style={{ color: '#94a3b8', marginBottom: '14px', fontSize: '13px' }}>
        Auto updates every 2 minutes{searchRadiusKm ? ` • Search radius: ${searchRadiusKm} km` : ''}{lastUpdated ? ` • Last updated: ${lastUpdated}` : ''}
      </p>

      {loading && <p>Loading nearby agencies and equipment prices...</p>}
      {error && <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>{error}</div>}

      {!loading && !error && agencies.length === 0 && (
        <div className="card">No nearby rental agencies found right now. Try again shortly.</div>
      )}

      {!loading && !error && agencies.map((agency) => (
        <div key={agency.id} className="card" style={{ borderLeft: '4px solid #0ea5e9' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc' }}>{agency.name}</h3>
          <p style={{ margin: '0 0 6px 0', color: '#cbd5e1' }}><strong>Phone:</strong> {agency.phone}</p>
          <p style={{ margin: '0 0 6px 0', color: '#cbd5e1' }}><strong>Distance:</strong> {agency.distanceKm} km</p>
          <p style={{ margin: '0 0 12px 0', color: '#94a3b8' }}>{agency.address}</p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' }}>Equipment</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' }}>₹ / Hour</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' }}>₹ / Day</th>
                </tr>
              </thead>
              <tbody>
                {(agency.equipments || []).map((item, idx) => (
                  <tr key={`${agency.id}-${idx}`}>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc' }}>{item.name}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}>₹{item.pricePerHour}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}>₹{item.pricePerDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '12px' }}>
            <a
              href={agency.mapUrl}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-block', padding: '9px 14px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: '#fff', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Open on Map
            </a>
            <span style={{ marginLeft: '10px', color: '#94a3b8', fontSize: '12px' }}>Price source: {agency.priceSource || 'listed'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
