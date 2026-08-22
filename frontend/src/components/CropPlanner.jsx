import React from 'react'

export default function CropPlanner({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Crop Planner</h2>
      <p>Seasonal calendar, sowing/harvest windows and rotation suggestions.</p>
    </div>
  )
}
