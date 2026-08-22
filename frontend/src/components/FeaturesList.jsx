import React from 'react'

const features = [
  { title: 'Market Prices', hash: '#/market-prices' },
  { title: 'Pest & Disease ID', hash: '#/pest-disease' },
  { title: 'Crop Planner', hash: '#/crop-planner' },
  { title: 'Input Marketplace', hash: '#/input-market' },
  { title: 'Irrigation Scheduler', hash: '#/irrigation' },
  { title: 'Finance & Loans', hash: '#/finance' },
  { title: 'Insurance & Claims', hash: '#/insurance' },
  { title: 'Extension Services', hash: '#/extension' },
  { title: 'Tutorials', hash: '#/tutorials' },
  { title: 'Farm Records', hash: '#/records' },
  { title: 'Supply Chain', hash: '#/supply-chain' },
  { title: 'Satellite/NDVI', hash: '#/satellite' },
  { title: 'Buyers & Linkages', hash: '#/buyers' },
  { title: 'Labor & Services', hash: '#/labor' },
  { title: 'Policy & Subsidies', hash: '#/policies' },
  { title: 'Offline / SMS', hash: '#/offline' },
  { title: 'Carbon Tools', hash: '#/carbon' },
  { title: 'Analytics', hash: '#/analytics' },
  { title: 'Documents', hash: '#/documents' }
]

export default function FeaturesList({ onBack }) {
  return (
    <div className="container">
      <button onClick={() => { if (onBack) onBack(); else window.location.hash = '#/dashboard' }} className="big" style={{ marginBottom: '1rem', display: 'inline-block' }}>&larr; Back</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>✨ All Features</h1>
        <span className="hint">Explore the toolkit — click any card to open a feature</span>
      </div>

      <p style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>These pages are placeholders now and will be linked to live APIs and services soon.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
        {features.map(f => (
          <a key={f.hash} href={f.hash} className="card" style={{ display: 'block', padding: '18px', borderRadius: '12px', color: 'var(--text-primary)', textDecoration: 'none', transition: 'transform 0.28s ease, box-shadow 0.28s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{f.title}</div>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, boxShadow: '0 6px 18px rgba(0,0,0,0.45)'}}>
                ➤
              </div>
            </div>
            <div style={{ marginTop: '8px', color: 'var(--text-tertiary)', fontSize: '13px' }}>{f.title} tools and resources</div>
          </a>
        ))}
      </div>
      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button className="big" onClick={() => window.location.hash = '#/dashboard'}>Back to Dashboard</button>
        <button className="big" style={{ background: 'linear-gradient(135deg,#ffd86b 0%, #ff5f7d 100%)' }} onClick={() => alert('Pro tip: Use the sidebar to access tools quickly!')}>Tip</button>
      </div>
    </div>
  )
}
