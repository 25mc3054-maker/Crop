import axios from 'axios'
import { API_BASE_URL } from './config'

export const CACHE_KEYS = {
  weather: 'kn_live_weather',
  schemes: 'kn_live_schemes',
  equipment: 'kn_live_equipment',
  communityNews: 'kn_live_community_news',
  commodities: 'kn_live_commodities',
  loans: 'kn_live_loans'
}

export function writeLiveCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch (e) {
    // ignore storage failures
  }
}

export function readLiveCache(key, maxAgeMs = 10 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.ts || !parsed.data) return null
    if (Date.now() - parsed.ts > maxAgeMs) return null
    return parsed
  } catch (e) {
    return null
  }
}

function getCurrentCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude })
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

export async function preloadDashboardData() {
  const coords = await getCurrentCoords()
  const params = coords ? { lat: coords.lat, lon: coords.lon } : undefined

  const tasks = [
    axios.get(`${API_BASE_URL}/weather/auto`, { params }).then((res) => writeLiveCache(CACHE_KEYS.weather, res.data)).catch(() => {}),
    axios.get(`${API_BASE_URL}/schemes`).then((res) => writeLiveCache(CACHE_KEYS.schemes, res.data)).catch(() => {}),
    axios.get(`${API_BASE_URL}/commodities/rates`).then((res) => writeLiveCache(CACHE_KEYS.commodities, res.data)).catch(() => {}),
    axios.get(`${API_BASE_URL}/finance/loans`).then((res) => writeLiveCache(CACHE_KEYS.loans, res.data)).catch(() => {}),
    axios.get(`${API_BASE_URL}/community-news`).then((res) => writeLiveCache(CACHE_KEYS.communityNews, res.data)).catch(() => {})
  ]

  await Promise.allSettled(tasks)
}
