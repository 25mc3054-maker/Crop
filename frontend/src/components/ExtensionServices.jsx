import React from 'react'

export default function ExtensionServices({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Extension Services</h2>
      <p>Connect with local agronomists, schedule visits and get expert advice.</p>
    </div>
  )
}
