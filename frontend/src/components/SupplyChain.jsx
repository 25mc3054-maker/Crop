import React from 'react'

export default function SupplyChain({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Supply Chain Tracking</h2>
      <p>Farm-to-buyer traceability, pickup scheduling and invoices.</p>
    </div>
  )
}
