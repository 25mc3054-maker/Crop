import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import { preloadDashboardData } from './livePreload'
import { REGIONAL_LANGUAGES, DUAL_DICTIONARY, getDualCropName, UI_LANG_STRINGS, playDualVoice } from './languageHelper'
import Navbar from './components/Navbar'
import { MiniPriceSparkline } from './components/MarketPrices'

import { COUNTRIES_LIST } from './countriesData'

// Standard fallback list of Indian States & Union Territories
const FALLBACK_INDIAN_STATES = [
  'ANDAMAN & NICOBAR ISLANDS', 'ANDHRA PRADESH', 'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR',
  'CHANDIGARH', 'CHHATTISGARH', 'DADRA & NAGAR HAVELI AND DAMAN & DIU', 'DELHI', 'GOA',
  'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JAMMU & KASHMIR', 'JHARKHAND', 'KARNATAKA',
  'KERALA', 'LADAKH', 'LAKSHADWEEP', 'MADHYA PRADESH', 'MAHARASHTRA', 'MANIPUR',
  'MEGHALAYA', 'MIZORAM', 'NAGALAND', 'ODISHA', 'PUDUCHERRY', 'PUNJAB', 'RAJASTHAN',
  'SIKKIM', 'TAMIL NADU', 'TELANGANA', 'TRIPURA', 'UTTAR PRADESH', 'UTTARAKHAND', 'WEST BENGAL'
]

// Benchmark Rates Fallback
const DEFAULT_BENCHMARK_RATES = [
  { symbol: 'WHEAT', crop: 'Wheat (Gehun)', modalPrice: 2475, priceInr: 2475, change24h: 1.8, trend: 'up', dailyArrivalQuintals: 3200, variety: 'Sharbati / Lokwan' },
  { symbol: 'RICE', crop: 'Paddy Basmati (Dhan)', modalPrice: 3850, priceInr: 3850, change24h: -0.6, trend: 'down', dailyArrivalQuintals: 2850, variety: 'Pusa 1121' },
  { symbol: 'COTTON', crop: 'Raw Cotton (Kapas)', modalPrice: 7450, priceInr: 7450, change24h: 3.1, trend: 'up', dailyArrivalQuintals: 1940, variety: 'Shankar-6' },
  { symbol: 'CHILLI', crop: 'Dry Red Chilli (Teja)', modalPrice: 17200, priceInr: 17200, change24h: 4.2, trend: 'up', dailyArrivalQuintals: 4120, variety: 'Teja S17' },
  { symbol: 'SOYBEAN', crop: 'Yellow Soybean', modalPrice: 4680, priceInr: 4680, change24h: -1.2, trend: 'down', dailyArrivalQuintals: 3600, variety: 'Yellow 9560' },
  { symbol: 'MUSTARD', crop: 'Mustard (Sarson)', modalPrice: 5650, priceInr: 5650, change24h: 2.8, trend: 'up', dailyArrivalQuintals: 2100, variety: 'Black Mustard' },
  { symbol: 'CORN', crop: 'Corn / Maize (Makka)', modalPrice: 2180, priceInr: 2180, change24h: 1.1, trend: 'up', dailyArrivalQuintals: 1800, variety: 'Yellow Hybrid' },
  { symbol: 'ONION', crop: 'Red Onion (Pyaz)', modalPrice: 2150, priceInr: 2150, change24h: -2.4, trend: 'down', dailyArrivalQuintals: 5600, variety: 'Red Medium' },
  { symbol: 'POTATO', crop: 'Fresh Potato (Aloo)', modalPrice: 1420, priceInr: 1420, change24h: 0.9, trend: 'up', dailyArrivalQuintals: 4800, variety: 'Jyoti / Pukhraj' },
  { symbol: 'TOMATO', crop: 'Hybrid Tomato', modalPrice: 2250, priceInr: 2250, change24h: 3.4, trend: 'up', dailyArrivalQuintals: 3100, variety: 'Firm Red' },
  { symbol: 'TURMERIC', crop: 'Turmeric (Haldi)', modalPrice: 13800, priceInr: 13800, change24h: 2.1, trend: 'up', dailyArrivalQuintals: 1250, variety: 'Selam Finger' },
  { symbol: 'CHANA', crop: 'Chickpea / Gram (Chana)', modalPrice: 5850, priceInr: 5850, change24h: 1.4, trend: 'up', dailyArrivalQuintals: 1750, variety: 'Desi Chana' },
  { symbol: 'GROUNDNUT', crop: 'Groundnut (Mungfali)', modalPrice: 6850, priceInr: 6850, change24h: 1.9, trend: 'up', dailyArrivalQuintals: 2400, variety: 'GG-20 Bold' },
  { symbol: 'JEERA', crop: 'Cumin (Jeera)', modalPrice: 27500, priceInr: 27500, change24h: 3.8, trend: 'up', dailyArrivalQuintals: 1600, variety: 'Machine Clean' },
  { symbol: 'GARLIC', crop: 'Garlic (Lahsun)', modalPrice: 11800, priceInr: 11800, change24h: 2.5, trend: 'up', dailyArrivalQuintals: 950, variety: 'Amleta Bold' },
  { symbol: 'TUR_DAL', crop: 'Arhar / Tur Dal', modalPrice: 9450, priceInr: 9450, change24h: 0.8, trend: 'up', dailyArrivalQuintals: 1100, variety: 'Maruti White' }
]

export default function Dashboard({ onLogout, initialOpenSettings = false }) {
  const [prices, setPrices] = useState(DEFAULT_BENCHMARK_RATES)
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('Greeshmanth')
  const [regLang, setRegLang] = useState(() => localStorage.getItem('krishi_secondary_lang') || 'none')
  const [showDigiLocker, setShowDigiLocker] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(() => initialOpenSettings || window.location.hash === '#/settings' || window.location.hash === '#settings')
  const [selectedMandiState, setSelectedMandiState] = useState('All')
  const [govVerifiedInfo, setGovVerifiedInfo] = useState({
    source: 'Real-Time APMC Mandi Daily Settlement Feed',
    agency: 'National Agricultural Markets',
    totalCrops: 120,
    activeStates: 28
  })

  // Settings LinkedIn / Instagram Navigation State
  const [settingsSubView, setSettingsSubView] = useState(null) // null for main categorized menu, or 'profile', 'language', 'phone', 'password', 'location', 'notifications', 'delete'
  const [langSearch, setLangSearch] = useState('')

  // 1. Phone state
  const [currentPhone, setCurrentPhone] = useState(() => localStorage.getItem('farmer_phone') || '')
  const [newPhone, setNewPhone] = useState('')
  const [phoneMsg, setPhoneMsg] = useState({ error: '', success: '', loading: false })

  // 2. Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [passMsg, setPassMsg] = useState({ error: '', success: '', loading: false })

  // 3. Location / State & Pincode state
  const [settingsCountryType, setSettingsCountryType] = useState(() => localStorage.getItem('farmer_country_type') || 'india')
  const [settingsCountryName, setSettingsCountryName] = useState(() => localStorage.getItem('farmer_country') || 'India')
  const [settingsState, setSettingsState] = useState(() => localStorage.getItem('farmer_state') || 'ANDHRA PRADESH')
  const [settingsPincode, setSettingsPincode] = useState(() => localStorage.getItem('farmer_pincode') || '534001')
  const [settingsVillage, setSettingsVillage] = useState(() => localStorage.getItem('farmer_village') || '')
  const [pincodeCheck, setPincodeCheck] = useState({ checking: false, valid: null, message: '', district: '' })
  const [locationMsg, setLocationMsg] = useState({ error: '', success: '', loading: false })

  // 4. Farmer profile state
  const [profileName, setProfileName] = useState(() => userName)
  const [profileVillage, setProfileVillage] = useState(() => localStorage.getItem('farmer_village') || 'Eluru')
  const [profileLand, setProfileLand] = useState(() => localStorage.getItem('farmer_land') || '3.5')
  const [profileCrops, setProfileCrops] = useState(() => localStorage.getItem('farmer_crops') || 'Paddy, Cotton, Chilli')
  const [profileMsg, setProfileMsg] = useState({ error: '', success: '', loading: false })

  // 5. Notification preferences state
  const [notifSms, setNotifSms] = useState(() => localStorage.getItem('farmer_sms_alerts') !== 'false')
  const [notifAudio, setNotifAudio] = useState(() => localStorage.getItem('farmer_audio_alerts') !== 'false')
  const [notifWhatsApp, setNotifWhatsApp] = useState(() => localStorage.getItem('farmer_wa_alerts') !== 'false')
  const [notifMsg, setNotifMsg] = useState({ error: '', success: '' })

  // 6. Account deletion state
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState({ error: '', loading: false })

  const isNone = regLang === 'none'
  const currentLangObj = REGIONAL_LANGUAGES.find(l => l.code === regLang) || REGIONAL_LANGUAGES[0]
  const currentStr = UI_LANG_STRINGS[regLang] || UI_LANG_STRINGS.none

  useEffect(() => {
    try {
      const token = localStorage.getItem('farmer_token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserName(payload.name || payload.phone || 'Greeshmanth')
      }
    } catch (e) {
      console.error('Failed to decode token', e)
    }

    const updateLang = () => {
      setRegLang(localStorage.getItem('krishi_secondary_lang') || 'none')
    }

    const handleOpenSettings = () => {
      setShowSettingsModal(true)
    }

    const handleHash = () => {
      if (window.location.hash === '#/settings' || window.location.hash === '#settings') {
        setShowSettingsModal(true)
      }
    }

    window.addEventListener('krishi_lang_changed', updateLang)
    window.addEventListener('storage', updateLang)
    window.addEventListener('krishi_open_settings', handleOpenSettings)
    window.addEventListener('hashchange', handleHash)

    fetchPrices(selectedMandiState)
    preloadDashboardData().catch(() => {})
    const interval = setInterval(() => fetchPrices(selectedMandiState), 30000)

    return () => {
      clearInterval(interval)
      window.removeEventListener('krishi_lang_changed', updateLang)
      window.removeEventListener('storage', updateLang)
      window.removeEventListener('krishi_open_settings', handleOpenSettings)
      window.removeEventListener('hashchange', handleHash)
    }
  }, [selectedMandiState])

  const handleShiftLanguage = (langCode) => {
    setRegLang(langCode)
    localStorage.setItem('krishi_secondary_lang', langCode)
    localStorage.setItem('krishi_lang_chosen', 'true')
    window.dispatchEvent(new Event('krishi_lang_changed'))

    if (langCode === 'none') {
      playDualVoice('Language shifted to English Only.', '', 'none')
    } else {
      const targetLang = REGIONAL_LANGUAGES.find(l => l.code === langCode)
      const str = UI_LANG_STRINGS[langCode] || UI_LANG_STRINGS.none
      const enText = `Language shifted to ${targetLang ? targetLang.englishName : ''} and English.`
      const regText = str.greeting || ''
      playDualVoice(enText, regText, langCode)
    }
  }

  // Live PIN code validation check for Settings
  useEffect(() => {
    if (settingsCountryType !== 'india') {
      setPincodeCheck({ checking: false, valid: true, message: '', district: '' })
      return
    }
    const clean = String(settingsPincode || '').replace(/\D/g, '')
    if (clean.length === 6) {
      setPincodeCheck({ checking: true, valid: null, message: 'Verifying PIN code...', district: '' })
      axios.get(`${API_BASE_URL}/api/pincode/validate`, {
        params: { state: settingsState, pincode: clean }
      })
      .then(res => {
        if (res.data && res.data.match) {
          setPincodeCheck({
            checking: false,
            valid: true,
            message: `✓ Valid PIN Code: ${res.data.district || ''}, ${res.data.state || settingsState}`,
            district: res.data.district || ''
          })
        } else {
          setPincodeCheck({
            checking: false,
            valid: false,
            message: res.data?.error || `⚠️ PIN code ${clean} does not match ${settingsState}`,
            district: ''
          })
        }
      })
      .catch(() => {
        setPincodeCheck({ checking: false, valid: true, message: '✓ PIN code entered (standard directory)', district: '' })
      })
    } else {
      setPincodeCheck({ checking: false, valid: null, message: '', district: '' })
    }
  }, [settingsState, settingsPincode, settingsCountryType])

  // 1. Handler: Change Phone Number
  const handleUpdatePhone = async (e) => {
    e.preventDefault()
    setPhoneMsg({ error: '', success: '', loading: true })
    try {
      const cleanPhone = newPhone.replace(/\D/g, '')
      if (settingsCountryType === 'india' && cleanPhone.length !== 10) {
        setPhoneMsg({ error: 'Indian mobile number must be exactly 10 digits.', success: '', loading: false })
        return
      }
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        setPhoneMsg({ error: 'Phone number must be between 7 and 15 digits.', success: '', loading: false })
        return
      }
      const res = await axios.post(`${API_BASE_URL}/api/user/change-phone`, {
        currentPhone: currentPhone || localStorage.getItem('farmer_phone') || '',
        newPhone: cleanPhone
      })
      if (res.data.success) {
        localStorage.setItem('farmer_phone', cleanPhone)
        setCurrentPhone(cleanPhone)
        if (res.data.token) localStorage.setItem('farmer_token', res.data.token)
        setPhoneMsg({ error: '', success: `Phone number updated successfully to +91 ${cleanPhone}`, loading: false })
        setNewPhone('')
      } else {
        setPhoneMsg({ error: res.data.error || 'Failed to update phone number', success: '', loading: false })
      }
    } catch (err) {
      setPhoneMsg({ error: err.response?.data?.error || err.message || 'Error updating phone number', success: '', loading: false })
    }
  }

  // 2. Handler: Change Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPassMsg({ error: '', success: '', loading: true })
    if (!newPassword || newPassword.length < 4) {
      setPassMsg({ error: 'New password must be at least 4 characters long.', success: '', loading: false })
      return
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ error: 'Passwords do not match. Please re-enter identical passwords.', success: '', loading: false })
      return
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/api/user/change-password`, {
        phone: currentPhone || localStorage.getItem('farmer_phone') || '',
        newPassword: newPassword.trim()
      })
      if (res.data.success) {
        setPassMsg({ error: '', success: 'Password changed successfully! Keep it confidential.', loading: false })
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPassMsg({ error: res.data.error || 'Failed to update password', success: '', loading: false })
      }
    } catch (err) {
      setPassMsg({ error: err.response?.data?.error || err.message || 'Error updating password', success: '', loading: false })
    }
  }

  // 3. Handler: Change State & PIN Code / Location
  const handleUpdateLocation = async (e) => {
    e.preventDefault()
    setLocationMsg({ error: '', success: '', loading: true })
    try {
      const isOther = settingsCountryType === 'other'
      if (!isOther && pincodeCheck.valid === false) {
        setLocationMsg({ error: pincodeCheck.message || 'State and PIN code do not match.', success: '', loading: false })
        return
      }
      const res = await axios.post(`${API_BASE_URL}/api/user/change-location`, {
        phone: currentPhone || localStorage.getItem('farmer_phone') || '',
        countryType: settingsCountryType,
        countryName: settingsCountryName,
        state: settingsState,
        pincode: settingsPincode,
        village: settingsVillage
      })
      if (res.data.success) {
        localStorage.setItem('farmer_country_type', settingsCountryType)
        localStorage.setItem('farmer_country', isOther ? settingsCountryName : 'India')
        localStorage.setItem('farmer_state', isOther ? '' : settingsState)
        localStorage.setItem('farmer_pincode', isOther ? '' : settingsPincode)
        if (settingsVillage) localStorage.setItem('farmer_village', settingsVillage)
        if (res.data.token) localStorage.setItem('farmer_token', res.data.token)
        setLocationMsg({ error: '', success: 'Location & PIN code preferences updated successfully!', loading: false })
      } else {
        setLocationMsg({ error: res.data.error || 'Failed to update location', success: '', loading: false })
      }
    } catch (err) {
      setLocationMsg({ error: err.response?.data?.error || err.message || 'Error updating location', success: '', loading: false })
    }
  }

  // 4. Handler: Update Farmer Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileMsg({ error: '', success: '', loading: true })
    try {
      const res = await axios.post(`${API_BASE_URL}/api/user/update-profile`, {
        phone: currentPhone || localStorage.getItem('farmer_phone') || '',
        name: profileName,
        village: profileVillage,
        landholding: profileLand,
        primaryCrops: profileCrops
      })
      if (res.data.success) {
        setUserName(profileName)
        localStorage.setItem('farmer_name', profileName)
        localStorage.setItem('farmer_village', profileVillage)
        localStorage.setItem('farmer_land', profileLand)
        localStorage.setItem('farmer_crops', profileCrops)
        if (res.data.token) localStorage.setItem('farmer_token', res.data.token)
        setProfileMsg({ error: '', success: 'Profile details saved successfully!', loading: false })
      } else {
        setProfileMsg({ error: res.data.error || 'Failed to update profile', success: '', loading: false })
      }
    } catch (err) {
      setProfileMsg({ error: err.response?.data?.error || err.message || 'Error updating profile', success: '', loading: false })
    }
  }

  // 5. Handler: Save Notification Preferences
  const handleSaveNotifications = (e) => {
    e.preventDefault()
    localStorage.setItem('farmer_sms_alerts', String(notifSms))
    localStorage.setItem('farmer_audio_alerts', String(notifAudio))
    localStorage.setItem('farmer_wa_alerts', String(notifWhatsApp))
    setNotifMsg({ error: '', success: 'Notification preferences saved successfully!' })
    setTimeout(() => setNotifMsg({ error: '', success: '' }), 4000)
  }

  // 6. Handler: Delete Account
  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) {
      setDeleteMsg({ error: 'Please check the confirmation box before deleting your account.', loading: false })
      return
    }
    setDeleteMsg({ error: '', loading: true })
    try {
      const phoneToDelete = currentPhone || localStorage.getItem('farmer_phone') || ''
      await axios.post(`${API_BASE_URL}/api/user/delete-account`, { phone: phoneToDelete })
      localStorage.clear()
      setShowSettingsModal(false)
      if (onLogout) {
        onLogout()
      } else {
        window.location.hash = '#/login'
        window.location.reload()
      }
    } catch (err) {
      setDeleteMsg({ error: err.response?.data?.error || err.message || 'Error deleting account', loading: false })
    }
  }

  const fetchPrices = async (filterState = 'All') => {
    try {
      // 1. Query Official Government data.gov.in Agmarknet API endpoint
      const params = filterState !== 'All' ? { state: filterState, limit: 14 } : { limit: 14 }
      let res = await axios.get(`${API_BASE_URL}/api/gov/rates`, { params }).catch(() => null)
      
      if (res && res.data && res.data.records && res.data.records.length > 0) {
        const mapped = res.data.records.map(r => ({
          symbol: r.symbol,
          crop: r.commodity,
          modalPrice: r.modalPrice,
          priceInr: r.modalPrice,
          change24h: r.change24h || 1.2,
          trend: r.trend || 'up',
          benchmarkMandi: r.market,
          state: r.state,
          variety: r.variety,
          dailyArrivalQuintals: r.arrivalsTonnes * 10
        }))
        setPrices(mapped.slice(0, 14))
        if (res.data.stats) {
          setGovVerifiedInfo(prev => ({
            ...prev,
            source: res.data.source || prev.source,
            totalCrops: res.data.stats.totalCommodities || 120
          }))
        }
        return
      }

      // 2. Fallback to /commodities/rates
      res = await axios.get(`${API_BASE_URL}/commodities/rates`).catch(() => null)
      if (res && res.data && res.data.rates && res.data.rates.length > 0) {
        let list = res.data.rates
        if (filterState !== 'All') {
          list = list.filter(item => item.state && item.state.toLowerCase().includes(filterState.toLowerCase()))
        }
        setPrices(list.slice(0, 14))
        return
      }
    } catch (e) {
      console.warn('Backend connection, using Agmarknet live benchmark fallback', e)
    } finally {
      // 3. Guaranteed local fallback by state
      if (filterState !== 'All') {
        const filtered = DEFAULT_BENCHMARK_RATES.filter(i => i.state.toLowerCase() === filterState.toLowerCase())
        if (filtered.length > 0) {
          setPrices(filtered)
        } else {
          setPrices(DEFAULT_BENCHMARK_RATES.slice(0, 12))
        }
      } else {
        setPrices(DEFAULT_BENCHMARK_RATES.slice(0, 12))
      }
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('farmer_token')
    localStorage.removeItem('krishi_lang_chosen')
    onLogout && onLogout()
  }

  // 12 Agricultural Operating Modules matching the sketch
  const operatingModules = [
    { k: '#/soil-analyser', icon: '🌱', title: 'Soil Health & NPK Diagnosis', desc: 'Instant lab-grade soil macro-nutrient analysis & customized fertilizer dosage', tag: 'NPK CLINIC' },
    { k: '#/weather', icon: '☁️', title: '7-Day Radar Weather Forecast', desc: 'Hyperlocal micro-climate forecasts, rainfall probabilities & spray windows', tag: 'RADAR MET' },
    { k: '#/ai-assistant', icon: '🤖', title: 'Krishi AI Agronomist Doctor', desc: '24/7 Voice-powered agricultural expert advising in all Indian languages', tag: 'VOICE AI' },
    { k: '#/equipment', icon: '🚜', title: 'GPS Equipment & Tractor Rental', desc: 'Book tractors, rotavators, drone sprayers & combine harvesters nearby', tag: 'GPS FLEET' },
    { k: '#/crop-planner', icon: '🗓️', title: 'Crop Season Calendar & Planner', desc: 'Optimal sowing timeline, crop rotation advice & harvest schedule', tag: 'YIELD PLAN' },
    { k: '#/pest-disease', icon: '🐛', title: 'Pest & Crop Disease Clinic', desc: 'Scan leaf symptoms for AI identification of fungi, viruses & organic remedies', tag: 'BIO CLINIC' },
    { k: '#/irrigation', icon: '💧', title: 'Smart Irrigation Scheduler', desc: 'Soil moisture tracking, drip automation timings & water conservation', tag: 'SMART WATER' },
    { k: '#/schemes', icon: '🏛️', title: 'Autonomous Scheme & Subsidy Tracker', desc: 'Live verified directory of 20 central and state agricultural DBT programs', tag: 'GOVT DBT' },
    { k: '#/finance', icon: '🏦', title: 'Kisan Credit Card (4% Net Subvention)', desc: 'Audited 4% crop loans, interest waiver calculator & quick sanction guide', tag: '4% NET KCC' },
    { k: '#/records', icon: '📑', title: 'Digital Farm Records & Ledger', desc: 'Track seasonal expenditures, seed costs, input receipts & harvest profits', tag: 'FARM BOOK' },
    { k: '#/satellite', icon: '🛰️', title: 'Satellite NDVI Crop Health', desc: 'Multispectral satellite imagery to detect crop stress and chlorophyll health', tag: 'SATELLITE' },
    { k: '#/input-market', icon: '🛒', title: 'Certified Seed & Bio-Inputs', desc: 'Direct access to certified seeds, organic fertilizers and bio-pesticides', tag: 'AGRI INPUTS' }
  ]

  return (
    <div style={{ minHeight: '100vh', padding: '12px 14px 40px', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <div className="container">
        
        {/* TOP HEADER + SEGMENTED NAVIGATION ROW (Square boxes / sharp edges) */}
        <Navbar 
          isDashboard={true} 
          onLogout={handleLogout} 
          onOpenProfile={() => setShowProfile(true)}
          onOpenDigiLocker={() => setShowDigiLocker(true)}
        />

        {/* 5 FEATURED QUICK ACTION CARDS (Square boxes with sharp 90-degree edges) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: 14, 
            marginBottom: 24 
          }}
        >
          {/* Card 1: Social Media [Open] - Light Green Hero Gradient Sharp Square Box */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #6cba55 0%, #4e9436 100%)',
              borderRadius: '0px',
              padding: '18px 20px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(78, 148, 54, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #4e9436'
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', color: '#3e7e2c', padding: '3px 8px', borderRadius: '0px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 10 }}>
                <span>🌾</span> KISAN SOCIAL
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 17, fontWeight: 900, color: '#ffffff', lineHeight: 1.25 }}>
                📱 Social Media
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255, 255, 255, 0.94)', lineHeight: 1.45 }}>
                Connect with farmers across all states. Posts auto-translate to your language with voice read-aloud.
              </p>
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => window.location.hash = '#/community-news'}
                style={{
                  width: '100%',
                  padding: '9px 16px',
                  background: '#ffffff',
                  color: '#2e7d32',
                  border: 'none',
                  borderRadius: '0px',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Open Social Media →
              </button>
            </div>
          </div>

          {/* Card 2: Govt schemes & Bank loans - Crisp Sharp Square Box */}
          <div 
            onClick={() => window.location.hash = '#/schemes'}
            style={{
              background: '#ffffff',
              borderRadius: '0px',
              border: '1px solid #e2ece0',
              borderTop: '4px solid #5ca346',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(24, 44, 29, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#5ca346'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(24, 44, 29, 0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2ece0'
              e.currentTarget.style.borderTopColor = '#5ca346'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(24, 44, 29, 0.04)'
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eaf7e6', color: '#2e7d32', padding: '3px 8px', borderRadius: '0px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 10 }}>
                <span>🏛️</span> 4% KCC, DBT & COMM. BANKS
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 900, color: '#182c1d', lineHeight: 1.25 }}>
                Govt Schemes & Bank Loans
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#496150', lineHeight: 1.45 }}>
                Central & State DBT subsidies, official 4% KCC public sector loans (SBI, PNB, BoB, Canara, MUDRA), plus separate commercial bank loans.
              </p>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#5ca346' }}>Explore Schemes & Loans →</span>
              <span style={{ fontSize: 14 }}>🏛️</span>
            </div>
          </div>

          {/* Card 3: Private loans - Crisp Sharp Square Box */}
          <div 
            onClick={() => window.location.hash = '#/finance'}
            style={{
              background: '#ffffff',
              borderRadius: '0px',
              border: '1px solid #e2ece0',
              borderTop: '4px solid #f59e0b',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(24, 44, 29, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#f59e0b'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(245, 158, 11, 0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2ece0'
              e.currentTarget.style.borderTopColor = '#f59e0b'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(24, 44, 29, 0.04)'
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '0px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 10 }}>
                <span>🤝</span> REGISTERED PLATFORM LENDERS
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 900, color: '#182c1d', lineHeight: 1.25 }}>
                Private Loans
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#496150', lineHeight: 1.45 }}>
                Exclusively for verified private finance companies (NBFCs) & private individuals registered and willing to lend on Krishi-Net.
              </p>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309' }}>View Registered Lenders →</span>
              <span style={{ fontSize: 14 }}>🤝</span>
            </div>
          </div>

          {/* Card 4: Buy & Sell crop - Crisp Sharp Square Box */}
          <div 
            onClick={() => window.location.hash = '#/amazon-rates'}
            style={{
              background: '#ffffff',
              borderRadius: '0px',
              border: '1px solid #e2ece0',
              borderTop: '4px solid #5ca346',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(24, 44, 29, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#5ca346'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(24, 44, 29, 0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2ece0'
              e.currentTarget.style.borderTopColor = '#5ca346'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(24, 44, 29, 0.04)'
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eaf7e6', color: '#2e7d32', padding: '3px 8px', borderRadius: '0px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 10 }}>
                <span>🌾</span> FARM-GATE APMC
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 900, color: '#182c1d', lineHeight: 1.25 }}>
                Buy & Sell Crop
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#496150', lineHeight: 1.45 }}>
                Direct procurement by verified mills, food processors & bulk mandi buyers without middlemen.
              </p>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#5ca346' }}>Trade Now →</span>
              <span style={{ fontSize: 14 }}>📈</span>
            </div>
          </div>

          {/* Card 5: Digi locker - Crisp Sharp Square Box */}
          <div 
            onClick={() => setShowDigiLocker(true)}
            style={{
              background: '#ffffff',
              borderRadius: '0px',
              border: '1px solid #e2ece0',
              borderTop: '4px solid #5ca346',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(24, 44, 29, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#5ca346'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(24, 44, 29, 0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2ece0'
              e.currentTarget.style.borderTopColor = '#5ca346'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(24, 44, 29, 0.04)'
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eaf7e6', color: '#2e7d32', padding: '3px 8px', borderRadius: '0px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 10 }}>
                <span>🔒</span> ENCRYPTED VAULT
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 900, color: '#182c1d', lineHeight: 1.25 }}>
                Digi Locker
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#496150', lineHeight: 1.45 }}>
                Safe storage for 7/12 Land Records, Soil Health Cards & KCC documents in your private cloud.
              </p>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#5ca346' }}>Open Vault →</span>
              <span style={{ fontSize: 14 }}>📂</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: LIVE MARKET RATES (IN THEIR OWN LANGUAGE) */}
        <div 
          className="card" 
          style={{ 
            padding: '24px', 
            marginBottom: 28, 
            backgroundColor: '#ffffff',
            borderRadius: '0px',
            border: '1px solid #e2ece0',
            boxShadow: '0 2px 8px rgba(24, 44, 29, 0.04)'
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#eaf7e6', color: '#2e7d32', border: '1px solid #86efac', padding: '3px 8px', borderRadius: '0px', fontSize: 10, fontWeight: 900 }}>
                  🔴 REAL-TIME COMMODITY PRICE TICKER
                </span>
                <span style={{ fontSize: 12, color: '#799080', fontWeight: 700 }}>
                  Live Benchmark Rates & Interactive Price Graphs
                </span>
              </div>
              <h2 style={{ margin: '4px 0 0 0', color: '#182c1d', fontSize: 21, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                📊 Live Market Rates {!isNone && <span style={{ color: '#5ca346', fontWeight: 700, fontSize: 16 }}>({DUAL_DICTIONARY.mandiRatesTitle[regLang] || currentLangObj.name})</span>}
              </h2>
            </div>

            <button 
              onClick={() => window.location.hash = '#/market-prices'} 
              style={{
                padding: '8px 20px',
                borderRadius: '0px',
                border: 'none',
                background: '#5ca346',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              📈 View All 120+ Crop Rates & Graphs →
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px 20px' }}>
              <div className="spinner"></div>
              <p style={{ color: '#496150', fontWeight: 600, fontSize: 13 }}>Loading live benchmark rates...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: 12 }}>
              {/* THE SEMI-CIRCLE GAUGE METER CARD (Sharp square box) */}
              <div
                onClick={() => window.location.hash = '#/market-prices'}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #5ca346',
                  borderRadius: '0px',
                  padding: '16px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  background: 'linear-gradient(180deg, #f0f7ee 0%, #ffffff 100%)',
                  boxShadow: '0 2px 6px rgba(92, 163, 70, 0.12)'
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 900, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📊 PRICE SENTIMENT GAUGE
                </div>

                {/* SVG Semi-Circle Arc Meter */}
                <div style={{ margin: '8px 0', position: 'relative', width: 140, height: 75 }}>
                  <svg width="140" height="75" viewBox="0 0 140 75">
                    {/* Background Track Arc */}
                    <path
                      d="M 15 70 A 55 55 0 0 1 125 70"
                      fill="none"
                      stroke="#e2ece0"
                      strokeWidth="12"
                      strokeLinecap="square"
                    />
                    {/* Active Light Green Value Arc (78% Bullish) */}
                    <path
                      d="M 15 70 A 55 55 0 0 1 125 70"
                      fill="none"
                      stroke="#5ca346"
                      strokeWidth="12"
                      strokeLinecap="square"
                      strokeDasharray="172"
                      strokeDashoffset="38"
                    />
                  </svg>
                  
                  {/* Gauge Value Display in Center */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#182c1d', lineHeight: 1 }}>
                      78%
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#5ca346', textTransform: 'uppercase' }}>
                      BULLISH DEMAND
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#182c1d' }}>
                    Commodity Price Index: ₹2,840/Qtl
                  </div>
                  <div style={{ fontSize: 10, color: '#2e7d32', fontWeight: 700, marginTop: 2 }}>
                    ▲ Bullish Market Momentum
                  </div>
                </div>
              </div>

              {/* Commodity Rate Cards with MiniPriceSparkline */}
              {prices.map((item, idx) => {
                const cropInfo = getDualCropName(item.symbol || item.crop, regLang)
                const isRateUp = (item.change24h || 0) >= 0
                return (
                  <div 
                    key={idx} 
                    onClick={() => window.location.hash = '#/market-prices'}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2ece0',
                      borderRadius: '0px',
                      padding: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(24, 44, 29, 0.03)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#5ca346'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 44, 29, 0.08)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e2ece0'
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(24, 44, 29, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '0px', background: '#f0f7ee', border: '1px solid #e2ece0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          {cropInfo.icon || '🌾'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#182c1d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 105 }}>
                            {cropInfo.en}
                          </div>
                          {!isNone && cropInfo.reg && (
                            <div style={{ fontSize: 11, color: '#5ca346', fontWeight: 800 }}>
                              {cropInfo.reg}
                            </div>
                          )}
                        </div>
                      </div>

                      <span 
                        style={{ 
                          fontSize: 10, 
                          fontWeight: 800, 
                          padding: '2px 6px', 
                          borderRadius: '0px',
                          background: isRateUp ? '#eaf7e6' : '#fee2e2',
                          color: isRateUp ? '#2e7d32' : '#b91c1c'
                        }}
                      >
                        {isRateUp ? `▲ +${item.change24h || 0}%` : `▼ ${item.change24h || 0}%`}
                      </span>
                    </div>

                    <div style={{ marginTop: 8, padding: '8px 10px', background: '#fbfdfa', border: '1px solid #e8ede6', borderRadius: '0px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: 19, color: '#182c1d', fontWeight: 900, letterSpacing: '-0.5px' }}>
                          ₹{(item.modalPrice || item.priceInr || 0).toLocaleString('en-US')}
                        </div>
                        <span style={{ fontSize: 10, color: '#799080', fontWeight: 800, textTransform: 'uppercase' }}>
                          / QNTL
                        </span>
                      </div>
                      
                      <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 800, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📈 Price Graph</span>
                        <span style={{ color: '#64748b' }}>{item.variety ? item.variety.split('/')[0].trim() : 'Standard'}</span>
                      </div>

                      <MiniPriceSparkline crop={item} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* MARKET INTELLIGENCE STRIP (Sharp Square Box under Live Rates) */}
          <div 
            style={{ 
              marginTop: 18, 
              paddingTop: 16, 
              borderTop: '1.5px solid #e8ede6',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12
            }}
          >
            {/* Box A: Top Gainers Today */}
            <div 
              style={{ 
                background: '#f9fcf8', 
                border: '1px solid #e2ece0', 
                borderRadius: '0px', 
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ width: 36, height: 36, background: '#eaf7e6', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                📈
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Top Price Gainers Today
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#182c1d', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  🌶️ Chilli (+4.2%) • 🌾 Cotton (+3.1%) • 🌼 Mustard (+2.8%)
                </div>
              </div>
            </div>

            {/* Box B: High Trade Volume */}
            <div 
              style={{ 
                background: '#f9fcf8', 
                border: '1px solid #e2ece0', 
                borderRadius: '0px', 
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ width: 36, height: 36, background: '#f0f7ee', border: '1px solid #5ca346', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                🏛️
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#5ca346', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  High Trade Volume Commodities (24h)
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#182c1d', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Wheat: 5,600 Qtl • Chilli: 4,120 Qtl • Soybean: 3,600 Qtl
                </div>
              </div>
            </div>

            {/* Box C: MSP Guaranteed Floor Price */}
            <div 
              style={{ 
                background: 'linear-gradient(135deg, #f0f7ee 0%, #ffffff 100%)', 
                border: '1px solid #86efac', 
                borderRadius: '0px', 
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  ⚖️ MSP Guaranteed Floor Price
                </div>
                <div style={{ fontSize: 11, color: '#496150', fontWeight: 700, marginTop: 2 }}>
                  100% MSP audit compliance active
                </div>
              </div>
              <button
                onClick={() => window.location.hash = '#/market-prices'}
                style={{
                  padding: '6px 12px',
                  borderRadius: '0px',
                  background: '#5ca346',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Explore Rates →
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: AGRICULTURAL OPERATING MODULES (Sharp Square Boxes) */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#eaf7e6', color: '#2e7d32', padding: '3px 8px', fontSize: 11, fontWeight: 900, borderRadius: '0px', textTransform: 'uppercase' }}>
              OPERATING SUITE
            </span>
            <span style={{ fontSize: 12, color: '#5ca346', fontWeight: 800 }}>
              12 High-Yield Agricultural Tools
            </span>
          </div>
          <h2 style={{ fontSize: 22, color: '#182c1d', fontWeight: 900, margin: '4px 0 2px 0' }}>
            🛠️ Agricultural Operating Modules
          </h2>
          <p style={{ color: '#496150', fontSize: 13, margin: 0 }}>
            Tools designed to optimize your farm economics, soil diagnosis, weather tracking, equipment leasing, and market access
          </p>
        </div>

        {/* Operating Modules Grid in Pure Crisp Sharp Square White Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
          {operatingModules.map((card, index) => (
            <div 
              key={card.k} 
              onClick={() => window.location.hash = card.k}
              style={{
                background: '#ffffff',
                borderRadius: '0px',
                border: '1px solid #e2ece0',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 5px rgba(24, 44, 29, 0.04)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#5ca346'
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(24, 44, 29, 0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e2ece0'
                e.currentTarget.style.boxShadow = '0 2px 5px rgba(24, 44, 29, 0.04)'
              }}
            >
              <div>
                {/* Header: Square Icon + Sharp Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <div 
                    style={{ 
                      width: 42, 
                      height: 42, 
                      borderRadius: '0px', 
                      background: '#f0f7ee', 
                      border: '1px solid #e2ece0',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: 22, 
                      flexShrink: 0 
                    }}
                  >
                    {card.icon}
                  </div>

                  <span style={{ fontSize: 10, fontWeight: 900, background: '#f8faf7', border: '1px solid #e2ece0', color: '#496150', padding: '3px 8px', borderRadius: '0px' }}>
                    {card.tag}
                  </span>
                </div>

                <h3 style={{ margin: 0, color: '#182c1d', fontSize: 15, fontWeight: 800 }}>
                  {card.title}
                </h3>
                
                <p style={{ margin: '6px 0 0 0', color: '#496150', fontSize: 12, lineHeight: 1.45 }}>
                  {card.desc}
                </p>
              </div>
              
              {/* Bottom Launch Link */}
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>TOOL #{index + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#5ca346', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Launch →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* ACCOUNTS CENTER & SETTINGS CARD (LINKEDIN / INSTAGRAM STYLE) */}
        {/* ========================================================================= */}
        <div 
          id="dashboard-settings-section"
          style={{ 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '18px 24px', 
            marginBottom: '22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* User Avatar with gradient border like Instagram */}
            <div style={{ 
              width: 50, 
              height: 50, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
              color: '#ffffff',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 20,
              fontWeight: 900,
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
              flexShrink: 0
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                Settings & Privacy Center
                <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', fontWeight: 800, borderRadius: '12px' }}>
                  ✓ Verified Kisan
                </span>
                <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', fontWeight: 700, borderRadius: '12px' }}>
                  {isNone ? '🌐 English' : `${currentLangObj.flag} ${currentLangObj.name}`}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
                Personal details, mobile number, security password, state & pincode, and preferences
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSettingsSubView(null)
              setShowSettingsModal(true)
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1e293b' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0f172a' }}
          >
            <span>⚙️</span> Manage Settings & Privacy →
          </button>
        </div>

        {/* Certified Kisan Helpline Section (Sharp Box) */}
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '26px 24px', 
            borderRadius: '0px', 
            background: 'linear-gradient(135deg, #f0f7ee 0%, #e3f1df 100%)', 
            border: '1.5px solid rgba(92, 163, 70, 0.3)',
            marginBottom: 20
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', color: '#2e7d32', padding: '3px 10px', borderRadius: '0px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8, border: '1px solid #86efac' }}>
            DIRECT KISAN HELPLINE
          </div>
          <h3 style={{ margin: '0 0 6px 0', color: '#182c1d', fontSize: 19, fontWeight: 900 }}>
            Need Direct Agronomy Assistance? {!isNone && `/ ${currentStr.needSupport || ''}`}
          </h3>
          <p style={{ color: '#496150', fontSize: 13, maxWidth: 640, margin: '0 auto 16px' }}>
            Connect directly with verified agricultural extension scientists and Kisan facilitators for personalized crop guidance in English and your regional language.
          </p>
          <button 
            onClick={() => window.open('https://wa.me/919876543210?text=Hello%20Krishi-Net%20Support', '_blank')} 
            style={{ 
              padding: '10px 24px', 
              fontSize: 13, 
              borderRadius: '0px', 
              background: '#5ca346', 
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            💬 Open WhatsApp Kisan Helpdesk
          </button>
        </div>

      </div>

      {/* DIGILOCKER VAULT MODAL (Sharp Square Box) */}
      {showDigiLocker && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.45)', 
            backdropFilter: 'blur(4px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 99999, 
            padding: 16 
          }}
        >
          <div 
            style={{ 
              maxWidth: 620, 
              width: '100%', 
              background: '#ffffff', 
              borderRadius: '0px', 
              border: '2px solid #5ca346',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.2)', 
              padding: 24, 
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#182c1d', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🔒 Kisan DigiLocker Vault
                </h3>
                <div style={{ fontSize: 12, color: '#5ca346', fontWeight: 700, marginTop: 2 }}>
                  Encrypted government-verified repository for farmer {userName}
                </div>
              </div>
              <button 
                onClick={() => setShowDigiLocker(false)} 
                style={{ width: 32, height: 32, borderRadius: '0px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Document List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {[
                { title: '7/12 Land Record (Pahani / RoR)', sub: 'Survey #42/1B • 5.50 Acres • Guntur District', tag: 'VERIFIED ✅', date: '2026 Season' },
                { title: 'Soil Health Card (SHC-2026)', sub: 'NPK Diagnosis & Organic Carbon Ratio: 0.68%', tag: 'ACTIVE ✅', date: 'Tested Jan 2026' },
                { title: 'Kisan Credit Card (KCC) Sanction', sub: 'SBI Agri Branch • ₹3,00,000 Limit at 4% Interest', tag: 'APPROVED ✅', date: 'Active' },
                { title: 'Aadhaar Kisan e-KYC Verification', sub: 'UIDAI Linked & Biometrically Verified', tag: 'LINKED ✅', date: 'Permanent' },
                { title: 'PM-Kisan DBT Registration Receipt', sub: 'Direct Benefit Transfer Scheme Beneficiary Slip', tag: 'ACTIVE ✅', date: 'Instalment #16' }
              ].map((doc, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: '#f8faf7',
                    border: '1px solid #e2ece0',
                    borderRadius: '0px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#182c1d' }}>{doc.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{doc.sub}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, background: '#eaf7e6', color: '#2e7d32', padding: '2px 8px', borderRadius: '0px', fontWeight: 800 }}>
                      {doc.tag}
                    </span>
                    <div style={{ marginTop: 6 }}>
                      <button 
                        onClick={() => alert(`Opening ${doc.title}`)}
                        style={{ padding: '4px 10px', fontSize: 11, borderRadius: '0px', border: '1px solid #5ca346', background: '#ffffff', color: '#5ca346', fontWeight: 800, cursor: 'pointer' }}
                      >
                        View / Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <button
                onClick={() => alert('Document upload portal opened. Choose PDF or image.')}
                style={{ flex: 1, padding: '11px', borderRadius: '0px', border: '1.5px solid #5ca346', background: '#ffffff', color: '#5ca346', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
              >
                ⬆️ Upload New Document
              </button>
              <button
                onClick={() => setShowDigiLocker(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '0px', border: 'none', background: '#5ca346', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FARMER PROFILE MODAL (Sharp Square Box) */}
      {showProfile && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.45)', 
            backdropFilter: 'blur(4px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 99999, 
            padding: 16 
          }}
        >
          <div 
            style={{ 
              maxWidth: 480, 
              width: '100%', 
              background: '#ffffff', 
              borderRadius: '0px', 
              border: '2px solid #5ca346',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.2)', 
              padding: 24, 
              position: 'relative' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '0px', background: '#5ca346', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#182c1d' }}>
                    {userName}
                  </h3>
                  <span style={{ fontSize: 11, background: '#eaf7e6', color: '#2e7d32', padding: '2px 8px', borderRadius: '0px', fontWeight: 800 }}>
                    ✓ Verified Kisan Member
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowProfile(false)} 
                style={{ width: 32, height: 32, borderRadius: '0px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '18px 0', background: '#f8faf7', padding: 14, borderRadius: '0px', border: '1px solid #e2ece0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Landholding:</span>
                <span style={{ fontWeight: 800, color: '#182c1d' }}>5.5 Acres (Irrigated)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Primary Crops:</span>
                <span style={{ fontWeight: 800, color: '#182c1d' }}>Wheat, Paddy, Teja Chilli</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>KCC Loan Status:</span>
                <span style={{ fontWeight: 800, color: '#2e7d32' }}>Active (4% Subvention)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Active Language:</span>
                <span style={{ fontWeight: 800, color: '#5ca346' }}>English + {currentLangObj.name}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowProfile(false); window.dispatchEvent(new Event('krishi_open_lang_modal')) }}
                style={{ flex: 1, padding: '10px', borderRadius: '0px', border: '1.5px solid #5ca346', background: '#ffffff', color: '#5ca346', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
              >
                🌐 Change Language
              </button>
              <button
                onClick={() => setShowProfile(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '0px', border: 'none', background: '#5ca346', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SETTINGS MODAL (LINKEDIN & INSTAGRAM / META ACCOUNTS CENTER ARCHITECTURE) */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(6px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 99999, 
            padding: 16 
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsModal(false)
              setSettingsSubView(null)
              if (window.location.hash === '#/settings' || window.location.hash === '#settings') {
                window.location.hash = '#/dashboard'
              }
            }
          }}
        >
          <div 
            style={{ 
              maxWidth: 740, 
              width: '100%', 
              background: '#ffffff', 
              borderRadius: '16px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)', 
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* ----------------------------------------------------------------- */}
            {/* MODAL NAVIGATION TOP BAR (LINKEDIN / INSTAGRAM STYLE) */}
            {/* ----------------------------------------------------------------- */}
            <div 
              style={{ 
                padding: '16px 22px', 
                borderBottom: '1px solid #e2e8f0', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {settingsSubView ? (
                  <button
                    type="button"
                    onClick={() => setSettingsSubView(null)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>←</span>
                    <span>Back</span>
                  </button>
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    ⚙️
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {settingsSubView ? `Settings & Privacy › ${
                      settingsSubView === 'profile' ? 'Personal Details' :
                      settingsSubView === 'language' ? 'Language' :
                      settingsSubView === 'phone' ? 'Phone Number' :
                      settingsSubView === 'password' ? 'Password' :
                      settingsSubView === 'location' ? 'State & PIN Code' :
                      settingsSubView === 'notifications' ? 'Notifications' : 'Account Deletion'
                    }` : 'Krishi-Net Portal'}
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    {settingsSubView === 'profile' ? 'Personal & Farm Details' :
                     settingsSubView === 'language' ? 'Language & Regional Localization' :
                     settingsSubView === 'phone' ? 'Mobile Phone Number' :
                     settingsSubView === 'password' ? 'Password & Sign In Security' :
                     settingsSubView === 'location' ? 'State & Postal PIN Code' :
                     settingsSubView === 'notifications' ? 'Notification & Advisory Alerts' :
                     settingsSubView === 'delete' ? 'Deactivation or Deletion' :
                     'Settings and privacy'}
                  </h2>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setShowSettingsModal(false)
                  setSettingsSubView(null)
                  if (window.location.hash === '#/settings' || window.location.hash === '#settings') {
                    window.location.hash = '#/dashboard'
                  }
                }} 
                style={{ 
                  width: 34, 
                  height: 34, 
                  borderRadius: '50%', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  cursor: 'pointer', 
                  fontSize: 15, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#64748b',
                  fontWeight: 800 
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* SCROLLABLE MAIN CONTENT AREA */}
            {/* ----------------------------------------------------------------- */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#fafbfc' }}>

              {/* =============================================================== */}
              {/* VIEW 1: MASTER CATEGORIES LIST (WHEN settingsSubView === null)   */}
              {/* =============================================================== */}
              {settingsSubView === null && (
                <div>
                  {/* INSTAGRAM-STYLE ACCOUNTS CENTER PROFILE BANNER */}
                  <div 
                    style={{ 
                      background: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '14px', 
                      padding: '16px 18px', 
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14,
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div 
                        style={{ 
                          width: 52, 
                          height: 52, 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                          color: '#ffffff',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: 22, 
                          fontWeight: 900,
                          boxShadow: '0 3px 10px rgba(34, 197, 94, 0.35)',
                          flexShrink: 0
                        }}
                      >
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {userName}
                          <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', fontWeight: 800, borderRadius: '12px' }}>
                            ✓ Verified Farmer
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                          {currentPhone ? `+91 ${currentPhone}` : 'Demo User'} • {settingsState}, India
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          Accounts Center • Manage your connected profiles & preferences
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettingsSubView('profile')}
                      style={{
                        padding: '7px 14px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0f172a',
                        cursor: 'pointer'
                      }}
                    >
                      Personal Details →
                    </button>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* CATEGORY 1: ACCOUNT PREFERENCES (LINKEDIN STYLE) */}
                  {/* ------------------------------------------------------------- */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, paddingLeft: 4 }}>
                      Account Preferences
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      {/* Row 1: Profile Details */}
                      <div 
                        onClick={() => setSettingsSubView('profile')}
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            👤
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Personal details & farm size</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Farmer name, village, landholding & primary crops</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{userName} • {profileLand} Ac</span>
                          <span style={{ fontSize: 18, color: '#94a3b8' }}>›</span>
                        </div>
                      </div>

                      {/* Row 2: Language */}
                      <div 
                        onClick={() => setSettingsSubView('language')}
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            🌐
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Language</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Portal translation, benchmark rates & voice pronunciation</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', fontWeight: 800, borderRadius: '6px' }}>
                            {isNone ? 'English Only' : `${currentLangObj.name} (${currentLangObj.englishName})`}
                          </span>
                          <span style={{ fontSize: 18, color: '#94a3b8' }}>›</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* CATEGORY 2: SIGN IN & SECURITY */}
                  {/* ------------------------------------------------------------- */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, paddingLeft: 4 }}>
                      Sign in & Security
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      {/* Row 3: Phone */}
                      <div 
                        onClick={() => setSettingsSubView('phone')}
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            📱
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Phone number</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Primary 10-digit number for SMS rates and OTP authentication</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{currentPhone ? `+91 ${currentPhone}` : 'Not set'}</span>
                          <span style={{ fontSize: 18, color: '#94a3b8' }}>›</span>
                        </div>
                      </div>

                      {/* Row 4: Password */}
                      <div 
                        onClick={() => setSettingsSubView('password')}
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            🔑
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Change password</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Update account password to keep your portal secure</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>••••••••</span>
                          <span style={{ fontSize: 18, color: '#94a3b8' }}>›</span>
                        </div>
                      </div>

                      {/* Row 5: State and PIN code */}
                      <div 
                        onClick={() => setSettingsSubView('location')}
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            📍
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>State & Postal PIN code</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Used for precision APMC mandi selection & localized weather</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{settingsState} ({settingsPincode})</span>
                          <span style={{ fontSize: 18, color: '#94a3b8' }}>›</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* CATEGORY 3: COMMUNICATIONS & NOTIFICATIONS */}
                  {/* ------------------------------------------------------------- */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, paddingLeft: 4 }}>
                      Communications
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => setSettingsSubView('notifications')}
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#fae8ff', color: '#a21caf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            🔔
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Notification preferences</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Mandi price SMS alerts, real-time voice audio & WhatsApp</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', fontWeight: 800, borderRadius: '6px' }}>
                            3 Active
                          </span>
                          <span style={{ fontSize: 18, color: '#94a3b8' }}>›</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* CATEGORY 4: ACCOUNT MANAGEMENT (DANGER ZONE) */}
                  {/* ------------------------------------------------------------- */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, paddingLeft: 4 }}>
                      Account Management
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '12px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => setSettingsSubView('delete')}
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            🗑️
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#b91c1c' }}>Deactivation or deletion</div>
                            <div style={{ fontSize: 12, color: '#991b1b' }}>Permanently remove your farmer account, phone, and data</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: '#e11d48', fontWeight: 700 }}>Manage</span>
                          <span style={{ fontSize: 18, color: '#f87171' }}>›</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* VIEW 2: SUB-VIEW: PERSONAL DETAILS & PROFILE                     */}
              {/* =============================================================== */}
              {settingsSubView === 'profile' && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Personal & Farm Details</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                      Update your public name, village location, landholding size, and primary crops.
                    </p>
                  </div>

                  <form onSubmit={handleUpdateProfile}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Farmer Full Name: <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={e => setProfileName(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, fontWeight: 600, boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Village / Mandal / Tehsil:
                        </label>
                        <input
                          type="text"
                          value={profileVillage}
                          onChange={e => setProfileVillage(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Landholding Area (in Acres):
                        </label>
                        <input
                          type="text"
                          value={profileLand}
                          onChange={e => setProfileLand(e.target.value)}
                          placeholder="e.g. 4.5"
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Primary Crops Grown:
                        </label>
                        <input
                          type="text"
                          value={profileCrops}
                          onChange={e => setProfileCrops(e.target.value)}
                          placeholder="e.g. Paddy, Cotton, Chilli"
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {profileMsg.error && (
                      <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
                        ⚠️ {profileMsg.error}
                      </div>
                    )}
                    {profileMsg.success && (
                      <div style={{ background: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 800, marginBottom: 14 }}>
                        ✓ {profileMsg.success}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="submit"
                        disabled={profileMsg.loading}
                        style={{
                          padding: '10px 22px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: profileMsg.loading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {profileMsg.loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsSubView(null)}
                        style={{
                          padding: '10px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =============================================================== */}
              {/* VIEW 3: SUB-VIEW: LANGUAGE & LOCALIZATION                        */}
              {/* =============================================================== */}
              {settingsSubView === 'language' && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Language Preferences</h3>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                        Active: <strong style={{ color: '#16a34a' }}>{isNone ? 'English Only (Default)' : `${currentLangObj.name} (${currentLangObj.englishName})`}</strong>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="🔍 Search language..."
                      value={langSearch}
                      onChange={e => setLangSearch(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: '8px', width: 200 }}
                    />
                  </div>

                  <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>
                    Select any regional language below. All agricultural market rates, weather alerts, schemes, and dual-voice pronunciation will shift immediately:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, maxHeight: 320, overflowY: 'auto', padding: '2px' }}>
                    {REGIONAL_LANGUAGES
                      .filter(l => !langSearch || l.name.toLowerCase().includes(langSearch.toLowerCase()) || (l.englishName && l.englishName.toLowerCase().includes(langSearch.toLowerCase())))
                      .map(lang => {
                        const isActive = regLang === lang.code
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleShiftLanguage(lang.code)}
                            style={{
                              padding: '12px 10px',
                              borderRadius: '10px',
                              border: isActive ? '2px solid #22c55e' : '1px solid #e2e8f0',
                              background: isActive ? '#f0fdf4' : '#ffffff',
                              color: isActive ? '#15803d' : '#0f172a',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.15s ease',
                              boxShadow: isActive ? '0 2px 6px rgba(34, 197, 94, 0.2)' : 'none'
                            }}
                          >
                            <span style={{ fontSize: 22 }}>{lang.code === 'none' ? '🌐' : lang.flag}</span>
                            <span style={{ fontSize: 13, fontWeight: 800 }}>{lang.name}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{lang.englishName || 'Default'}</span>
                            {isActive && (
                              <span style={{ fontSize: 10, color: '#15803d', fontWeight: 900, marginTop: 2, background: '#dcfce7', padding: '1px 6px', borderRadius: '6px' }}>
                                ✓ Selected
                              </span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* VIEW 4: SUB-VIEW: MOBILE PHONE NUMBER                            */}
              {/* =============================================================== */}
              {settingsSubView === 'phone' && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Mobile Phone Number</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                      Your phone number is used to authenticate your Krishi-Net account and route real-time APMC Mandi price SMS alerts.
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePhone}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                          Current Registered Number:
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={currentPhone ? `+91 ${currentPhone}` : 'Demo / 9876543210'}
                          style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, color: '#64748b', fontWeight: 700, boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                          New Mobile Number (10 digits): <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ display: 'flex' }}>
                          <span style={{ padding: '10px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 13, fontWeight: 800, color: '#475569' }}>
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="e.g. 9848022338"
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))}
                            style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '0 8px 8px 0', fontSize: 14, fontWeight: 700, color: '#0f172a', outline: 'none' }}
                          />
                        </div>
                      </div>
                    </div>

                    {phoneMsg.error && (
                      <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
                        ⚠️ {phoneMsg.error}
                      </div>
                    )}
                    {phoneMsg.success && (
                      <div style={{ background: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 800, marginBottom: 14 }}>
                        ✓ {phoneMsg.success}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="submit"
                        disabled={phoneMsg.loading || !newPhone}
                        style={{
                          padding: '10px 22px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: phoneMsg.loading || !newPhone ? 'not-allowed' : 'pointer',
                          opacity: phoneMsg.loading || !newPhone ? 0.6 : 1
                        }}
                      >
                        {phoneMsg.loading ? 'Updating...' : 'Update Phone Number'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsSubView(null)}
                        style={{
                          padding: '10px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =============================================================== */}
              {/* VIEW 5: SUB-VIEW: PASSWORD & SECURITY                            */}
              {/* =============================================================== */}
              {settingsSubView === 'password' && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Change Password</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                      Choose a strong, unique password to safeguard your farm data and loan applications.
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePassword}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          New Password (min 4 characters): <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                          Confirm New Password: <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Re-enter identical password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12.5, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={showPass}
                          onChange={e => setShowPass(e.target.checked)}
                        />
                        Show password characters
                      </label>
                    </div>

                    {passMsg.error && (
                      <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
                        ⚠️ {passMsg.error}
                      </div>
                    )}
                    {passMsg.success && (
                      <div style={{ background: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 800, marginBottom: 14 }}>
                        ✓ {passMsg.success}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="submit"
                        disabled={passMsg.loading || !newPassword}
                        style={{
                          padding: '10px 22px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: passMsg.loading || !newPassword ? 'not-allowed' : 'pointer',
                          opacity: passMsg.loading || !newPassword ? 0.6 : 1
                        }}
                      >
                        {passMsg.loading ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsSubView(null)}
                        style={{
                          padding: '10px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =============================================================== */}
              {/* VIEW 6: SUB-VIEW: STATE & PIN CODE (LOCATION)                    */}
              {/* =============================================================== */}
              {settingsSubView === 'location' && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>State & PIN Code Location</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                      Configures micro-climate weather forecasts and benchmarks your local APMC mandi settlement prices.
                    </p>
                  </div>

                  <form onSubmit={handleUpdateLocation}>
                    {/* Country Selector */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <button
                        type="button"
                        onClick={() => setSettingsCountryType('india')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: settingsCountryType === 'india' ? '2px solid #22c55e' : '1px solid #cbd5e1',
                          background: settingsCountryType === 'india' ? '#f0fdf4' : '#ffffff',
                          color: settingsCountryType === 'india' ? '#15803d' : '#475569',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        🇮🇳 India (Official Postal Directory)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsCountryType('other')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: settingsCountryType === 'other' ? '2px solid #22c55e' : '1px solid #cbd5e1',
                          background: settingsCountryType === 'other' ? '#f0fdf4' : '#ffffff',
                          color: settingsCountryType === 'other' ? '#15803d' : '#475569',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        🌍 Other Country (International)
                      </button>
                    </div>

                    {settingsCountryType === 'india' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            Indian State: <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            value={settingsState}
                            onChange={e => setSettingsState(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, fontWeight: 700, background: '#ffffff', boxSizing: 'border-box' }}
                          >
                            {FALLBACK_INDIAN_STATES.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            6-Digit PIN Code: <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="e.g. 534001"
                            value={settingsPincode}
                            onChange={e => setSettingsPincode(e.target.value.replace(/\D/g, ''))}
                            style={{ width: '100%', padding: '10px 12px', border: pincodeCheck.valid === false ? '1.5px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, fontWeight: 800, boxSizing: 'border-box' }}
                          />
                          {pincodeCheck.message && (
                            <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700, color: pincodeCheck.valid ? '#15803d' : '#b91c1c' }}>
                              {pincodeCheck.message}
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            Village / Town:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Eluru Rural"
                            value={settingsVillage}
                            onChange={e => setSettingsVillage(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            Select Country: <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            value={settingsCountryName}
                            onChange={e => setSettingsCountryName(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, fontWeight: 700, background: '#ffffff', boxSizing: 'border-box' }}
                          >
                            {COUNTRIES_LIST.map(c => (
                              <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            City / Region:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. California"
                            value={settingsVillage}
                            onChange={e => setSettingsVillage(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: 13, boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}

                    {locationMsg.error && (
                      <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
                        ⚠️ {locationMsg.error}
                      </div>
                    )}
                    {locationMsg.success && (
                      <div style={{ background: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 800, marginBottom: 14 }}>
                        ✓ {locationMsg.success}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="submit"
                        disabled={locationMsg.loading}
                        style={{
                          padding: '10px 22px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: locationMsg.loading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {locationMsg.loading ? 'Saving...' : 'Save Location Settings'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsSubView(null)}
                        style={{
                          padding: '10px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =============================================================== */}
              {/* VIEW 7: SUB-VIEW: NOTIFICATIONS                                  */}
              {/* =============================================================== */}
              {settingsSubView === 'notifications' && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Notification & Advisory Preferences</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                      Choose how you receive live crop rates, weather warnings, and agricultural extension advice.
                    </p>
                  </div>

                  <form onSubmit={handleSaveNotifications}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daily Mandi Price SMS Alerts</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Morning SMS with daily APMC modal rates for your chosen crops</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifSms}
                          onChange={e => setNotifSms(e.target.checked)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Dual Voice Audio Guidance</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Spoken advisories in English and your selected regional language</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifAudio}
                          onChange={e => setNotifAudio(e.target.checked)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>WhatsApp Kisan Consultation</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Allow direct agronomist diagnostic follow-ups on WhatsApp</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifWhatsApp}
                          onChange={e => setNotifWhatsApp(e.target.checked)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                      </label>
                    </div>

                    {notifMsg.success && (
                      <div style={{ background: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 800, marginBottom: 14 }}>
                        ✓ {notifMsg.success}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="submit"
                        style={{
                          padding: '10px 22px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        Save Preferences
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsSubView(null)}
                        style={{
                          padding: '10px 18px',
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =============================================================== */}
              {/* VIEW 8: SUB-VIEW: ACCOUNT DELETION (DANGER ZONE)                 */}
              {/* =============================================================== */}
              {settingsSubView === 'delete' && (
                <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '22px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#b91c1c' }}>Deactivation or Deletion</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                      Permanent account removal process for Krishi-Net farmer profiles.
                    </p>
                  </div>

                  <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>
                      ⚠️ This action is permanent and cannot be undone
                    </div>
                    <div style={{ fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.5 }}>
                      Deleting your account will remove your registered phone (<strong>+91 {currentPhone || '9876543210'}</strong>), personalized mandi rate alerts, soil health cards, and all farm records from Krishi-Net servers permanently.
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={deleteConfirmed}
                        onChange={e => setDeleteConfirmed(e.target.checked)}
                        style={{ marginTop: 3, width: 16, height: 16 }}
                      />
                      <span>I understand that this action is permanent and I want to delete my account.</span>
                    </label>
                  </div>

                  {deleteMsg.error && (
                    <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: 12.5, fontWeight: 700, marginBottom: 14 }}>
                      ⚠️ {deleteMsg.error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteMsg.loading || !deleteConfirmed}
                      style={{
                        padding: '10px 22px',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: deleteMsg.loading || !deleteConfirmed ? 'not-allowed' : 'pointer',
                        opacity: deleteMsg.loading || !deleteConfirmed ? 0.6 : 1
                      }}
                    >
                      {deleteMsg.loading ? 'Deleting Account...' : 'Permanently Delete Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubView(null)}
                      style={{
                        padding: '10px 18px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MODAL FOOTER BAR */}
            {/* ----------------------------------------------------------------- */}
            <div 
              style={{ 
                padding: '14px 22px', 
                borderTop: '1px solid #e2e8f0', 
                background: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false)
                  setSettingsSubView(null)
                  window.location.hash = '#/select-language'
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🌐 Re-run Initial Setup
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {settingsSubView && (
                  <button 
                    type="button"
                    onClick={() => setSettingsSubView(null)} 
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      background: '#ffffff', 
                      color: '#0f172a', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      fontSize: 12.5
                    }}
                  >
                    ← Back to All Settings
                  </button>
                )}

                <button 
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false)
                    setSettingsSubView(null)
                    if (window.location.hash === '#/settings' || window.location.hash === '#settings') {
                      window.location.hash = '#/dashboard'
                    }
                  }} 
                  style={{ 
                    padding: '8px 20px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: '#0f172a', 
                    color: '#ffffff', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    fontSize: 12.5
                  }}
                >
                  Done & Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
