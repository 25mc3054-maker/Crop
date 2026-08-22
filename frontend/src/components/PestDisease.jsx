import React from 'react'

export default function PestDisease({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Pest & Disease ID</h2>
      <p>Upload images to identify pests and diseases and get treatment suggestions.</p>
    </div>
  )
}
