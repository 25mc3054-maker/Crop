import React from 'react'

export default function InsuranceClaims({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Insurance & Claims</h2>
      <p>Lookup policies and file claims with guided checklists.</p>
    </div>
  )
}
