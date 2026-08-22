import React from 'react'

export default function Tutorials({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Tutorials & Knowledge Base</h2>
      <p>Video lessons, step-by-step guides and best-practices for farmers.</p>
    </div>
  )
}
