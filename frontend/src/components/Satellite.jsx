import React from 'react'

export default function Satellite({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Satellite & Remote Sensing</h2>
      <p>NDVI maps and field health history using satellite data.</p>
    </div>
  )
}
