import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { CACHE_KEYS, readLiveCache, writeLiveCache } from './livePreload';
import Navbar from './components/Navbar';

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
    <div className="container" style={{ padding: '24px 16px', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar title="🏛️ Government Schemes & Subsidies" showBack={true} onBack={onBack} />

      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#a7f3d0' }}>Official subsidies, financial grants, and direct verification portals.</p>
        {detectedState && <div style={{ display: 'inline-block', background: '#00eb78', color: '#000000', padding: '4px 10px', fontSize: 12, fontWeight: 900, marginTop: 8 }}>📍 Detected State: {detectedState}</div>}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <div className="spinner" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#000000', fontWeight: 800 }}>Fetching government scheme directories...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ background: '#fee2e2', border: '2px solid #ef4444', color: '#991b1b' }}>{error}</div>
      ) : schemes.length === 0 ? (
        <div className="card">No schemes found.</div>
      ) : (
        schemes.map((scheme) => (
          <div key={scheme.id} className="card" style={{ borderLeft: '6px solid #16a34a' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#000000', fontSize: 20, fontWeight: 900 }}>{scheme.title}</h3>
            <p style={{ margin: '0 0 8px 0', color: '#1f2937' }}><strong>Benefit:</strong> {scheme.benefit}</p>
            <p style={{ margin: '0 0 8px 0', color: '#1f2937' }}><strong>Eligibility:</strong> {scheme.eligibility}</p>
            <p style={{ margin: '0 0 14px 0', color: '#475569', fontSize: '13px', fontWeight: 600 }}>{scheme.ministry}</p>
            <a
              href={scheme.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-dark"
              style={{ textDecoration: 'none', padding: '10px 20px', fontSize: 13 }}
            >
              🚀 Apply on Official Portal →
            </a>
          </div>
        ))
      )}
    </div>
  );
}