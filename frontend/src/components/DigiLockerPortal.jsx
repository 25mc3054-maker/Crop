import React, { useState } from 'react'
import {
  IconLock,
  IconShield,
  IconScheme,
  IconCheck,
  IconClose,
  IconDownload,
  IconUpload,
  IconVerified,
  IconSearch,
  IconCalendar,
  IconFileText
} from './SocialIcons'

// Initial Stored Documents in Vault
const INITIAL_VAULT_DOCUMENTS = [
  {
    id: 'doc-aadhaar',
    title: 'Aadhaar Card (UIDAI Linked)',
    type: 'Identity Record',
    docNo: 'XXXX-XXXX-4829',
    verified: true,
    fileSize: '0.8 MB PDF',
    syncedAt: '1 week ago',
    hash: 'SHA256: 1d9e2a...7f4c'
  },
  {
    id: 'doc-pahani',
    title: 'Land Passbook / Pahani / Adangal (ROR 1-B)',
    type: 'Land Revenue Record',
    docNo: 'ROR-AP-ELR-2026-9921',
    surveyNo: 'Survey 142/3A (3.50 Acres)',
    verified: true,
    fileSize: '1.4 MB PDF',
    syncedAt: '2 days ago',
    hash: 'SHA256: 4f8b9e...3c2a'
  },
  {
    id: 'doc-soil',
    title: 'Official Soil Health Card (ICAR-SHC)',
    type: 'Soil Testing Summary',
    docNo: 'SHC-2026-Lam-04921',
    grade: 'Optimal NPK & Micro-nutrients',
    verified: true,
    fileSize: '0.9 MB PDF',
    syncedAt: '3 weeks ago',
    hash: 'SHA256: 3a7b1c...5e2f'
  },
  {
    id: 'doc-kcc',
    title: 'Kisan Credit Card (SBI Ag-Branch)',
    type: 'Credit & Concession Passbook',
    docNo: 'KCC-SBI-0091823-AP',
    limit: '₹3,00,000 at 4% Net Rate',
    verified: true,
    fileSize: '1.1 MB PDF',
    syncedAt: '1 month ago',
    hash: 'SHA256: 8c3e1b...9a0e'
  }
]

// Real-Time Welfare & Subsidy Schemes
const REAL_TIME_SCHEMES = [
  {
    id: 'pm-kisan',
    title: 'PM-Kisan Samman Nidhi Yojana',
    level: 'Central Government DBT Scheme',
    benefit: '₹6,000 / year paid in three 4-monthly direct installments of ₹2,000',
    eligibility: 'All small & marginal landholding farmer families across India',
    requiredDocs: ['Aadhaar Card', 'Land Passbook / Pahani', 'Bank Passbook / KCC'],
    deadline: 'Rolling Continuous DBT',
    department: 'Ministry of Agriculture & Farmers Welfare, Govt of India',
    status: 'Ready to Apply'
  },
  {
    id: 'rythu-bharosa',
    title: 'Rythu Bharosa / State Farmer Assistance Scheme',
    level: 'State Input Subsidy Support',
    benefit: '₹13,500 / year total financial input assistance including tenant farmers',
    eligibility: 'Cultivator landholders & ROFR certified tenant farmers',
    requiredDocs: ['Land Record (Adangal/ROR)', 'Aadhaar Card', 'CCRC Agreement'],
    deadline: '15 Oct 2026',
    department: 'State Directorate of Agriculture',
    status: 'Ready to Apply'
  },
  {
    id: 'micro-irrigation',
    title: 'Micro-Irrigation Drip & Sprinkler Subsidy',
    level: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
    benefit: 'Up to 90% direct subsidy for inline drip lateral pipes and solar pumps',
    eligibility: 'Farmers owning cultivable land with borewell or canal water source',
    requiredDocs: ['Pahani / Adangal', 'Soil Health Card', 'Aadhaar Card'],
    deadline: '30 Nov 2026',
    department: 'Micro-Irrigation Project Development Agency (MIP)',
    status: 'Ready to Apply'
  },
  {
    id: 'pmfby-insurance',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    level: 'Comprehensive Crop Risk Insurance',
    benefit: '100% loss compensation against drought, flood & pests at 1.5% premium',
    eligibility: 'All loanee and non-loanee farmers growing notified Kharif crops',
    requiredDocs: ['Sowing Certificate', 'Pahani / Adangal', 'KCC Passbook'],
    deadline: '31 Oct 2026',
    department: 'AIC of India / National Crop Insurance Portal',
    status: 'Ready to Apply'
  }
]

export default function DigiLockerPortal({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('schemes') // 'schemes' | 'vault'
  const [vaultDocs, setVaultDocs] = useState(INITIAL_VAULT_DOCUMENTS)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Direct Scheme Application State
  const [selectedScheme, setSelectedScheme] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationSuccess, setApplicationSuccess] = useState(null)
  
  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocType, setNewDocType] = useState('Land Revenue Record')

  // Filter schemes
  const filteredSchemes = REAL_TIME_SCHEMES.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.benefit.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.level.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 1-Click DigiLocker Application Handler
  const handleApplyScheme = (scheme) => {
    setSelectedScheme(scheme)
    setIsSubmitting(true)

    // Simulate direct secure encrypted payload submission without external redirects
    setTimeout(() => {
      setIsSubmitting(false)
      const refId = `KRISHI-GOV-2026-${Math.floor(100000 + Math.random() * 900000)}`
      setApplicationSuccess({
        schemeTitle: scheme.title,
        benefit: scheme.benefit,
        refId: refId,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        verifiedDocs: scheme.requiredDocs
      })
      setSelectedScheme(null)
    }, 1200)
  }

  // Upload New Document to Vault
  const handleUploadDoc = (e) => {
    e.preventDefault()
    if (!newDocTitle.trim()) return

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      type: newDocType,
      docNo: `DIGI-AP-${Math.floor(1000 + Math.random() * 9000)}`,
      verified: true,
      fileSize: '1.2 MB PDF',
      syncedAt: 'Just now',
      hash: `SHA256: ${Math.random().toString(36).substring(2, 10)}...`
    }

    setVaultDocs([newDoc, ...vaultDocs])
    setNewDocTitle('')
    setUploadModalOpen(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none font-sans">
      
      {/* Header Banner with Encryption Badge */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <IconLock size={18} />
            </div>
            <h1 className="text-xl font-black text-[#111827]">DigiLocker & Direct Government Schemes</h1>
          </div>
          <p className="text-xs text-gray-500 font-medium max-w-2xl">
            Secure digital document vault linked with Aadhaar, Land Passbooks (ROR), and Soil Cards. Apply directly for state and central subsidies without visiting external portals.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex p-1 bg-gray-100 rounded-xl shrink-0 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('schemes')}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeSubTab === 'schemes'
                ? 'bg-white text-[#2E7D32] shadow-xs'
                : 'text-gray-600 hover:text-[#111827]'
            }`}
          >
            Direct Scheme Portal
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('vault')}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'vault'
                ? 'bg-white text-[#2E7D32] shadow-xs'
                : 'text-gray-600 hover:text-[#111827]'
            }`}
          >
            <IconShield size={14} color="#2E7D32" />
            <span>Document Vault ({vaultDocs.length})</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* VIEW 1: DIRECT SCHEME APPLICATION GRID */}
      {/* ================================================================ */}
      {activeSubTab === 'schemes' && (
        <div className="space-y-4">
          
          {/* Search Schemes Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search central & state schemes (e.g. PM-Kisan, Rythu Bharosa, Drip Subsidy)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-xs font-medium text-[#111827] rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32] placeholder-gray-400 shadow-xs"
              />
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#2E7D32] font-bold bg-[#E8F5E9] px-3.5 py-2.5 rounded-xl border border-[#2E7D32]/20">
              <IconCheck size={16} />
              <span>DigiLocker Auto-Population Active</span>
            </div>
          </div>

          {/* Schemes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-md">
                      {scheme.level}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                      <IconCalendar size={13} />
                      <span>{scheme.deadline}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#111827] mb-2 leading-snug">
                    {scheme.title}
                  </h3>

                  <div className="p-3 bg-gray-50 rounded-xl mb-3 border border-gray-100">
                    <p className="text-xs font-bold text-[#111827] leading-relaxed">
                      {scheme.benefit}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 mb-3 font-medium">
                    <strong className="text-gray-700">Eligibility:</strong> {scheme.eligibility}
                  </p>

                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-gray-700 block mb-1.5">Required DigiLocker Credentials:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {scheme.requiredDocs.map((doc, i) => (
                        <span key={i} className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <IconCheck size={11} color="#2E7D32" />
                          <span>{doc}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Button */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-gray-400 font-medium truncate max-w-[180px]">
                    {scheme.department}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleApplyScheme(scheme)}
                    disabled={isSubmitting && selectedScheme?.id === scheme.id}
                    className="bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-400 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
                  >
                    <IconLock size={13} color="#FFFFFF" />
                    <span>
                      {isSubmitting && selectedScheme?.id === scheme.id ? 'Applying via Vault...' : 'Apply via DigiLocker'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ================================================================ */}
      {/* VIEW 2: ENCRYPTED DOCUMENT VAULT */}
      {/* ================================================================ */}
      {activeSubTab === 'vault' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-[#111827]">Farmer Encrypted Document Vault</h2>
              <p className="text-xs text-gray-500">Official government documents verified & encrypted with SHA-256 signatures.</p>
            </div>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <IconUpload size={15} color="#FFFFFF" />
              <span>+ Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vaultDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between hover:border-[#2E7D32]/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                      {doc.type}
                    </span>
                    <span className="text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <IconVerified size={13} color="#2E7D32" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[#111827] mb-1">
                    {doc.title}
                  </h3>
                  
                  <p className="text-xs font-mono font-bold text-gray-700 mb-2">
                    {doc.docNo}
                  </p>

                  {doc.surveyNo && (
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      Land Particulars: {doc.surveyNo}
                    </p>
                  )}

                  {doc.grade && (
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      Soil Quality: {doc.grade}
                    </p>
                  )}

                  {doc.limit && (
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      Sanction Limit: {doc.limit}
                    </p>
                  )}

                  <p className="text-[10px] font-mono text-gray-400 mt-2 truncate">
                    {doc.hash}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-3">
                  <span className="text-[11px] text-gray-400 font-medium">
                    {doc.fileSize} • Synced {doc.syncedAt}
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading verified copy of ${doc.title}`)}
                    className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
                  >
                    <IconDownload size={14} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ================================================================ */}
      {/* CONFIRMATION MODAL: 1-CLICK APPLICATION SUCCESSFUL */}
      {/* ================================================================ */}
      {applicationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#2E7D32] mx-auto flex items-center justify-center">
              <IconCheck size={32} />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#111827]">Application Submitted Successfully!</h3>
              <p className="text-xs text-gray-500 mt-1">Your application was auto-populated from your verified DigiLocker vault records.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl text-left space-y-2 border border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Scheme:</span>
                <span className="font-bold text-[#111827] truncate max-w-[220px]">{applicationSuccess.schemeTitle}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Reference Tracking ID:</span>
                <span className="font-mono font-black text-[#2E7D32]">{applicationSuccess.refId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Date Submitted:</span>
                <span className="font-semibold text-gray-700">{applicationSuccess.date}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-medium">Portal Status:</span>
                <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded text-[10px]">DIRECT DBT VERIFIED</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              No need to visit government offices or MeeSeva kiosks. Benefit disbursements will credit directly into your registered Aadhaar-seeded bank account.
            </p>

            <button
              type="button"
              onClick={() => setApplicationSuccess(null)}
              className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-[#111827]">Upload to Vault</h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <IconClose size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Kisan Credit Card Passbook"
                  className="w-full px-3 py-2 bg-gray-50 text-xs font-medium rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Document Category</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 text-xs font-bold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  <option value="Land Revenue Record">Land Revenue Record (Pahani/ROR)</option>
                  <option value="Identity Record">Identity Record (Aadhaar/Voter)</option>
                  <option value="Credit & Concession">Credit & Concession (KCC)</option>
                  <option value="Soil Testing Summary">Soil Testing Summary</option>
                  <option value="Crop Sowing Certificate">Crop Sowing Certificate</option>
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                <IconFileText size={24} color="#2E7D32" className="mx-auto mb-1" />
                <p className="text-xs font-bold text-gray-700">Attach PDF or Scanned Photo</p>
                <p className="text-[10px] text-gray-400">Max size 10MB (Encrypted automatically)</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
