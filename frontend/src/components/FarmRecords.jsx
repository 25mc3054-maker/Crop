import React from 'react'

export default function FarmRecords({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Farm Records & Ledger</h2>
      <p>Track plots, yields, input usage and export reports.</p>
    </div>
  )
}
