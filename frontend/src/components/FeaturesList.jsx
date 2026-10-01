import React from 'react'

const features = [
  { title: 'Market Prices', hash: '#/market-prices', icon: '📈' },
  { title: 'Pest & Disease ID', hash: '#/pest-disease', icon: '🐛' },
  { title: 'Crop Planner', hash: '#/crop-planner', icon: '🗓️' },
  { title: 'Input Marketplace', hash: '#/input-market', icon: '🛒' },
  { title: 'Irrigation Scheduler', hash: '#/irrigation', icon: '💧' },
  { title: 'Finance & Loans', hash: '#/finance', icon: '💰' },
  { title: 'Insurance & Claims', hash: '#/insurance', icon: '🛡️' },
  { title: 'Extension Services', hash: '#/extension', icon: '🧑‍🌾' },
  { title: 'Tutorials', hash: '#/tutorials', icon: '📚' },
  { title: 'Farm Records', hash: '#/records', icon: '📋' },
  { title: 'Supply Chain', hash: '#/supply-chain', icon: '🚛' },
  { title: 'Satellite/NDVI', hash: '#/satellite', icon: '🛰️' },
  { title: 'Buyers & Linkages', hash: '#/buyers', icon: '🤝' },
  { title: 'Labor & Services', hash: '#/labor', icon: '👥' },
  { title: 'Policy & Subsidies', hash: '#/policies', icon: '🏛️' },
  { title: 'Offline / SMS', hash: '#/offline', icon: '📡' },
  { title: 'Carbon Tools', hash: '#/carbon', icon: '🌱' },
  { title: 'Analytics', hash: '#/analytics', icon: '📊' },
  { title: 'Documents', hash: '#/documents', icon: '📁' }
]

export default function FeaturesList({ onBack }) {
  return (
    <div className="container">
      <button onClick={() => { if (onBack) onBack(); else window.location.hash = '#/dashboard' }} className="btn btn-ghost" style={{ marginBottom: '1.2rem' }}>
        &larr; Back to Dashboard
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#ffffff', fontWeight: 900 }}>✨ Agricultural Toolkit & Features</h1>
        <p style={{ color: '#a7f3d0' }}>Comprehensive suite of agricultural services, advisory engines, and trade utilities.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {features.map(f => (
          <a 
            key={f.hash} 
            href={f.hash} 
            className="card" 
            style={{ 
              display: 'block', 
              padding: '20px', 
              color: '#000000', 
              textDecoration: 'none', 
              margin: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#000000' }}>{f.title}</div>
              </div>
              <div style={{ width: '36px', height: '36px', background: '#bbf7d0', border: '1px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', fontWeight: 900 }}>
                →
              </div>
            </div>
            <div style={{ marginTop: '10px', color: '#334155', fontSize: '13px', fontWeight: 600 }}>Explore {f.title} tools & resources</div>
          </a>
        ))}
      </div>
    </div>
  )
}
