import React from 'react'

export default function FinanceLoans({ onBack }) {
  return (
    <div className="container">
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Back</button>
      <h2>Finance & Loans</h2>
      <p>Loan marketplace, eligibility checks, subsidy and repayment calculators.</p>
    </div>
  )
}
