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
import FinancePage from './components/FinancePage'
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
import useSeoHead from './useSeoHead'

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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Accessible Semantic Header */}
      <header role="banner" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(46, 125, 50, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#5ca346', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', boxShadow: '0 4px 12px rgba(92, 163, 70, 0.25)' }}>
              🌱
            </div>
            <a href="#/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#182c1d', letterSpacing: '-0.03em' }}>
                krishi<span style={{ color: '#5ca346' }}>🌿</span>net
              </span>
            </a>
          </div>

          <nav role="navigation" aria-label="Main Navigation" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href="#/market-prices" style={{ color: '#2e7d32', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>📊 Mandi Prices</a>
            <a href="#/schemes" style={{ color: '#2e7d32', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>🏛️ Schemes</a>
            <a href="#/soil-analyser" style={{ color: '#2e7d32', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>🧪 Soil Health</a>
            <a href="#/weather" style={{ color: '#2e7d32', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>🌦️ Weather</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <button 
                id="header-login-btn"
                onClick={onLogin}
                className="btn btn-ghost" 
                style={{ borderRadius: '9999px', padding: '8px 18px', fontWeight: 800, fontSize: 13 }}
              >
                Sign In
              </button>
              <a 
                id="header-register-btn"
                href="#/register"
                className="btn btn-primary"
                style={{ borderRadius: '9999px', padding: '8px 20px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}
                onClick={() => { window.location.hash = '#/register' }}
              >
                Register Free
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Semantic Page Content */}
      <main id="main-content" role="main" style={{ flex: 1, padding: '24px 16px 48px' }}>
        <div className="container">
          
          {/* Hero Section (Plantsome Inspired Green Organic Cutout) */}
          <section id="hero" aria-labelledby="hero-title" className="hero-plantsome" style={{ padding: '48px 40px', minHeight: 460, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, alignItems: 'center', width: '100%', position: 'relative', zIndex: 2 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', padding: '6px 14px', borderRadius: '9999px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
                  🌾 NEXT-GEN AGRICULTURAL INTELLIGENCE
                </div>
                <h1 id="hero-title" style={{ color: '#ffffff', fontSize: 'clamp(28px, 4.4vw, 46px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 18 }}>
                  Awesome Crop Intelligence That Every Kisan Loves
                </h1>

                <p style={{ color: 'rgba(255, 255, 255, 0.94)', fontSize: 16, lineHeight: 1.6, marginBottom: 28, maxWidth: 520 }}>
                  Empowering Indian farmers with real-time APMC mandi benchmark prices, AI crop disease diagnosis, soil health NPK testing, 4% low-interest Kisan Credit loans, and government agriculture schemes.
                </p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button 
                    id="hero-login-cta"
                    onClick={onLogin} 
                    className="btn-hero-white" 
                    style={{ borderRadius: '9999px', padding: '14px 32px', fontSize: 15 }}
                  >
                    ⚡ Login to Portal →
                  </button>
                  <a 
                    id="hero-register-cta"
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
          <section id="features" aria-labelledby="features-title" style={{ marginTop: 52, marginBottom: 44 }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#5ca346', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Ecosystem Features & Agricultural Tools
              </span>
              <h2 id="features-title" style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 900, color: '#182c1d', marginTop: 4 }}>
                Empowering Farmers at Every Stage of Cultivation
              </h2>
              <p style={{ color: '#496150', fontSize: 15, maxWidth: 640, margin: '8px auto 0' }}>
                From soil preparation to harvest and market trading, Krishi-Net gives you digital superpowers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              
              {/* Feature 1 */}
              <article className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#eaf7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                    📈
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                    Live Mandi Benchmark Prices
                  </h3>
                  <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                    Real-time benchmark prices and 7-day, 15-day & 30-day interactive price change graphs for Paddy, Wheat, Cotton, Mustard, and Soybeans across APMCs.
                  </p>
                </div>
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #f1f5f0' }}>
                  <a href="#/market-prices" style={{ color: '#5ca346', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Explore Market Trends →</a>
                </div>
              </article>

              {/* Feature 2 */}
              <article className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                    🤖
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                    AI Agronomy Leaf Doctor
                  </h3>
                  <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                    Diagnose crop leaf diseases, pest infestations, and fertilizer deficiencies using voice or photo analysis with instant treatment remedies.
                  </p>
                </div>
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #f1f5f0' }}>
                  <a href="#/ai-assistant" style={{ color: '#0284c7', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>24/7 Krishi AI Doctor →</a>
                </div>
              </article>

              {/* Feature 3 */}
              <article className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                    🏦
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                    Concessional Kisan Credit
                  </h3>
                  <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                    Low 4% net interest KCC crop loans, tractor finance, and automated government subsidy application processing.
                  </p>
                </div>
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #f1f5f0' }}>
                  <a href="#/finance" style={{ color: '#d97706', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Explore Credit & Loans →</a>
                </div>
              </article>

              {/* Feature 4 */}
              <article className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                    🧪
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                    Soil Health & NPK Testing
                  </h3>
                  <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                    Test soil parameters, calculate Nitrogen, Phosphorus, Potassium (NPK) ratios, and obtain crop-specific fertilizer plans.
                  </p>
                </div>
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #f1f5f0' }}>
                  <a href="#/soil-analyser" style={{ color: '#db2777', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Analyze Soil Health →</a>
                </div>
              </article>

              {/* Feature 5 */}
              <article className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                    🌦️
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                    Hyperlocal Weather Alerts
                  </h3>
                  <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                    7-day pinpoint weather forecasts, rain probability, wind speed, and monsoon alert advisories tuned to your farm pincode.
                  </p>
                </div>
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #f1f5f0' }}>
                  <a href="#/weather" style={{ color: '#059669', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>View Weather Forecast →</a>
                </div>
              </article>

              {/* Feature 6 */}
              <article className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                    🏛️
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#182c1d' }}>
                    Govt Schemes & Subsidies
                  </h3>
                  <p style={{ fontSize: 14, color: '#496150', lineHeight: 1.6 }}>
                    PM-Kisan, PMFBY crop insurance, solar pump subsidies, and state agriculture welfare schemes directory with one-click eligibility.
                  </p>
                </div>
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #f1f5f0' }}>
                  <a href="#/schemes" style={{ color: '#9333ea', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Check Scheme Eligibility →</a>
                </div>
              </article>

            </div>
          </section>

          {/* Value Proposition Section */}
          <section id="why-krishi-net" aria-labelledby="why-heading" style={{ background: '#ffffff', borderRadius: '24px', padding: '40px 32px', marginBottom: 48, border: '1px solid rgba(46,125,50,0.12)', boxShadow: '0 10px 30px -4px rgba(24, 44, 29, 0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#5ca346', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Built for Indian Agriculture
              </span>
              <h2 id="why-heading" style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: '#182c1d', marginTop: 4 }}>
                Why Indian Farmers Trust Krishi-Net
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#16a34a', marginBottom: 4 }}>10+</div>
                <div style={{ fontWeight: 800, color: '#182c1d', marginBottom: 6 }}>Indian Regional Languages</div>
                <p style={{ fontSize: 13, color: '#496150', margin: 0 }}>Hindi, Telugu, Tamil, Marathi, Punjabi, Bengali, Gujarati, Kannada, and more.</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#16a34a', marginBottom: 4 }}>100% Free</div>
                <div style={{ fontWeight: 800, color: '#182c1d', marginBottom: 6 }}>Open Agricultural Data</div>
                <p style={{ fontSize: 13, color: '#496150', margin: 0 }}>Real-time mandi benchmark prices and advisory accessible without subscription costs.</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#16a34a', marginBottom: 4 }}>98.4%</div>
                <div style={{ fontWeight: 800, color: '#182c1d', marginBottom: 6 }}>AI Disease Accuracy</div>
                <p style={{ fontSize: 13, color: '#496150', margin: 0 }}>Trained on over 100,000+ crop pathology samples for accurate diagnosis.</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#16a34a', marginBottom: 4 }}>Offline First</div>
                <div style={{ fontWeight: 800, color: '#182c1d', marginBottom: 6 }}>Progressive Web App</div>
                <p style={{ fontSize: 13, color: '#496150', margin: 0 }}>Access vital advisory and farm logs even in remote areas with low network connectivity.</p>
              </div>
            </div>
          </section>

          {/* Frequently Asked Questions (FAQ) Section with Semantic Markup */}
          <section id="faq" aria-labelledby="faq-heading" style={{ marginBottom: 48 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#5ca346', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Knowledge & Help
              </span>
              <h2 id="faq-heading" style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: '#182c1d', marginTop: 4 }}>
                Frequently Asked Questions
              </h2>
            </div>

            <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <details style={{ background: '#ffffff', border: '1px solid rgba(46,125,50,0.12)', borderRadius: '16px', padding: '18px 22px', cursor: 'pointer' }}>
                <summary style={{ fontWeight: 800, color: '#182c1d', fontSize: 16 }}>
                  How do I check live mandi commodity prices for my crop?
                </summary>
                <p style={{ margin: '12px 0 0', color: '#496150', fontSize: 14, lineHeight: 1.6 }}>
                  You can browse to our Market Prices section to view real-time APMC mandi prices for Paddy, Wheat, Cotton, Mustard, Soybeans, Pulses, and Vegetables. Interactive 7-day, 15-day, and 30-day graphs help you decide the optimal selling time.
                </p>
              </details>

              <details style={{ background: '#ffffff', border: '1px solid rgba(46,125,50,0.12)', borderRadius: '16px', padding: '18px 22px', cursor: 'pointer' }}>
                <summary style={{ fontWeight: 800, color: '#182c1d', fontSize: 16 }}>
                  How does the Krishi AI Agronomist disease diagnosis work?
                </summary>
                <p style={{ margin: '12px 0 0', color: '#496150', fontSize: 14, lineHeight: 1.6 }}>
                  Simply snap a photo of any damaged plant leaf or crop stem and upload it. The Krishi AI Agronomist instantly analyzes the disease symptoms, identifies the exact fungus, virus, or pest, and provides recommended organic remedies and chemical treatments.
                </p>
              </details>

              <details style={{ background: '#ffffff', border: '1px solid rgba(46,125,50,0.12)', borderRadius: '16px', padding: '18px 22px', cursor: 'pointer' }}>
                <summary style={{ fontWeight: 800, color: '#182c1d', fontSize: 16 }}>
                  Can I calculate interest rates for Kisan Credit Card (KCC) loans?
                </summary>
                <p style={{ margin: '12px 0 0', color: '#496150', fontSize: 14, lineHeight: 1.6 }}>
                  Yes, Krishi-Net provides an automated KCC loan calculator with prompt repayment incentive rebates, effectively calculating your net interest rate down to 4% per annum along with maximum credit eligibility.
                </p>
              </details>

              <details style={{ background: '#ffffff', border: '1px solid rgba(46,125,50,0.12)', borderRadius: '16px', padding: '18px 22px', cursor: 'pointer' }}>
                <summary style={{ fontWeight: 800, color: '#182c1d', fontSize: 16 }}>
                  Is Krishi-Net free for all farmers?
                </summary>
                <p style={{ margin: '12px 0 0', color: '#496150', fontSize: 14, lineHeight: 1.6 }}>
                  Yes, Krishi-Net is 100% free for farmers across India. You can register with just your mobile number to access all tools, weather alerts, schemes, and market prices.
                </p>
              </details>
            </div>
          </section>

        </div>
      </main>

      {/* Semantic Rich SEO Footer */}
      <footer role="contentinfo" style={{ background: '#132817', color: 'rgba(255, 255, 255, 0.8)', padding: '48px 20px 24px', borderTop: '3px solid #5ca346' }}>
        <div className="container" style={{ maxWidth: 1140, margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, marginBottom: 40 }}>
            {/* Column 1: Brand & Mission */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>🌱</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff' }}>krishi<span style={{ color: '#6cba55' }}>🌿</span>net</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
                Digital agricultural intelligence platform empowering Indian farmers with real-time commodity prices, AI agronomy, soil health science, and government subsidy access.
              </p>
              <div style={{ fontSize: 12, color: '#6cba55', fontWeight: 800 }}>
                🌾 Empowering Kisan • Prospering India
              </div>
            </div>

            {/* Column 2: Agricultural Intelligence Tools */}
            <div>
              <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Smart Tools
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <li><a href="#/market-prices" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Live Mandi Commodity Prices</a></li>
                <li><a href="#/ai-assistant" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Krishi AI Leaf Doctor</a></li>
                <li><a href="#/soil-analyser" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Soil Health NPK Analyser</a></li>
                <li><a href="#/weather" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Hyperlocal Weather & Monsoon Alerts</a></li>
                <li><a href="#/crop-planner" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Seasonal Cultivation Planner</a></li>
                <li><a href="#/finance" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>4% Kisan Credit Card Calculator</a></li>
              </ul>
            </div>

            {/* Column 3: Government Schemes & Portals */}
            <div>
              <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Govt Schemes
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <li><a href="#/schemes" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>PM-Kisan Samman Nidhi</a></li>
                <li><a href="#/schemes" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>PM Fasal Bima Yojana (PMFBY)</a></li>
                <li><a href="#/schemes" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Kisan Urja Suraksha (KUSUM)</a></li>
                <li><a href="#/schemes" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Soil Health Card Mission</a></li>
                <li><a href="#/schemes" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>e-NAM National Agriculture Market</a></li>
              </ul>
            </div>

            {/* Column 4: Multilingual & Account Access */}
            <div>
              <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Farmer Access
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <li><a href="#/login" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Farmer Portal Sign In</a></li>
                <li><a href="#/register" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Create Free Kisan Account</a></li>
                <li><a href="#/community-news" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Kisan Community & News</a></li>
                <li><a href="#/tutorials" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Modern Farming Video Tutorials</a></li>
                <li><a href="#/equipment" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>Tractor & Equipment Rental</a></li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            <div>
              © {new Date().getFullYear()} Krishi-Net. All rights reserved. Dedicated to the prosperity of Indian Farmers.
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="#/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="#/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Terms of Service</a>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Sitemap (XML)</a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState(() => window.location.hash || '#/')

  // Dynamic SEO Page Title, Meta Description, OpenGraph and Canonical updater
  useSeoHead(route)

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
    return <FinancePage onBack={() => { window.location.hash = '#/dashboard'; setRoute('#/dashboard'); }} />
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
