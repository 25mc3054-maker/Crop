import React, { useState } from 'react'
import {
  IconFieldmates,
  IconUserPlus,
  IconFollow,
  IconFollowing,
  IconMyCircle,
  IconVerified,
  IconCheck,
  IconClose,
  IconShare,
  IconBell,
  IconSearch,
  IconLock
} from './SocialIcons'

// Initial followers data
const SAMPLE_FOLLOWERS = [
  { id: 'fol-1', name: 'Ravi Kumar', handle: '@ravi_paddy', village: 'Gudivada', state: 'AP', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', isMyCircle: false, hasGreenTick: false, isFollowing: true },
  { id: 'fol-2', name: 'Dr. M. Venkat Rao', handle: '@venkat_lam', village: 'Lam RARS', state: 'AP', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', isMyCircle: false, hasGreenTick: true, isFollowing: true },
  { id: 'fol-3', name: 'Kavitha Devi', handle: '@kavitha_organic', village: 'Tirupati', state: 'AP', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', isMyCircle: true, hasGreenTick: true, isFollowing: true },
  { id: 'fol-4', name: 'Anil Chowdary', handle: '@anil_cotton', village: 'Warangal', state: 'Telangana', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', isMyCircle: true, hasGreenTick: false, isFollowing: false }
]

// Suggested verified green-tick agricultural accounts
const VERIFIED_SUGGESTIONS = [
  { id: 'sug-1', name: 'Indian Council of Agri Research (ICAR)', handle: '@icar_official', avatar: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=100&auto=format&fit=crop&q=80', hasGreenTick: true, category: 'National Nodal Body' },
  { id: 'sug-2', name: 'AP Department of Agriculture', handle: '@ap_agriculture', avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=100&auto=format&fit=crop&q=80', hasGreenTick: true, category: 'State Extension Directorate' },
  { id: 'sug-3', name: 'Prof. Jayashankar Ag University', handle: '@pjtsau_research', avatar: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=100&auto=format&fit=crop&q=80', hasGreenTick: true, category: 'Agronomy Research Hub' }
]

// Fieldmate mutual requests & contacts suggestions
const INITIAL_FIELDMATE_REQUESTS = [
  { id: 'req-1', name: 'Balaram Varma', handle: '@balaram_rice', village: 'Bhimavaram', state: 'AP', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80', mutualFieldmates: 6, contactMatch: true },
  { id: 'req-2', name: 'Srinivasa Rao', handle: '@srinu_chilli', village: 'Sattenapalle', state: 'AP', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', mutualFieldmates: 3, contactMatch: false }
]

const CONTACT_SUGGESTIONS = [
  { id: 'con-1', name: 'Nageswara Rao (In Contacts)', handle: '@nagesh_kisan', phone: '+91 98480 91823', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80', mutualFieldmates: 8 },
  { id: 'con-2', name: 'Satyanarayana Murthy (In Contacts)', handle: '@murthy_crops', phone: '+91 94401 77219', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80', mutualFieldmates: 12 }
]

export default function FamilyNetworkingFeed({
  currentUser,
  myCircleList = [],
  onToggleMyCircle,
  isNotificationsView = false
}) {
  const [followers, setFollowers] = useState(SAMPLE_FOLLOWERS)
  const [requests, setRequests] = useState(INITIAL_FIELDMATE_REQUESTS)
  const [contactsPermissionGranted, setContactsPermissionGranted] = useState(() => localStorage.getItem('krishi_contacts_granted') === 'true')
  const [showContactsPrompt, setShowContactsPrompt] = useState(false)
  const [myCircleUsers, setMyCircleUsers] = useState(() => 
    SAMPLE_FOLLOWERS.filter(f => f.isMyCircle || myCircleList.includes(f.handle))
  )

  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 'notif-1', type: 'fieldmate_request', title: 'Balaram Varma sent you a Fieldmate request', time: '20 mins ago', actionPending: true, reqId: 'req-1' },
    { id: 'notif-2', type: 'new_follower', title: 'Dr. M. Venkat Rao started following your field updates', time: '2 hours ago', hasGreenTick: true },
    { id: 'notif-3', type: 'new_follower', title: 'Anil Chowdary followed you (Past 24h)', time: '5 hours ago' },
    { id: 'notif-4', type: 'circle', title: 'Kavitha Devi was added to your My Circle list', time: '1 day ago' }
  ])

  // Handle WhatsApp Invite Share
  const handleInviteWhatsApp = () => {
    const inviteText = encodeURIComponent(`Namaste! Join me on KrishiSocial, the modern borderless agricultural platform for real-time crop advisory, APMC rates, and verified farmgate trade: ${window.location.origin}`)
    window.open(`https://api.whatsapp.com/send?text=${inviteText}`, '_blank')
  }

  // Handle Fieldmate Acceptance
  const handleAcceptRequest = (reqId) => {
    const req = requests.find(r => r.id === reqId)
    setRequests(prev => prev.filter(r => r.id !== reqId))
    if (req) {
      setFollowers(prev => [...prev, { ...req, isFollowing: true, isMyCircle: false }])
    }
  }

  const handleDeclineRequest = (reqId) => {
    setRequests(prev => prev.filter(r => r.id !== reqId))
  }

  const handleToggleFollowUser = (userId) => {
    setFollowers(prev => prev.map(f => {
      if (f.id === userId) {
        return { ...f, isFollowing: !f.isFollowing }
      }
      return f
    }))
  }

  // NOTIFICATIONS VIEW
  if (isNotificationsView) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none font-sans">
        
        {/* Top Banner with WhatsApp Invite Button */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <IconBell size={24} color="#2E7D32" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#111827]">Notifications & Activity</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Fieldmate connection requests, 24h new followers, and community invites
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInviteWhatsApp}
            className="px-5 py-2.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] active:scale-95 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-2"
          >
            <IconShare size={15} color="#FFFFFF" />
            <span>Invite via WhatsApp</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl p-5 shadow-sm divide-y divide-gray-100 space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconBell size={16} color="#2E7D32" />
                </div>
                <div>
                  <div className="text-xs font-black text-[#111827] flex items-center gap-1.5">
                    <span>{n.title}</span>
                    {n.hasGreenTick && <IconVerified size={13} color="#2E7D32" />}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">{n.time}</span>
                </div>
              </div>

              {n.actionPending && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(n.reqId)}
                    className="px-3 py-1 rounded-xl bg-[#2E7D32] text-white text-xs font-black shadow-sm"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeclineRequest(n.reqId)}
                    className="px-3 py-1 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    )
  }

  // 3-COLUMN FAMILY NETWORKING TAB
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 select-none font-sans space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
            <IconFieldmates size={26} color="#2E7D32" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-[#111827]">Family & Agricultural Network</h1>
              <span className="text-[10px] font-black bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full">
                3-Tier Trust
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Followers, Mutual Fieldmates, and your trusted inner "My Circle"
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInviteWhatsApp}
          className="px-4 py-2 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-black shadow-md transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <IconShare size={14} color="#FFFFFF" />
          <span>Invite via WhatsApp</span>
        </button>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: FOLLOWERS & OFFICIAL VERIFIED SUGGESTIONS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFollow size={18} color="#2E7D32" />
              <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                Followers ({followers.length})
              </h2>
            </div>
            <span className="text-[11px] font-bold text-gray-400">Public Stream</span>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm space-y-3">
            <div className="divide-y divide-gray-100">
              {followers.map((usr) => (
                <div key={usr.id} className="pt-3 first:pt-0 pb-3 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Orange border ONLY if in My Circle */}
                    <div className={`p-0.5 rounded-full ${
                      usr.isMyCircle ? 'ring-2 ring-[#EA580C]' : 'ring-1 ring-gray-200'
                    }`}>
                      <img
                        src={usr.avatar}
                        alt={usr.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-[#111827]">{usr.name}</span>
                        {usr.hasGreenTick && <IconVerified size={13} color="#2E7D32" />}
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {usr.village}, {usr.state}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollowUser(usr.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                      usr.isFollowing
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-[#2E7D32] text-white shadow-sm'
                    }`}
                  >
                    {usr.isFollowing ? 'Following' : 'Follow Back'}
                  </button>
                </div>
              ))}
            </div>

            {/* Official / Verified Green-Tick Suggestions */}
            <div className="pt-4 border-t border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                Official Institutions & Nodal Bodies
              </span>

              <div className="space-y-2.5">
                {VERIFIED_SUGGESTIONS.map((sug) => (
                  <div key={sug.id} className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-[#F9FAFB]">
                    <div className="flex items-center gap-2">
                      <img
                        src={sug.avatar}
                        alt={sug.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#111827] flex items-center gap-1 truncate">
                          <span>{sug.name}</span>
                          <IconVerified size={12} color="#2E7D32" />
                        </div>
                        <span className="text-[10px] text-gray-500 block truncate">{sug.category}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-[#2E7D32] text-white text-[11px] font-bold flex-shrink-0"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: FIELDMATES (MUTUAL CONNECTIONS & CONTACTS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFieldmates size={18} color="#2E7D32" />
              <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                Fieldmates ({requests.length + 2})
              </h2>
            </div>
            <span className="text-[11px] font-black text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
              Mutual Access
            </span>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm space-y-4">
            {/* Pending Requests */}
            {requests.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Pending Connection Requests ({requests.length})
                </span>

                <div className="space-y-2">
                  {requests.map((req) => (
                    <div key={req.id} className="p-3 rounded-2xl bg-[#F9FAFB] space-y-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={req.avatar}
                          alt={req.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                        />
                        <div>
                          <div className="text-xs font-black text-[#111827]">{req.name}</div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            {req.village}, {req.state} • {req.mutualFieldmates} Mutuals
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req.id)}
                          className="flex-1 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-black shadow-sm transition"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineRequest(req.id)}
                          className="flex-1 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Matching & Contacts Access Prompt */}
            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Phonebook Matched Farmers
                </span>
                {!contactsPermissionGranted && (
                  <button
                    type="button"
                    onClick={() => {
                      setContactsPermissionGranted(true)
                      localStorage.setItem('krishi_contacts_granted', 'true')
                    }}
                    className="text-[11px] font-bold text-[#2E7D32] underline"
                  >
                    Sync Phonebook
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {CONTACT_SUGGESTIONS.map((con) => (
                  <div key={con.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F9FAFB]">
                    <div className="flex items-center gap-2">
                      <img
                        src={con.avatar}
                        alt={con.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                      />
                      <div>
                        <div className="text-xs font-black text-[#111827]">{con.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{con.mutualFieldmates} mutual fieldmates</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1 rounded-xl bg-[#2E7D32] text-white text-xs font-black"
                    >
                      + Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: MY CIRCLE (CLOSE-FRIENDS & ORANGE BORDER PRIVILEGE) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconMyCircle size={18} color="#EA580C" />
              <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                My Circle ({myCircleUsers.length})
              </h2>
            </div>
            <span className="text-[10px] font-black text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded-full">
              Orange Ring
            </span>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Your close-friends circle. Profiles in "My Circle" receive exclusive visibility rights and a vibrant orange border across the entire platform.
            </p>

            <div className="divide-y divide-gray-100">
              {myCircleUsers.map((usr) => (
                <div key={usr.id} className="pt-3 first:pt-0 pb-3 last:pb-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Vibrant Orange border exclusively reserved for My Circle */}
                    <div className="p-0.5 rounded-full ring-2 ring-[#EA580C] shadow-sm">
                      <img
                        src={usr.avatar}
                        alt={usr.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#111827]">{usr.name}</div>
                      <span className="text-[10px] font-bold text-[#EA580C]">My Circle Member</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleMyCircle && onToggleMyCircle(usr.handle)
                      setMyCircleUsers(prev => prev.filter(u => u.id !== usr.id))
                    }}
                    className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-500 text-xs font-bold transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Suggested Circle additions from top 10 interactions */}
            <div className="pt-3 border-t border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                Top Interacted Suggestions
              </span>

              <div className="space-y-2">
                {followers.filter(f => !f.isMyCircle).map((sug) => (
                  <div key={sug.id} className="flex items-center justify-between p-2 rounded-2xl bg-[#F9FAFB]">
                    <div className="flex items-center gap-2">
                      <img
                        src={sug.avatar}
                        alt={sug.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
                      />
                      <span className="text-xs font-bold text-[#111827]">{sug.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleMyCircle && onToggleMyCircle(sug.handle)
                        setMyCircleUsers(prev => [...prev, { ...sug, isMyCircle: true }])
                      }}
                      className="px-2.5 py-1 rounded-lg bg-orange-100 text-[#EA580C] text-[11px] font-black hover:bg-orange-200 transition"
                    >
                      + Add to Circle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
