import React from 'react'

export default function PolicySubsidies({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Policy & Subsidies</h2>
      <p>Curated government schemes, deadlines and application help.</p>
    </div>
  )
}
