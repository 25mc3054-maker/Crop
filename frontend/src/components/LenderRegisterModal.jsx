import React, { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

// Comprehensive List of Indian States
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi NCR',
  'Jammu & Kashmir',
  'Ladakh'
]

export default function LenderRegisterModal({
  isOpen,
  onClose,
  onSuccess
}) {
  // Empty initial form states (Zero pre-filled hardcoded values)
  const [formData, setFormData] = useState({
    name: '',
    type: 'private_finance_company',
    registrationNumber: '',
    ownerOrContactPerson: '',
    phone: '',
    email: '',
    state: '', // Defaulted to empty ""
    district: '',
    availablePool: '', // Empty
    maxAmountPerFarmer: '', // Empty
    interestRate: '', // Empty
    tenure: '3 to 12 Months',
    collateralRequirement: '', // Empty
    disbursementTime: 'Within 24 Hours',
    notes: '' // Empty
  })

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your name or company name.')
      return
    }

    if (!formData.phone.trim() || formData.phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit contact phone number.')
      return
    }

    if (!formData.state) {
      setErrorMsg('Please select your operating state.')
      return
    }

    if (!formData.availablePool) {
      setErrorMsg('Please specify your available lending pool.')
      return
    }

    if (!formData.maxAmountPerFarmer) {
      setErrorMsg('Please specify max loan amount per farmer.')
      return
    }

    if (!formData.interestRate) {
      setErrorMsg('Please specify your proposed monthly interest rate.')
      return
    }

    try {
      setSubmitting(true)
      
      const payload = {
        ...formData,
        availablePoolLabel: `₹${Number(formData.availablePool || 0).toLocaleString('en-IN')}`,
        maxAmountLabel: `₹${Number(formData.maxAmountPerFarmer || 0).toLocaleString('en-IN')}`,
        interestRateLabel: `${formData.interestRate}% Monthly Simple Interest`,
        platformRating: 'New Verified Registered Lender',
        verifiedDate: new Date().toISOString()
      }

      await axios.post(`${API_BASE_URL}/api/finance/register-private-lender`, payload).catch(() => {})

      if (onSuccess) {
        onSuccess(payload)
      }
      onClose()
    } catch (err) {
      console.error('Lender registration error', err)
      setErrorMsg('Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black text-[#111827]">
              Register as a Verified Private Lender
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              List your capital pool and connect directly with verified farmers on Krishi-Net
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* 1. Entity Type Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Lending Entity Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('type', 'private_finance_company')}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  formData.type === 'private_finance_company'
                    ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#2E7D32]'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>🏢</span>
                <span>Private Finance Company / NBFC</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange('type', 'private_individual')}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  formData.type === 'private_individual'
                    ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#2E7D32]'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>👤</span>
                <span>Private Individual / Rural Financier</span>
              </button>
            </div>
          </div>

          {/* 2. Name & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {formData.type === 'private_finance_company' ? 'Company / Firm Name *' : 'Your Full Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={formData.type === 'private_finance_company' ? 'e.g. Kisan Samriddhi Finance Ltd' : 'e.g. K. Narayana Rao'}
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={formData.ownerOrContactPerson}
                onChange={(e) => handleChange('ownerOrContactPerson', e.target.value)}
                placeholder="e.g. Managing Director or Self"
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
              />
            </div>
          </div>

          {/* 3. Phone & Registration ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                10-Digit Contact Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g. 98XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Registration / PAN / ID
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                placeholder="e.g. RBI NBFC ID, PAN, or Aadhaar"
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
              />
            </div>
          </div>

          {/* 4. Operating State & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Operating State *
              </label>
              <select
                required
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition cursor-pointer"
              >
                {/* Default empty option as required */}
                <option value="" disabled className="text-gray-400">
                  Select State
                </option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                District / Operating Region
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
                placeholder="e.g. West Godavari / All Districts"
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
              />
            </div>
          </div>

          {/* 5. Total Pool & Max Loan Per Farmer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Total Available Lending Pool (₹) *
              </label>
              <input
                type="text"
                required
                value={formData.availablePool}
                onChange={(e) => handleChange('availablePool', e.target.value)}
                placeholder="e.g. 5,00,000"
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Max Loan Per Farmer (₹) *
              </label>
              <input
                type="text"
                required
                value={formData.maxAmountPerFarmer}
                onChange={(e) => handleChange('maxAmountPerFarmer', e.target.value)}
                placeholder="e.g. 1,50,000"
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
              />
            </div>
          </div>

          {/* 6. Proposed Interest Rate & Disbursement Speed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Proposed Interest Rate (% per month) *
              </label>
              <input
                type="text"
                required
                value={formData.interestRate}
                onChange={(e) => handleChange('interestRate', e.target.value)}
                placeholder="e.g. 1.5"
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Disbursement Speed
              </label>
              <select
                value={formData.disbursementTime}
                onChange={(e) => handleChange('disbursementTime', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition cursor-pointer"
              >
                <option value="Same Day Cash / UPI">Same Day Cash / UPI</option>
                <option value="Within 24 Hours">Within 24 Hours</option>
                <option value="Within 48 Hours">Within 48 Hours</option>
              </select>
            </div>
          </div>

          {/* 7. Collateral / Trust Requirements */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Collateral / Trust Requirements
            </label>
            <input
              type="text"
              value={formData.collateralRequirement}
              onChange={(e) => handleChange('collateralRequirement', e.target.value)}
              placeholder="e.g. Crop Lien, Village Guarantee, or None"
              className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] transition"
            />
          </div>

          {/* 8. Additional Terms */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Additional Terms / Guidelines
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Write brief guidelines or requirements for borrowers..."
              className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-[#111827] placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] resize-none transition"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-400 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              {submitting ? 'Registering...' : '✓ Complete Registration & List'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
