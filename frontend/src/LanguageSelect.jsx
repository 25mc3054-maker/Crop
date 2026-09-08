import React, { useState } from 'react'
import { REGIONAL_LANGUAGES, UI_LANG_STRINGS, playDualVoice } from './languageHelper'

export default function LanguageSelect({ onContinue }) {
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('krishi_secondary_lang') || 'none')
  const [previewing, setPreviewing] = useState(false)

  const currentStr = UI_LANG_STRINGS[selectedLang] || UI_LANG_STRINGS.none

  const handleLanguageSelect = (langCode) => {
    setSelectedLang(langCode)
    const langObj = REGIONAL_LANGUAGES.find(l => l.code === langCode)
    const str = UI_LANG_STRINGS[langCode] || UI_LANG_STRINGS.none

    setPreviewing(true)
    if (langCode === 'none') {
      const enText = 'English selected. Welcome to Krishi-Net.'
      playDualVoice(enText, '', 'none', () => setPreviewing(false))
    } else {
      const enText = `${langObj ? langObj.englishName : 'Regional'} and English selected. Welcome to Krishi-Net.`
      const regText = str.greeting
      playDualVoice(enText, regText, langCode, () => setPreviewing(false))
    }
  }

  const handleProceed = () => {
    localStorage.setItem('krishi_secondary_lang', selectedLang)
    localStorage.setItem('krishi_lang_chosen', 'true')
    onContinue && onContinue(selectedLang)
  }

  return (
    <section className="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', backgroundColor: 'var(--bg-page)' }}>
      <div 
        className="hero-card" 
        style={{ 
          maxWidth: 720, 
          width: '100%', 
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '36px 30px', 
          backgroundColor: '#ffffff', 
          borderRadius: '28px',
          border: '1px solid rgba(0, 0, 0, 0.06)', 
          boxShadow: '0 20px 45px -10px rgba(24, 44, 29, 0.1)', 
          color: '#182c1d',
          boxSizing: 'border-box'
        }}
      >
        
        {/* Top Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eaf7e6', color: '#2e7d32', padding: '5px 14px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.6px', borderRadius: '9999px' }}>
            <span>🌐</span> MULTILINGUAL REGIONAL INTERFACE
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: '#182c1d', margin: '0 0 6px 0' }}>
            Choose Your Regional Language
          </h2>
          <p style={{ fontSize: 14, color: '#496150', margin: 0 }}>
            {selectedLang === 'none' ? 'English Only mode (No regional language)' : currentStr.chooseSubtitle}
          </p>
        </div>

        {/* English Notice Banner */}
        <div style={{ background: '#f8faf7', border: '1px solid #e2ece0', borderRadius: '16px', padding: '14px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eaf7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            🌐
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#182c1d' }}>
              English is always active (Mandatory Primary Language)
            </div>
            <div style={{ fontSize: 12, color: '#496150', marginTop: 2 }}>
              {selectedLang === 'none' 
                ? 'All dashboards, market commodity rates, and tools will be displayed exclusively in English.' 
                : currentStr.englishNotice}
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div style={{ marginBottom: 10, textAlign: 'left' }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: '#182c1d', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {selectedLang === 'none' ? 'SELECT LANGUAGE PREFERENCE:' : `SELECT REGIONAL INDIAN LANGUAGE / ${currentStr.selectLabel}:`}
          </label>
        </div>

        {/* Scrollable Language Grid */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            maxHeight: '320px', 
            paddingRight: '6px', 
            marginBottom: 20
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {REGIONAL_LANGUAGES.map(lang => {
              const isSelected = selectedLang === lang.code
              const isNone = lang.code === 'none'
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #5ca346' : '1px solid #e8ede6',
                    backgroundColor: isSelected ? '#eaf7e6' : '#ffffff',
                    color: isSelected ? '#2e7d32' : '#182c1d',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: isSelected ? '0 4px 12px rgba(92, 163, 70, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.14s ease',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: isNone ? 20 : 18 }}>
                    {isNone ? '🌐' : lang.flag}
                  </span>
                  
                  <span style={{ fontSize: 14, fontWeight: 800 }}>
                    {lang.name}
                  </span>
                  
                  <span style={{ fontSize: 11, color: isSelected ? '#2e7d32' : '#64748b', fontWeight: 600 }}>
                    {lang.englishName}
                  </span>

                  {isSelected && (
                    <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 12, color: '#5ca346', fontWeight: 900 }}>
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom Proceed Action Button */}
        <button
          type="button"
          onClick={handleProceed}
          className="btn btn-primary btn-block"
          style={{
            padding: '14px 20px',
            fontSize: 15,
            borderRadius: '9999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {previewing 
            ? '🔊 Playing Voice Announcement...' 
            : `✓ ${currentStr.continueBtn || 'Continue to Dashboard'} →`}
        </button>

      </div>
    </section>
  )
}
