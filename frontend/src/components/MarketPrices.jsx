import React from 'react'

export default function MarketPrices({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Market Prices</h2>
      <p>Live local and regional commodity prices, trends and alerts (coming soon).</p>
    </div>
  )
}
