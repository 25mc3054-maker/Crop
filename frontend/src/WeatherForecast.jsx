import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { CACHE_KEYS, readLiveCache, writeLiveCache } from './livePreload';

export default function WeatherForecast({ onBack }) {
  const cachedWeather = readLiveCache(CACHE_KEYS.weather, 15 * 60 * 1000);
  const [weatherSummary, setWeatherSummary] = useState(cachedWeather?.data || null);
  const [loading, setLoading] = useState(!cachedWeather);
  const [error, setError] = useState(null);
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

  const fetchAutoWeather = async (lat, lon, showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const params = {};
      if (lat && lon) { params.lat = lat; params.lon = lon; }

      const { data } = await axios.get(`${API_BASE_URL}/weather/auto`, { params });
      setWeatherSummary(data);
      writeLiveCache(CACHE_KEYS.weather, data);
      if (showLoader) setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch weather data.');
      if (showLoader) setLoading(false);
    }
  };

  const detectWeatherAutomatically = (showLoader = true) => {
    if (!navigator.geolocation) {
      fetchAutoWeather(undefined, undefined, showLoader);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        coordsRef.current = { lat: position.coords.latitude, lon: position.coords.longitude };
        fetchAutoWeather(position.coords.latitude, position.coords.longitude, showLoader);
      },
      () => {
        fetchAutoWeather(undefined, undefined, showLoader);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getNextRainText = () => {
    if (!weatherSummary?.nextRainAt) return 'No rain expected soon';
    return new Date(weatherSummary.nextRainAt).toLocaleString();
  };

  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem', padding: '8px 16px' }}>&larr; Back to Dashboard</button>
      <h1>Weather Forecast</h1>
      
      {loading && <p>Loading weather data...</p>}
      {error && <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>{error}</div>}

      {weatherSummary && (
        <div className="card" style={{ background: 'linear-gradient(to bottom right, #4facfe, #00f2fe)', color: 'white' }}>
          <h2 style={{ marginTop: 0, marginBottom: '8px' }}>{weatherSummary.locationLabel || 'Near your location'}</h2>
          <div style={{ fontSize: '2.8rem', fontWeight: 'bold', marginBottom: '10px' }}>
            {Number(weatherSummary.temperatureC).toFixed(1)}°C
          </div>
          <div style={{ fontSize: '1.1rem', marginBottom: '6px' }}>
            {weatherSummary.willRain ? 'It may rain.' : 'Rain is not expected soon.'}
          </div>
          <div style={{ fontSize: '1rem' }}>
            Next rain: {getNextRainText()}
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.9 }}>
            Live updates every 30 seconds
          </div>
        </div>
      )}
    </div>
  );
}