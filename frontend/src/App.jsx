import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'
import SoilAnalyser from './SoilAnalyser'
import WeatherForecast from './WeatherForecast'
import CommunityForum from './CommunityForum'
import Notifications from './Notifications'
import AIAssistant from './AIAssistant'
import EquipmentRental from './EquipmentRental'
import AmazonRates from './AmazonRates'
import FeaturesList from './components/FeaturesList'
import Schemes from './components/Schemes'
import MarketPrices from './components/MarketPrices'
import PestDisease from './components/PestDisease'
import CropPlanner from './components/CropPlanner'
import InputMarketplace from './components/InputMarketplace'
import IrrigationScheduler from './components/IrrigationScheduler'
import FinanceLoans from './components/FinanceLoans'
import InsuranceClaims from './components/InsuranceClaims'
import ExtensionServices from './components/ExtensionServices'
import Tutorials from './components/Tutorials'
import FarmRecords from './components/FarmRecords'
import SupplyChain from './components/SupplyChain'
import Satellite from './components/Satellite'
import Buyers from './components/Buyers'
import LaborServices from './components/LaborServices'
import PolicySubsidies from './components/PolicySubsidies'
import OfflineSupport from './components/OfflineSupport'
import CarbonTools from './components/CarbonTools'
import Analytics from './components/Analytics'
import Documents from './components/Documents'
import LanguageSelect from './LanguageSelect'
import { API_BASE_URL } from './config'

const HERO_SLIDES = [
  {
    src: '/hero/hero-1.jpg',
    alt: 'Lush Green Paddy Fields in Andhra Pradesh',
    title: 'Lush Green Paddy Fields',
    location: 'Paddy Fields • Andhra Pradesh'
  },
  {
    src: '/hero/hero-2.jpg',
    alt: 'Golden Wheat Fields in Punjab',
    title: 'Golden Wheat Fields at Harvest',
    location: 'Golden Wheat • Punjab'
  },
  {
    src: '/hero/hero-3.jpg',
    alt: 'Tractor Cultivating Soil in Punjab',
    title: 'Precision Soil Cultivation',
    location: 'Tractor Farming • Punjab'
  },
  {
    src: '/hero/hero-4.jpg',
    alt: 'Golden Sunrise over Andhra Paddy Fields',
    title: 'Morning Sunrise over Paddy',
    location: 'Sunrise on Paddy • Eluru'
  },
  {
    src: '/hero/hero-5.jpg',
    alt: 'Vibrant Yellow Mustard Crop Fields',
    title: 'Blooming Mustard Fields',
    location: 'Mustard Farming • West Bengal'
  },
  {
    src: '/hero/hero-6.jpg',
    alt: 'Farmers Harvesting Golden Wheat in Madhya Pradesh',
    title: 'Wheat Harvest Operations',
    location: 'Wheat Harvest • Madhya Pradesh'
  },
  {
    src: '/hero/hero-7.jpg',
    alt: 'Lush Green Tea Plantation Terraces in Munnar',
    title: 'Terraced Tea Plantations',
    location: 'Tea Estates • Munnar, Kerala'
  }
]

function HeroImageRotator() {
  const [current, setCurrent] = useState(0)

  // Rotate every 7 seconds -> 7 slides * 7 seconds = 49 seconds total cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % HERO_SLIDES.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrent(prev => (prev + 1) % HERO_SLIDES.length)
  const prevSlide = () => setCurrent(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)

  return (
    <div style={{ position: 'relative', textAlign: 'center', width: '100%', maxWidth: 540, margin: '0 auto' }}>
      <div 
        style={{ 
          borderRadius: '24px', 
          overflow: 'hidden', 
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.35)', 
          border: '3px solid rgba(255,255,255,0.5)',
          position: 'relative',
          height: 380,
          background: '#0d2814'
        }}
      >
        {/* Render 7 slides with cross-fade */}
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === current
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: isActive ? 'auto' : 'none',
                zIndex: isActive ? 2 : 1
              }}
            >
              <img 
                src={slide.src} 
                alt={slide.alt} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block',
                  transform: isActive ? 'scale(1.04)' : 'scale(1.0)',
                  transition: 'transform 7s ease-out'
                }} 
              />
            </div>
          )
        })}

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous image"
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 5,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(6px)',
            border: 'none',
            color: '#182c1d',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'background 0.2s'
          }}
        >
          ‹
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next image"
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 5,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(6px)',
            border: 'none',
            color: '#182c1d',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'background 0.2s'
          }}
        >
          ›
        </button>

        {/* Bottom Carousel Segment Indicators (7 Dots with 7s animation) */}
        <div
          style={{
            position: 'absolute',
            bottom: 22,
            left: 0,
            right: 0,
            zIndex: 5,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6
          }}
        >
          {HERO_SLIDES.map((_, idx) => {
            const isActive = idx === current
            return (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{
                  width: isActive ? 28 : 8,
                  height: 6,
                  borderRadius: 9999,
                  background: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? '0 0 8px rgba(255,255,255,0.8)' : 'none'
                }}
              />
            )
          })}
        </div>
      </div>

    </div>
  )
}

function WelcomeStart({ onLogin }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', padding: '20px 16px' }}>
      <div className="container">
        
        {/* Top Minimal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#5ca346', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>
              🌱
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#182c1d', letterSpacing: '-0.03em' }}>
              krishi<span style={{ color: '#5ca346' }}>🌿</span>net
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={onLogin}
              className="btn btn-ghost" 
              style={{ borderRadius: '9999px', padding: '8px 20px', fontWeight: 800, fontSize: 13 }}
            >
              Sign In
            </button>
            <a 
              href="#/register"
              className="btn btn-primary"
              style={{ borderRadius: '9999px', padding: '8px 22px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}
              onClick={() => { window.location.hash = '#/register' }}
            >
              Register Free
            </a>
          </div>
        </div>

        {/* Hero Section (Plantsome Inspired Green Organic Cutout) */}
        <section className="hero-plantsome" style={{ padding: '48px 40px', minHeight: 460, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, alignItems: 'center', width: '100%', position: 'relative', zIndex: 2 }}>
            <div>
              <h1 style={{ color: '#ffffff', fontSize: 'clamp(28px, 4.4vw, 46px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 18 }}>
                Awesome crop intelligence that every Kisan loves
              </h1>

              <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 16, lineHeight: 1.6, marginBottom: 28, maxWidth: 520 }}>
                Empowering farmers with real-time mandi rates, AI agronomy diagnosis, soil health insights, direct market access, and a suite of advanced features.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button 
                  onClick={onLogin} 
                  className="btn-hero-white" 
                  style={{ borderRadius: '9999px', padding: '14px 32px', fontSize: 15 }}
                >
                  ⚡ Login to Portal →
                </button>
                <a 
                  href="#/register" 
                  className="btn btn-ghost" 
                  style={{ borderRadius: '9999px', padding: '14px 28px', fontSize: 15, textDecoration: 'none', color: '#ffffff', borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.12)' }}
                  onClick={() => { window.location.hash = '#/register' }}
                >
                  📝 New Farmer Account
                </a>
              </div>
            </div>

<HeroImageRotator />
          </div>
        </section>

        {/* Feature Spotlight Section */}
        <section style={{ marginTop: 44, marginBottom: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#5ca346', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Ecosystem Features
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 900, color: '#182c1d', marginTop: 4 }}>
              Empowering farmers at every stage of cultivation
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#eaf7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
                  📈
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                  Live Commodity Benchmark Prices
                </h3>
                <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                  Real-time benchmark prices and 7-day, 15-day & 30-day interactive price change graphs for every crop.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f0' }}>
                <span style={{ color: '#5ca346', fontWeight: 800, fontSize: 13 }}>Instant Price Calculator & Trends →</span>
              </div>
            </div>

            <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
                  🤖
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                  AI Agronomy Diagnosis
                </h3>
                <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                  Diagnose crop leaf diseases, pest infestations, and fertilizer deficiencies using voice, photo analysis, and instant remedies.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f0' }}>
                <span style={{ color: '#0284c7', fontWeight: 800, fontSize: 13 }}>24/7 Krishi AI Doctor →</span>
              </div>
            </div>

            <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
                  🏦
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                  Concessional Kisan Credit
                </h3>
                <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                  Low 4% net interest KCC crop loans, machinery finance, and automated government subsidy application processing.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f0' }}>
                <span style={{ color: '#d97706', fontWeight: 800, fontSize: 13 }}>Explore Financial Grants →</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState(() => window.location.hash || '#/')

  // Listen to hash changes
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('farmer_token')
    if (token) {
      axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        setIsAuthenticated(true)
        setLoading(false)
      })
      .catch((err) => {
        // Only invalidate if the server explicitly rejected the token (401 or 403)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('farmer_token')
          setIsAuthenticated(false)
        } else {
          // If offline or network glitch, keep session alive in local dev
          setIsAuthenticated(true)
        }
        setLoading(false)
      })
    } else {
      setIsAuthenticated(false)
      setLoading(false)
    }
  }, [])

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('farmer_token')
    // Keep krishi_lang_chosen and krishi_secondary_lang so returning users are not asked to select language every time
    window.location.hash = '#/'
    setRoute('#/')
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    const hasChosenLang = !!localStorage.getItem('krishi_lang_chosen')
    if (hasChosenLang) {
      // Returning user: Go directly to dashboard without asking for language
      window.location.hash = '#/dashboard'
      setRoute('#/dashboard')
    } else {
      // First-time user only: Ask to choose language option
      window.location.hash = '#/select-language'
      setRoute('#/select-language')
    }
  }

  // Show loading screen while checking auth
  if (loading) {
    return (
      <section className="hero">
        <div className="hero-card" style={{ maxWidth: 440 }}>
          <div className="spinner" aria-hidden="true"></div>
          <h2 style={{ color: '#000000', fontSize: 22, fontWeight: 900, marginBottom: 8 }}>🌾 Loading Krishi-Net</h2>
          <p style={{ color: '#1f2937', fontWeight: 600 }}>Preparing your agricultural dashboard...</p>
        </div>
      </section>
    )
  }

  // Start page
  if (route === '#/' || route === '') {
    if (isAuthenticated) {
      if (!localStorage.getItem('krishi_lang_chosen')) {
        return <LanguageSelect onContinue={() => { 
          localStorage.setItem('krishi_lang_chosen', 'true');
          window.location.hash = '#/dashboard'; 
          setRoute('#/dashboard'); 
        }} />
      }
      return <Dashboard onLogout={handleLogout} />
    }
    return <WelcomeStart onLogin={() => { window.location.hash = '#/login'; setRoute('#/login') }} />
  }

  if (route === '#/login') {
    return <Login onDone={handleLoginSuccess} />
  }

  if (route === '#/register') {
    return <Register onDone={handleLoginSuccess} />
  }

  // Guard protected pages
  if (!isAuthenticated) {
    return <Login onDone={handleLoginSuccess} />
  }

  // Explicit Language Selection Screen or First-Time Users ONLY
  if (route === '#/select-language' || (!localStorage.getItem('krishi_lang_chosen') && route !== '#/login' && route !== '#/register')) {
    return <LanguageSelect onContinue={() => { 
      localStorage.setItem('krishi_lang_chosen', 'true');
      window.location.hash = '#/dashboard'; 
      setRoute('#/dashboard'); 
    }} />
  }

  // Route handlers
  if (route === '#/dashboard') {
    return <Dashboard onLogout={handleLogout} />
  }
  if (route === '#/settings') {
    return <Dashboard onLogout={handleLogout} initialOpenSettings={true} />
  }
  if (route === '#/soil-analyser') {
    return <SoilAnalyser onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/weather') {
    return <WeatherForecast onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/community-news' || route === '#/forum' || route === '#/kisan-social' || route === '#/social') {
    return <CommunityForum onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/notifications') {
    return <Notifications onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/ai-assistant') {
    return <AIAssistant onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/market-prices') {
    return <MarketPrices onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/amazon-rates') {
    return (
      <div className="container">
        <button onClick={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} className="btn btn-ghost" style={{ marginBottom: '16px' }}>
          ← Back to Dashboard
        </button>
        <AmazonRates onClose={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
      </div>
    )
  }
  if (route === '#/pest-disease') {
    return <PestDisease onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/crop-planner') {
    return <CropPlanner onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/input-market') {
    return <InputMarketplace onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/irrigation') {
    return <IrrigationScheduler onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/finance') {
    return <FinanceLoans onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/insurance') {
    return <InsuranceClaims onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/extension') {
    return <ExtensionServices onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/tutorials') {
    return <Tutorials onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/records') {
    return <FarmRecords onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/supply-chain') {
    return <SupplyChain onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/satellite') {
    return <Satellite onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/buyers') {
    return <Buyers onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/labor') {
    return <LaborServices onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/policies') {
    return <PolicySubsidies onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/offline') {
    return <OfflineSupport onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/carbon') {
    return <CarbonTools onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/analytics') {
    return <Analytics onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/documents') {
    return <Documents onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/features') {
    return <FeaturesList onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/schemes') {
    return <Schemes onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/equipment') {
    return <EquipmentRental onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }

  return <Dashboard onLogout={handleLogout} />
}
