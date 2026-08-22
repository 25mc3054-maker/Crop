import React, { useState, useEffect, useRef } from 'react'
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
import { API_BASE_URL } from './config'

function WelcomeStart({ onLogin }) {
  return (
    <section className="hero">
      <div className="hero-card">
        <h1>Welcome to Krishi-Net</h1>
        <p>A place where farmers feel lighter in their work.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={onLogin} className="btn btn-primary">Login</button>
          <a href="#/register" className="btn btn-ghost" onClick={() => { window.location.hash = '#/register' }}>Register</a>
        </div>
      </div>
    </section>
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
      // Verify token is valid
      axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        setIsAuthenticated(true)
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem('farmer_token')
        setIsAuthenticated(false)
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
    window.location.hash = '#/'
    setRoute('#/')
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    window.location.hash = '#/dashboard'
    setRoute('#/dashboard')
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <section className="hero">
        <div className="hero-card loading-screen">
          <div className="spinner" aria-hidden="true"></div>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>🌾 Loading Krishi-Net</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Preparing your agricultural dashboard...</p>
        </div>
      </section>
    )
  }

  // Start page should always be the default entry
  if (route === '#/' || route === '') {
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

  // User is authenticated - show Dashboard or other pages
  if (route === '#/dashboard') {
    return <Dashboard onLogout={handleLogout} />
  }
  if (route === '#/soil-analyser') {
    return <SoilAnalyser onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/weather') {
    return <WeatherForecast onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }
  if (route === '#/community-news' || route === '#/forum') {
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
  // Placeholder routes for future features
  if (route === '#/sell-crops') {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} style={{ padding: '10px 20px', marginBottom: '20px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
        <h2>💰 Sell Your Crops</h2>
        <p>Coming soon! List and sell your crops directly to buyers.</p>
      </div>
    )
  }
  if (route === '#/schemes') {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} style={{ padding: '10px 20px', marginBottom: '20px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
        <h2>🏛️ Government Schemes</h2>
        <p>Coming soon! Browse available government schemes and subsidies.</p>
      </div>
    )
  }
  if (route === '#/equipment') {
    return <EquipmentRental onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
  }

  // Default authenticated fallback
  return <Dashboard onLogout={handleLogout} />
}
