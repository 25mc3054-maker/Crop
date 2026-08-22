import React from 'react'

export default function LaborServices({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Labor & Services</h2>
      <p>Find seasonal labor and local contractors for farm services.</p>
    </div>
  )
}
