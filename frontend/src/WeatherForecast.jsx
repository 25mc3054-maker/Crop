import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { CACHE_KEYS, readLiveCache, writeLiveCache } from './livePreload';
import Navbar from './components/Navbar';

function isOtherCountryFarmer() {
  const cType = localStorage.getItem('farmer_country_type');
  if (cType === 'other') return true;
  const country = localStorage.getItem('farmer_country');
  if (country && country.toLowerCase() !== 'india') return true;
  try {
    const token = localStorage.getItem('farmer_token');
    if (token && token.includes('.')) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.countryType === 'other') return true;
      if (payload.country && payload.country.toLowerCase() !== 'india') return true;
    }
  } catch (e) {}
  return false;
}

function getRegisteredFarmerPincode() {
  if (isOtherCountryFarmer()) return null; // For other countries, do not use pincode
  const direct = localStorage.getItem('farmer_pincode');
  if (direct && /^\d{6}$/.test(direct.trim())) return direct.trim();
  try {
    const token = localStorage.getItem('farmer_token');
    if (token && token.includes('.')) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.pincode && /^\d{6}$/.test(payload.pincode.toString().trim())) {
        return payload.pincode.toString().trim();
      }
    }
  } catch (e) {}
  return null;
}

export default function WeatherForecast({ onBack }) {
  const cachedWeather = readLiveCache(CACHE_KEYS.weather, 15 * 60 * 1000);
  const [weatherSummary, setWeatherSummary] = useState(cachedWeather?.data || null);
  const [loading, setLoading] = useState(!cachedWeather);
  const [error, setError] = useState(null);
  const [customPincode, setCustomPincode] = useState('');
  const isInternational = isOtherCountryFarmer();
  const [activePincode, setActivePincode] = useState(isInternational ? '' : (getRegisteredFarmerPincode() || ''));
  const [isPincodeFallback, setIsPincodeFallback] = useState(false);
  const coordsRef = useRef(null);

  useEffect(() => {
    detectWeatherAutomatically();

    const refreshWeather = () => {
      if (coordsRef.current?.lat && coordsRef.current?.lon) {
        fetchAutoWeather(coordsRef.current.lat, coordsRef.current.lon, false);
      } else {
        detectWeatherAutomatically(false);
      }
    };

    const interval = setInterval(refreshWeather, 30000);
    const onFocus = () => refreshWeather();
    const onOnline = () => refreshWeather();
    const onVisibility = () => {
      if (!document.hidden) refreshWeather();
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

  const fetchAutoWeather = async (lat, lon, showLoader = true, pin = null) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const params = {};

      if (lat && lon) {
        params.lat = lat;
        params.lon = lon;
        setIsPincodeFallback(false);
      } else if (!isInternational && pin && /^\d{6}$/.test(pin.trim())) {
        params.pincode = pin.trim();
        setIsPincodeFallback(true);
      } else if (!isInternational) {
        const savedPin = activePincode || getRegisteredFarmerPincode();
        if (savedPin && /^\d{6}$/.test(savedPin.trim())) {
          params.pincode = savedPin.trim();
          setIsPincodeFallback(true);
        }
      }

      const { data } = await axios.get(`${API_BASE_URL}/weather/auto`, { params });
      setWeatherSummary(data);
      if (data.source === 'pincode' && !isInternational) {
        setIsPincodeFallback(true);
      } else {
        setIsPincodeFallback(false);
      }
      writeLiveCache(CACHE_KEYS.weather, data);
      if (showLoader) setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch weather data.');
      if (showLoader) setLoading(false);
    }
  };

  const detectWeatherAutomatically = (showLoader = true) => {
    // If device geolocation is unsupported or disabled
    if (!navigator.geolocation) {
      if (isInternational) {
        // For other country users: purely use location system (IP/Network location fallback)
        fetchAutoWeather(undefined, undefined, showLoader, null);
      } else {
        const pin = activePincode || getRegisteredFarmerPincode();
        fetchAutoWeather(undefined, undefined, showLoader, pin);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        coordsRef.current = { lat: position.coords.latitude, lon: position.coords.longitude };
        fetchAutoWeather(position.coords.latitude, position.coords.longitude, showLoader);
      },
      (geoError) => {
        console.warn('Geolocation failed or permission denied:', geoError.message);
        if (isInternational) {
          // For other country users: purely use location system (IP/Network location fallback)
          fetchAutoWeather(undefined, undefined, showLoader, null);
        } else {
          const pin = activePincode || getRegisteredFarmerPincode();
          fetchAutoWeather(undefined, undefined, showLoader, pin);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handlePincodeSearch = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(customPincode.trim())) {
      return alert('Please enter a valid 6-digit Indian PIN code');
    }
    setActivePincode(customPincode.trim());
    coordsRef.current = null;
    fetchAutoWeather(undefined, undefined, true, customPincode.trim());
  };

  const getNextRainText = () => {
    if (!weatherSummary?.nextRainAt) return 'No rain expected soon';
    return new Date(weatherSummary.nextRainAt).toLocaleString();
  };

  const registeredPin = !isInternational ? getRegisteredFarmerPincode() : null;

  return (
    <div className="container" style={{ padding: '24px 16px', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar title="☁️ Agricultural Weather Forecast" showBack={true} onBack={onBack} />
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#a7f3d0', fontSize: 14 }}>
          Hyper-local precipitation forecast and temperature tracking for field operations.
        </p>
      </div>

      {/* Location Status & Mode Banner */}
      <div 
        className="card" 
        style={{ 
          background: '#132e1b', 
          border: '1.5px solid #2e7d32', 
          color: '#ffffff', 
          padding: '16px 20px', 
          marginBottom: '20px',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📍 {isInternational ? 'Global Location System (International)' : 'Accurate Farm Location & Fallback'}
            </div>
            <div style={{ fontSize: 13, color: '#e2e8f0', marginTop: 2 }}>
              {isInternational ? (
                <span>
                  Using <strong>Device GPS & Satellite Location System</strong> for international agricultural weather forecasting.
                </span>
              ) : isPincodeFallback ? (
                <span>
                  Using Indian PIN code: <strong style={{ color: '#4ade80' }}>{weatherSummary?.locationLabel?.match(/PIN:\s*(\d+)/)?.[1] || activePincode || registeredPin}</strong> (Device GPS unavailable)
                </span>
              ) : (
                <span>
                  Using Live GPS Geolocation coordinates
                </span>
              )}
            </div>
          </div>

          {/* Quick Pincode Switcher Form (Shown only for Indian farmers) */}
          {!isInternational && (
            <form onSubmit={handlePincodeSearch} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="text" 
                placeholder="PIN (e.g. 521211)"
                value={customPincode}
                onChange={e => setCustomPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{
                  width: 130,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #4ade80',
                  background: '#ffffff',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: 13
                }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '7px 14px', borderRadius: '8px', fontSize: 13, fontWeight: 800 }}
              >
                Check PIN
              </button>
            </form>
          )}
        </div>
      </div>
      
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <div className="spinner" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#000000', fontWeight: 800 }}>Fetching live meteorological station data...</p>
        </div>
      )}
      
      {error && (
        <div className="card" style={{ background: '#fee2e2', border: '2px solid #ef4444', color: '#991b1b', marginBottom: 16 }}>
          <strong>⚠️ Weather Alert:</strong> {error}
        </div>
      )}
      
      {weatherSummary && (
        <div className="card" style={{ background: '#e8f9ee', border: '2px solid #16a34a', color: '#000000', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#bbf7d0', color: '#000000', padding: '5px 12px', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', border: '1px solid #16a34a', borderRadius: '9999px' }}>
              <span>📍</span> {weatherSummary.locationLabel || 'Near your farm coordinates'}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803d', background: '#ffffff', padding: '4px 12px', border: '1px solid #16a34a', borderRadius: '9999px' }}>
              🔄 Live synced every 30s
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '20px 0' }}>
            <div style={{ background: '#ffffff', padding: '20px', border: '2px solid #16a34a', borderRadius: '12px' }}>
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>Current Temperature</div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#065f46', marginTop: 4 }}>
                {Number(weatherSummary.temperatureC).toFixed(1)}°C
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '20px', border: '2px solid #16a34a', borderRadius: '12px' }}>
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>Precipitation Status</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: weatherSummary.willRain ? '#0284c7' : '#047857', marginTop: 8 }}>
                {weatherSummary.willRain ? '🌧️ Rain Predicted Soon' : '☀️ Clear / No Rain Expected'}
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', border: '2px solid #16a34a', borderRadius: '12px', marginBottom: 16 }}>
            <strong style={{ color: '#000000' }}>Expected Rain Schedule:</strong>
            <span style={{ marginLeft: 8, color: '#15803d', fontWeight: 800 }}>{getNextRainText()}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => detectWeatherAutomatically(true)} className="btn btn-dark" style={{ borderRadius: '8px' }}>
              🔄 Refresh Location Data
            </button>
            {!isInternational && registeredPin && (
              <button 
                onClick={() => {
                  coordsRef.current = null;
                  fetchAutoWeather(undefined, undefined, true, registeredPin);
                }} 
                className="btn btn-ghost" 
                style={{ borderRadius: '8px', border: '1.5px solid #16a34a', color: '#166534', fontWeight: 800 }}
              >
                🌾 Use My Registered PIN ({registeredPin})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}