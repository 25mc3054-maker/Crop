import React from 'react'

export default function OfflineSupport({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Offline Support & SMS/USSD</h2>
      <p>Access critical features via SMS, USSD and low-bandwidth modes.</p>
    </div>
  )
}
