import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import { CACHE_KEYS, readLiveCache, writeLiveCache } from './livePreload'
import Navbar from './components/Navbar'

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
        fetchAgencies(
          {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          },
          showLoader
        )
      },
      () => {
        fetchAgencies(null, showLoader)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  return (
    <div className="container" style={{ padding: '24px 16px', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar title="🚜 Farm Equipment Rental" showBack={true} onBack={onBack} />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <p style={{ color: '#a7f3d0', marginTop: 4, margin: 0 }}>{locationLabel || 'Detecting your farm coordinates...'}</p>
        </div>
        <button onClick={() => loadNearbyAgencies(false)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
          🔄 Refresh Live Feed
        </button>
      </div>

      <p style={{ color: '#cbd5e1', marginBottom: '16px', fontSize: '13px' }}>
        Auto updates every 2 minutes{searchRadiusKm ? ` • Search radius: ${searchRadiusKm} km` : ''}{lastUpdated ? ` • Last updated: ${lastUpdated}` : ''}
      </p>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <div className="spinner" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#000000', fontWeight: 800 }}>Loading nearby equipment rental agencies...</p>
        </div>
      )}
      
      {error && <div className="card" style={{ background: '#fee2e2', border: '2px solid #ef4444', color: '#991b1b' }}>{error}</div>}

      {!loading && !error && agencies.length === 0 && (
        <div className="card">No nearby rental agencies found right now. Try again shortly.</div>
      )}

      {!loading && !error && agencies.map((agency) => (
        <div key={agency.id} className="card" style={{ borderLeft: '6px solid #16a34a' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#000000', fontSize: 20, fontWeight: 900 }}>{agency.name}</h3>
          <p style={{ margin: '0 0 6px 0', color: '#1f2937' }}><strong>Phone:</strong> {agency.phone}</p>
          <p style={{ margin: '0 0 6px 0', color: '#1f2937' }}><strong>Distance:</strong> {agency.distanceKm} km</p>
          <p style={{ margin: '0 0 14px 0', color: '#475569', fontWeight: 600 }}>{agency.address}</p>

          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>₹ / Hour</th>
                  <th>₹ / Day</th>
                </tr>
              </thead>
              <tbody>
                {(agency.equipments || []).map((item, idx) => (
                  <tr key={`${agency.id}-${idx}`}>
                    <td style={{ fontWeight: 800 }}>{item.name}</td>
                    <td style={{ fontWeight: 800, color: '#065f46' }}>₹{item.pricePerHour}</td>
                    <td style={{ fontWeight: 800, color: '#065f46' }}>₹{item.pricePerDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={agency.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-dark"
              style={{ textDecoration: 'none', padding: '10px 18px', fontSize: 13 }}
            >
              🗺️ Open in Google Maps
            </a>
            <span style={{ color: '#475569', fontSize: '12px', fontWeight: 700 }}>Price source: {agency.priceSource || 'listed catalog'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
