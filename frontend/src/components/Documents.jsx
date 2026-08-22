import React from 'react'

export default function Documents({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Document Templates</h2>
      <p>Printable templates: invoices, subsidy forms, loan applications and receipts.</p>
    </div>
  )
}
