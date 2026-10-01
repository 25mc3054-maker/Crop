import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import Navbar from './Navbar'
import UniversalProfileModal from './UniversalProfileModal'
import PortalApplyModal from './PortalApplyModal'
import { DEFAULT_SCHEMES, DEFAULT_LOANS } from '../data/schemesFallback'

export default function Schemes({ onBack }) {
  const [schemes, setSchemes] = useState(DEFAULT_SCHEMES)
  const [loading, setLoading] = useState(false)
  const [applyState, setApplyState] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [lifecycleFilter, setLifecycleFilter] = useState('active') // 'active', 'new', 'archived', 'all'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [toast, setToast] = useState(null)
  
  // AI Curator State
  const [curatorStatus, setCuratorStatus] = useState({
    stats: {
      totalActiveSchemes: 11,
      newSchemesDiscovered: 5,
      archivedClosedSchemes: 3,
      auditedLoans: 6
    }
  })
  const [curating, setCurating] = useState(false)
  const [showCuratorLogModal, setShowCuratorLogModal] = useState(false)

  // Universal Digi-Locker Profile State
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [readiness, setReadiness] = useState({ score: 100, isReady: true, statusLabel: '100% Ready (Universal 1-Click Enabled)' })

  // Direct 1-Click Portal Apply Modal State
  const [portalModalOpen, setPortalModalOpen] = useState(false)
  const [selectedSchemeForPortal, setSelectedSchemeForPortal] = useState(null)
  const [batchSchemesForPortal, setBatchSchemesForPortal] = useState([])
  // My Submitted Applications Drawer / Modal
  const [applicationsModalOpen, setApplicationsModalOpen] = useState(false)
  const [myApplications, setMyApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(false)

  // Master Section Switcher: 'schemes' | 'govt_loans' | 'commercial_loans'
  const [mainTab, setMainTab] = useState('schemes')
  const [loanCatalog, setLoanCatalog] = useState(DEFAULT_LOANS)
  const [loadingLoans, setLoadingLoans] = useState(false)
  const [loanCategoryFilter, setLoanCategoryFilter] = useState('all')
  const [loanSearchQuery, setLoanSearchQuery] = useState('')
  const [selectedLoanForApply, setSelectedLoanForApply] = useState(null)
  const [loanApplyModalOpen, setLoanApplyModalOpen] = useState(false)
  const [loanSubmitting, setLoanSubmitting] = useState(false)
  const [loanFormData, setLoanFormData] = useState({
    farmerName: '',
    phone: '',
    village: '',
    landAcres: '2.5',
    cropType: 'Paddy / Wheat',
    loanAmount: '100000'
  })

  useEffect(() => {
    fetchSchemes(true, lifecycleFilter)
    fetchLoanCatalog()
    loadUniversalProfile()
    loadMyApplications()
    // Autonomous auto-audit synchronization: refresh every 2 minutes
    const iv = setInterval(() => {
      fetchSchemes(false, lifecycleFilter)
      fetchLoanCatalog()
    }, 2 * 60 * 1000)
    return () => clearInterval(iv)
  }, [lifecycleFilter])

  // Pre-fill loan form from storage or profile
  useEffect(() => {
    try {
      const token = localStorage.getItem('farmer_token')
      const name = localStorage.getItem('farmer_name')
      const phone = localStorage.getItem('farmer_phone')
      const village = localStorage.getItem('farmer_village')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setLoanFormData(prev => ({
          ...prev,
          farmerName: name || payload.name || '',
          phone: phone || payload.phone || '',
          village: village || payload.village || ''
        }))
      } else if (name || phone) {
        setLoanFormData(prev => ({
          ...prev,
          farmerName: name || '',
          phone: phone || '',
          village: village || ''
        }))
      }
    } catch (e) {}
  }, [userProfile])

  const fetchLoanCatalog = async () => {
    try {
      setLoadingLoans(true)
      const res = await axios.get(`${API_BASE_URL}/api/loans/catalog`)
      if (res.data?.ok) {
        setLoanCatalog({
          govtBankLoans: res.data.govtBankLoans || [],
          commercialBankLoans: res.data.commercialBankLoans || []
        })
      }
    } catch (e) {
      console.error('Failed to fetch loan catalog', e)
    } finally {
      setLoadingLoans(false)
    }
  }

  const handleLoanApplyClick = (loan) => {
    setSelectedLoanForApply(loan)
    setLoanFormData(prev => ({
      ...prev,
      loanAmount: String(Math.min(100000, loan.maxAmount || 100000))
    }))
    setLoanApplyModalOpen(true)
  }

  const handleLoanFormSubmit = async (e) => {
    e.preventDefault()
    if (!loanFormData.farmerName || !loanFormData.phone) {
      setToast({ type: 'error', message: 'Please provide your name and 10-digit mobile number' })
      return
    }
    if (loanFormData.phone.replace(/\D/g, '').length !== 10) {
      setToast({ type: 'error', message: 'Please enter a valid 10-digit Indian mobile number' })
      return
    }
    try {
      setLoanSubmitting(true)
      const res = await axios.post(`${API_BASE_URL}/finance/apply`, {
        loanId: selectedLoanForApply?.id,
        farmerName: loanFormData.farmerName,
        phone: loanFormData.phone,
        village: loanFormData.village,
        landAcres: loanFormData.landAcres,
        cropType: loanFormData.cropType,
        loanAmount: loanFormData.loanAmount
      })
      if (res.data?.ok) {
        setLoanApplyModalOpen(false)
        setToast({
          type: 'success',
          message: `✓ Loan application submitted for ${selectedLoanForApply?.name}! A Krishi-Net Banking Facilitator will contact you for branch documentation.`
        })
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to submit loan application.' })
    } finally {
      setLoanSubmitting(false)
    }
  }

  const fetchSchemes = async (showLoader = false, filter = lifecycleFilter) => {
    try {
      if (showLoader) setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/schemes`, {
        params: { status: filter }
      })
      if (res.data?.schemes && res.data.schemes.length > 0) {
        setSchemes(res.data.schemes)
      } else {
        const fallback = filter === 'archived'
          ? DEFAULT_SCHEMES.filter(s => s.lifecycleStatus === 'archived')
          : DEFAULT_SCHEMES.filter(s => s.lifecycleStatus !== 'archived')
        setSchemes(fallback)
      }
      if (res.data?.curatorStatus) {
        setCuratorStatus(res.data.curatorStatus)
      }
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Failed to fetch schemes', err)
      const fallback = filter === 'archived'
        ? DEFAULT_SCHEMES.filter(s => s.lifecycleStatus === 'archived')
        : DEFAULT_SCHEMES.filter(s => s.lifecycleStatus !== 'archived')
      setSchemes(fallback)
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  const getAuthHeaders = () => {
    const headers = {}
    const token = localStorage.getItem('farmer_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
    let sessionKey = localStorage.getItem('krishi_vault_session_id')
    if (!sessionKey) {
      sessionKey = 'vault_' + Math.random().toString(36).substring(2, 12)
      localStorage.setItem('krishi_vault_session_id', sessionKey)
    }
    headers['x-farmer-session'] = sessionKey
    return headers
  }

  const loadUniversalProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/profile/universal`, {
        headers: getAuthHeaders()
      })
      if (res.data?.profile) {
        setUserProfile(res.data.profile)
      }
      if (res.data?.readiness) {
        setReadiness(res.data.readiness)
      }
    } catch (err) {
      console.error('Failed to load universal profile', err)
    }
  }

  const loadMyApplications = async () => {
    try {
      setLoadingApplications(true)
      const res = await axios.get(`${API_BASE_URL}/api/portal/applications`, {
        headers: getAuthHeaders()
      })
      if (res.data?.applications) {
        setMyApplications(res.data.applications)
      }
    } catch (err) {
      console.error('Failed to load portal applications', err)
    } finally {
      setLoadingApplications(false)
    }
  }

  // Trigger manual AI audit cycle
  const triggerAiCurator = async () => {
    try {
      setCurating(true)
      const res = await axios.post(`${API_BASE_URL}/api/ai/curate-now`)
      if (res.data?.ok) {
        setCuratorStatus(res.data.status)
        setToast({
          type: 'success',
          message: '🤖 AI Audit Complete! Verified active schemes, added newly announced 2026 schemes, archived closed schemes, and updated loan rates.'
        })
        fetchSchemes(false, lifecycleFilter)
      }
    } catch (err) {
      console.error('AI curate failed', err)
      setToast({ type: 'error', message: 'Failed to run AI audit cycle. Please retry.' })
    } finally {
      setCurating(false)
    }
  }

  // Open 1-Click Direct Portal Modal for a specific scheme
  const handleOpenDirectApply = (scheme) => {
    setSelectedSchemeForPortal(scheme)
    setPortalModalOpen(true)
  }

  const handleApplicationSuccess = () => {
    loadMyApplications()
    setToast({
      type: 'success',
      message: '✅ Direct Application Successfully Transmitted to Ministry Portal!'
    })
  }

  const startApply = (id) => {
    let defaultName = userProfile?.fullName || ''
    let defaultPhone = userProfile?.phone || ''
    setApplyState(prev => ({ ...prev, [id]: { name: defaultName, phone: defaultPhone, details: '' } }))
  }

  const updateField = (id, field, value) => {
    setApplyState(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }))
  }

  const submitApplication = async (schemeId) => {
    const data = applyState[schemeId]
    if (!data || !data.name || !data.phone) {
      setToast({ type: 'error', message: 'Please enter farmer name and 10-digit mobile' })
      return
    }
    const phoneNorm = data.phone.replace(/\s|-/g, '')
    if (!/^((\+91)?\d{10}|\d{10})$/.test(phoneNorm)) {
      setToast({ type: 'error', message: 'Enter a valid 10-digit phone number' })
      return
    }
    try {
      setSubmitting(true)
      const res = await axios.post(`${API_BASE_URL}/schemes/apply`, { schemeId, ...data })
      if (res.data && res.data.ok) {
        setToast({ type: 'success', message: 'Assistance request logged! Ref: ' + res.data.application.id })
        setApplyState(prev => ({ ...prev, [schemeId]: null }))
      } else {
        setToast({ type: 'error', message: 'Failed to submit application' })
      }
    } catch (err) {
      console.error('Apply error', err)
      setToast({ type: 'error', message: 'Submission failed: ' + (err.response?.data?.error || err.message) })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const filteredSchemes = schemes.filter(s => {
    const matchesCategory = 
      categoryFilter === 'all' ? (s.lifecycleStatus !== 'archived') :
      categoryFilter === 'archived' ? (s.lifecycleStatus === 'archived') :
      categoryFilter === 'income' ? (s.type === 'income_support' || s.id.includes('kisan')) :
      categoryFilter === 'insurance' ? (s.type === 'insurance') :
      categoryFilter === 'solar' ? (s.type === 'renewable_energy') :
      categoryFilter === 'machinery' ? (s.type === 'machinery') :
      categoryFilter === 'irrigation' ? (s.type === 'irrigation') :
      categoryFilter === 'new_tech' ? (s.type === 'fertilizer_subsidy' || s.type === 'digital_registry' || s.type === 'women_empowerment' || s.type === 'fisheries' || s.lifecycleStatus === 'newly_added') : true

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q ? true : (
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.provider && s.provider.toLowerCase().includes(q)) ||
      (s.subsidy && s.subsidy.toLowerCase().includes(q)) ||
      (s.aiReason && s.aiReason.toLowerCase().includes(q))
    )

    return matchesCategory && matchesSearch
  })

  const filteredGovtLoans = (loanCatalog.govtBankLoans || []).filter(l => {
    const matchesCat = loanCategoryFilter === 'all' ? true :
      loanCategoryFilter === 'crop' ? (l.category.toLowerCase().includes('crop') || l.id.includes('kcc')) :
      loanCategoryFilter === 'emergency' ? (l.category.toLowerCase().includes('emergency') || l.id.includes('tatkal') || l.id.includes('gold')) :
      loanCategoryFilter === 'infra' ? (l.category.toLowerCase().includes('storage') || l.id.includes('infra') || l.id.includes('aif')) :
      loanCategoryFilter === 'allied' ? (l.category.toLowerCase().includes('allied') || l.id.includes('mudra') || l.category.toLowerCase().includes('dairy')) :
      loanCategoryFilter === 'solar' ? (l.category.toLowerCase().includes('solar') || l.id.includes('green') || l.id.includes('kusum')) : true

    const q = loanSearchQuery.toLowerCase().trim()
    const matchesQ = !q ? true : (
      l.name.toLowerCase().includes(q) ||
      l.bank.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      (l.aiNotes && l.aiNotes.toLowerCase().includes(q))
    )
    return matchesCat && matchesQ
  })

  const filteredCommercialLoans = (loanCatalog.commercialBankLoans || []).filter(l => {
    const q = loanSearchQuery.toLowerCase().trim()
    const matchesQ = !q ? true : (
      l.name.toLowerCase().includes(q) ||
      l.bank.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q)
    )
    return matchesQ
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans select-none pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        
        {toast && (
          <div className="fixed right-6 top-6 z-50 max-w-md">
            <div className={`p-4 rounded-2xl shadow-xl border text-xs font-bold leading-relaxed ${
              toast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-900/10' 
                : 'bg-rose-50 text-rose-900 border-rose-200 shadow-rose-900/10'
            }`}>
              {toast.message}
            </div>
          </div>
        )}

        <Navbar 
          title={
            mainTab === 'schemes' ? '🏛️ Government Schemes & AI Subsidy Curator' :
            mainTab === 'govt_loans' ? '🏦 Government Bank Loans & 4% Kisan Credit (KCC)' :
            '🏢 Commercial Bank Loans (Private Banking)'
          } 
          showBack={true} 
          onBack={onBack} 
        />

        {/* ========================================================================= */}
        {/* HIGH-LEVEL MASTER 3-WAY OPTION CONTROLLER */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
          {/* OPTION 1: ALL GOVT SCHEMES */}
          <button
            type="button"
            onClick={() => setMainTab('schemes')}
            className={`p-4 sm:p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 cursor-pointer ${
              mainTab === 'schemes'
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-300/40'
                : 'bg-white text-slate-800 border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold ${
              mainTab === 'schemes' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
            }`}>
              🏛️
            </div>
            <div>
              <div className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${
                mainTab === 'schemes' ? 'text-emerald-100' : 'text-emerald-600'
              }`}>
                Option 1 • Central & State DBT
              </div>
              <div className="text-sm sm:text-base font-black leading-tight">
                All Govt Schemes & Subsidies
              </div>
              <div className={`text-xs mt-1 font-medium ${
                mainTab === 'schemes' ? 'text-emerald-50' : 'text-slate-500'
              }`}>
                {filteredSchemes.length} verified • PM-Kisan, PMFBY, KUSUM
              </div>
            </div>
          </button>

          {/* OPTION 2: GOVT BANK LOANS */}
          <button
            type="button"
            onClick={() => setMainTab('govt_loans')}
            className={`p-4 sm:p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 cursor-pointer ${
              mainTab === 'govt_loans'
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-300/40'
                : 'bg-white text-slate-800 border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold ${
              mainTab === 'govt_loans' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
            }`}>
              🏦
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  mainTab === 'govt_loans' ? 'text-emerald-100' : 'text-emerald-600'
                }`}>
                  Option 2 • Public Sector
                </span>
                <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-md">
                  4% KCC
                </span>
              </div>
              <div className="text-sm sm:text-base font-black leading-tight">
                Govt Bank Loans & KCC
              </div>
              <div className={`text-xs mt-1 font-medium ${
                mainTab === 'govt_loans' ? 'text-emerald-50' : 'text-slate-500'
              }`}>
                SBI, PNB, BoB, Canara • 3% Central Subvention
              </div>
            </div>
          </button>

          {/* OPTION 3: COMMERCIAL / NON-GOVT BANK LOANS */}
          <button
            type="button"
            onClick={() => setMainTab('commercial_loans')}
            className={`p-4 sm:p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 cursor-pointer ${
              mainTab === 'commercial_loans'
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-400 shadow-md ring-2 ring-blue-300/40'
                : 'bg-white text-slate-800 border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-bold ${
              mainTab === 'commercial_loans' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
            }`}>
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  mainTab === 'commercial_loans' ? 'text-blue-100' : 'text-blue-600'
                }`}>
                  Option 3 • Private Banks
                </span>
                <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-md">
                  Commercial
                </span>
              </div>
              <div className="text-sm sm:text-base font-black leading-tight">
                Commercial / Non-Govt Loans
              </div>
              <div className={`text-xs mt-1 font-medium ${
                mainTab === 'commercial_loans' ? 'text-blue-50' : 'text-slate-500'
              }`}>
                HDFC, ICICI, Axis, Kotak • Fast Processing
              </div>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ENCRYPTED FARMER DIGI-LOCKER PROFILE BANNER (Common across views) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xs mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>🔒</span> {userProfile?.fullName || 'Farmer Digi-Locker Vault'}
              </span>
              {userProfile?.aadhaarNumber && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                  Aadhaar: XXXX-XXXX-{String(userProfile.aadhaarNumber).slice(-4)}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed m-0 max-w-2xl">
              {readiness.score > 0 ? (
                <><strong>1-Click Official Portal Filing:</strong> Your verified digital profile automatically autofills central and state welfare scheme applications with instant DigiLocker authentication.</>
              ) : (
                <><strong>Encrypted Vault is Ready:</strong> Click <strong>"Setup Digi-Locker"</strong> to save your land records and bank details securely once for all government schemes.</>
              )}
            </p>

            {readiness.score > 0 && (
              <div className="flex gap-2.5 mt-2.5 text-xs text-emerald-700 font-semibold flex-wrap">
                {userProfile?.village && <span className="bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">📍 {userProfile.village}, {userProfile.district || ''}</span>}
                {userProfile?.landAreaAcres && <span className="bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">🌾 {userProfile.landAreaAcres} Acres</span>}
                {userProfile?.bankName && <span className="bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">🏦 {userProfile.bankName}</span>}
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              {readiness.score > 0 ? '✏️ Edit Digi-Locker' : '🔒 Setup Digi-Locker'}
            </button>

            <button
              type="button"
              onClick={() => { loadMyApplications(); setApplicationsModalOpen(true); }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
            >
              📑 My Applications ({myApplications.length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: ALL GOVERNMENT SCHEMES & SUBSIDIES */}
        {/* ========================================================================= */}
        {mainTab === 'schemes' && (
          <>
            {/* Category Filter Chips & Search Bar */}
            <div className="space-y-3.5 mb-6">
              <div className="flex flex-wrap gap-2 items-center">
                {[
                  { id: 'all', label: '🏛️ All Schemes' },
                  { id: 'income', label: '🌾 Direct Income' },
                  { id: 'insurance', label: '🛡️ Crop Insurance' },
                  { id: 'solar', label: '☀️ Solar PM-KUSUM' },
                  { id: 'machinery', label: '🚜 Farm Machinery & Drones' },
                  { id: 'irrigation', label: '💧 Drip Irrigation' },
                  { id: 'new_tech', label: '⚡ Advanced 2026 Tech' },
                  { id: 'archived', label: '📦 Archived Schemes' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(tab.id)
                      if (tab.id === 'archived') {
                        setLifecycleFilter('archived')
                      } else if (lifecycleFilter === 'archived') {
                        setLifecycleFilter('active')
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                      categoryFilter === tab.id
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search schemes, subsidies, keywords (e.g. PM-Kisan, Solar pump, Drone subsidy)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white text-xs sm:text-sm font-semibold text-slate-800 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs placeholder-slate-400 transition"
                />
              </div>
            </div>

        {/* Schemes Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-black text-slate-800">AI Curator Verifying Government Registries...</p>
            <p className="text-xs text-slate-500 mt-1">Cross-referencing central portals, state DBT registries, and subsidy quotas</p>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3 text-xl">
              🏛️
            </div>
            <p className="text-sm font-black text-slate-800 mb-1">No schemes found matching the selected filters.</p>
            <button 
              type="button"
              onClick={() => { setCategoryFilter('all'); setSearchQuery(''); setLifecycleFilter('active'); }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl mt-3 shadow-xs transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSchemes.map(s => {
              const isNew = s.lifecycleStatus === 'newly_added'
              const isArchived = s.lifecycleStatus === 'archived'

              return (
                <div 
                  key={s.id} 
                  className={`bg-white rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
                    isArchived 
                      ? 'border-rose-200/80 bg-slate-50/50' 
                      : isNew 
                      ? 'border-amber-200/80 shadow-xs' 
                      : 'border-slate-100 hover:border-emerald-200 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header: Provider + AI Stamp */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                        {s.provider}
                      </span>
                      
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isArchived 
                          ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                          : isNew 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isArchived ? '⛔ Closed / Archived' : (isNew ? '⚡ AI Added 2026' : '✓ AI Verified')}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-1.5 leading-snug">
                      {s.name}
                    </h3>

                    {/* Status & Validity */}
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <span className={`font-bold ${isArchived ? 'text-rose-700' : 'text-emerald-600'}`}>
                        ● {s.status}
                      </span>
                      {s.validUntil && (
                        <span className="text-slate-400 text-[11px] font-medium">
                          (Valid: {s.validUntil})
                        </span>
                      )}
                    </div>

                    {/* AI Curation Reason */}
                    {s.aiReason && (
                      <div className={`p-2.5 rounded-xl text-xs font-semibold mb-3 border ${
                        isArchived 
                          ? 'bg-rose-50 text-rose-900 border-rose-200/60' 
                          : isNew 
                          ? 'bg-amber-50 text-amber-900 border-amber-200/60' 
                          : 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60'
                      }`}>
                        <strong>🤖 AI Audit Note:</strong> {s.aiReason}
                      </div>
                    )}

                    {/* Subsidy Highlight */}
                    {s.subsidy && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-2.5 rounded-xl mb-3 text-xs font-black text-emerald-800 flex items-center gap-1.5">
                        <span>🎁</span>
                        <span>Subsidy: {s.subsidy}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {s.description}
                    </p>

                    {/* Benefits List */}
                    {s.benefits && s.benefits.length > 0 && (
                      <div className="mb-3">
                        <strong className="text-xs font-black text-slate-800 block mb-1">Key Advantages:</strong>
                        <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc">
                          {s.benefits.map((b, idx) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Eligibility & Documents */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4 text-xs space-y-2">
                      <div>
                        <strong className="text-slate-800 block text-[11px]">Who Can Apply:</strong>
                        <span className="text-slate-600">{s.eligibility}</span>
                      </div>

                      {s.documents && s.documents.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <strong className="text-slate-800 block text-[11px]">Required Documents:</strong>
                          <span className="text-emerald-700 font-bold">{s.documents.join(' • ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {!isArchived ? (
                      <div className="space-y-2">
                        <button 
                          type="button"
                          onClick={() => handleOpenDirectApply(s)}
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>⚡ 1-Click Direct Portal Apply</span>
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-bold">Auto-Fill</span>
                        </button>

                        <div className="flex gap-2">
                          {s.applyLink && (
                            <a 
                              href={s.applyLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex-1 py-2 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition no-underline"
                            >
                              Official Portal ↗
                            </a>
                          )}
                          <button 
                            type="button"
                            className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                            onClick={() => startApply(s.id)} 
                          >
                            Assisted Desk
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-rose-50 rounded-xl text-center text-xs font-bold text-rose-800 border border-rose-100">
                        ⛔ Applications Halted by Government
                      </div>
                    )}

                    {/* Offline Assisted Desk Form Drawer */}
                    {applyState[s.id] && (
                      <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                        <div className="text-xs font-black text-emerald-800">
                          Register for Assisted Application:
                        </div>
                        <input 
                          value={applyState[s.id].name} 
                          onChange={e => updateField(s.id, 'name', e.target.value)} 
                          placeholder="Your full name" 
                          className="w-full p-2 bg-white text-xs rounded-lg border border-slate-200 outline-none"
                        />
                        <input 
                          value={applyState[s.id].phone} 
                          onChange={e => updateField(s.id, 'phone', e.target.value)} 
                          placeholder="10-digit mobile" 
                          className="w-full p-2 bg-white text-xs rounded-lg border border-slate-200 outline-none"
                        />
                        <textarea 
                          value={applyState[s.id].details} 
                          onChange={e => updateField(s.id, 'details', e.target.value)} 
                          placeholder="Village name, survey number, crop type..." 
                          rows="2"
                          className="w-full p-2 bg-white text-xs rounded-lg border border-slate-200 outline-none"
                        />
                        <div className="flex gap-2 pt-1">
                          <button 
                            type="button"
                            className="flex-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                            onClick={() => submitApplication(s.id)} 
                            disabled={submitting}
                          >
                            {submitting ? 'Submitting…' : '✓ Confirm & Get Ref ID'}
                          </button>
                          <button 
                            type="button"
                            className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                            onClick={() => setApplyState(prev => ({ ...prev, [s.id]: null }))}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: GOVERNMENT BANK LOANS & KISAN CREDIT CARD (4% NET RATE) */}
        {/* ========================================================================= */}
        {mainTab === 'govt_loans' && (
          <div>
            {/* Top Highlight Banner: 3% Central Subvention & 4% Net Rate */}
            <div style={{ 
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
              border: '2px solid #86efac', 
              borderRadius: 16, 
              padding: '22px 26px', 
              marginBottom: 24, 
              boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ maxWidth: 780 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="badge-sharp" style={{ background: '#22c55e', color: '#ffffff', fontSize: 11, fontWeight: 900 }}>
                      ✓ RBI & NABARD 2026 AUDITED
                    </span>
                    <span style={{ fontSize: 12, color: '#dcfce7', fontWeight: 700 }}>
                      Official Public Sector & Regional Rural Bank Agricultural Credit
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 900 }}>
                    Kisan Credit Card: Nominal 7.0% → Net 4.0% p.a. Prompt Repayment
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#f0fdf4', lineHeight: 1.5 }}>
                    Under the Central Government's <strong>Modified Interest Subvention Scheme (MISS)</strong>, farmers who repay crop loans within 12 months receive a <strong>3.0% direct interest subvention</strong> from the Government of India, reducing your actual interest rate to just <strong>4.0% per annum</strong>. Up to ₹1.60 Lakhs (and up to ₹3.00 Lakhs with tie-up arrangements) is 100% collateral-free. MUDRA loans provide collateral-free credit up to ₹10.00 Lakhs for allied agriculture (Dairy, Poultry, Fisheries).
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)' }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#dcfce7', fontWeight: 800 }}>Net Farmer Rate</span>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>4.0% <span style={{ fontSize: 14 }}>p.a.</span></div>
                    <span style={{ fontSize: 11, color: '#f0fdf4' }}>With 3% Subvention</span>
                  </div>
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)' }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#dcfce7', fontWeight: 800 }}>Zero Collateral Limit</span>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#fef08a' }}>₹1.60L <span style={{ fontSize: 14 }}>- ₹10L</span></div>
                    <span style={{ fontSize: 11, color: '#f0fdf4' }}>No Land Mortgage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Chips & Search Bar for Govt Loans */}
            <div className="space-y-3.5 mb-6">
              <div className="flex flex-wrap gap-2 items-center">
                {[
                  { id: 'all', label: '🏦 All Govt Loans' },
                  { id: 'crop', label: '🌾 Crop Loans (KCC 4%)' },
                  { id: 'emergency', label: '⚡ Contingency & Gold' },
                  { id: 'infra', label: '🏢 Storage & AIF (3% Subvention)' },
                  { id: 'allied', label: '🐄 Dairy & Poultry (MUDRA)' },
                  { id: 'solar', label: '☀️ Solar Irrigation (PM-KUSUM)' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setLoanCategoryFilter(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                      loanCategoryFilter === cat.id
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search government bank, KCC loan, MUDRA, interest subvention..."
                  value={loanSearchQuery}
                  onChange={e => setLoanSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white text-xs sm:text-sm font-semibold text-slate-800 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs placeholder-slate-400 transition"
                />
              </div>
            </div>

            {/* Government Bank Loans Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
              {filteredGovtLoans.map(loan => (
                <div
                  key={loan.id}
                  className="card"
                  style={{
                    padding: 22,
                    background: '#ffffff',
                    color: '#000000',
                    borderLeft: '6px solid #22c55e',
                    border: '1px solid #e2ece0',
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.06)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#15803d', textTransform: 'uppercase', background: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>
                            🏛️ {loan.bank}
                          </span>
                          <span className="badge-sharp" style={{ background: '#16a34a', color: '#ffffff', fontSize: 10 }}>
                            Govt Bank Loan
                          </span>
                        </div>
                        <h3 style={{ margin: '4px 0 2px 0', fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>
                          {loan.name}
                        </h3>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{loan.category}</span>
                      </div>

                      <div style={{ textAlign: 'right', background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Effective Rate</span>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>
                          {loan.effectiveRate}% <span style={{ fontSize: 11, color: '#64748b' }}>p.a.</span>
                        </div>
                        {loan.subventionRate > 0 && (
                          <span style={{ fontSize: 10, color: '#15803d', fontWeight: 800, background: '#ecfdf5', padding: '1px 5px', borderRadius: 4 }}>
                            3% Govt Subvention
                          </span>
                        )}
                      </div>
                    </div>

                    {loan.aiNotes && (
                      <div style={{ background: '#f0fdf4', border: '1px dashed #86efac', padding: '6px 10px', borderRadius: 6, fontSize: 11, color: '#166534', fontWeight: 700, margin: '8px 0 10px 0' }}>
                        🤖 <strong>Audit Status:</strong> {loan.aiNotes}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, background: '#f1f5f9', padding: 10, borderRadius: 8, margin: '10px 0', fontSize: 12 }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Borrowing Limit:</span>
                        <strong style={{ color: '#0f172a' }}>{loan.maxAmountLabel}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Collateral:</span>
                        <strong style={{ color: '#0f172a' }}>{loan.collateralFreeLimit}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Tenure:</span>
                        <strong style={{ color: '#0f172a' }}>{loan.tenure}</strong>
                      </div>
                    </div>

                    <ul style={{ margin: '8px 0 14px 18px', padding: 0, fontSize: 12, color: '#334155' }}>
                      {loan.benefits.map((b, i) => (
                        <li key={i} style={{ marginBottom: 3 }}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => handleLoanApplyClick(loan)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px 14px', fontSize: 13, fontWeight: 900, backgroundColor: '#16a34a' }}
                    >
                      ⚡ Apply with Assisted Verification
                    </button>
                    <a
                      href={loan.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-dark"
                      style={{ padding: '10px 14px', fontSize: 13, fontWeight: 800, textDecoration: 'none', backgroundColor: '#0f172a' }}
                    >
                      Bank Portal ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: COMMERCIAL / NON-GOVERNMENT BANK LOANS (PRIVATE COMMERCIAL BANKS) */}
        {/* ========================================================================= */}
        {mainTab === 'commercial_loans' && (
          <div>
            {/* Top Notice Banner for Commercial Bank Loans */}
            <div style={{ 
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
              border: '2px solid #3b82f6', 
              borderRadius: 16, 
              padding: '22px 26px', 
              marginBottom: 24, 
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ maxWidth: 820 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="badge-sharp" style={{ background: '#3b82f6', color: '#ffffff', fontSize: 11, fontWeight: 900 }}>
                      🏢 PRIVATE COMMERCIAL BANKS
                    </span>
                    <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 700 }}>
                      Non-Government Subsidized Agricultural Credit
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 900 }}>
                    Commercial Bank Agricultural Finance (HDFC, ICICI, Axis, Kotak)
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                    These agricultural loans are offered by leading <strong>Private Commercial Banks</strong>. <strong>Please Note:</strong> These products are <strong>not government subsidized</strong> and do not carry the 3% central interest subvention. They operate under competitive commercial interest rates (9.25% - 10.25% p.a.). Useful for high-capacity farm tractor financing, commercial horticulture, seed production, and urgent private agricultural liquidity with rapid doorstep turnaround.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(59,130,246,0.4)' }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#93c5fd', fontWeight: 800 }}>Interest Rate</span>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#60a5fa' }}>9.25% - 10.2%</div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Commercial Terms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar for Commercial Loans */}
            <div className="mb-6">
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search commercial bank, loan product, category..."
                  value={loanSearchQuery}
                  onChange={e => setLoanSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white text-xs sm:text-sm font-semibold text-slate-800 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs placeholder-slate-400 transition"
                />
              </div>
            </div>

            {/* Commercial Loans Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
              {filteredCommercialLoans.map(loan => (
                <div
                  key={loan.id}
                  className="card"
                  style={{
                    padding: 22,
                    background: '#ffffff',
                    color: '#000000',
                    borderLeft: '6px solid #3b82f6',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(30, 41, 59, 0.05)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', background: '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>
                            🏢 {loan.bank}
                          </span>
                          <span className="badge-sharp" style={{ background: '#3b82f6', color: '#ffffff', fontSize: 10 }}>
                            Commercial Private Bank
                          </span>
                        </div>
                        <h3 style={{ margin: '4px 0 2px 0', fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>
                          {loan.name}
                        </h3>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{loan.category}</span>
                      </div>

                      <div style={{ textAlign: 'right', background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Commercial Rate</span>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb' }}>
                          {loan.effectiveRate}% <span style={{ fontSize: 11, color: '#64748b' }}>p.a.</span>
                        </div>
                        <span style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>
                          Non-Subsidized
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, background: '#f1f5f9', padding: 10, borderRadius: 8, margin: '10px 0', fontSize: 12 }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Borrowing Limit:</span>
                        <strong style={{ color: '#0f172a' }}>{loan.maxAmountLabel}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Security:</span>
                        <strong style={{ color: '#0f172a' }}>{loan.collateralFreeLimit}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: 11 }}>Tenure:</span>
                        <strong style={{ color: '#0f172a' }}>{loan.tenure}</strong>
                      </div>
                    </div>

                    <ul style={{ margin: '8px 0 14px 18px', padding: 0, fontSize: 12, color: '#334155' }}>
                      {loan.benefits.map((b, i) => (
                        <li key={i} style={{ marginBottom: 3 }}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => handleLoanApplyClick(loan)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px 14px', fontSize: 13, fontWeight: 900, backgroundColor: '#2563eb' }}
                    >
                      ⚡ Apply with Assisted Verification
                    </button>
                    <a
                      href={loan.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-dark"
                      style={{ padding: '10px 14px', fontSize: 13, fontWeight: 800, textDecoration: 'none', backgroundColor: '#0f172a' }}
                    >
                      Bank Portal ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* UNIVERSAL PROFILE MODAL */}
        <UniversalProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onProfileSaved={(prof, read) => {
            setUserProfile(prof)
            setReadiness(read)
            setToast({
              type: 'success',
              message: '✓ Universal Digi-Locker Profile updated! Ready for 1-Click Scheme Submissions.'
            })
          }}
        />

        {/* DIRECT 1-CLICK PORTAL SUBMISSION MODAL */}
        <PortalApplyModal
          isOpen={portalModalOpen}
          onClose={() => setPortalModalOpen(false)}
          scheme={selectedSchemeForPortal}
          batchSchemes={batchSchemesForPortal || []}
          onOpenProfile={() => {
            setPortalModalOpen(false)
            setProfileModalOpen(true)
          }}
          onApplicationSuccess={handleApplicationSuccess}
        />

        {/* MY SUBMITTED APPLICATIONS MODAL */}
        {applicationsModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000,
            padding: 16
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 18,
              maxWidth: 760,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '2px solid #5ca346'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#182c1d' }}>
                    📑 My Official Portal Scheme Submissions
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#6b7280' }}>
                    Live registry of all applications dispatched directly to Ministry DBT portals.
                  </p>
                </div>
                <button 
                  onClick={() => setApplicationsModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4b5563' }}
                >
                  ✕
                </button>
              </div>

              {loadingApplications ? (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <div className="spinner" style={{ borderColor: '#5ca346', borderTopColor: 'transparent', margin: '0 auto 10px auto' }}></div>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>Loading submitted applications...</p>
                </div>
              ) : myApplications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 36, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: 36 }}>📋</span>
                  <h4 style={{ margin: '8px 0 4px 0', color: '#1e293b' }}>No Official Applications Yet</h4>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                    Click "⚡ 1-Click Direct Portal Apply" on any scheme card to submit your application instantly!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {myApplications.map((app) => (
                    <div key={app.id} style={{ background: '#f7faf6', padding: 16, borderRadius: 10, border: '1px solid #d1fae5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#047857', textTransform: 'uppercase' }}>
                            {app.portal}
                          </span>
                          <h4 style={{ margin: '2px 0 0 0', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                            {app.schemeName}
                          </h4>
                        </div>
                        <span className="badge-sharp" style={{ background: '#10b981', color: '#ffffff', fontSize: 10 }}>
                          ✓ SUBMITTED
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#475569' }}>
                        <div>
                          <strong>Govt Reg ID:</strong> <span style={{ fontFamily: 'monospace', color: '#182c1d', fontWeight: 900 }}>{app.governmentRefId}</span>
                        </div>
                        <div>
                          <strong>Dispatched:</strong> {new Date(app.submissionTimestamp).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>
                          ● Verification Token: {app.verificationHash || 'Active Gateway Link'}
                        </span>
                        {app.trackingUrl && (
                          <a
                            href={app.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: 11, fontWeight: 900, textDecoration: 'none', backgroundColor: '#5ca346' }}
                          >
                            Track on Official Portal ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <button 
                  onClick={() => setApplicationsModalOpen(false)}
                  className="btn btn-dark"
                  style={{ padding: '8px 20px', fontSize: 13, fontWeight: 800, backgroundColor: '#182c1d' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Curator Audit Log Modal */}
        {showCuratorLogModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000,
            padding: 16
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 700,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '2px solid #5ca346'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#182c1d' }}>
                    🤖 AI Curator Audit Log & Verification History
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#6b7280' }}>
                    Transparent system logs detailing how schemes, loans, and news are verified and updated.
                  </p>
                </div>
                <button 
                  onClick={() => setShowCuratorLogModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4b5563' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#5ca346', marginBottom: 8 }}>
                  Core AI Capabilities
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                  {curatorStatus?.aiCapabilities?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#182c1d', marginBottom: 8 }}>
                  Recent Audit Trails
                </h4>
                {curatorStatus?.recentAudits && curatorStatus.recentAudits.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {curatorStatus.recentAudits.map((log, idx) => (
                      <div key={idx} style={{ background: '#f7faf6', padding: '12px 14px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span className="badge-sharp" style={{ background: '#182c1d', color: '#ffffff', fontSize: 10 }}>
                            {log.type}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: 11 }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, color: '#182c1d', marginBottom: 4 }}>
                          {log.summary}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#047857' }}>
                          <span>Schemes Audited: {log.schemesAudited}</span>
                          <span>Archived: {log.schemesArchived}</span>
                          <span>Added: {log.schemesAdded}</span>
                          <span>Loans: {log.loansAudited}</span>
                          <span>News: {log.newsCurated}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>No audit logs recorded yet.</div>
                )}
              </div>

              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <button 
                  onClick={() => setShowCuratorLogModal(false)}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: 13, fontWeight: 800, backgroundColor: '#5ca346' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ASSISTED BANK LOAN APPLICATION MODAL (For Govt and Commercial Banks) */}
        {loanApplyModalOpen && selectedLoanForApply && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 6000,
            padding: 16
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: selectedLoanForApply.loanType === 'commercial_bank_loan' ? '2px solid #3b82f6' : '2px solid #5ca346'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                <div>
                  <span className="badge-sharp" style={{ background: selectedLoanForApply.loanType === 'commercial_bank_loan' ? '#3b82f6' : '#15803d', color: '#ffffff', fontSize: 10 }}>
                    {selectedLoanForApply.loanType === 'commercial_bank_loan' ? 'Commercial Private Bank Loan' : 'Govt Bank Loan (4% KCC)'}
                  </span>
                  <h3 style={{ margin: '4px 0 2px 0', fontSize: 18, fontWeight: 900, color: '#182c1d' }}>
                    {selectedLoanForApply.name}
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{selectedLoanForApply.bank}</span>
                </div>
                <button
                  onClick={() => setLoanApplyModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4b5563' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleLoanFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#475569' }}>Effective Rate:</span>
                    <strong style={{ color: '#15803d' }}>{selectedLoanForApply.effectiveRate}% p.a.</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Collateral:</span>
                    <strong>{selectedLoanForApply.collateralFreeLimit}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                    Farmer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={loanFormData.farmerName}
                    onChange={e => setLoanFormData({ ...loanFormData, farmerName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      10-Digit Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={loanFormData.phone}
                      onChange={e => setLoanFormData({ ...loanFormData, phone: e.target.value.replace(/\D/g, '') })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Village / Area
                    </label>
                    <input
                      type="text"
                      value={loanFormData.village}
                      onChange={e => setLoanFormData({ ...loanFormData, village: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Cultivable Land (Acres)
                    </label>
                    <input
                      type="text"
                      value={loanFormData.landAcres}
                      onChange={e => setLoanFormData({ ...loanFormData, landAcres: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      Primary Crop / Activity
                    </label>
                    <input
                      type="text"
                      value={loanFormData.cropType}
                      onChange={e => setLoanFormData({ ...loanFormData, cropType: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                    Loan Amount Requested (₹)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    max={selectedLoanForApply.maxAmount || 1000000}
                    step="10000"
                    value={loanFormData.loanAmount}
                    onChange={e => setLoanFormData({ ...loanFormData, loanAmount: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setLoanApplyModalOpen(false)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '10px', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loanSubmitting}
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '10px', fontSize: 13, fontWeight: 900, backgroundColor: '#5ca346' }}
                  >
                    {loanSubmitting ? 'Submitting Application...' : 'Confirm Assisted Submission →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
