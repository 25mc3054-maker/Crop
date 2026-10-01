import { useEffect } from 'react'

const ROUTE_SEO_MAP = {
  '#/': {
    title: 'Krishi-Net 🌱 Next-Gen AI Agricultural Intelligence & Kisan Super App',
    description: 'Empowering farmers with real-time mandi benchmark prices, AI crop diagnosis, soil health testing, concessional credit, and government farming schemes.',
    canonical: 'https://krishi-net.org/'
  },
  '#/login': {
    title: 'Farmer Portal Login & Authentication | Krishi-Net',
    description: 'Sign in securely with mobile OTP to access your personalized Krishi-Net farming dashboard, crop advisory, and market records.',
    canonical: 'https://krishi-net.org/#/login'
  },
  '#/register': {
    title: 'Free Farmer Registration & Kisan Account | Krishi-Net',
    description: 'Create a free farmer account on Krishi-Net to access customized crop advisories, mandi rates, soil testing, and subsidy schemes.',
    canonical: 'https://krishi-net.org/#/register'
  },
  '#/dashboard': {
    title: 'Farmer Dashboard & Farm Overview | Krishi-Net',
    description: 'Monitor your agricultural operations, live mandi prices, weather alerts, soil condition reports, and community updates.',
    canonical: 'https://krishi-net.org/#/dashboard'
  },
  '#/market-prices': {
    title: 'Live Mandi Benchmark Commodity Prices & Trends | Krishi-Net',
    description: 'Check real-time APMC mandi prices for Paddy, Wheat, Cotton, Mustard, and Soybeans with 7, 15, and 30-day interactive price trend analysis.',
    canonical: 'https://krishi-net.org/#/market-prices'
  },
  '#/schemes': {
    title: 'Government Agriculture Schemes, Subsidies & PM-Kisan Portal | Krishi-Net',
    description: 'Discover central and state government agricultural subsidies, PM-Kisan installment status, tractor subsidies, and financial grants.',
    canonical: 'https://krishi-net.org/#/schemes'
  },
  '#/soil-analyser': {
    title: 'AI Soil Health Analyser & NPK Fertilizer Recommendations | Krishi-Net',
    description: 'Test your soil parameters, check Nitrogen, Phosphorus, Potassium (NPK) ratios, pH balance, and receive custom fertilizer recommendations.',
    canonical: 'https://krishi-net.org/#/soil-analyser'
  },
  '#/weather': {
    title: 'Hyperlocal 7-Day Weather & Monsoon Alerts for Farmers | Krishi-Net',
    description: 'Accurate 7-day hyperlocal weather forecasting, precipitation predictions, humidity, wind velocity, and monsoon alerts for precision farming.',
    canonical: 'https://krishi-net.org/#/weather'
  },
  '#/ai-assistant': {
    title: 'Krishi AI Agronomist - Instant Crop Disease & Pest Diagnosis | Krishi-Net',
    description: '24/7 AI-powered agricultural diagnosis assistant. Upload leaf photos or ask farming queries in regional languages for instant expert remedies.',
    canonical: 'https://krishi-net.org/#/ai-assistant'
  },
  '#/pest-disease': {
    title: 'Crop Pest & Disease Management Guide | Krishi-Net',
    description: 'Identify common fungal, bacterial, and pest diseases across major crops with certified chemical and biological treatment protocols.',
    canonical: 'https://krishi-net.org/#/pest-disease'
  },
  '#/crop-planner': {
    title: 'Crop Planning & Seasonal Cultivation Calendar | Krishi-Net',
    description: 'Optimize your sowing schedule, crop rotation, seed selection, and harvest timelines based on regional agro-climatic conditions.',
    canonical: 'https://krishi-net.org/#/crop-planner'
  },
  '#/finance': {
    title: 'Concessional 4% Kisan Credit Card Loans & Grants | Krishi-Net',
    description: 'Calculate loan interest, apply for low-interest KCC crop loans, machinery finance, and insurance claim settlements.',
    canonical: 'https://krishi-net.org/#/finance'
  },
  '#/community-news': {
    title: 'Kisan Community Forum, Field Vibes & Agro News | Krishi-Net',
    description: 'Connect with fellow farmers, share field updates, discuss farming innovations, and stay updated with agricultural news.',
    canonical: 'https://krishi-net.org/#/community-news'
  },
  '#/tutorials': {
    title: 'Agricultural Video Tutorials & Modern Farming Guides | Krishi-Net',
    description: 'Watch video masterclasses on organic farming, drip irrigation, drone spraying, and high-yield crop cultivation practices.',
    canonical: 'https://krishi-net.org/#/tutorials'
  },
  '#/equipment': {
    title: 'Farm Equipment Rental & Tractor Booking | Krishi-Net',
    description: 'Rent modern farming machinery, harvesters, rotavators, and sprayers at affordable hourly rates from local verified providers.',
    canonical: 'https://krishi-net.org/#/equipment'
  }
}

export function useSeoHead(route) {
  useEffect(() => {
    const currentRoute = route || window.location.hash || '#/'
    const seoData = ROUTE_SEO_MAP[currentRoute] || ROUTE_SEO_MAP['#/']

    // Update document title
    if (seoData.title) {
      document.title = seoData.title
    }

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', seoData.description)

    // Update OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', seoData.title)
    }

    // Update OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) {
      ogDesc.setAttribute('content', seoData.description)
    }

    // Update Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', seoData.canonical || `https://krishi-net.org/${currentRoute}`)
  }, [route])
}

export default useSeoHead
