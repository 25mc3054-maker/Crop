import React from 'react'

export default function CarbonTools({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Carbon & Sustainability</h2>
      <p>Carbon footprint calculator and carbon credit participation guides.</p>
    </div>
  )
}
