import React, { useState, useEffect } from 'react'
import { REGIONAL_LANGUAGES, UI_LANG_STRINGS, DUAL_DICTIONARY, playDualVoice } from '../languageHelper'

export default function Navbar({ 
  title, 
  onBack, 
  onLogout, 
  showBack = false,
  isDashboard = false,
  onOpenProfile,
  onOpenDigiLocker
}) {
  const [regLang, setRegLang] = useState(() => localStorage.getItem('krishi_secondary_lang') || 'none')
  const [showModal, setShowModal] = useState(false)
  const [showInternalProfile, setShowInternalProfile] = useState(false)
  const [userName, setUserName] = useState('Greeshmanth')

  useEffect(() => {
    try {
      const token = localStorage.getItem('farmer_token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.name) setUserName(payload.name)
      }
    } catch (e) {}

    const updateLang = () => setRegLang(localStorage.getItem('krishi_secondary_lang') || 'none')
    window.addEventListener('krishi_lang_changed', updateLang)
    window.addEventListener('storage', updateLang)
    return () => {
      window.removeEventListener('krishi_lang_changed', updateLang)
      window.removeEventListener('storage', updateLang)
    }
  }, [])

  const isNone = regLang === 'none'
  const currentLangObj = REGIONAL_LANGUAGES.find(l => l.code === regLang) || REGIONAL_LANGUAGES[0]

  // Regional welcome greeting for user's selected language
  const getRegionalGreeting = () => {
    if (isNone) return ''
    const greetings = {
      te: 'స్వాగతం',
      hi: 'स्वागत है',
      ml: 'സ്വാഗതം',
      ta: 'வரவேற்கிறோம்',
      kn: 'ಸ್ವಾಗತ',
      pa: 'ਜੀ ਆਇਆਂ ਨੂੰ',
      bn: 'স্বাগতম',
      gu: 'સ્વાગત છે',
      mr: 'स्वागत आहे',
      ur: 'خوش آمدید',
      or: 'ସ୍ୱାଗତ',
      as: 'স্বাগতম'
    }
    const greetWord = greetings[regLang] || DUAL_DICTIONARY.welcome[regLang] || 'Welcome'
    return `(${greetWord}, ${userName}!)`
  }

  const handleSelectLang = (code) => {
    setRegLang(code)
    localStorage.setItem('krishi_secondary_lang', code)
    setShowModal(false)

    if (code === 'none') {
      playDualVoice('Language set to English Only.', '', 'none')
    } else {
      const targetLang = REGIONAL_LANGUAGES.find(l => l.code === code)
      const str = UI_LANG_STRINGS[code] || UI_LANG_STRINGS.none
      const enText = `${targetLang ? targetLang.englishName : ''} and English selected. Welcome to Krishi-Net.`
      const regText = str.greeting || ''
      playDualVoice(enText, regText, code)
    }

    window.dispatchEvent(new Event('krishi_lang_changed'))
  }

  const navItems = [
    { label: 'Home', hash: '#/dashboard' },
    { label: 'Mandi Rates', hash: '#/market-prices' },
    { label: 'Soil Health', hash: '#/soil-analyser' },
    { label: 'Weather', hash: '#/weather' },
    { label: 'AI Assistance', hash: '#/ai-assistant' },
    { label: 'Crop Planner', hash: '#/crop-planner' },
    { label: 'Pest Disease', hash: '#/pest-disease' },
    { label: 'Equipment Rental', hash: '#/equipment' },
    { label: 'Irrigation Scheduler', hash: '#/irrigation' },
    { label: 'Farm Records', hash: '#/records' },
    { label: '⚙️ Settings', hash: '#/settings' }
  ]

  const currentHash = window.location.hash || '#/dashboard'

  return (
    <>
      {/* TOP HEADER BAR (Logo & Name on left | Welcome Greeshmanth, Language change, Profile on right - Sharp Box) */}
      {isDashboard && (
        <header 
          style={{
            background: '#ffffff',
            border: '1px solid #e2ece0',
            borderRadius: '0px',
            padding: '12px 20px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            boxShadow: '0 2px 6px rgba(24, 44, 29, 0.04)'
          }}
        >
          {/* Logo & Name */}
          <div 
            onClick={() => window.location.hash = '#/dashboard'} 
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <div 
              style={{ 
                width: 42, 
                height: 42, 
                borderRadius: '0px', 
                background: 'linear-gradient(135deg, #6cba55 0%, #4e9436 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 22, 
                color: '#ffffff',
                border: '1px solid #4e9436'
              }}
            >
              🌱
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#182c1d', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                Krishi<span style={{ color: '#5ca346' }}>-Net</span>
              </div>
              <div style={{ fontSize: 11, color: '#5ca346', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                🌾 Smart Agricultural OS
              </div>
            </div>
          </div>

          {/* Right Controls: Welcome 'Greeshmanth' (in their own language) | Language Option | Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Welcome greeting in English + dynamic selected language */}
            <div style={{ textAlign: 'right', paddingRight: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#182c1d', lineHeight: 1.2 }}>
                Welcome, <span style={{ color: '#5ca346' }}>{userName}</span>! 👋
              </div>
              {!isNone && (
                <div style={{ fontSize: 12, color: '#5ca346', fontWeight: 700, marginTop: 2 }}>
                  {getRegionalGreeting()}
                </div>
              )}
            </div>

            {/* Language Change Option Button - Sharp Square Box */}
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '7px 14px',
                borderRadius: '0px',
                border: '1.5px solid #5ca346',
                background: '#ffffff',
                color: '#5ca346',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ee' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
              title="Change Language"
            >
              <span>🌐</span> {isNone ? 'Language' : currentLangObj.name} <span style={{ fontSize: 9 }}>▼</span>
            </button>

            {/* Profile Option Button - Sharp Square Box */}
            <button
              onClick={() => onOpenProfile ? onOpenProfile() : setShowInternalProfile(true)}
              style={{
                padding: '7px 14px',
                borderRadius: '0px',
                border: '1px solid #d1fae5',
                background: '#f0f7ee',
                color: '#182c1d',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#5ca346' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1fae5' }}
              title="View Farmer Profile"
            >
              <span style={{ width: 22, height: 22, borderRadius: '0px', background: '#5ca346', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
                {userName.charAt(0).toUpperCase()}
              </span>
              <span>Profile</span>
            </button>

            {/* Settings Option Button */}
            <button
              onClick={() => {
                window.location.hash = '#/settings'
                window.dispatchEvent(new Event('krishi_open_settings'))
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '0px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#5ca346' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1' }}
              title="Portal Settings & Language Preferences"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>

            {/* Logout Button - Sharp Square Box */}
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  padding: '7px 13px',
                  borderRadius: '0px',
                  border: '1px solid #fed7aa',
                  background: '#fff7ed',
                  color: '#c2410c',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ffedd5' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed' }}
                title="Logout"
              >
                Logout
              </button>
            )}
          </div>
        </header>
      )}

      {/* SEGMENTED NAVIGATION BAR ROW (Sharp Square Boxes - Full Width, No Scrolling) */}
      <nav className="segmented-nav-container" aria-label="Main Navigation">
        <div className="segmented-nav-row">
          {showBack && (
            <button
              onClick={onBack || (() => window.location.hash = '#/dashboard')}
              className="segmented-nav-item"
              style={{ fontWeight: 800, color: '#475569', flex: '0 0 90px' }}
            >
              ← Back
            </button>
          )}

          {navItems.map((item) => {
            const isActive = currentHash === item.hash
            // Dynamic proportional weighting:
            // Short items (Home, Weather) don't hog excessive empty space,
            // while longer items (Equipment Rental, Irrigation Scheduler) receive generous breathing room.
            const isLong = item.label.length >= 15 // Equipment Rental (16), Irrigation Scheduler (20)
            const isShort = item.label.length <= 7 // Home (4), Weather (7)
            const flexStyle = isLong ? '1.5 1 auto' : (isShort ? '0.75 1 auto' : '1 1 auto')
            const padStyle = isLong ? '13px 20px' : (isShort ? '13px 12px' : '13px 15px')

            return (
              <button
                key={item.hash}
                onClick={() => window.location.hash = item.hash}
                className={`segmented-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  flex: flexStyle,
                  padding: padStyle
                }}
                title={item.label}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Subpage title if provided */}
      {title && (
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#182c1d' }}>
            {title}
          </h1>
        </div>
      )}

      {/* Regional Language Picker Modal - Sharp Square Box */}
      {showModal && (
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
              maxWidth: 580, 
              width: '100%', 
              maxHeight: '90vh', 
              background: '#ffffff', 
              borderRadius: '0px', 
              border: '2px solid #5ca346',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.2)', 
              padding: 24, 
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#182c1d' }}>
                  Select Language / भाषा चुनें
                </h3>
                <div style={{ fontSize: 12, color: '#5ca346', fontWeight: 700, marginTop: 2 }}>
                  English is always active with your selected regional language
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '0px', 
                  background: '#f1f5f9', 
                  border: '1px solid #cbd5e1', 
                  color: '#475569', 
                  fontSize: 16, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, margin: '8px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {REGIONAL_LANGUAGES.map(l => {
                  const isSelected = regLang === l.code
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleSelectLang(l.code)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: '0px',
                        border: isSelected ? '2px solid #5ca346' : '1px solid #e2ece0',
                        backgroundColor: isSelected ? '#f0f7ee' : '#ffffff',
                        color: isSelected ? '#2e7d32' : '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{l.flag}</span>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{l.name}</span>
                      <span style={{ fontSize: 11, color: isSelected ? '#2e7d32' : '#64748b', fontWeight: 600 }}>
                        {l.englishName}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginTop: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: 14, 
                  borderRadius: '0px', 
                  fontWeight: 800, 
                  background: '#5ca346', 
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ✓ Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Farmer Profile Modal - Sharp Square Box */}
      {showInternalProfile && (
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
                onClick={() => setShowInternalProfile(false)} 
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
                onClick={() => { setShowInternalProfile(false); setShowModal(true) }}
                style={{ flex: 1, padding: '10px', borderRadius: '0px', border: '1.5px solid #5ca346', background: '#ffffff', color: '#5ca346', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
              >
                🌐 Change Language
              </button>
              <button
                onClick={() => setShowInternalProfile(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '0px', border: 'none', background: '#5ca346', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

