import React from 'react'

export default function Analytics({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Analytics & Benchmarks</h2>
      <p>Compare yields against local averages and view performance charts.</p>
    </div>
  )
}
