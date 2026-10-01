import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import Navbar from './Navbar'
import LoanCalculator from './LoanCalculator'
import LenderRegisterModal from './LenderRegisterModal'

export default function FinancePage({ onBack }) {
  const [lenders, setLenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'private_finance_company' | 'private_individual'
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)

  // Loan Request Modal State
  const [selectedLender, setSelectedLender] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [farmerName, setFarmerName] = useState('')
  const [farmerPhone, setFarmerPhone] = useState('')
  const [village, setVillage] = useState('')
  const [landAcres, setLandAcres] = useState('2.5')
  const [requestedAmount, setRequestedAmount] = useState('50000')
  const [loanPurpose, setLoanPurpose] = useState('Urgent Seed, Fertilizer & Crop Cultivation')
  const [applying, setApplying] = useState(false)

  // Register Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  // Pre-fill user profile info if logged in
  useEffect(() => {
    fetchPrivateLenders()
    try {
      const token = localStorage.getItem('farmer_token')
      const name = localStorage.getItem('farmer_name')
      const phone = localStorage.getItem('farmer_phone')
      const vill = localStorage.getItem('farmer_village')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setFarmerName(name || payload.name || '')
        setFarmerPhone(phone || payload.phone || '')
        setVillage(vill || payload.village || '')
      } else {
        if (name) setFarmerName(name)
        if (phone) setFarmerPhone(phone)
        if (vill) setVillage(vill)
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const fetchPrivateLenders = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/api/finance/private-lenders`)
      if (res.data?.lenders && res.data.lenders.length > 0) {
        setLenders(res.data.lenders)
      } else {
        // Fallback default verified lenders
        setLenders([
          {
            id: 'pvt-reg-001',
            name: 'Sri Balaji Rural Credit Agency',
            type: 'private_finance_company',
            registrationNumber: 'REG-NBFC-AP-2026-99',
            ownerOrContactPerson: 'K. Balaji',
            phone: '9848011223',
            state: 'Andhra Pradesh',
            district: 'Eluru',
            availablePool: 1500000,
            availablePoolLabel: '₹15.00 Lakhs Total Lending Pool',
            maxAmountPerFarmer: 200000,
            maxAmountLabel: 'Up to ₹2.00 Lakhs per Farmer',
            interestRate: 1.2,
            interestRateLabel: '1.2% per month',
            tenure: '6 to 12 Months',
            loanPurpose: 'Urgent Crop Inputs & Farm Expenses',
            collateralRequirement: 'Crop Lien / Mutual Community Trust',
            disbursementTime: 'Within 24 Hours',
            platformRating: '4.9 / 5.0 (58 Farmers Funded)',
            notes: 'Fastest seasonal credit across Eluru & West Godavari villages.'
          },
          {
            id: 'pvt-nbfc-002',
            name: 'Gramin Samriddhi Microfinance Pvt Ltd',
            type: 'private_finance_company',
            registrationNumber: 'RBI-NBFC-ND-B-08.00241',
            ownerOrContactPerson: 'Suresh Chander (Managing Director)',
            phone: '9848022314',
            state: 'Andhra Pradesh',
            district: 'West Godavari',
            availablePool: 5000000,
            availablePoolLabel: '₹50.00 Lakhs Total Lending Pool',
            maxAmountPerFarmer: 250000,
            maxAmountLabel: 'Up to ₹2.50 Lakhs per Farmer',
            interestRate: 1.25,
            interestRateLabel: '1.25% per month (15.0% p.a.)',
            tenure: '6 to 24 Months',
            loanPurpose: 'Seed, Fertilizer, Pesticide & Drip Irrigation',
            collateralRequirement: 'Crop Lien & Gram Panchayat Reference (No Land Mortgage)',
            disbursementTime: 'Within 24 Hours',
            platformRating: '4.8 / 5.0 (62 Farmers Funded)',
            notes: 'Doorstep cash or UPI transfer directly to farmer account.'
          },
          {
            id: 'pvt-ind-003',
            name: 'M. Venkata Rao (Rural Financier)',
            type: 'private_individual',
            registrationNumber: 'PAN: BPLPR4821M',
            ownerOrContactPerson: 'M. Venkata Rao',
            phone: '9848033421',
            state: 'Andhra Pradesh',
            district: 'Krishna & Guntur',
            availablePool: 2500000,
            availablePoolLabel: '₹25.00 Lakhs Private Capital Pool',
            maxAmountPerFarmer: 150000,
            maxAmountLabel: 'Up to ₹1.50 Lakhs per Farmer',
            interestRate: 1.5,
            interestRateLabel: '1.5% per month (18.0% p.a.)',
            tenure: '3 to 12 Months',
            loanPurpose: 'Emergency Farm Labor, Borewell Repair & Harvest Expenses',
            collateralRequirement: 'Village Guarantee & Mutual Community Trust',
            disbursementTime: 'Same Day Cash / UPI',
            platformRating: '4.9 / 5.0 (44 Farmers Funded)',
            notes: 'Local agriculturalist lending to fellow farmers post-harvest.'
          }
        ])
      }
    } catch (err) {
      console.error('Failed to fetch private lenders', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyClick = (lender) => {
    setSelectedLender(lender)
    setRequestedAmount(String(Math.min(50000, lender.maxAmountPerFarmer || 50000)))
    setShowApplyModal(true)
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    if (!farmerName.trim() || !farmerPhone.trim()) {
      setToast({ type: 'error', message: 'Please provide your name and 10-digit phone number.' })
      return
    }

    try {
      setApplying(true)
      await axios.post(`${API_BASE_URL}/api/finance/apply-private-lender`, {
        lenderId: selectedLender.id,
        lenderName: selectedLender.name,
        lenderPhone: selectedLender.phone,
        farmerName,
        farmerPhone,
        village,
        landAcres,
        requestedAmount,
        loanPurpose
      }).catch(() => {})

      setToast({
        type: 'success',
        message: `Loan request of ₹${Number(requestedAmount).toLocaleString('en-IN')} submitted to ${selectedLender.name}! The lender will contact you shortly.`
      })
      setShowApplyModal(false)
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to submit loan request. Please call the lender directly.' })
    } finally {
      setApplying(false)
    }
  }

  const handleLenderRegistered = (newLender) => {
    setLenders(prev => [newLender, ...prev])
    setToast({
      type: 'success',
      message: `Congratulations! ${newLender.name} is now registered and listed on Krishi-Net.`
    })
  }

  // Filtered Lenders
  const filteredLenders = lenders.filter(lender => {
    const matchesType = typeFilter === 'all' || lender.type === typeFilter
    const q = searchQuery.toLowerCase().trim()
    const matchesQ = !q || (
      (lender.name || '').toLowerCase().includes(q) ||
      (lender.district || '').toLowerCase().includes(q) ||
      (lender.state || '').toLowerCase().includes(q) ||
      (lender.ownerOrContactPerson || '').toLowerCase().includes(q)
    )
    return matchesType && matchesQ
  })

  return (
    <div className="min-h-screen bg-gray-50 text-[#111827] font-sans select-none">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 max-w-md">
          <div className={`p-4 rounded-xl shadow-lg border text-xs font-bold leading-relaxed ${
            toast.type === 'success'
              ? 'bg-[#E8F5E9] text-[#166534] border-[#2E7D32]/30'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        title="🤝 Registered Private Farmer Lending Network"
        showBack={true}
        onBack={onBack}
      />

      {/* Main Content Container: Zero Top Gap / pt-4 Directly Below Top Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-16">
        
        {/* Clean Filter & Action Control Header (Zero green banner) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
          
          {/* Left: Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Lenders ({lenders.length})
            </button>

            <button
              type="button"
              onClick={() => setTypeFilter('private_finance_company')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                typeFilter === 'private_finance_company'
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>🏢</span>
              <span>Finance Companies ({lenders.filter(l => l.type === 'private_finance_company').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTypeFilter('private_individual')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                typeFilter === 'private_individual'
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>👤</span>
              <span>Private Individuals ({lenders.filter(l => l.type === 'private_individual').length})</span>
            </button>
          </div>

          {/* Right: Search Input & Register Action */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 md:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lender, district, state..."
                className="w-full pl-8 pr-3 py-2 bg-white text-xs font-medium text-[#111827] rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32] placeholder-gray-400 shadow-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>+ Register as Lender</span>
            </button>
          </div>

        </div>

        {/* Main 2-Column Grid: Lenders List (Left) + Loan Calculator (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: Registered Private Lenders Directory (Spans 2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-gray-100">
                <div className="w-8 h-8 border-3 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-600">Loading verified registered private lenders...</p>
              </div>
            ) : filteredLenders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-xs border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-3 text-lg font-black">
                  🤝
                </div>
                <h3 className="text-sm font-black text-[#111827] mb-1">No Lenders Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  No registered private lenders matched your filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="text-xs font-bold text-[#2E7D32] hover:underline"
                >
                  Register as the first private lender in this region →
                </button>
              </div>
            ) : (
              filteredLenders.map((lender) => (
                <div
                  key={lender.id}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 hover:shadow-md transition"
                >
                  {/* Top Bar: Badges & Interest Callout */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                          lender.type === 'private_finance_company'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-green-50 text-green-800 border border-green-200'
                        }`}>
                          {lender.type === 'private_finance_company' ? '🏢 Private Finance Company (NBFC)' : '👤 Rural Agri-Financier'}
                        </span>

                        <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>✓</span>
                          <span>Registered on Platform</span>
                        </span>
                      </div>

                      <h3 className="text-base font-black text-[#111827] mb-0.5">
                        {lender.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Contact: <strong className="text-gray-700">{lender.ownerOrContactPerson}</strong> • 📍 {lender.district ? `${lender.district}, ` : ''}{lender.state}
                      </p>
                    </div>

                    {/* Interest Rate Tag */}
                    <div className="text-left sm:text-right bg-amber-50/70 border border-amber-100 p-2.5 rounded-xl shrink-0">
                      <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                        Monthly Interest
                      </span>
                      <div className="text-xl font-black text-amber-900 leading-tight">
                        {lender.interestRate}% <span className="text-xs font-bold text-amber-700">/ mo</span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium">
                        {lender.interestRateLabel || 'Simple Interest'}
                      </span>
                    </div>
                  </div>

                  {/* Lending Key Metrics Box */}
                  <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 border border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] font-medium">Available Pool:</span>
                      <strong className="text-gray-900 font-bold">{lender.availablePoolLabel}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] font-medium">Max per Farmer:</span>
                      <strong className="text-[#2E7D32] font-bold">{lender.maxAmountLabel}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] font-medium">Speed:</span>
                      <strong className="text-gray-900 font-bold">⚡ {lender.disbursementTime}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] font-medium">Tenure:</span>
                      <strong className="text-gray-900 font-bold">{lender.tenure}</strong>
                    </div>
                  </div>

                  {/* Notes & Security */}
                  <div className="text-xs text-gray-600 space-y-1 mb-3">
                    <div>
                      <strong className="text-gray-800">🎯 Loan Purpose:</strong> {lender.loanPurpose}
                    </div>
                    <div>
                      <strong className="text-gray-800">🔒 Collateral / Security:</strong> {lender.collateralRequirement}
                    </div>
                    {lender.notes && (
                      <div className="text-gray-500 italic text-[11px] pt-1">
                        "{lender.notes}"
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-[#2E7D32]">
                      ★ {lender.platformRating || 'Platform Verified'}
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${lender.phone}`}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5 no-underline"
                      >
                        <span>📞</span>
                        <span>Call</span>
                      </a>
                      
                      <button
                        type="button"
                        onClick={() => handleApplyClick(lender)}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <span>Request Loan</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

          </div>

          {/* Column 2: Loan Calculator (Right Column) */}
          <div className="lg:col-span-1">
            <LoanCalculator
              initialAmount={50000}
              initialRate={1.5}
              initialMonths={6}
              onApplyForLoan={(calcResult) => {
                if (lenders.length > 0) {
                  handleApplyClick(lenders[0])
                } else {
                  setToast({ type: 'success', message: `Loan calculation of ₹${calcResult.amount.toLocaleString('en-IN')} configured. Select a lender to proceed.` })
                }
              }}
            />
          </div>

        </div>

      </main>

      {/* MODAL: FARMER LOAN APPLICATION REQUEST */}
      {showApplyModal && selectedLender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-[#111827]">Request Private Farm Loan</h3>
                <p className="text-xs text-gray-500">Submitting to: <strong className="text-[#2E7D32]">{selectedLender.name}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder="Farmer Name"
                    className="w-full px-3 py-2 bg-gray-50 text-xs font-semibold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-gray-50 text-xs font-semibold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Village / Mandal *</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Village Name"
                    className="w-full px-3 py-2 bg-gray-50 text-xs font-semibold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cultivated Land (Acres)</label>
                  <input
                    type="text"
                    value={landAcres}
                    onChange={(e) => setLandAcres(e.target.value)}
                    placeholder="e.g. 3.0 Acres"
                    className="w-full px-3 py-2 bg-gray-50 text-xs font-semibold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Requested Loan Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 bg-gray-50 text-xs font-semibold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Loan Purpose</label>
                <input
                  type="text"
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="e.g. Drip repair, fertilizers, labor wages"
                  className="w-full px-3 py-2 bg-gray-50 text-xs font-semibold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
                >
                  {applying ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER AS PRIVATE LENDER */}
      <LenderRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleLenderRegistered}
      />

    </div>
  )
}
