import React, { useState } from 'react'
import {
  IconSearch,
  IconFilter,
  IconMapPin,
  IconVerified,
  IconPhone,
  IconCropSprout,
  IconTractor,
  IconLeaf,
  IconDroplets,
  IconClose,
  IconCheck
} from './SocialIcons'
import { IconChatBubble } from './KrishiNavbar'

const MARKET_CATEGORIES = [
  { id: 'all', label: 'All Listings' },
  { id: 'produce', label: 'Crops & Produce' },
  { id: 'seeds', label: 'Certified Seeds & Inputs' },
  { id: 'machinery', label: 'Equipment & Implements' },
  { id: 'irrigation', label: 'Drip & Solar Pumps' }
]

const SAMPLE_MARKET_ITEMS = [
  {
    id: 'mkt-1',
    title: 'Certified BPT 5204 (Sona Masuri) Paddy Lot',
    category: 'produce',
    price: 2650,
    unit: 'quintal',
    quantityAvailable: '40 Quintals',
    location: 'Kaikalur Mandi, Eluru',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    seller: {
      name: 'Rambabu Varma',
      handle: '@rambabu_eluru',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      badge: 'Verified Producer',
      isFieldmate: true,
      isMyCircle: true,
      phone: '+91 98480 23112'
    },
    description: 'Freshly harvested paddy grain with 12.2% certified moisture. Zero chemical residues in ripening phase. Moisture testing certificate available.',
    postedAt: '1 hour ago'
  },
  {
    id: 'mkt-2',
    title: 'Mahindra 575 DI Tractor with Rotavator Attachment',
    category: 'machinery',
    price: 950,
    unit: 'acre service',
    quantityAvailable: 'On-Demand Booking',
    location: 'Tanuku, West Godavari',
    image: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600&auto=format&fit=crop&q=80',
    seller: {
      name: 'Narayana Swamy',
      handle: '@narayana_custom',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      badge: 'Custom Hiring Center',
      isFieldmate: true,
      isMyCircle: false,
      phone: '+91 94401 88290'
    },
    description: '45 HP tractor equipped with 42-blade heavy rotavator. Expert driver included. Diesel charges included in per-acre rate.',
    postedAt: '3 hours ago'
  },
  {
    id: 'mkt-3',
    title: 'Teja S17 Export-Grade Dry Red Chilli',
    category: 'produce',
    price: 17200,
    unit: 'quintal',
    quantityAvailable: '25 Quintals',
    location: 'Lam APMC Yard, Guntur',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910a473?w=600&auto=format&fit=crop&q=80',
    seller: {
      name: 'K. Subba Rao',
      handle: '@subba_guntur',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      badge: 'APMC Licensee',
      isFieldmate: false,
      isMyCircle: false,
      phone: '+91 98850 11983'
    },
    description: 'Deep red color, SHU 75,000 heat rating, sun-dried on cement platforms. No aflatoxin contamination. Direct mandi weighing scale.',
    postedAt: '5 hours ago'
  },
  {
    id: 'mkt-4',
    title: 'Jain Drip Inline Irrigation Lateral Pipe (16mm, 400m Roll)',
    category: 'irrigation',
    price: 3400,
    unit: 'bundle roll',
    quantityAvailable: '18 Rolls',
    location: 'Nandyal Ag-Depot',
    image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&auto=format&fit=crop&q=80',
    seller: {
      name: 'Sri Krishna Agro Traders',
      handle: '@krishna_agritech',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      badge: 'Certified Dealer',
      isFieldmate: true,
      isMyCircle: false,
      phone: '+91 99890 34211'
    },
    description: 'Virgin HDPE UV-stabilized drip lines with 2.4 LPH emitters at 40cm spacing. Complete with warranty and subsidy billing documentation.',
    postedAt: '1 day ago'
  }
]

export default function AgriMarketplaceFeed({
  currentUser,
  myCircleList = [],
  onDirectChatWithSeller
}) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [callModalSeller, setCallModalSeller] = useState(null)

  const filteredItems = SAMPLE_MARKET_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none font-sans">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-[#111827]">Agri-Marketplace & Produce Exchange</h1>
            <span className="text-[10px] font-black bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-0.5 rounded-full">
              Verified Farmgate
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Buy & sell crops, certified bio-inputs, and book nearby machinery without middleman margins
          </p>
        </div>

        <div className="relative max-w-sm w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search produce, machinery, seeds..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#F3F4F6] text-xs font-semibold text-[#111827] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2E7D32]"
          />
          <div className="absolute left-3 top-3 text-gray-400">
            <IconSearch size={16} color="#9CA3AF" />
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MARKET_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#2E7D32] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => {
          const isSellerInMyCircle = myCircleList.includes(item.seller.handle) || item.seller.isMyCircle
          const canCallSeller = item.seller.isFieldmate || item.seller.badge.includes('Verified') || item.seller.badge.includes('APMC')

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* High Resolution Item Image */}
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-black text-[#111827] shadow-sm flex items-center gap-1">
                    <IconMapPin size={12} color="#2E7D32" />
                    <span>{item.location}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-[#111827]/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-white">
                    {item.quantityAvailable}
                  </div>
                </div>

                {/* Title & Price Per Unit */}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-black text-[#111827] leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-base font-black text-[#2E7D32]">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      / {item.unit}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Seller Profile Summary */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Orange border ONLY if in My Circle */}
                    <div className={`p-0.5 rounded-full ${
                      isSellerInMyCircle ? 'ring-2 ring-[#EA580C]' : 'ring-1 ring-gray-200'
                    }`}>
                      <img
                        src={item.seller.avatar}
                        alt={item.seller.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-[#111827]">{item.seller.name}</span>
                        <IconVerified size={13} color="#2E7D32" />
                      </div>
                      <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.2 rounded">
                        {item.seller.badge}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-gray-400 font-medium">{item.postedAt}</span>
                </div>
              </div>

              {/* Instant Contact Action Buttons */}
              <div className="pt-1 grid grid-cols-2 gap-2.5">
                {/* Direct Chat with Seller */}
                <button
                  type="button"
                  onClick={() => onDirectChatWithSeller && onDirectChatWithSeller(item.seller, item)}
                  className="py-2.5 px-3 rounded-2xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <IconChatBubble size={16} color="#2E7D32" />
                  <span>Direct Chat</span>
                </button>

                {/* Call Seller (Enabled for Fieldmates or Verified Sellers) */}
                <button
                  type="button"
                  disabled={!canCallSeller}
                  onClick={() => setCallModalSeller(item.seller)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm ${
                    canCallSeller
                      ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white active:scale-95'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={canCallSeller ? 'Direct Phone Connect' : 'Calling reserved for Fieldmates & Verified Sellers'}
                >
                  <IconPhone size={15} color={canCallSeller ? '#FFFFFF' : '#9CA3AF'} />
                  <span>{canCallSeller ? 'Call Seller' : 'Connect First'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Call Seller Prompt Modal */}
      {callModalSeller && (
        <div className="fixed inset-0 z-50 bg-[#111827]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4 relative">
            <button
              type="button"
              onClick={() => setCallModalSeller(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400"
            >
              <IconClose size={18} color="currentColor" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mx-auto">
              <IconPhone size={24} color="#2E7D32" />
            </div>

            <div>
              <h3 className="text-base font-black text-[#111827]">Direct Farmer Call Connect</h3>
              <p className="text-xs text-gray-500 mt-1">Verified Fieldmate Telephony Routing</p>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-2xl">
              <div className="text-sm font-black text-[#2E7D32]">{callModalSeller.name}</div>
              <div className="text-xs text-gray-600 font-bold mt-0.5">{callModalSeller.phone}</div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCallModalSeller(null)}
                className="flex-1 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
              >
                Close
              </button>
              <a
                href={`tel:${callModalSeller.phone}`}
                className="flex-1 py-2.5 rounded-2xl bg-[#2E7D32] text-white text-xs font-black flex items-center justify-center gap-1 shadow-md"
              >
                <span>Dial Number</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
