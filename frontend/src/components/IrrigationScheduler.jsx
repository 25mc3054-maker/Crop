import React from 'react'

export default function IrrigationScheduler({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Irrigation Scheduler</h2>
      <p>Water requirement calculator and reminders for irrigation events.</p>
    </div>
  )
}
