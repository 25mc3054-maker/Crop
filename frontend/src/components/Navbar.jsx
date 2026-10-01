import React from 'react'
import {
  IconSearch,
  IconPosts,
  IconFieldVibes,
  IconMarket,
  IconFieldmates,
  IconBell,
  IconScheme,
  IconSettings,
  IconLogo,
  IconPlus,
  IconArrowLeft
} from './SocialIcons'

// Custom SVG Chat Bubble Icon with badge counter
export const IconChatBubble = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

export default function Navbar({
  // Active Navigation & View state
  activeTab = 'posts',
  onTabChange,
  
  // Create Modal Trigger
  onOpenCreatePost,
  setIsCreateModalOpen,
  
  // Chat, Notif, Settings & Profile actions
  unreadChatCount = 3,
  unreadNotifCount = 2,
  onOpenChat,
  onOpenNotifications,
  onOpenSettings,
  onOpenProfile,
  currentUser,
  
  // Search state
  searchQuery = '',
  onSearchChange,

  // Legacy page support (e.g. WeatherForecast, SoilAnalyser, MarketPrices)
  title,
  isLightTitle = false,
  showBack = false,
  onBack
}) {
  // If explicitly used as a legacy page header with a title and back button
  if (showBack && title) {
    return (
      <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-gray-100 select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[56px] py-2 sm:py-2.5 flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-gray-50 hover:bg-[#E8F5E9] text-[#111827] hover:text-[#2E7D32] transition shrink-0"
              title="Go Back"
            >
              <IconArrowLeft size={20} />
            </button>
            {isLightTitle ? (
              <p className="text-xs sm:text-[13px] font-normal text-gray-500 leading-snug select-text">
                {title}
              </p>
            ) : (
              <h1 className="text-base sm:text-lg font-black text-[#111827] truncate">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#2E7D32] flex items-center justify-center text-white font-black text-xs shadow-xs">
              <IconLogo size={18} />
            </div>
            <span className="text-xs font-black text-[#111827] hidden sm:inline">Krishi<span className="text-[#2E7D32]">Social</span></span>
          </div>
        </div>
      </header>
    )
  }

  // 5 Primary Navigation Tabs as specified in Section 2
  const PRIMARY_TABS = [
    { id: 'posts', label: 'Posts', altId: 'feed', Icon: IconPosts },
    { id: 'vibes', label: 'fieldVibes', altId: 'fieldVibes', Icon: IconFieldVibes },
    { id: 'marketplace', label: 'Buy / Marketplace', altId: 'marketplace', Icon: IconMarket },
    { id: 'family', label: 'Family', altId: 'family', Icon: IconFieldmates },
    { id: 'digilocker', label: 'DigiLocker & Schemes', altId: 'digilocker', Icon: IconScheme }
  ]

  // Handler to open create modal and lock background scroll
  const handleTriggerCreate = () => {
    document.body.style.overflow = 'hidden'
    if (setIsCreateModalOpen) {
      setIsCreateModalOpen(true)
    } else if (onOpenCreatePost) {
      onOpenCreatePost()
    }
  }

  // Check active tab match
  const isTabActive = (tab) => {
    return activeTab === tab.id || activeTab === tab.altId
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-gray-100 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* 1. Left: Brand Logo & Title */}
          <div 
            onClick={() => onTabChange && onTabChange('posts')} 
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
            title="KrishiSocial Agricultural Super-App"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <IconLogo size={22} />
            </div>
            <div className="hidden lg:block">
              <span className="text-base sm:text-lg font-black tracking-tight text-[#111827]">
                Krishi<span className="text-[#2E7D32]">Social</span>
              </span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider -mt-1">
                Kisan Network
              </p>
            </div>
          </div>

          {/* 2. Center-Left: 5 Primary Navigation Clickable Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 shrink-0">
            {PRIMARY_TABS.map((tab) => {
              const active = isTabActive(tab)
              const Icon = tab.Icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all relative ${
                    active
                      ? 'text-[#2E7D32] bg-[#E8F5E9] shadow-xs'
                      : 'text-gray-600 hover:text-[#111827] hover:bg-gray-50'
                  }`}
                >
                  <Icon size={17} color={active ? '#2E7D32' : '#4B5563'} active={active} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#2E7D32] rounded-full" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* 3. Center-Right: Single Search Input */}
          <div className="flex-1 max-w-xs lg:max-w-sm mx-1 sm:mx-2">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 pointer-events-none">
                <IconSearch size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Search farmers, crops, mandi rates..."
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-gray-50 text-xs font-medium text-[#111827] rounded-full border border-gray-200 outline-none focus:ring-2 focus:ring-[#2E7D32] focus:bg-white placeholder-gray-400 transition"
              />
            </div>
          </div>

          {/* 4. Far-Right Actions: + Create, Messages, Notifications, Settings, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* + Create Button (High-visibility Light Green) */}
            <button
              type="button"
              onClick={handleTriggerCreate}
              className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition"
              title="Create New Post or fieldVibe"
            >
              <IconPlus size={16} color="#FFFFFF" />
              <span className="hidden sm:inline">+ Create</span>
            </button>

            {/* Messages Icon with Unread Badge */}
            <button
              type="button"
              onClick={() => onOpenChat ? onOpenChat() : onTabChange && onTabChange('messages')}
              className="relative p-2 rounded-xl bg-gray-50 hover:bg-[#E8F5E9] text-[#111827] hover:text-[#2E7D32] transition active:scale-95"
              title="Direct Chat Messages"
              aria-label="Messages"
            >
              <IconChatBubble size={20} color="currentColor" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#2E7D32] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>

            {/* Notifications Icon with Unread Count */}
            <button
              type="button"
              onClick={() => onOpenNotifications ? onOpenNotifications() : onTabChange && onTabChange('notifications')}
              className="relative p-2 rounded-xl bg-gray-50 hover:bg-[#E8F5E9] text-[#111827] hover:text-[#2E7D32] transition active:scale-95"
              title="Notifications & Fieldmate Requests"
              aria-label="Notifications"
            >
              <IconBell size={20} color="currentColor" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#2E7D32] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* Unified Master Settings Icon */}
            <button
              type="button"
              onClick={() => onOpenSettings && onOpenSettings()}
              className="p-2 rounded-xl bg-gray-50 hover:bg-[#E8F5E9] text-[#111827] hover:text-[#2E7D32] transition active:scale-95"
              title="Unified Master Settings Hub"
              aria-label="Settings"
            >
              <IconSettings size={20} color="currentColor" />
            </button>

            {/* User Profile Avatar (Orange border EXCLUSIVELY if in My Circle) */}
            <div
              onClick={() => onOpenProfile ? onOpenProfile() : onTabChange && onTabChange('profile')}
              className={`relative cursor-pointer transition-transform hover:scale-105 active:scale-95 p-0.5 rounded-full ${
                currentUser?.isMyCircle 
                  ? 'ring-2 ring-[#EA580C] shadow-xs' 
                  : 'ring-1 ring-gray-200'
              }`}
              title={`${currentUser?.name || 'Farmer'} ${currentUser?.isMyCircle ? '(In My Circle)' : ''}`}
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'Farmer'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
              />
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Sticky Navigation Strip for Screen Widths < 768px */}
      <div className="md:hidden bg-white border-t border-gray-100 px-2 py-1 flex items-center justify-around overflow-x-auto">
        {PRIMARY_TABS.map((tab) => {
          const active = isTabActive(tab)
          const Icon = tab.Icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center gap-1 transition ${
                active ? 'text-[#2E7D32] font-black' : 'text-gray-500 font-bold'
              }`}
            >
              <Icon size={18} color={active ? '#2E7D32' : '#6B7280'} active={active} />
              <span className="text-[10px] truncate max-w-[62px]">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}
