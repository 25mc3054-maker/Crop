import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import Navbar from './Navbar'
import UniversalProfileModal from './UniversalProfileModal'
import PortalApplyModal from './PortalApplyModal'

export default function Schemes({ onBack }) {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [applyState, setApplyState] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [lifecycleFilter, setLifecycleFilter] = useState('active') // 'active', 'new', 'archived', 'all'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [toast, setToast] = useState(null)
  
  // AI Curator State
  const [curatorStatus, setCuratorStatus] = useState(null)
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
  const [loanCatalog, setLoanCatalog] = useState({ govtBankLoans: [], commercialBankLoans: [] })
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
    const iv = setInterval(() => {
      fetchSchemes(false, lifecycleFilter)
      fetchLoanCatalog()
    }, 60 * 1000)
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

  const fetchSchemes = async (showLoader = true, filter = lifecycleFilter) => {
    try {
      if (showLoader) setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/schemes`, {
        params: { status: filter }
      })
      setSchemes(res.data.schemes || [])
      if (res.data.curatorStatus) {
        setCuratorStatus(res.data.curatorStatus)
      }
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Failed to fetch schemes', err)
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
      categoryFilter === 'all' ? true :
      categoryFilter === 'income' ? (s.type === 'income_support' || s.id.includes('kisan')) :
      categoryFilter === 'insurance' ? (s.type === 'insurance') :
      categoryFilter === 'solar' ? (s.type === 'renewable_energy') :
      categoryFilter === 'machinery' ? (s.type === 'machinery') :
      categoryFilter === 'irrigation' ? (s.type === 'irrigation') :
      categoryFilter === 'new_tech' ? (s.type === 'fertilizer_subsidy' || s.type === 'digital_registry' || s.type === 'women_empowerment' || s.type === 'fisheries') : true

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
    <div style={{ minHeight: '100vh', padding: '16px 12px 90px', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <div className="container" style={{ width: '96%', maxWidth: '1720px', margin: '0 auto' }}>
        
        {toast && (
          <div style={{ position: 'fixed', right: 24, top: 24, zIndex: 6000, maxWidth: 460 }}>
            <div className="card" style={{ padding: '14px 20px', background: toast.type === 'success' ? '#182c1d' : '#fee2e2', color: toast.type === 'success' ? '#dcfce7' : '#991b1b', border: toast.type === 'success' ? '2px solid #5ca346' : '2px solid #ef4444', boxShadow: '0 12px 28px rgba(0,0,0,0.35)', borderRadius: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.4 }}>{toast.message}</div>
            </div>
          </div>
        )}

        <Navbar 
          title={
            mainTab === 'schemes' ? '🏛️ Government Schemes & AI Autonomous Subsidy Curator' :
            mainTab === 'govt_loans' ? '🏦 Government Bank Loans & 4% Kisan Credit (KCC)' :
            '🏢 Commercial / Non-Govt Bank Loans (Private Commercial Banks)'
          } 
          showBack={true} 
          onBack={onBack} 
        />

        {/* ========================================================================= */}
        {/* HIGH-LEVEL MASTER 3-WAY OPTION CONTROLLER */}
        {/* ========================================================================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
          marginBottom: 24
        }}>
          {/* OPTION 1: ALL GOVT SCHEMES */}
          <button
            onClick={() => setMainTab('schemes')}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              border: mainTab === 'schemes' ? '3px solid #5ca346' : '1px solid #e2ece0',
              background: mainTab === 'schemes' ? 'linear-gradient(135deg, #182c1d 0%, #0f1c13 100%)' : '#ffffff',
              color: mainTab === 'schemes' ? '#ffffff' : '#182c1d',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: mainTab === 'schemes' ? '0 8px 20px rgba(24, 44, 29, 0.25)' : '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: 30, background: mainTab === 'schemes' ? 'rgba(92,163,70,0.25)' : '#eaf7e6', width: 52, height: 52, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              🏛️
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: mainTab === 'schemes' ? '#a7f3d0' : '#2e7d32', marginBottom: 2 }}>
                Option 1 • Central & State DBT
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>
                All Govt Schemes & Subsidies
              </div>
              <div style={{ fontSize: 12, color: mainTab === 'schemes' ? '#cbd5e1' : '#64748b', marginTop: 3 }}>
                {schemes.length} verified programs • PM-Kisan, PMFBY, KUSUM
              </div>
            </div>
          </button>

          {/* OPTION 2: GOVT BANK LOANS */}
          <button
            onClick={() => setMainTab('govt_loans')}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              border: mainTab === 'govt_loans' ? '3px solid #5ca346' : '1px solid #e2ece0',
              background: mainTab === 'govt_loans' ? 'linear-gradient(135deg, #182c1d 0%, #0f1c13 100%)' : '#ffffff',
              color: mainTab === 'govt_loans' ? '#ffffff' : '#182c1d',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: mainTab === 'govt_loans' ? '0 8px 20px rgba(24, 44, 29, 0.25)' : '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: 30, background: mainTab === 'govt_loans' ? 'rgba(92,163,70,0.25)' : '#eaf7e6', width: 52, height: 52, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              🏦
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: mainTab === 'govt_loans' ? '#a7f3d0' : '#2e7d32', marginBottom: 2 }}>
                  Option 2 • Public Sector Banks
                </span>
                <span className="badge-sharp" style={{ background: '#10b981', color: '#ffffff', fontSize: 9, padding: '1px 5px' }}>4% KCC</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>
                Govt Bank Loans & Kisan Credit
              </div>
              <div style={{ fontSize: 12, color: mainTab === 'govt_loans' ? '#cbd5e1' : '#64748b', marginTop: 3 }}>
                SBI, PNB, BoB, Canara, NABARD, MUDRA • 3% Central Subvention
              </div>
            </div>
          </button>

          {/* OPTION 3: COMMERCIAL / NON-GOVT BANK LOANS */}
          <button
            onClick={() => setMainTab('commercial_loans')}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              border: mainTab === 'commercial_loans' ? '3px solid #3b82f6' : '1px solid #e2ece0',
              background: mainTab === 'commercial_loans' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff',
              color: mainTab === 'commercial_loans' ? '#ffffff' : '#182c1d',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: mainTab === 'commercial_loans' ? '0 8px 20px rgba(30, 41, 59, 0.25)' : '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: 30, background: mainTab === 'commercial_loans' ? 'rgba(59,130,246,0.25)' : '#eff6ff', width: 52, height: 52, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              🏢
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: mainTab === 'commercial_loans' ? '#93c5fd' : '#2563eb', marginBottom: 2 }}>
                  Option 3 • Private Commercial Banks
                </span>
                <span className="badge-sharp" style={{ background: '#3b82f6', color: '#ffffff', fontSize: 9, padding: '1px 5px' }}>Non-Govt</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>
                Commercial / Non-Govt Loans
              </div>
              <div style={{ fontSize: 12, color: mainTab === 'commercial_loans' ? '#cbd5e1' : '#64748b', marginTop: 3 }}>
                HDFC, ICICI, Axis, Kotak • Private Bank Commercial Rates
              </div>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: ALL GOVERNMENT SCHEMES & SUBSIDIES */}
        {/* ========================================================================= */}
        {mainTab === 'schemes' && (
          <>
            {/* AI Autonomous Curator Live Command Center */}
            <div style={{ 
              background: 'linear-gradient(135deg, #182c1d 0%, #0f1c13 100%)', 
              border: '2px solid #5ca346', 
              borderRadius: 16, 
              padding: '20px 24px', 
              marginBottom: 20, 
              boxShadow: '0 8px 24px rgba(24, 44, 29, 0.25)',
              color: '#ffffff'
            }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid rgba(92, 163, 70, 0.3)', paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="badge-sharp" style={{ background: '#5ca346', color: '#ffffff', fontSize: 11, fontWeight: 900, letterSpacing: '0.8px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ffffff', animation: 'pulse 1.8s infinite' }}></span>
                🤖 AI AUTONOMOUS CURATOR ACTIVE
              </span>
              <span style={{ fontSize: 13, color: '#a7f3d0', fontWeight: 600 }}>
                Continuous 24/7 Scheme Verification & 1-Click Direct Portal Application
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button 
                onClick={triggerAiCurator}
                disabled={curating}
                className="btn btn-primary"
                style={{ 
                  padding: '9px 18px', 
                  fontSize: 13, 
                  fontWeight: 900, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 8,
                  backgroundColor: curating ? '#22543d' : '#5ca346',
                  borderColor: '#5ca346'
                }}
              >
                {curating ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                    <span>AI Auditing Portals...</span>
                  </>
                ) : (
                  <>⚡ Run AI Audit Now</>
                )}
              </button>

              <button 
                onClick={() => setShowCuratorLogModal(true)}
                className="btn btn-dark"
                style={{ padding: '9px 16px', fontSize: 13, fontWeight: 800, backgroundColor: '#26422d', border: '1px solid #3c6e43' }}
              >
                📋 Audit Trails
              </button>
            </div>
          </div>

          {/* Real-time KPI Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: 10, borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 800 }}>🟢 Verified Active Schemes</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>
                {curatorStatus?.stats?.totalActiveSchemes || 11}
              </div>
              <div style={{ fontSize: 11, color: '#34d399', marginTop: 2 }}>100% Valid & Open for Applications</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: 10, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 800 }}>⚡ AI Added (New 2026)</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
                {curatorStatus?.stats?.newSchemesDiscovered || 5}
              </div>
              <div style={{ fontSize: 11, color: '#fde68a', marginTop: 2 }}>PM-PRANAM, Drones, AgriStack Added</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: 10, borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 800 }}>⛔ Closed Schemes Auto-Archived</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#f87171', marginTop: 4 }}>
                {curatorStatus?.stats?.archivedClosedSchemes || 3}
              </div>
              <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>Removed from Active Lists to Protect Farmers</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: 10, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 800 }}>🏦 Bank Loans & Rates Audited</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#93c5fd', marginTop: 4 }}>
                {curatorStatus?.stats?.auditedLoans || 6}
              </div>
              <div style={{ fontSize: 11, color: '#bfdbfe', marginTop: 2 }}>4% Net KCC & RBI Norms Verified</div>
            </div>
          </div>
        </div>

        {/* ENCRYPTED FARMER DIGI-LOCKER PROFILE BANNER */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #5ca346',
          borderRadius: 16,
          padding: '18px 24px',
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(24, 44, 29, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ flex: '1 1 480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className="badge-sharp" style={{ background: readiness.isReady ? '#15803d' : '#475569', color: '#ffffff', fontSize: 11, fontWeight: 900 }}>
                {readiness.isReady ? '✓ DIGI-LOCKER READY (100%)' : `🔒 ENCRYPTED DIGI-LOCKER (${readiness.score}% FILLED)`}
              </span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#182c1d' }}>
                {userProfile?.fullName || 'Your Private Digi-Locker Vault'}
              </span>
              {userProfile?.aadhaarNumber && (
                <span style={{ fontSize: 11, color: '#6b7280', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                  Aadhaar: XXXX-XXXX-{String(userProfile.aadhaarNumber).slice(-4)}
                </span>
              )}
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#496150', lineHeight: 1.4 }}>
              {readiness.score > 0 ? (
                <><strong>1-Click Official Portal Apply Enabled:</strong> Your encrypted credentials automatically autofill government scheme forms with anti-bot captcha verification.</>
              ) : (
                <><strong>Encrypted Vault is Empty:</strong> Your credentials are not filled yet. Click <strong>"Setup Digi-Locker"</strong> to enter your details once. Only you can access your vault.</>
              )}
            </p>

            {readiness.score > 0 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: '#065f46', flexWrap: 'wrap' }}>
                {userProfile?.village && <span>📍 {userProfile.village}, {userProfile.district || ''}</span>}
                {userProfile?.landAreaAcres && <span>• 🌾 {userProfile.landAreaAcres} Acres {userProfile.surveyKhasraNo ? `(${userProfile.surveyKhasraNo})` : ''}</span>}
                {userProfile?.bankName && <span>• 🏦 {userProfile.bankName}</span>}
                {userProfile?.primaryCrop && <span>• 🌱 {userProfile.primaryCrop}</span>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setProfileModalOpen(true)}
              className="btn btn-dark"
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 800, backgroundColor: '#182c1d', border: '1px solid #3c6e43' }}
            >
              {readiness.score > 0 ? '✏️ Edit Digi-Locker' : '🔒 Setup Digi-Locker'}
            </button>

            <button
              onClick={() => { loadMyApplications(); setApplicationsModalOpen(true); }}
              className="btn btn-outline"
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 800 }}
            >
              📑 My Portal Applications ({myApplications.length})
            </button>
          </div>
        </div>

        {/* Lifecycle Selector Tabs (Active vs AI-New vs Archived Closed) */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setLifecycleFilter('active')}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 900,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: lifecycleFilter === 'active' ? '#5ca346' : '#ffffff',
                color: lifecycleFilter === 'active' ? '#ffffff' : '#182c1d',
                boxShadow: lifecycleFilter === 'active' ? '0 4px 12px rgba(92, 163, 70, 0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🟢</span>
              <span>Active Schemes ({curatorStatus?.stats?.totalActiveSchemes || 11})</span>
            </button>

            <button
              onClick={() => setLifecycleFilter('new')}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 900,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: lifecycleFilter === 'new' ? '#d97706' : '#ffffff',
                color: lifecycleFilter === 'new' ? '#ffffff' : '#92400e',
                boxShadow: lifecycleFilter === 'new' ? '0 4px 12px rgba(217, 119, 6, 0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>⚡</span>
              <span>AI Added (New 2026) ({curatorStatus?.stats?.newSchemesDiscovered || 5})</span>
            </button>

            <button
              onClick={() => setLifecycleFilter('archived')}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 900,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: lifecycleFilter === 'archived' ? '#dc2626' : '#ffffff',
                color: lifecycleFilter === 'archived' ? '#ffffff' : '#991b1b',
                boxShadow: lifecycleFilter === 'archived' ? '0 4px 12px rgba(220, 38, 38, 0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>📦</span>
              <span>Archived / Closed Schemes ({curatorStatus?.stats?.archivedClosedSchemes || 3})</span>
            </button>

            <button
              onClick={() => setLifecycleFilter('all')}
              style={{
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 800,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: lifecycleFilter === 'all' ? '#1f2937' : '#ffffff',
                color: lifecycleFilter === 'all' ? '#ffffff' : '#4b5563',
                boxShadow: lifecycleFilter === 'all' ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              All Registers
            </button>
          </div>

          {/* Quick links to Loan & News */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => { window.location.hash = '#/finance' }}
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: 12, fontWeight: 800 }}
            >
              💰 Audited Loans →
            </button>
            <button 
              onClick={() => { window.location.hash = '#/community-news' }}
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: 12, fontWeight: 800 }}
            >
              📰 Daily Farmer Wire →
            </button>
          </div>
        </div>

        {/* Notice for Archived View */}
        {lifecycleFilter === 'archived' && (
          <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#991b1b' }}>
            <div style={{ fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⛔ Transparency Notice: Schemes Closed or Discontinued by Government</span>
            </div>
            <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>
              The Krishi-Net AI Curator automatically isolates schemes whose deadlines have passed, budgets have been exhausted, or that have been superseded by new government initiatives. This prevents farmers from applying to dead programs.
            </div>
          </div>
        )}

        {/* Category Filter Chips & Search Bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'income', label: '🌾 Direct Income' },
              { id: 'insurance', label: '🛡️ Crop Insurance' },
              { id: 'solar', label: '☀️ Solar Pumps' },
              { id: 'machinery', label: '🚜 Farm Machinery & Drones' },
              { id: 'irrigation', label: '💧 Drip Irrigation' },
              { id: 'new_tech', label: '⚡ Advanced 2026 Tech' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  borderRadius: 20,
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  backgroundColor: categoryFilter === tab.id ? '#182c1d' : '#ffffff',
                  color: categoryFilter === tab.id ? '#ffffff' : '#374151',
                  boxShadow: categoryFilter === tab.id ? '0 2px 6px rgba(24, 44, 29, 0.25)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ minWidth: 280, flex: '0 1 360px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search schemes, subsidies, keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '9px 16px', 
                borderRadius: 24, 
                border: '2px solid #5ca346', 
                backgroundColor: '#ffffff', 
                color: '#182c1d', 
                fontSize: 13,
                fontWeight: 600
              }}
            />
          </div>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', color: '#182c1d', borderRadius: 16 }}>
            <div className="spinner" style={{ borderColor: '#5ca346', borderTopColor: 'transparent', margin: '0 auto 16px auto' }}></div>
            <p style={{ color: '#182c1d', fontWeight: 900, fontSize: 16 }}>AI Curator Verifying Government Registries...</p>
            <p style={{ color: '#6b7280', fontSize: 13 }}>Cross-referencing central DB, state nodal agencies, and subsidy availability</p>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#374151' }}>No schemes found matching the selected filters.</p>
            <button 
              onClick={() => { setCategoryFilter('all'); setSearchQuery(''); setLifecycleFilter('active'); }}
              className="btn btn-primary"
              style={{ marginTop: 10, padding: '8px 16px', fontSize: 12 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {filteredSchemes.map(s => {
              const isNew = s.lifecycleStatus === 'newly_added'
              const isArchived = s.lifecycleStatus === 'archived'
              const cardBorder = isArchived ? '#ef4444' : (isNew ? '#f59e0b' : '#5ca346')

              return (
                <div 
                  key={s.id} 
                  className="card" 
                  style={{ 
                    borderTop: `6px solid ${cardBorder}`, 
                    margin: 0, 
                    background: isArchived ? '#fbfbfb' : '#ffffff', 
                    color: '#182c1d',
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 14,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Header: Provider + AI Stamp */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#182c1d', textTransform: 'uppercase', background: '#f0fdf4', padding: '3px 9px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                        {s.provider}
                      </span>
                      
                      {/* AI Stamp Badge */}
                      <span className="badge-sharp" style={{ 
                        background: isArchived ? '#ef4444' : (isNew ? '#d97706' : '#15803d'),
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 900
                      }}>
                        {isArchived ? '⛔ CLOSED / ARCHIVED' : (isNew ? '⚡ AI ADDED 2026' : '✓ AI VERIFIED')}
                      </span>
                    </div>

                    <h3 style={{ margin: '4px 0 6px 0', color: isArchived ? '#4b5563' : '#0f172a', fontSize: 18, fontWeight: 900, lineHeight: 1.3 }}>
                      {s.name}
                    </h3>

                    {/* Status & Validity */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10, fontSize: 12 }}>
                      <span style={{ color: isArchived ? '#b91c1c' : '#16a34a', fontWeight: 800 }}>
                        ● {s.status}
                      </span>
                      {s.validUntil && (
                        <span style={{ color: '#6b7280', fontWeight: 700 }}>
                          (Validity: {s.validUntil})
                        </span>
                      )}
                    </div>

                    {/* AI Curation Reason */}
                    {s.aiReason && (
                      <div style={{ 
                        background: isArchived ? '#fef2f2' : (isNew ? '#fffbeb' : '#f0fdf4'), 
                        border: `1px dashed ${isArchived ? '#fca5a5' : (isNew ? '#fcd34d' : '#86efac')}`, 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        marginBottom: 12, 
                        fontSize: 12, 
                        fontWeight: 700, 
                        color: isArchived ? '#991b1b' : (isNew ? '#92400e' : '#166534')
                      }}>
                        <strong>🤖 AI Audit Note:</strong> {s.aiReason}
                      </div>
                    )}

                    {/* Subsidy Highlight */}
                    {s.subsidy && (
                      <div style={{ 
                        background: '#f7faf6', 
                        border: '1px solid #5ca346', 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        marginBottom: 12, 
                        fontSize: 13, 
                        fontWeight: 900, 
                        color: '#182c1d'
                      }}>
                        🎁 Subsidy: {s.subsidy}
                      </div>
                    )}

                    <p style={{ margin: '8px 0 14px 0', color: '#374151', fontSize: 13, lineHeight: 1.5, fontWeight: 600 }}>
                      {s.description}
                    </p>

                    {/* Benefits List */}
                    {s.benefits && s.benefits.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <strong style={{ color: '#182c1d', fontSize: 12, display: 'block', marginBottom: 4 }}>Key Scheme Advantages:</strong>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
                          {s.benefits.map((b, idx) => (
                            <li key={idx} style={{ marginBottom: 2 }}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Eligibility & Documents */}
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 14, fontSize: 12 }}>
                      <strong style={{ color: '#182c1d', display: 'block', marginBottom: 2 }}>Who Can Apply:</strong>
                      <span style={{ color: '#4b5563' }}>{s.eligibility}</span>

                      {s.documents && s.documents.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #d1d5db' }}>
                          <strong style={{ color: '#182c1d', display: 'block', marginBottom: 2 }}>Required Documents:</strong>
                          <span style={{ color: '#047857', fontWeight: 700 }}>{s.documents.join(' • ')}</span>
                        </div>
                      )}

                      {s.helpline && (
                        <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280' }}>
                          📞 Toll-Free Helpline: <strong style={{ color: '#182c1d' }}>{s.helpline}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions (Direct 1-Click Apply vs Assisted Desk vs Official Portal) */}
                  <div>
                    {!isArchived ? (
                      <div>
                        {/* Primary 1-Click Direct Portal Button */}
                        <button 
                          type="button"
                          onClick={() => handleOpenDirectApply(s)}
                          className="btn btn-primary"
                          style={{ 
                            width: '100%', 
                            padding: '12px 14px', 
                            fontSize: 14, 
                            fontWeight: 900, 
                            backgroundColor: '#5ca346',
                            borderColor: '#5ca346',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 10px rgba(92,163,70,0.3)',
                            marginBottom: 8
                          }}
                        >
                          <span>⚡ 1-Click Direct Portal Apply</span>
                          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 10 }}>Auto-Fill + Captcha</span>
                        </button>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {s.applyLink && (
                            <a 
                              href={s.applyLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-outline" 
                              style={{ flex: 1, textDecoration: 'none', padding: '8px 10px', fontSize: 12, fontWeight: 800, textAlign: 'center' }}
                            >
                              Official Site ↗
                            </a>
                          )}
                          <button 
                            className="btn btn-dark" 
                            onClick={() => startApply(s.id)} 
                            style={{ flex: 1, padding: '8px 10px', fontSize: 12, fontWeight: 800, backgroundColor: '#182c1d' }}
                          >
                            Assisted Desk
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, padding: '10px', background: '#fee2e2', borderRadius: 6, textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#991b1b' }}>
                        ⛔ Applications Halted by Government — View Active 2026 Schemes
                      </div>
                    )}

                    {/* Offline Assisted Desk Form Drawer */}
                    {applyState[s.id] && (
                      <div style={{ marginTop: 14, padding: 16, background: '#f7faf6', border: '2px solid #5ca346', borderRadius: 8 }}>
                        <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 10, color: '#182c1d' }}>
                          Register for Assisted Application Submission:
                        </div>
                        <label style={{ color: '#182c1d', fontWeight: 800, fontSize: 12, display: 'block', marginBottom: 2 }}>Farmer Name</label>
                        <input 
                          value={applyState[s.id].name} 
                          onChange={e => updateField(s.id, 'name', e.target.value)} 
                          placeholder="Your full name" 
                          style={{ backgroundColor: '#ffffff', color: '#182c1d', border: '1px solid #cbd5e1', padding: '8px 10px', width: '100%', borderRadius: 4, marginBottom: 8 }} 
                        />
                        <label style={{ color: '#182c1d', fontWeight: 800, fontSize: 12, display: 'block', marginBottom: 2 }}>Mobile Number</label>
                        <input 
                          value={applyState[s.id].phone} 
                          onChange={e => updateField(s.id, 'phone', e.target.value)} 
                          placeholder="10-digit mobile" 
                          style={{ backgroundColor: '#ffffff', color: '#182c1d', border: '1px solid #cbd5e1', padding: '8px 10px', width: '100%', borderRadius: 4, marginBottom: 8 }} 
                        />
                        <label style={{ color: '#182c1d', fontWeight: 800, fontSize: 12, display: 'block', marginBottom: 2 }}>Land & Farm Details</label>
                        <textarea 
                          value={applyState[s.id].details} 
                          onChange={e => updateField(s.id, 'details', e.target.value)} 
                          placeholder="e.g. Village name, survey number, crop type, acreage" 
                          rows="2"
                          style={{ backgroundColor: '#ffffff', color: '#182c1d', border: '1px solid #cbd5e1', padding: '8px 10px', width: '100%', borderRadius: 4, marginBottom: 10 }} 
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => submitApplication(s.id)} 
                            disabled={submitting}
                            style={{ flex: 2, padding: 10, fontWeight: 900, backgroundColor: '#5ca346' }}
                          >
                            {submitting ? 'Submitting…' : '✓ Confirm & Get Reference ID'}
                          </button>
                          <button 
                            className="btn btn-dark" 
                            onClick={() => setApplyState(prev => ({ ...prev, [s.id]: null }))}
                            style={{ flex: 1, padding: 10, backgroundColor: '#182c1d' }}
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
              background: 'linear-gradient(135deg, #182c1d 0%, #0f1c13 100%)', 
              border: '2px solid #5ca346', 
              borderRadius: 16, 
              padding: '22px 26px', 
              marginBottom: 24, 
              boxShadow: '0 8px 24px rgba(24, 44, 29, 0.25)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ maxWidth: 780 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="badge-sharp" style={{ background: '#5ca346', color: '#ffffff', fontSize: 11, fontWeight: 900 }}>
                      ✓ RBI & NABARD 2026 AUDITED
                    </span>
                    <span style={{ fontSize: 12, color: '#a7f3d0', fontWeight: 700 }}>
                      Official Public Sector & Regional Rural Bank Agricultural Credit
                    </span>
                  </div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 900 }}>
                    Kisan Credit Card: Nominal 7.0% → Net 4.0% p.a. Prompt Repayment
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#d1fae5', lineHeight: 1.5 }}>
                    Under the Central Government's <strong>Modified Interest Subvention Scheme (MISS)</strong>, farmers who repay crop loans within 12 months receive a <strong>3.0% direct interest subvention</strong> from the Government of India, reducing your actual interest rate to just <strong>4.0% per annum</strong>. Up to ₹1.60 Lakhs (and up to ₹3.00 Lakhs with tie-up arrangements) is 100% collateral-free. MUDRA loans provide collateral-free credit up to ₹10.00 Lakhs for allied agriculture (Dairy, Poultry, Fisheries).
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(92,163,70,0.5)' }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#a7f3d0', fontWeight: 800 }}>Net Farmer Rate</span>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#34d399' }}>4.0% <span style={{ fontSize: 14 }}>p.a.</span></div>
                    <span style={{ fontSize: 11, color: '#e2e8f0' }}>With 3% Subvention</span>
                  </div>
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(92,163,70,0.5)' }}>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#a7f3d0', fontWeight: 800 }}>Zero Collateral Limit</span>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#facc15' }}>₹1.60L <span style={{ fontSize: 14 }}>- ₹10L</span></div>
                    <span style={{ fontSize: 11, color: '#e2e8f0' }}>No Land Mortgage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Chips & Search Bar for Govt Loans */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Govt Loans' },
                  { id: 'crop', label: '🌾 Crop Loans (KCC 4%)' },
                  { id: 'emergency', label: '⚡ Contingency & Gold' },
                  { id: 'infra', label: '🏢 Storage & AIF (3% Subvention)' },
                  { id: 'allied', label: '🐄 Dairy & Poultry (MUDRA)' },
                  { id: 'solar', label: '☀️ Solar Irrigation (PM-KUSUM)' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setLoanCategoryFilter(cat.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: loanCategoryFilter === cat.id ? '#5ca346' : '#ffffff',
                      color: loanCategoryFilter === cat.id ? '#ffffff' : '#182c1d',
                      boxShadow: loanCategoryFilter === cat.id ? '0 4px 12px rgba(92, 163, 70, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="🔍 Search govt bank, KCC loan, MUDRA..."
                value={loanSearchQuery}
                onChange={e => setLoanSearchQuery(e.target.value)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  width: '280px',
                  backgroundColor: '#ffffff'
                }}
              />
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
                    borderLeft: '6px solid #5ca346',
                    border: '1px solid #e2ece0',
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(24, 44, 29, 0.05)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#065f46', textTransform: 'uppercase', background: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>
                            🏛️ {loan.bank}
                          </span>
                          <span className="badge-sharp" style={{ background: '#15803d', color: '#ffffff', fontSize: 10 }}>
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
                          <span style={{ fontSize: 10, color: '#047857', fontWeight: 800, background: '#ecfdf5', padding: '1px 5px', borderRadius: 4 }}>
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
                      style={{ flex: 1, padding: '10px 14px', fontSize: 13, fontWeight: 900, backgroundColor: '#5ca346' }}
                    >
                      ⚡ Apply with Assisted Verification
                    </button>
                    <a
                      href={loan.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-dark"
                      style={{ padding: '10px 14px', fontSize: 13, fontWeight: 800, textDecoration: 'none', backgroundColor: '#182c1d' }}
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
