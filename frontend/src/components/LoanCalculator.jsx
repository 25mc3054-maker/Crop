import React, { useState } from 'react'

export default function LoanCalculator({
  initialAmount = 50000,
  initialRate = 1.5,
  initialMonths = 6,
  onApplyForLoan
}) {
  const [amount, setAmount] = useState(initialAmount)
  const [ratePerMonth, setRatePerMonth] = useState(initialRate)
  const [months, setMonths] = useState(initialMonths)

  // Selectable interest rates up to 3% per month
  const RATE_OPTIONS = [1.0, 1.5, 2.0, 2.5, 3.0]

  // Financial Calculations
  const principal = Math.max(0, Number(amount) || 0)
  const monthlyRateFraction = (Number(ratePerMonth) || 0) / 100
  const monthlyInterest = Math.round(principal * monthlyRateFraction)
  const totalInterest = monthlyInterest * (Number(months) || 1)
  
  // Platform Convenience Fee: 0.5% (0.005) of Total Tenure Interest
  // Example: If Total Interest = ₹12,000, Convenience Fee = 12,000 * 0.005 = ₹60
  const convenienceFee = Math.round(totalInterest * 0.005)
  const totalPayable = principal + totalInterest + convenienceFee

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 font-sans select-none sticky top-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-black">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <path d="M16 10h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M12 14h.01" />
            <path d="M8 14h.01" />
            <path d="M12 18h.01" />
            <path d="M8 18h.01" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-black text-[#111827]">Private Loan Calculator</h2>
          <p className="text-xs text-gray-500 font-medium">Monthly simple interest with 0.5% platform fee</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. Loan Amount Control */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-gray-700">Principal Loan Amount:</label>
            <span className="text-base font-black text-[#2E7D32]">
              ₹{principal.toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min="10000"
            max="500000"
            step="5000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-[#2E7D32] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
            <span>₹10,000</span>
            <span>₹2.50 Lakh</span>
            <span>₹5.00 Lakh</span>
          </div>
        </div>

        {/* 2. Interest Rate Selection (Up to 3% per month) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-700">Interest Rate (% per month):</label>
            <span className="text-xs font-black text-[#111827] bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-md">
              {ratePerMonth}% / mo
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {RATE_OPTIONS.map((rate) => {
              const isSelected = ratePerMonth === rate
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setRatePerMonth(rate)}
                  className={`py-2 px-1 text-xs font-black rounded-xl transition cursor-pointer text-center ${
                    isSelected
                      ? 'bg-[#2E7D32] text-white shadow-xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {rate}%/mo
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Tenure Duration Slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-gray-700">Repayment Tenure:</label>
            <span className="text-xs font-black text-[#111827]">
              {months} {months === 1 ? 'Month' : 'Months'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="24"
            step="1"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full accent-[#2E7D32] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
            <span>1 Month</span>
            <span>12 Months</span>
            <span>24 Months</span>
          </div>
        </div>

        {/* 4. Summary Breakdown Cards (Line by Line Outcome) */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 pb-1 border-b border-gray-200">
            Financial Breakdown Summary
          </div>

          {/* Line 1: Principal Loan Amount */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">1. Principal Loan Amount:</span>
            <span className="font-bold text-[#111827]">
              ₹{principal.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Line 2: Monthly Interest Due */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">2. Monthly Interest Due ({ratePerMonth}%):</span>
            <span className="font-bold text-[#111827]">
              ₹{monthlyInterest.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Line 3: Total Tenure Interest */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">3. Total Tenure Interest ({months} mos):</span>
            <span className="font-bold text-[#111827]">
              ₹{totalInterest.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Line 4: Platform Convenience Fee */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium flex items-center gap-1">
              <span>4. Platform Convenience Fee (0.5%):</span>
              <span className="text-[10px] text-gray-400" title="0.005 of total interest">(0.5%)</span>
            </span>
            <span className="font-bold text-[#2E7D32]">
              ₹{convenienceFee.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Line 5: Final Outcome / Total Amount Payable */}
          <div className="pt-2.5 mt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-black text-[#111827] block">
                5. Total Amount Payable:
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                (Principal + Total Interest + Fee)
              </span>
            </div>
            <span className="text-base font-black text-[#2E7D32]">
              ₹{totalPayable.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {onApplyForLoan && (
          <button
            type="button"
            onClick={() => onApplyForLoan({ amount: principal, rate: ratePerMonth, months })}
            className="w-full py-3 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Request ₹{principal.toLocaleString('en-IN')} Loan</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  )
}
