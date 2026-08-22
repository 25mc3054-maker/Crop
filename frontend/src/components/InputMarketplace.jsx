import React from 'react'

export default function InputMarketplace({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Input Marketplace</h2>
      <p>Search seeds, fertilisers and tools; contact local sellers.</p>
    </div>
  )
}
