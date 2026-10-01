import React, { useState, useEffect } from 'react'
import {
  IconClose,
  IconLock,
  IconShield,
  IconDataSaver,
  IconVerified,
  IconCheck,
  IconUserPlus,
  IconFieldmates,
  IconSettings,
  IconSearch,
  IconLightning,
  IconMessageQueue,
  IconArrowLeft
} from './SocialIcons'

// Mock followers and fieldmates for account restriction selector
const SAMPLE_USERS = [
  { id: 'usr-1', name: 'Ravi Kumar', handle: '@ravi_paddy', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', isMyCircle: false, role: 'Fieldmate' },
  { id: 'usr-2', name: 'Kavitha Devi', handle: '@kavitha_organic', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', isMyCircle: true, role: 'Fieldmate' },
  { id: 'usr-3', name: 'Venkatesh Rao', handle: '@venkat_lam', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', isMyCircle: false, role: 'Follower' },
  { id: 'usr-4', name: 'Anil Chowdary', handle: '@anil_cotton', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', isMyCircle: true, role: 'Fieldmate' },
  { id: 'usr-5', name: 'Srinivas Reddy', handle: '@srinivas_chilli', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', isMyCircle: false, role: 'Follower' }
]

export default function UnifiedSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUserSettings
}) {
  // 1. Privacy & Chat Access
  const [chatAccess, setChatAccess] = useState(() => localStorage.getItem('krishi_chat_access') || 'Fieldmates')
  
  // 2. Default Post & fieldVibes Visibility
  const [postVisibility, setPostVisibility] = useState(() => localStorage.getItem('krishi_post_visibility') || 'Everyone')
  const [vibesVisibility, setVibesVisibility] = useState(() => localStorage.getItem('krishi_vibes_visibility') || 'Everyone')
  
  // 3. Restrict Specific Accounts
  const [restrictedUsers, setRestrictedUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('krishi_restricted_users') || '[]')
    } catch {
      return []
    }
  })
  const [restrictSearch, setRestrictSearch] = useState('')

  // 4. Performance & Bandwidth
  const [dataSaver, setDataSaver] = useState(() => localStorage.getItem('krishi_data_saver') === 'true')

  // 5. Secret Green Tick Engine (Hidden developer verification)
  const [greenTickActive, setGreenTickActive] = useState(() => localStorage.getItem('krishi_secret_green_tick') === 'true')
  const [secretTapCount, setSecretTapCount] = useState(0)
  const [showSecretEngine, setShowSecretEngine] = useState(false)
  const [saveToast, setSaveToast] = useState(false)

  // Body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Handle secret sequence: tapping version 5 times unlocks the secret engine
  const handleSecretTap = () => {
    const nextCount = secretTapCount + 1
    setSecretTapCount(nextCount)
    if (nextCount >= 5) {
      setShowSecretEngine(prev => !prev)
      setSecretTapCount(0)
    }
  }

  const handleToggleRestrict = (handle) => {
    setRestrictedUsers(prev => {
      const next = prev.includes(handle)
        ? prev.filter(h => h !== handle)
        : [...prev, handle]
      localStorage.setItem('krishi_restricted_users', JSON.stringify(next))
      return next
    })
  }

  const handleSaveSettings = () => {
    localStorage.setItem('krishi_chat_access', chatAccess)
    localStorage.setItem('krishi_post_visibility', postVisibility)
    localStorage.setItem('krishi_vibes_visibility', vibesVisibility)
    localStorage.setItem('krishi_data_saver', String(dataSaver))
    localStorage.setItem('krishi_secret_green_tick', String(greenTickActive))
    
    if (onUpdateUserSettings) {
      onUpdateUserSettings({
        chatAccess,
        postVisibility,
        vibesVisibility,
        dataSaver,
        greenTickActive,
        restrictedUsers
      })
    }

    setSaveToast(true)
    setTimeout(() => {
      setSaveToast(false)
      onClose()
    }, 900)
  }

  const filteredUsers = SAMPLE_USERS.filter(u => 
    u.name.toLowerCase().includes(restrictSearch.toLowerCase()) ||
    u.handle.toLowerCase().includes(restrictSearch.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 bg-[#111827]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-white shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <IconSettings size={22} color="#2E7D32" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111827]">Master Settings Hub</h2>
              <p className="text-xs text-gray-500 font-medium">Privacy, post visibility, bandwidth & access</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F3F4F6] text-gray-400 hover:text-[#111827] transition"
          >
            <IconClose size={18} color="currentColor" />
          </button>
        </div>

        {/* Modal Body - Clean Categorized Sections */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7 scrollbar-thin">
          
          {/* SECTION 1: Privacy & Direct Chat Access */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <IconLock size={18} color="#2E7D32" />
              <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                Privacy & Chat Access
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Control who can send direct chat messages. Messages from non-fieldmates will be routed to a hidden Message Request drawer requiring manual approval.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {['Everyone', 'Fieldmates', 'Followers'].map((opt) => {
                const selected = chatAccess === opt
                return (
                  <label
                    key={opt}
                    onClick={() => setChatAccess(opt)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
                      selected
                        ? 'bg-[#E8F5E9] text-[#2E7D32] shadow-sm font-black'
                        : 'bg-[#F9FAFB] hover:bg-gray-100 text-[#111827] font-bold'
                    }`}
                  >
                    <span className="text-xs">{opt}</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      selected ? 'bg-[#2E7D32] text-white' : 'bg-gray-200'
                    }`}>
                      {selected && <IconCheck size={10} color="#FFFFFF" />}
                    </div>
                  </label>
                )
              })}
            </div>
          </section>

          {/* SECTION 2: Default Post & fieldVibes Visibility */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <IconShield size={18} color="#2E7D32" />
              <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                Default Post Visibility
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Configure default audience visibility separately for standard knowledge posts and short fieldVibes videos.
            </p>

            <div className="space-y-3 pt-1">
              {/* Posts Visibility */}
              <div className="bg-[#F9FAFB] p-4 rounded-2xl space-y-2">
                <span className="text-xs font-black text-[#111827] block">Standard Posts Audience</span>
                <div className="flex flex-wrap gap-2">
                  {['Everyone', 'Fieldmates', 'Followers'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPostVisibility(opt)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        postVisibility === opt
                          ? 'bg-[#2E7D32] text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* fieldVibes Visibility */}
              <div className="bg-[#F9FAFB] p-4 rounded-2xl space-y-2">
                <span className="text-xs font-black text-[#111827] block">fieldVibes Short Video Audience</span>
                <div className="flex flex-wrap gap-2">
                  {['Everyone', 'Fieldmates', 'Followers'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setVibesVisibility(opt)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        vibesVisibility === opt
                          ? 'bg-[#2E7D32] text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Restrict Specific Accounts */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconUserPlus size={18} color="#2E7D32" />
                <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                  Restrict Specific Accounts
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                {restrictedUsers.length} Restricted
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Restricted accounts cannot see your posts, stories, or fieldVibes updates in their feed.
            </p>

            <div className="relative">
              <input
                type="text"
                value={restrictSearch}
                onChange={(e) => setRestrictSearch(e.target.value)}
                placeholder="Search followers or fieldmates to restrict..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F9FAFB] text-xs font-medium text-[#111827] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2E7D32]"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <IconSearch size={14} color="#9CA3AF" />
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-2xl p-2 max-h-48 overflow-y-auto divide-y divide-gray-100">
              {filteredUsers.map((usr) => {
                const isRestricted = restrictedUsers.includes(usr.handle)
                return (
                  <div key={usr.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white transition">
                    <div className="flex items-center gap-2.5">
                      {/* Orange border ONLY if in My Circle */}
                      <div className={`p-0.5 rounded-full ${
                        usr.isMyCircle ? 'ring-2 ring-[#EA580C]' : 'ring-1 ring-gray-200'
                      }`}>
                        <img
                          src={usr.avatar}
                          alt={usr.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#111827] leading-tight">{usr.name}</div>
                        <div className="text-[11px] text-gray-500 font-medium">{usr.handle} • {usr.role}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleRestrict(usr.handle)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        isRestricted
                          ? 'bg-[#111827] text-white'
                          : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                      }`}
                    >
                      {isRestricted ? 'Restricted' : 'Restrict'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          {/* SECTION 4: Performance & Bandwidth (Data Saver) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <IconDataSaver size={18} color="#2E7D32" />
              <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                Performance & Bandwidth
              </h3>
            </div>

            <div className="bg-[#F9FAFB] p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#111827]">Data Saver Mode</span>
                  <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.2 rounded">
                    High Utility
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enables aggressive client-side compression for 3G/rural connectivity, disables high-res background video pre-loading, and activates offline caching.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setDataSaver(!dataSaver)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors relative flex items-center flex-shrink-0 ${
                  dataSaver ? 'bg-[#2E7D32]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                  dataSaver ? 'translate-x-5.5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </section>

          {/* SECTION 5: Secret Green Tick Verification Engine (Hidden backend logic) */}
          {showSecretEngine && (
            <section className="p-4 rounded-2xl bg-[#E8F5E9] space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconVerified size={18} color="#2E7D32" />
                  <span className="text-xs font-black text-[#2E7D32] uppercase tracking-wider">
                    Internal Verification Core
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-[#2E7D32] bg-white px-2 py-0.5 rounded">
                  Confidential
                </span>
              </div>

              <p className="text-xs text-[#1B5E20] font-medium leading-relaxed">
                Autonomous system tier. Active state unlocks 3x viral distribution multiplier, prioritized APMC trade indexing, and suppresses all third-party promotional banners.
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-[#111827]">Green Tick Verification Status</span>
                <button
                  type="button"
                  onClick={() => setGreenTickActive(!greenTickActive)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                    greenTickActive
                      ? 'bg-[#2E7D32] text-white shadow-sm'
                      : 'bg-white text-gray-600'
                  }`}
                >
                  {greenTickActive ? 'Active (Verified)' : 'Inactive'}
                </button>
              </div>
            </section>
          )}

          {/* App Version with Hidden Trigger Tap Target */}
          <div className="text-center pt-2">
            <span
              onClick={handleSecretTap}
              className="text-[11px] text-gray-400 font-semibold cursor-pointer select-none hover:text-gray-600 transition"
              title="Build Info"
            >
              KrishiSocial Core v2.4.0 (Enterprise Ag-Engine)
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white shadow-sm flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#F3F4F6] hover:bg-gray-200 text-xs font-bold text-gray-700 transition"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-6 py-2.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] active:scale-95 text-xs font-black text-white shadow-md transition flex items-center gap-2"
          >
            <IconCheck size={14} color="#FFFFFF" />
            <span>{saveToast ? 'Preferences Saved' : 'Apply Settings'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
