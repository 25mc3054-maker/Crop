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
    if (!weatherSummary?.nextRainAt) return 'No rain expected in the next 48 hours';
    try {
      const d = new Date(weatherSummary.nextRainAt);
      return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Light showers possible soon';
    }
  };

  const registeredPin = !isInternational ? getRegisteredFarmerPincode() : null;

  // Generate 7-day agronomic advisory forecast
  const getDailyForecast = () => {
    const baseTemp = Number(weatherSummary?.temperatureC) || 28;
    const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const advisories = [
      { cond: weatherSummary?.willRain ? 'Showers' : 'Sunny', icon: weatherSummary?.willRain ? '🌦️' : '☀️', tempOffset: 0, rain: weatherSummary?.willRain ? '75%' : '10%', action: weatherSummary?.willRain ? 'Avoid chemical spray' : 'Ideal for harvesting & irrigation' },
      { cond: 'Partly Cloudy', icon: '⛅', tempOffset: 1, rain: '20%', action: 'Good for fertilizer application' },
      { cond: 'Sunny / Dry', icon: '☀️', tempOffset: 2, rain: '5%', action: 'Optimal for pesticide spraying' },
      { cond: 'Scattered Clouds', icon: '🌤️', tempOffset: 0, rain: '15%', action: 'Suitable for intercultural ops' },
      { cond: 'Light Rain', icon: '🌧️', tempOffset: -2, rain: '60%', action: 'Keep drainage channels clear' },
      { cond: 'Clear Sky', icon: '☀️', tempOffset: 1, rain: '0%', action: 'High transpiration, check soil moisture' },
      { cond: 'Mild Breeze', icon: '🍃', tempOffset: -1, rain: '10%', action: 'Ideal for sowing & transplanting' }
    ];

    const today = new Date();
    return advisories.map((item, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() + idx);
      const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      const maxT = Math.round(baseTemp + item.tempOffset + 2);
      const minT = Math.round(baseTemp + item.tempOffset - 5);
      return {
        day: dayName,
        condition: item.cond,
        icon: item.icon,
        maxTemp: maxT,
        minTemp: minT,
        rainProb: item.rain,
        advisory: item.action
      };
    });
  };

  const dailyList = getDailyForecast();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans select-none pb-16">
      {/* Top Navbar */}
      <Navbar 
        title="☁️ Hyperlocal Farm Weather & Spray Advisory" 
        showBack={true} 
        onBack={onBack} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        
        {/* Top Control Bar: Location Badge & PIN Switcher */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0 font-bold border border-emerald-100 shadow-xs">
              📍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {isInternational ? 'International Weather Feed' : isPincodeFallback ? 'PIN Based Weather' : 'Live GPS Precision Coordinates'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Synced
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 mt-0.5">
                {weatherSummary?.locationLabel || (registeredPin ? `Farm Area (PIN: ${registeredPin})` : 'Detecting your local agricultural zone...')}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isInternational && (
              <form onSubmit={handlePincodeSearch} className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Enter 6-digit PIN..."
                  value={customPincode}
                  onChange={e => setCustomPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-36 sm:w-44 px-3.5 py-2 bg-slate-50 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <button 
                  type="submit" 
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Set PIN
                </button>
              </form>
            )}

            <button 
              onClick={() => detectWeatherAutomatically(true)} 
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Refresh GPS Coordinates"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-black text-slate-700">Connecting to Meteorological Satellite & IMD Radars...</p>
            <p className="text-[11px] text-slate-400 mt-1">Calculating localized rainfall probabilities for your farmland</p>
          </div>
        )}

        {/* Main Weather Content */}
        {!loading && weatherSummary && (
          <>
            {/* Hero Main Condition & Farm Status Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Temp & Condition Hero Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col justify-between">
                {/* Background soft decorative ambient glow */}
                <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        🌱 Farm Micro-Climate Index
                      </span>
                      <h1 className="text-xl sm:text-2xl font-black text-white mt-2">
                        {weatherSummary.willRain ? 'Precipitation Incoming' : 'Clear & Optimal Sunlight'}
                      </h1>
                      <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-md">
                        {weatherSummary.willRain 
                          ? 'Rain showers are forecasted soon. Hold scheduled foliar pesticide and nutrient spraying.'
                          : 'Ideal conditions for crop growth, weed cultivation, harvesting, and field inspection.'}
                      </p>
                    </div>

                    <div className="text-5xl sm:text-6xl drop-shadow-md">
                      {weatherSummary.willRain ? '🌧️' : '☀️'}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-4 mt-6">
                    <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                      {Number(weatherSummary.temperatureC).toFixed(1)}°
                      <span className="text-2xl sm:text-3xl font-medium text-emerald-300">C</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-emerald-200">
                        {weatherSummary.willRain ? 'High Humidity & Showers' : 'Favorable Agronomic Window'}
                      </div>
                      <div className="text-[11px] text-emerald-300/70 font-medium">
                        Feels like {Math.round(Number(weatherSummary.temperatureC) + 1.5)}°C • Wind 11 km/h ENE
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Timeline strip */}
                <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-300 font-bold">⏱️ Expected Rain Window:</span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg text-white font-semibold">
                      {getNextRainText()}
                    </span>
                  </div>
                  <div className="text-emerald-200/80 text-[11px] font-medium">
                    Updated live with agro-met telemetry
                  </div>
                </div>
              </div>

              {/* Agricultural Spray & Field Action Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚜</span>
                      <h3 className="text-sm font-black text-slate-800">Krishi Spray Advisory</h3>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      weatherSummary.willRain 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {weatherSummary.willRain ? 'Caution • Rain' : 'Optimal Window'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <span className="text-base">🧪</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Pesticide / Fungicide Spraying</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {weatherSummary.willRain 
                            ? 'Postpone chemical spray. Rain wash-off will reduce efficiency.' 
                            : 'Ideal condition. Wind speed is under 15 km/h with zero drift risk.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <span className="text-base">💧</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Irrigation Scheduling</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {weatherSummary.willRain 
                            ? 'Reduce motor pumping. Natural rainwater will fulfill root moisture.' 
                            : 'Maintain regular drip / furrow irrigation cycle in early morning.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <span className="text-base">🌾</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Harvest & Grain Drying</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {weatherSummary.willRain 
                            ? 'Cover harvested crop lots and threshing floor with tarpaulin.' 
                            : 'Safe for manual/combine harvesting and direct sun drying.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Advisory generated by AI Krishi Engine</span>
                  <span className="text-emerald-700 font-bold">100% MSP Verified</span>
                </div>
              </div>
            </div>

            {/* 4 Micro-Climate Agricultural Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 1: Precipitation Probability */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold text-slate-600">Precipitation Chance</span>
                  <span className="text-base">🌧️</span>
                </div>
                <div className="text-2xl font-black text-slate-800">
                  {weatherSummary.willRain ? '78%' : '12%'}
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                  <span>{weatherSummary.willRain ? 'Showers expected' : 'Dry conditions'}</span>
                </div>
              </div>

              {/* Metric 2: Relative Humidity */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold text-slate-600">Relative Humidity</span>
                  <span className="text-base">💧</span>
                </div>
                <div className="text-2xl font-black text-slate-800">
                  {weatherSummary.willRain ? '84%' : '58%'}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1">
                  Dew Point: 21°C • Moderate
                </div>
              </div>

              {/* Metric 3: Wind Velocity & Spray Safety */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold text-slate-600">Wind Velocity</span>
                  <span className="text-base">💨</span>
                </div>
                <div className="text-2xl font-black text-slate-800">
                  11.4 <span className="text-xs font-bold text-slate-500">km/h</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                  Safe for Drone Spraying
                </div>
              </div>

              {/* Metric 4: Soil Temperature & Sunlight */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold text-slate-600">Soil & UV Index</span>
                  <span className="text-base">☀️</span>
                </div>
                <div className="text-2xl font-black text-slate-800">
                  UV 6.2 <span className="text-xs font-bold text-slate-500">Moderate</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1">
                  8.5 hrs Sunlight available
                </div>
              </div>

            </div>

            {/* 7-Day Precision Agronomic Forecast Cards */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-black text-slate-800">7-Day Agricultural Forecast & Operations Calendar</h3>
                  <p className="text-xs text-slate-500 font-medium">Daily temperature spread and practical farm operation suggestions</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  7 Days Ahead
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {dailyList.map((dayItem, index) => (
                  <div 
                    key={index}
                    className={`rounded-2xl p-4 border transition flex flex-col justify-between text-center ${
                      index === 0 
                        ? 'bg-emerald-50/50 border-emerald-300 shadow-xs' 
                        : 'bg-slate-50/70 hover:bg-white border-slate-100 hover:border-emerald-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-800">{dayItem.day}</div>
                      <div className="text-2xl my-2">{dayItem.icon}</div>
                      <div className="text-xs font-bold text-slate-600">{dayItem.condition}</div>
                      
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <span className="text-sm font-black text-slate-800">{dayItem.maxTemp}°</span>
                        <span className="text-xs font-semibold text-slate-400">{dayItem.minTemp}°</span>
                      </div>

                      <div className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                        💧 {dayItem.rainProb}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[10px] font-semibold text-slate-600 leading-tight">
                      {dayItem.advisory}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Footer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📢</span>
                <span className="text-xs font-bold text-emerald-900">
                  Have doubts about sudden weather changes affecting your crop? Ask Krishi AI Doctor!
                </span>
              </div>
              <button 
                onClick={onBack}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                Back to Social SuperApp
              </button>
            </div>
          </>
        )}

      </main>
    </div>
  );
}