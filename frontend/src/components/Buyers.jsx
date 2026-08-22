import React from 'react'

export default function Buyers({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Buyers & Market Linkages</h2>
      <p>Directory of buyers and tender board for direct sales.</p>
    </div>
  )
}
