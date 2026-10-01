import React, { useState } from 'react'
import Navbar from './Navbar'

export default function Documents({ onBack }) {
  const [activeTab, setActiveTab] = useState('vault')
  const [documents, setDocuments] = useState([
    { id: 1, title: '7/12 Land Record (Pahani / RoR)', category: 'Land Record', sub: 'Survey #42/1B • 5.50 Acres • Guntur District', tag: 'VERIFIED ✅', date: '2026 Season', size: '1.4 MB' },
    { id: 2, title: 'Soil Health Card (SHC-2026)', category: 'Soil Diagnosis', sub: 'NPK Diagnosis & Organic Carbon Ratio: 0.68%', tag: 'ACTIVE ✅', date: 'Tested Jan 2026', size: '890 KB' },
    { id: 3, title: 'Kisan Credit Card (KCC) Sanction Certificate', category: 'Credit & Banking', sub: 'SBI Agri Branch • ₹3,00,000 Limit at 4% Interest', tag: 'APPROVED ✅', date: 'Active', size: '2.1 MB' },
    { id: 4, title: 'Aadhaar Kisan e-KYC Verification', category: 'Identity', sub: 'UIDAI Linked & Biometrically Verified', tag: 'LINKED ✅', date: 'Permanent', size: '540 KB' },
    { id: 5, title: 'PM-Kisan DBT Registration Receipt', category: 'Govt Subsidies', sub: 'Direct Benefit Transfer Scheme Beneficiary Slip', tag: 'ACTIVE ✅', date: 'Instalment #16', size: '1.1 MB' }
  ])

  const handleUpload = () => {
    const title = prompt('Enter document title (e.g. Electricity Subsidy Bill):')
    if (!title) return
    setDocuments([
      ...documents,
      {
        id: Date.now(),
        title,
        category: 'Uploaded File',
        sub: 'Uploaded just now • Stored securely in your private vault',
        tag: 'UPLOADED ✅',
        date: 'Today',
        size: '1.2 MB'
      }
    ])
    alert('Document uploaded successfully to your encrypted Kisan DigiLocker!')
  }

  return (
    <div style={{ minHeight: '100vh', padding: '14px 10px 60px', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <div className="container" style={{ width: '96%', maxWidth: '1400px', margin: '0 auto' }}>
        
        <Navbar title="🔒 Kisan DigiLocker Vault" showBack={true} onBack={onBack} />

        {/* Hero Header - Sharp Square Box */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #6cba55 0%, #4e9436 100%)',
            borderRadius: '0px',
            padding: '28px 32px',
            color: '#ffffff',
            marginBottom: 24,
            boxShadow: '0 4px 14px rgba(78, 148, 54, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: '1px solid #4e9436'
          }}
        >
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', color: '#2e7d32', padding: '4px 12px', fontSize: 11, fontWeight: 900, borderRadius: '0px', textTransform: 'uppercase', marginBottom: 10 }}>
              <span>🔒</span> ENCRYPTED AGRICULTURAL VAULT
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3.4vw, 32px)', fontWeight: 900, color: '#ffffff', margin: '0 0 8px 0' }}>
              Kisan DigiLocker & Land Records Vault
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>
              Instant, tamper-proof access to your 7/12 Land Records, Soil Health Cards, KCC Certificates, and DBT receipts.
            </p>
          </div>

          <button
            onClick={handleUpload}
            style={{
              padding: '12px 24px',
              borderRadius: '0px',
              background: '#ffffff',
              color: '#2e7d32',
              border: 'none',
              fontWeight: 900,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}
          >
            ⬆️ Upload New Document
          </button>
        </div>

        {/* Document Grid - Sharp Square Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2ece0',
                borderTop: '4px solid #5ca346',
                borderRadius: '0px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(24, 44, 29, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, background: '#eaf7e6', color: '#2e7d32', padding: '2px 8px', borderRadius: '0px', fontWeight: 800 }}>
                    {doc.tag}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
                    {doc.date}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 800, color: '#182c1d' }}>
                  {doc.title}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#496150', lineHeight: 1.45 }}>
                  {doc.sub}
                </p>
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>File size: {doc.size}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => alert(`Viewing ${doc.title}`)}
                    style={{ padding: '6px 14px', borderRadius: '0px', border: '1px solid #5ca346', background: '#ffffff', color: '#5ca346', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => alert(`Downloading verified PDF for ${doc.title}`)}
                    style={{ padding: '6px 14px', borderRadius: '0px', border: 'none', background: '#5ca346', color: '#ffffff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
