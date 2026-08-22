import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { CACHE_KEYS, readLiveCache, writeLiveCache } from './livePreload';

export default function Notifications({ onBack }) {
  const cachedSchemes = readLiveCache(CACHE_KEYS.schemes, 30 * 60 * 1000);
  const [schemes, setSchemes] = useState(cachedSchemes?.data?.schemes || []);
  const [loading, setLoading] = useState(!cachedSchemes);
  const [error, setError] = useState(null);
  const [detectedState, setDetectedState] = useState(cachedSchemes?.data?.detectedState || '');
  const [lastUpdated, setLastUpdated] = useState(cachedSchemes ? new Date(cachedSchemes.ts).toLocaleTimeString() : '');

  useEffect(() => {
    loadSchemesWithLocation();

    const refreshSchemes = () => loadSchemesWithLocation(false);
    const interval = setInterval(refreshSchemes, 120000);
    const onFocus = () => refreshSchemes();
    const onOnline = () => refreshSchemes();
    const onVisibility = () => {
      if (!document.hidden) refreshSchemes();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const fetchSchemes = async (coords = null, showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const params = {};
      if (coords?.lat && coords?.lon) {
        params.lat = coords.lat;
        params.lon = coords.lon;
      }
      const res = await axios.get(`${API_BASE_URL}/government-schemes`, { params });
      setSchemes(res.data.schemes || []);
      setDetectedState(res.data.detectedState || '');
      setLastUpdated(new Date().toLocaleTimeString());
      writeLiveCache(CACHE_KEYS.schemes, res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load government schemes. Please try again.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const loadSchemesWithLocation = (showLoader = true) => {
    if (!navigator.geolocation) {
      fetchSchemes(null, showLoader);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchSchemes({ lat: position.coords.latitude, lon: position.coords.longitude }, showLoader);
      },
      () => {
        fetchSchemes(null, showLoader);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#f8fafc', cursor: 'pointer' }}>&larr; Back to Dashboard</button>
      <h1>Government Schemes for Farmers</h1>
      <p style={{ color: '#cbd5e1', marginBottom: '14px' }}>Official schemes with direct apply/check links.</p>
      {detectedState && <p style={{ color: '#10b981', marginBottom: '14px' }}>Detected State: {detectedState}</p>}
      {lastUpdated && <p style={{ color: '#94a3b8', marginBottom: '14px', fontSize: '13px' }}>Live updates every 2 minutes • Last updated: {lastUpdated}</p>}

      {loading ? <p>Loading schemes...</p> : error ? <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>{error}</div> : schemes.length === 0 ? <p>No schemes found.</p> : (
        schemes.map((scheme) => (
          <div key={scheme.id} className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc' }}>{scheme.title}</h3>
            <p style={{ margin: '0 0 8px 0', color: '#cbd5e1' }}><strong>Benefit:</strong> {scheme.benefit}</p>
            <p style={{ margin: '0 0 8px 0', color: '#cbd5e1' }}><strong>Eligibility:</strong> {scheme.eligibility}</p>
            <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '13px' }}>{scheme.ministry}</p>
            <a
              href={scheme.applyUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Apply
            </a>
          </div>
        ))
      )}
    </div>
  );
}