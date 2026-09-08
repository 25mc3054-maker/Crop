import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { API_BASE_URL } from './config'
import { COUNTRIES_LIST, findCountry, validateInternationalPhone } from './countriesData'

// Standard fallback list of Indian States & Union Territories
const FALLBACK_INDIAN_STATES = [
  'ANDAMAN & NICOBAR ISLANDS',
  'ANDHRA PRADESH',
  'ARUNACHAL PRADESH',
  'ASSAM',
  'BIHAR',
  'CHANDIGARH',
  'CHHATTISGARH',
  'DADRA & NAGAR HAVELI AND DAMAN & DIU',
  'DELHI',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL PRADESH',
  'JAMMU & KASHMIR',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'LADAKH',
  'LAKSHADWEEP',
  'MADHYA PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
  'ODISHA',
  'PUDUCHERRY',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR PRADESH',
  'UTTARAKHAND',
  'WEST BENGAL'
];

export default function Register({ onDone }) {
  // Top selector: 'india' (default) or 'other'
  const [countryType, setCountryType] = useState('india')
  const [countryName, setCountryName] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [village, setVillage] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('register')
  const [demoOtp, setDemoOtp] = useState('')
  const [statesList, setStatesList] = useState(FALLBACK_INDIAN_STATES)
  const [pinValidation, setPinValidation] = useState({
    checked: false,
    match: null,
    error: '',
    district: '',
    actualState: '',
    offices: []
  })

  // Load official states list on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/states`)
        if (res.data?.states?.length > 0) {
          setStatesList(res.data.states)
        }
      } catch (e) {
        // Fallback already pre-set
      }
    }
    fetchStates()
  }, [])

  // Real-time validation for India mode
  useEffect(() => {
    if (countryType !== 'india') {
      setPinValidation({ checked: false, match: null, error: '', district: '', actualState: '', offices: [] })
      return
    }

    const cleanPin = pincode.replace(/\D/g, '').slice(0, 6)
    if (cleanPin.length === 6 && state) {
      validateStateAndPincode(state, cleanPin)
    } else {
      setPinValidation({
        checked: false,
        match: null,
        error: cleanPin.length > 0 && cleanPin.length < 6 ? 'PIN code must be 6 digits' : '',
        district: '',
        actualState: '',
        offices: []
      })
    }
  }, [countryType, state, pincode])

  const validateStateAndPincode = async (selectedState, pin) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/pincode/validate`, {
        params: { state: selectedState, pincode: pin }
      })
      const data = res.data
      if (data.match) {
        setPinValidation({
          checked: true,
          match: true,
          error: '',
          district: data.district,
          actualState: data.state,
          offices: data.offices || []
        })
      } else {
        setPinValidation({
          checked: true,
          match: false,
          error: data.error || `State and Pincode are not matching. PIN code ${pin} belongs to ${data.actualState || 'another state'}, not ${selectedState}.`,
          district: data.district || '',
          actualState: data.actualState || '',
          offices: []
        })
      }
    } catch (err) {
      setPinValidation({
        checked: true,
        match: false,
        error: 'Unable to verify PIN code right now. Please check your network.',
        district: '',
        actualState: '',
        offices: []
      })
    }
  }

  const matchedCountry = useMemo(() => {
    return countryType === 'other' ? findCountry(countryName) : null
  }, [countryType, countryName])

  const cleanPhone = useMemo(() => {
    return phone.replace(/\D/g, '')
  }, [phone])

  const intlPhoneValidation = useMemo(() => {
    if (countryType !== 'other') return { valid: true }
    if (!countryName.trim()) return { valid: false, error: 'Please enter or select country name', reason: 'no_country' }
    if (!cleanPhone) return { valid: false, error: 'Please enter phone number', reason: 'empty_phone' }
    return validateInternationalPhone(countryName, cleanPhone)
  }, [countryType, countryName, cleanPhone])

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    // For India: strictly limited to 10 digits
    // For Other Country: allow standard international format (up to 15 digits)
    const maxDigits = countryType === 'india' ? 10 : 15
    setPhone(raw.slice(0, maxDigits))
  }

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(val)
  }

  const sendOtp = async (e) => {
    e && e.preventDefault()
    
    // Country-specific phone validation
    if (countryType === 'india') {
      if (cleanPhone.length !== 10) {
        return alert(`Mobile number must be exactly 10 digits for India (currently ${cleanPhone.length} digits)`)
      }
      if (!state) return alert('Please select your State')
      if (pincode.length !== 6) return alert('Please enter a valid 6-digit Indian PIN code')
      if (pinValidation.checked && pinValidation.match === false) {
        return alert(pinValidation.error || 'State and Pincode are not matching! Please correct before proceeding.')
      }
    } else {
      if (!countryName.trim()) return alert('Please enter or select your Country Name')
      const phoneCheck = validateInternationalPhone(countryName, cleanPhone)
      if (!phoneCheck.valid) {
        return alert(phoneCheck.error)
      }
    }
    
    if (!name.trim()) return alert('Please enter your full name')

    if (countryType === 'india') {
      if (!state) return alert('Please select your State')
      if (pincode.length !== 6) return alert('Please enter a valid 6-digit Indian PIN code')
      if (pinValidation.checked && pinValidation.match === false) {
        return alert(pinValidation.error || 'State and Pincode are not matching! Please correct before proceeding.')
      }
    } else {
      if (!countryName.trim()) return alert('Please enter your Country Name')
    }

    if (!village.trim()) {
      return alert(countryType === 'india' ? 'Please enter your Village / Taluka' : 'Please enter your City / Village / Region')
    }

    setLoading(true)
    try {
      const payload = {
        phone,
        name,
        countryType,
        countryName: countryType === 'india' ? 'India' : countryName.trim(),
        state: state.trim(),
        pincode: countryType === 'india' ? pincode.trim() : '',
        village: village.trim(),
        password
      }

      const res = await axios.post(`${API_BASE_URL}/auth/register`, payload)
      setStep('verify')
      if (res.data.devOtp) {
        setDemoOtp(res.data.devOtp)
        setOtp(res.data.devOtp)
      } else {
        alert('OTP sent! Check your phone.')
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e) => {
    e && e.preventDefault()
    if (!otp || otp.length !== 6) return alert('Enter valid 6-digit OTP')
    
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-registration`, { phone, otp })
      if (res.data.token) {
        localStorage.setItem('farmer_token', res.data.token)
        localStorage.setItem('farmer_name', (res.data.user?.name || name).trim())
        localStorage.setItem('farmer_registered_name', (res.data.user?.name || name).trim())
        localStorage.setItem('farmer_country_type', countryType)
        localStorage.setItem('farmer_country', countryType === 'india' ? 'India' : countryName)
        localStorage.setItem('farmer_state', state)
        localStorage.setItem('farmer_pincode', countryType === 'india' ? pincode : '')
        localStorage.setItem('farmer_village', village)
      }
      alert('Registration successful!')
      onDone && onDone()
    } catch (err) {
      alert(err.response?.data?.error || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="hero">
      <div className="hero-card" style={{ maxWidth: 520, textAlign: 'left', padding: '32px 28px', borderRadius: '24px' }}>
        
        {/* Top Country Selector: India (Direct default) & Other Country */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: 4, borderRadius: '12px', marginBottom: 22 }}>
          <button
            type="button"
            onClick={() => {
              setCountryType('india')
              setState('')
              setPincode('')
              setPhone(prev => prev.slice(0, 10))
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              background: countryType === 'india' ? '#15803d' : 'transparent',
              color: countryType === 'india' ? '#ffffff' : '#334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: countryType === 'india' ? '0 2px 8px rgba(21,128,61,0.3)' : 'none'
            }}
          >
            <span style={{ fontSize: 16 }}>🇮🇳</span> India
          </button>

          <button
            type="button"
            onClick={() => {
              setCountryType('other')
              setState('')
              setPincode('')
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              background: countryType === 'other' ? '#15803d' : 'transparent',
              color: countryType === 'other' ? '#ffffff' : '#334155',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: countryType === 'other' ? '0 2px 8px rgba(21,128,61,0.3)' : 'none'
            }}
          >
            <span style={{ fontSize: 16 }}>🌍</span> Other Country
          </button>
        </div>

        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: 26, fontWeight: 900, color: '#000000' }}>
            {step === 'register' ? (countryType === 'india' ? 'Farmer Registration (India)' : 'International Farmer Registration') : 'Verify Mobile OTP'}
          </h2>
          <p style={{ margin: 0, color: '#1f2937', fontWeight: 600, fontSize: 14 }}>
            {countryType === 'india' 
              ? 'Join thousands of farmers across India benefiting from Krishi-Net'
              : 'Join global farmers benefiting from AI agronomy & precision weather'}
          </p>
        </div>

        {step === 'register' ? (
          <form onSubmit={sendOtp}>
            {countryType === 'india' ? (
              <>
                {/* INDIA MODE: 1. Strict 10-Digit Mobile Number */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ color: '#000000', fontWeight: 800, margin: 0 }}>
                      Mobile Number <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cleanPhone.length === 10 ? '#16a34a' : '#64748b' }}>
                      {cleanPhone.length === 10 ? '✓ Exactly 10 digits' : `${cleanPhone.length}/10 digits`}
                    </span>
                  </div>
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile number" 
                    value={phone} 
                    onChange={handlePhoneChange}
                    maxLength={10}
                    style={{ 
                      backgroundColor: '#ffffff', 
                      color: '#000000', 
                      border: cleanPhone.length === 10 ? '2px solid #16a34a' : (cleanPhone.length > 0 ? '2px solid #f59e0b' : '2px solid #cbd5e1'), 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: '0.5px'
                    }} 
                  />
                  {cleanPhone.length > 0 && cleanPhone.length < 10 && (
                    <div style={{ color: '#d97706', fontSize: 11, marginTop: 4, fontWeight: 700 }}>
                      ⚠️ Mobile number must be exactly 10 digits ({10 - cleanPhone.length} more digits needed)
                    </div>
                  )}
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#000000', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ramesh Kumar Patel" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a', width: '100%', padding: '10px 12px', borderRadius: '8px' }} 
                  />
                </div>

                {/* State & Pincode Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ color: '#000000', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                      State <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      value={state}
                      onChange={e => setState(e.target.value)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: '2px solid #16a34a',
                        width: '100%',
                        padding: '10px 8px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: 13
                      }}
                    >
                      <option value="">-- Select State --</option>
                      {statesList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#000000', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                      PIN Code <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="6 digits (e.g. 521211)" 
                      value={pincode} 
                      onChange={handlePincodeChange}
                      maxLength={6}
                      style={{ 
                        backgroundColor: '#ffffff', 
                        color: '#000000', 
                        border: pinValidation.checked && !pinValidation.match ? '2.5px solid #dc2626' : '2px solid #16a34a', 
                        width: '100%', 
                        padding: '10px 12px', 
                        borderRadius: '8px',
                        fontWeight: 700,
                        letterSpacing: '1px'
                      }} 
                    />
                  </div>
                </div>

                {/* State & Pincode Matching Validation Messages */}
                {pinValidation.checked && !pinValidation.match && (
                  <div 
                    style={{ 
                      background: '#fef2f2', 
                      border: '2px solid #ef4444', 
                      borderRadius: '10px', 
                      padding: '10px 14px', 
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8
                    }}
                  >
                    <span style={{ fontSize: 18 }}>❌</span>
                    <div>
                      <div style={{ color: '#991b1b', fontWeight: 900, fontSize: 13 }}>
                        State and Pincode are not matching
                      </div>
                      <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 2 }}>
                        PIN code <strong>{pincode}</strong> belongs to <strong>{pinValidation.actualState}</strong>, not {state}.
                      </div>
                    </div>
                  </div>
                )}

                {pinValidation.checked && pinValidation.match && (
                  <div 
                    style={{ 
                      background: '#f0fdf4', 
                      border: '2px solid #22c55e', 
                      borderRadius: '10px', 
                      padding: '10px 14px', 
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8
                    }}
                  >
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ color: '#15803d', fontWeight: 900 }}>
                        Verified Indian Postal Code
                      </div>
                      <div style={{ color: '#166534', marginTop: 1 }}>
                        District: <strong>{pinValidation.district || 'Verified Area'}</strong>, {pinValidation.actualState}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* OTHER COUNTRY MODE */}
                {/* 1. Country Name (Mandatory) */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ color: '#000000', fontWeight: 800, margin: 0 }}>
                      Country Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    {matchedCountry && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d' }}>
                        {matchedCountry.flag} {matchedCountry.name} (Dial {matchedCountry.dial})
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    list="international-countries-datalist"
                    placeholder="Type or select Country (e.g. Singapore, United States, United Kingdom...)" 
                    value={countryName} 
                    onChange={e => setCountryName(e.target.value)} 
                    style={{ 
                      backgroundColor: '#ffffff', 
                      color: '#000000', 
                      border: countryName.trim() ? '2px solid #16a34a' : '2px solid #cbd5e1', 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: '8px', 
                      fontWeight: 600,
                      fontSize: 14
                    }} 
                  />
                  <datalist id="international-countries-datalist">
                    {COUNTRIES_LIST.map(c => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name} ({c.dial}, {c.minDigits === c.maxDigits ? `${c.minDigits} digits` : `${c.minDigits}-${c.maxDigits} digits`})
                      </option>
                    ))}
                  </datalist>

                  {/* Quick selection chips for popular farming countries */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#475569', fontWeight: 700, alignSelf: 'center' }}>Popular:</span>
                    {[
                      { name: 'Singapore', flag: '🇸🇬', digits: '8' },
                      { name: 'United States', flag: '🇺🇸', digits: '10' },
                      { name: 'United Kingdom', flag: '🇬🇧', digits: '10-11' },
                      { name: 'Australia', flag: '🇦🇺', digits: '9-10' },
                      { name: 'Denmark', flag: '🇩🇰', digits: '8' },
                      { name: 'Norway', flag: '🇳🇴', digits: '8' },
                      { name: 'Kenya', flag: '🇰🇪', digits: '9-10' },
                      { name: 'United Arab Emirates', flag: '🇦🇪', digits: '9' }
                    ].map(item => {
                      const isSelected = countryName.toLowerCase() === item.name.toLowerCase()
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setCountryName(item.name)}
                          style={{
                            background: isSelected ? '#15803d' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#334155',
                            border: isSelected ? '1.5px solid #15803d' : '1px solid #cbd5e1',
                            borderRadius: '9999px',
                            padding: '3px 9px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {item.flag} {item.name} ({item.digits}d)
                        </button>
                      )
                    })}
                  </div>

                  {matchedCountry && (
                    <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '8px', padding: '6px 10px', marginTop: 8, fontSize: 12, color: '#065f46', fontWeight: 700 }}>
                      {matchedCountry.flag} <strong>{matchedCountry.name}</strong> phone rules: {matchedCountry.minDigits === matchedCountry.maxDigits ? `Must have exactly ${matchedCountry.minDigits} digits` : `Must have between ${matchedCountry.minDigits} and ${matchedCountry.maxDigits} digits`} (Dial code: {matchedCountry.dial}, e.g. {matchedCountry.example})
                    </div>
                  )}
                </div>

                {/* 2. Mobile / Phone Number with Country-Specific Digit Rules Checking */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ color: '#000000', fontWeight: 800, margin: 0 }}>
                      Phone Number <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <span style={{ fontSize: 11, fontWeight: 700, color: (countryName.trim() && intlPhoneValidation.valid) ? '#16a34a' : ((countryName.trim() && cleanPhone.length > 0 && !intlPhoneValidation.valid) ? '#dc2626' : '#64748b') }}>
                      {matchedCountry 
                        ? `${matchedCountry.flag} Requires ${matchedCountry.minDigits === matchedCountry.maxDigits ? `${matchedCountry.minDigits} digits` : `${matchedCountry.minDigits}-${matchedCountry.maxDigits} digits`} (${cleanPhone.length} entered)`
                        : (cleanPhone.length > 0 ? `${cleanPhone.length} digits entered` : 'International phone format')}
                    </span>
                  </div>
                  <input 
                    type="tel" 
                    placeholder={matchedCountry ? `e.g. ${matchedCountry.example} (${matchedCountry.minDigits === matchedCountry.maxDigits ? `${matchedCountry.minDigits} digits` : `${matchedCountry.minDigits}-${matchedCountry.maxDigits} digits`})` : 'Enter phone number'} 
                    value={phone} 
                    onChange={handlePhoneChange}
                    maxLength={15}
                    style={{ 
                      backgroundColor: '#ffffff', 
                      color: '#000000', 
                      border: countryName.trim() && cleanPhone.length > 0 
                        ? (intlPhoneValidation.valid ? '2px solid #16a34a' : '2.5px solid #dc2626') 
                        : '2px solid #cbd5e1', 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: '0.5px'
                    }} 
                  />

                  {/* Real-time Country Phone Rule Validation Feedback */}
                  {countryName.trim() && cleanPhone.length > 0 && !intlPhoneValidation.valid && (
                    <div 
                      style={{ 
                        background: '#fef2f2', 
                        border: '2px solid #ef4444', 
                        borderRadius: '10px', 
                        padding: '10px 14px', 
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                      }}
                    >
                      <span style={{ fontSize: 18 }}>❌</span>
                      <div>
                        <div style={{ color: '#991b1b', fontWeight: 900, fontSize: 13 }}>
                          Phone Number Format Mismatch
                        </div>
                        <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 2, fontWeight: 700 }}>
                          {intlPhoneValidation.error}
                        </div>
                      </div>
                    </div>
                  )}

                  {countryName.trim() && cleanPhone.length > 0 && intlPhoneValidation.valid && (
                    <div 
                      style={{ 
                        background: '#f0fdf4', 
                        border: '2px solid #22c55e', 
                        borderRadius: '10px', 
                        padding: '8px 12px', 
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <span style={{ fontSize: 16 }}>✅</span>
                      <div style={{ color: '#15803d', fontSize: 12, fontWeight: 800 }}>
                        Valid {intlPhoneValidation.country || matchedCountry?.name || countryName} phone number ({cleanPhone.length} digits)
                        {matchedCountry?.dial ? ` · Dial code ${matchedCountry.dial}` : ''}
                      </div>
                    </div>
                  )}

                  {!countryName.trim() && (
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                      💡 Enter or select your <strong>Country Name</strong> above to check your phone number format (e.g. Singapore requires 8 digits, USA requires 10 digits).
                    </div>
                  )}
                </div>

                {/* 3. Full Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#000000', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Johnathan Smith / Wei Lee" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a', width: '100%', padding: '10px 12px', borderRadius: '8px' }} 
                  />
                </div>

                {/* 4. State / Province (Optional for Other Countries) */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#000000', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                    State / Province <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter state or province (optional)" 
                    value={state} 
                    onChange={e => setState(e.target.value)} 
                    style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #94a3b8', width: '100%', padding: '10px 12px', borderRadius: '8px' }} 
                  />
                </div>
                {/* Note: In Other Country, PIN code is NOT asked! */}
              </>
            )}

            {/* Village / City / Region */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: '#000000', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                {countryType === 'india' ? 'Village / Taluka' : 'City / Village / Region'} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input 
                type="text" 
                placeholder={countryType === 'india' ? 'Your village or location' : 'Your city, town, or farm location'} 
                value={village} 
                onChange={e => setVillage(e.target.value)} 
                style={{ backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a', width: '100%', padding: '10px 12px', borderRadius: '8px' }} 
              />
              {/* Optional office suggestions for India */}
              {countryType === 'india' && pinValidation.offices?.length > 0 && !village && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#475569' }}>
                  Nearby areas:{' '}
                  {pinValidation.offices.slice(0, 4).map((off, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setVillage(off.replace(/\s+[BS]\.O\.?$/i, ''))}
                      style={{
                        background: '#e0f2fe',
                        border: '1px solid #7dd3fc',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        margin: '2px 3px',
                        fontSize: 11,
                        cursor: 'pointer',
                        color: '#0369a1'
                      }}
                    >
                      {off.replace(/\s+[BS]\.O\.?$/i, '')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ color: '#000000', fontWeight: 800, margin: 0 }}>Password (Optional)</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#065f46',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: 0,
                    textTransform: 'uppercase'
                  }}
                >
                  {showPassword ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Create password (optional)" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    color: '#000000', 
                    border: '2px solid #16a34a',
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '44px',
                    borderRadius: '8px'
                  }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || phone.length !== 10 || (countryType === 'india' && pinValidation.checked && pinValidation.match === false)} 
              className="btn btn-dark btn-block" 
              style={{ 
                padding: 14,
                borderRadius: '8px',
                opacity: (phone.length !== 10 || (countryType === 'india' && pinValidation.checked && pinValidation.match === false)) ? 0.6 : 1,
                cursor: (phone.length !== 10 || (countryType === 'india' && pinValidation.checked && pinValidation.match === false)) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Validating & Generating OTP...' : '⚡ Generate OTP & Proceed'}
            </button>
            <button 
              type="button" 
              className="btn btn-primary btn-block" 
              onClick={() => window.location.hash = '#/'} 
              style={{ marginTop: 12, padding: 12, borderRadius: '8px' }}
            >
              ← Back to Home / Login
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <p style={{ color: '#1f2937', fontWeight: 700 }}>
                OTP has been sent to <strong style={{ color: '#000000' }}>{phone}</strong>
              </p>
              <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 8 }}>
                Location: <strong>{village}{state ? `, ${state}` : ''} ({countryType === 'india' ? pincode : (countryName || 'International')})</strong>
              </div>
              {demoOtp && (
                <div style={{ background: '#dcfce7', border: '2px solid #16a34a', padding: '12px 14px', marginTop: 10, color: '#000000', fontSize: 13, borderRadius: '8px' }}>
                  <div style={{ fontWeight: 900, textTransform: 'uppercase', color: '#15803d' }}>⚡ Demo Mode (Auto-Generated OTP)</div>
                  <div style={{ marginTop: 4, color: '#000000', fontSize: 14 }}>
                    Your verification code: <strong style={{ fontSize: 18, color: '#047857', letterSpacing: 3, fontWeight: 900 }}>{demoOtp}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2, fontWeight: 600 }}>(Auto-populated for instant testing)</div>
                </div>
              )}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#000000', fontWeight: 800, display: 'block', marginBottom: 4 }}>Enter 6-Digit OTP</label>
              <input 
                type="text" 
                placeholder="000000" 
                value={otp} 
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                maxLength="6" 
                style={{ fontSize: 20, textAlign: 'center', letterSpacing: 6, fontWeight: 900, backgroundColor: '#ffffff', color: '#000000', border: '2px solid #16a34a', width: '100%', padding: '10px', borderRadius: '8px' }} 
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-dark btn-block" style={{ padding: 14, borderRadius: '8px' }}>
              {loading ? '⏳ Verifying...' : '✓ Complete Registration'}
            </button>
            <button type="button" className="btn btn-primary btn-block" onClick={() => setStep('register')} style={{ marginTop: 12, padding: 12, borderRadius: '8px' }}>
              ← Edit Details
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
